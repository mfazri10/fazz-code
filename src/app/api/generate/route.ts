import { getTokenUsage,recordFailure, safeGenerate } from "@/lib/agent-safety";
import { getSession } from "@/lib/auth-server";
import { type PlanResult } from "@/lib/planner-agent";
import { type ReviewResult } from "@/lib/reviewer-agent";
import { generateSchema } from "@/lib/validations";

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
            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            plan = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            send({ stage: "planning", status: "done", plan, tokens: result.tokens });
          } catch (error) {
            recordFailure("planner");
            send({ stage: "planning", status: "error", message: String(error) });
          }
        }

        // Stage 2: Generation signal
        send({ stage: "generating", status: "done" });

        // Stage 3: Fix loop with circuit breaker
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

            // Parse fixed files
            const codeBlockRegex = /```(\w+)\s+filename="([^"]+)"\n([\s\S]*?)```/g;
            let match;
            while ((match = codeBlockRegex.exec(result.text)) !== null) {
              const [, , filePath, content] = match;
              if (filePath && content) files[filePath] = content.trim();
            }

            allErrors = []; // In real impl, re-check errors
            send({ stage: "fixing", status: "done", iteration: iteration + 1, tokens: result.tokens });
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
            const reviewModel = model.includes("claude") ? "gpt-4o" : "claude-sonnet-4-20250514";
            const fileContext = Object.entries(files).map(([p, c]) => `\n### ${p}\n\`\`\`\n${c}\n\`\`\``).join("\n");

            const result = await safeGenerate({
              model: reviewModel,
              system: REVIEWER_SYSTEM,
              prompt: `Review these files:${fileContext}`,
              projectId,
              agentId: "reviewer",
            });

            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            const review: ReviewResult | null = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            send({ stage: "reviewing", status: "done", review, tokens: result.tokens });
          } catch (error) {
            recordFailure("reviewer");
            send({ stage: "reviewing", status: "error", message: String(error) });
          }
        }

        // Token usage report
        const usage = getTokenUsage(projectId);
        send({ stage: "done", status: "complete", tokenUsage: usage });
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
