import { runGenerator } from "@/lib/agent-loop";
import { runFixer } from "@/lib/fixer-agent";
import { type PlanResult,runPlanner } from "@/lib/planner-agent";
import { runReviewer } from "@/lib/reviewer-agent";
import { useProjectStore } from "@/stores/project-store";

export interface NetworkOptions {
  prompt: string;
  model?: string;
  skipPlan?: boolean;
  skipReview?: boolean;
  maxFixIterations?: number;
  onProgress?: (stage: string, message: string) => void;
  onComplete?: (summary: string) => void;
  onError?: (error: Error) => void;
}

export async function runNetwork({
  prompt,
  model = "claude-sonnet-4-20250514",
  skipPlan = false,
  skipReview = false,
  maxFixIterations = 3,
  onProgress,
  onComplete,
  onError,
}: NetworkOptions): Promise<void> {
  const store = useProjectStore.getState();

  try {
    // Stage 1: Planning
    let plan: PlanResult | null = null;
    if (!skipPlan) {
      onProgress?.("planning", "Creating plan...");
      plan = await runPlanner(prompt, model);
      onProgress?.("planning", `Plan: ${plan.summary}`);
    }

    // Stage 2: Generation
    onProgress?.("generating", "Generating code...");
    await runGenerator({
      prompt: plan
        ? `Generate the following based on this plan:\n\n${JSON.stringify(plan, null, 2)}\n\nOriginal request: ${prompt}`
        : prompt,
      model,
      onProgress: (msg) => onProgress?.("generating", msg),
    });

    // Stage 3: Self-heal loop (if errors)
    let iteration = 0;
    while (iteration < maxFixIterations) {
      const errors = store.errors;
      if (errors.length === 0) break;

      onProgress?.("fixing", `Fix attempt ${iteration + 1}/${maxFixIterations}...`);
      await runFixer(errors, model);
      iteration++;
    }

    // Stage 4: Review (optional, cross-model)
    if (!skipReview) {
      onProgress?.("reviewing", "Reviewing code...");
      const reviewModel = model.includes("claude") ? "gpt-4o" : "claude-sonnet-4-20250514";
      const review = await runReviewer(reviewModel);

      if (review.verdict === "request_changes" && review.issues.some((i) => i.severity === "error")) {
        onProgress?.("fixing", "Applying review fixes...");
        await runFixer(
          review.issues
            .filter((i) => i.severity === "error")
            .map((i) => ({ file: i.file, message: i.detail, severity: i.severity })),
          model
        );
      }
    }

    onProgress?.("done", "Generation complete!");
    onComplete?.("Generation complete!");
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onProgress?.("error", err.message);
    onError?.(err);
    throw err;
  }
}
