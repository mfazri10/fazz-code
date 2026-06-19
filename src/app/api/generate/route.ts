import { getTokenUsage, recordFailure, safeGenerate } from "@/lib/agent-safety";
import { getSession } from "@/lib/auth-server";
import { type PlanResult } from "@/lib/planner-agent";
import { type ReviewResult } from "@/lib/reviewer-agent";
import {
  extractJsonObject,
  generateSchema,
  planResultSchema,
  reviewResultSchema,
} from "@/lib/validations";

export const maxDuration = 300;

const PLANNER_SYSTEM = `You are Fazz Code Planner. Output a JSON plan:
{"summary":"...","files":[{"path":"...","description":"..."}],"components":[{"name":"...","file":"...","description":"..."}],"notes":"..."}
Only valid JSON.`;

const FIXER_SYSTEM = `You are Fazz Code Fixer. Given errors and code, output minimal fixes.
For each fix: \`\`\`tsx filename="path"\n// fixed content\n\`\`\`
Make minimal changes only.`;

const REVIEWER_SYSTEM = `You are Fazz Code Reviewer. Output JSON:
{"verdict":"approve|request_changes","issues":[{"file":"...","severity":"error|warning|info","detail":"...","suggestion":"..."}],"summary":"..."}
Only valid JSON.`;

/** Safely parse a model JSON response against a Zod schema; returns null on failure. */
function safeParseJson<T>(text: string, schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }): T | null {
  try {
    const result = schema.safeParse(extractJsonObject(text));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    prompt,
    model,
    skipPlan,
    skipReview,
    maxFixIterations,
    files,
    errors: inputErrors,
    projectId,
  } = parsed.data;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        // Stage 1: Planning with safety
        let plan: PlanResult | null = null;
        if (!skipPlan) {
          send({ stage: "planning", status: "start" });
          try {
            const result = await safeGenerate({
              model,
              system: PLANNER_SYSTEM,
              prompt: `User request: ${prompt}`,
              projectId,
              agentId: "planner",
            });
            // Validate the model output against the schema instead of a greedy regex.
            plan = safeParseJson<PlanResult>(result.text, planResultSchema);
            send({ stage: "planning", status: "done", plan, tokens: result.tokens });
          } catch (error) {
            recordFailure("planner");
            send({ stage: "planning", status: "error", message: String(error) });
          }
        }

        // Stage 2: Generate code from the plan
        if (plan && plan.files && plan.files.length > 0) {
          send({ stage: "generating", status: "start" });
          try {
            const fileDescs = plan.files.map((f) => `- ${f.path}: ${f.description}`).join("\n");
            const componentDescs = plan.components?.map((c) => `- ${c.name} (${c.file}): ${c.description}`).join("\n") ?? "";

            const result = await safeGenerate({
              model,
              system: `You are Fazz Code Generator. Generate complete, working code files.
Output each file in this exact format:
\`\`\`tsx filename="path/to/file"\n// file content\n\`\`\`

Rules:
- Generate ALL files listed in the plan
- Use TypeScript, Next.js App Router, Tailwind CSS, shadcn/ui components
- Make code complete and functional, not placeholders
- Import from @/components/ui/ for shadcn components`,
              prompt: `User request: ${prompt}\n\nPlan summary: ${plan.summary}\n\nFiles to generate:\n${fileDescs}\n${componentDescs ? `\nComponents:\n${componentDescs}` : ""}`,
              projectId,
              agentId: "generator",
            });

            // Parse generated files
            const codeBlockRegex = /```(\w+)\s+filename="([^"]+)"\n([\s\S]*?)```/g;
            let match;
            while ((match = codeBlockRegex.exec(result.text)) !== null) {
              const [, , filePath, content] = match;
              if (filePath && content) {
                files[filePath] = content.trim();
              }
            }

            send({ stage: "generating", status: "done", files, tokens: result.tokens });
          } catch (error) {
            recordFailure("generator");
            send({ stage: "generating", status: "error", message: String(error) });
          }
        } else {
          send({ stage: "generating", status: "done" });
        }

        // Stage 3: Fix loop with circuit breaker.
        // The server cannot run a build, so it applies one Fixer pass and returns
        // the updated files. The client re-mounts them in WebContainer, re-checks,
        // and calls /api/generate again with any remaining errors.
        let allErrors = inputErrors;
        let iteration = 0;
        while (iteration < maxFixIterations && allErrors.length > 0) {
          send({ stage: "fixing", status: "start", iteration: iteration + 1 });
          try {
            const errorContext = allErrors.map((e) => `[${e.severity}] ${e.file}: ${e.message}`).join("\n");
            const fileContext = Object.entries(files).map(([p, c]) => `\n### ${p}\n\`\`\`\n${c}\n\`\`\``).join("\n");

            const result = await safeGenerate({
              model,
              system: FIXER_SYSTEM,
              prompt: `Errors:\n${errorContext}\n\nFiles:${fileContext}`,
              projectId,
              agentId: "fixer",
            });

            // Parse fixed files and collect what changed.
            const codeBlockRegex = /```(\w+)\s+filename="([^"]+)"\n([\s\S]*?)```/g;
            let match;
            const fixedFiles: Record<string, string> = {};
            while ((match = codeBlockRegex.exec(result.text)) !== null) {
              const [, , filePath, content] = match;
              if (filePath && content) {
                files[filePath] = content.trim();
                fixedFiles[filePath] = content.trim();
              }
            }

            // Return the fixed files so the client can persist + re-check them.
            send({
              stage: "fixing",
              status: "done",
              iteration: iteration + 1,
              files: fixedFiles,
              tokens: result.tokens,
            });

            // Re-validation happens client-side; stop after applying this pass.
            allErrors = [];
          } catch (error) {
            recordFailure("fixer");
            send({ stage: "fixing", status: "error", message: String(error) });
            break; // Don't loop on persistent errors
          }
          iteration++;
        }

        // Stage 4: Review
        if (!skipReview) {
          send({ stage: "reviewing", status: "start" });
          try {
            const reviewModel = model.includes("mimo") ? "mimo-v2.5" : "mimo-v2.5-pro";
            const fileContext = Object.entries(files).map(([p, c]) => `\n### ${p}\n\`\`\`\n${c}\n\`\`\``).join("\n");

            const result = await safeGenerate({
              model: reviewModel,
              system: REVIEWER_SYSTEM,
              prompt: `Review these files:${fileContext}`,
              projectId,
              agentId: "reviewer",
            });

            const review = safeParseJson<ReviewResult>(result.text, reviewResultSchema);
            send({ stage: "reviewing", status: "done", review, tokens: result.tokens });
          } catch (error) {
            recordFailure("reviewer");
            send({ stage: "reviewing", status: "error", message: String(error) });
          }
        }

        // Final payload: token usage + the full (possibly fixed) file set so the
        // client can persist the result.
        const usage = getTokenUsage(projectId);
        send({ stage: "done", status: "complete", files, tokenUsage: usage });
      } catch (error) {
        send({ stage: "error", message: String(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
