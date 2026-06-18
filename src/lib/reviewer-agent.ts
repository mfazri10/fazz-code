import { generateText } from "ai";

import { getModel } from "@/lib/model-gateway";

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
  model: string = "gpt-4o",
  files: Record<string, string> = {}
): Promise<ReviewResult> {
  const fileContext = Object.entries(files)
    .map(([path, content]) => `\n### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join("\n");

  const result = await generateText({
    model: getModel(model),
    system: REVIEWER_SYSTEM_PROMPT,
    prompt: `Review these files:${fileContext}`,
  });

  const jsonMatch = result.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse review JSON");
  }

  return JSON.parse(jsonMatch[0]) as ReviewResult;
}
