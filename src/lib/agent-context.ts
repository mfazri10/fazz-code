import { useProjectStore } from "@/stores/project-store";

export function buildContextPrompt(userPrompt: string): string {
  const store = useProjectStore.getState();
  const { files, errors } = store;

  let context = "";

  if (files.length > 0) {
    context += "\n\n## Current Project Files\n";
    for (const file of files) {
      context += `\n### ${file.path}\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n`;
    }
  }

  if (errors.length > 0) {
    context += "\n\n## Current Errors\n";
    for (const error of errors) {
      context += `- [${error.severity}] ${error.file}: ${error.message}\n`;
    }
  }

  return userPrompt + context;
}

export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

export function truncateToTokenBudget(
  text: string,
  maxTokens: number
): string {
  const estimatedTokens = estimateTokens(text);
  if (estimatedTokens <= maxTokens) return text;

  const maxChars = maxTokens * 4;
  return text.slice(0, maxChars) + "\n... (truncated)";
}
