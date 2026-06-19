export interface NetworkOptions {
  prompt: string;
  model?: string;
  skipPlan?: boolean;
  skipReview?: boolean;
  maxFixIterations?: number;
  files?: Record<string, string>;
  activeFile?: string;
  projectName?: string;
  onProgress?: (stage: string, message: string) => void;
  onComplete?: (summary: string) => void;
  onError?: (error: Error) => void;
}

export async function runNetwork({
  prompt,
  model = "mimo-v2.5-pro",
  skipPlan = false,
  skipReview = false,
  maxFixIterations = 3,
  files,
  activeFile,
  projectName,
  onProgress,
  onComplete,
  onError,
}: NetworkOptions): Promise<void> {
  try {
    onProgress?.("starting", "Starting agent pipeline...");

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        model,
        skipPlan,
        skipReview,
        maxFixIterations,
        ...(files && { files }),
        ...(activeFile && { activeFile }),
        ...(projectName && { projectName }),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response stream");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);

          if (data.stage === "error") {
            throw new Error(data.message);
          }

          if (data.stage === "done") {
            onProgress?.("done", "Generation complete!");
            onComplete?.("Generation complete!");
            return;
          }

          const stageMsg: Record<string, string> = {
            planning: data.status === "done"
              ? `Plan: ${data.plan?.summary ?? "created"}`
              : "Creating plan...",
            generating: data.status === "done"
              ? "Code generated"
              : "Generating code...",
            fixing: `Fix attempt ${data.iteration ?? "?"} (${data.remainingErrors ?? "?"} errors left)`,
            reviewing: data.status === "done"
              ? "Review complete"
              : "Reviewing code...",
          };

          onProgress?.(data.stage, stageMsg[data.stage] ?? data.status);
        } catch {
          // skip malformed lines
        }
      }
    }

    onComplete?.("Generation complete!");
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onProgress?.("error", err.message);
    onError?.(err);
    throw err;
  }
}
