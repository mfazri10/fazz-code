import { getSession } from "@/lib/auth-server";
import { runFixer } from "@/lib/fixer-agent";
import { type PlanResult, runPlanner } from "@/lib/planner-agent";
import { runReviewer } from "@/lib/reviewer-agent";

export const maxDuration = 300; // 5 min for full pipeline

interface RequestBody {
  prompt: string;
  model?: string;
  skipPlan?: boolean;
  skipReview?: boolean;
  maxFixIterations?: number;
  files?: Record<string, string>;
  errors?: Array<{ file: string; message: string; severity: string }>;
}

export async function POST(req: Request) {
  // Auth check
  const sessionData = await getSession();
  if (!sessionData?.session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    prompt,
    model = "claude-sonnet-4-20250514",
    skipPlan = false,
    skipReview = false,
    maxFixIterations = 3,
    files = {},
    errors: inputErrors = [],
  } = body;

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "Prompt required" }, { status: 400 });
  }

  // Stream results via ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        // Stage 1: Planning
        let plan: PlanResult | null = null;
        if (!skipPlan) {
          send({ stage: "planning", status: "start" });
          plan = await runPlanner(prompt, model);
          send({ stage: "planning", status: "done", plan });
        }

        // Stage 2: Generation
        send({ stage: "generating", status: "start" });
        // Client-side handles generation via /api/chat — here we signal plan done
        send({ stage: "generating", status: "done" });

        // Stage 3: Fix loop
        let allErrors = inputErrors;
        let iteration = 0;
        while (iteration < maxFixIterations && allErrors.length > 0) {
          send({ stage: "fixing", status: "start", iteration: iteration + 1 });
          const fixResult = await runFixer(allErrors, model, files);
          allErrors = fixResult.remainingErrors;
          send({ stage: "fixing", status: "done", iteration: iteration + 1, remainingErrors: allErrors.length });
          iteration++;
        }

        // Stage 4: Review
        if (!skipReview) {
          send({ stage: "reviewing", status: "start" });
          const reviewModel = model.includes("claude") ? "gpt-4o" : "claude-sonnet-4-20250514";
          const review = await runReviewer(reviewModel, files);
          send({ stage: "reviewing", status: "done", review });

          if (review.verdict === "request_changes" && review.issues.some((i) => i.severity === "error")) {
            send({ stage: "fixing", status: "start", source: "review" });
            await runFixer(
              review.issues.filter((i) => i.severity === "error").map((i) => ({ file: i.file, message: i.detail, severity: i.severity })),
              model,
              files
            );
            send({ stage: "fixing", status: "done", source: "review" });
          }
        }

        send({ stage: "done", status: "complete" });
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
