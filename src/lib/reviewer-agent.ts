import { generateText } from "ai";
import { getModel } from "@/lib/model-gateway";
import { useProjectStore } from "@/stores/project-store";

const REVIEWER_SYSTEM_PROMPT = `You are Fazz Code Reviewer, an expert at reviewing code quality and suggesting improvements.

Review the provided code and output a JSON assessment:
{
  "verdict": "approve" | "request_changes",
  "issues": [
    {
      "file": "src/app/page.tsx",
      "severity": "error" | "warning" | "info",
      "detail": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "summary": "Overall assessment"
}

Focus on:
1. TypeScript type safety
2. React best practices
3. Accessibility
4. Performance
5. Code organization
6. Security

Only output valid JSON.`;

export interface ReviewResult {
  verdict: "approve" | "request_changes";
  issues: Array<{
    file: string;
    severity: "error" | "warning" | "info";
    detail: string;
    suggestion: string;
  }>;
  summary: string;
}

export async function runReviewer(
  model: string = "gpt-4o"
): Promise<ReviewResult> {
  const store = useProjectStore.getState();
  store.setRunStatus("reviewing");

  try {
    const fileContext = store.files
      .map((f) => `\n### ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``)
      .join("\n");

    const result = await generateText({
      model: getModel(model),
      system: REVIEWER_SYSTEM_PROMPT,
      prompt: `Review these files:${fileContext}`,
    });

    // Parse JSON
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse review JSON");
    }

    const review: ReviewResult = JSON.parse(jsonMatch[0]);

    // Add review message
    const emoji = review.verdict === "approve" ? "✅" : "⚠️";
    store.addMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content: `${emoji} **Review: ${review.verdict}**\n\n${review.summary}${
        review.issues.length > 0
          ? `\n\n**Issues:**\n${review.issues.map((i) => `- [${i.severity}] \`${i.file}\`: ${i.detail}`).join("\n")}`
          : ""
      }`,
      timestamp: new Date(),
      status: "done",
    });

    return review;
  } finally {
    store.setRunStatus("idle");
  }
}
