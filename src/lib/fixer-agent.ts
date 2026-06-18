import { generateText } from "ai";

import { getModel } from "@/lib/model-gateway";

const FIXER_SYSTEM_PROMPT = `You are Fazz Code Fixer, an expert at fixing code errors.

Given error messages and the current code, output minimal patches to fix the issues.

For each fix, use this format:
\`\`\`tsx filename="path/to/file.tsx"
// complete fixed file content
\`\`\`

Focus on:
1. TypeScript type errors
2. Import errors
3. Runtime errors
4. Build errors

Make minimal changes - only fix what's broken. Don't refactor or add features.`;

export interface FixResult {
  filesFixed: string[];
  remainingErrors: Array<{ file: string; message: string; severity: string }>;
  summary: string;
}

export async function runFixer(
  errors: Array<{ file: string; message: string; severity: string }>,
  model: string = "claude-sonnet-4-20250514",
  files: Record<string, string> = {}
): Promise<FixResult> {
  const errorContext = errors
    .map((e) => `[${e.severity}] ${e.file}: ${e.message}`)
    .join("\n");

  const fileContext = Object.entries(files)
    .map(([path, content]) => `\n### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join("\n");

  const result = await generateText({
    model: getModel(model),
    system: FIXER_SYSTEM_PROMPT,
    prompt: `Errors to fix:\n${errorContext}\n\nCurrent files:${fileContext}`,
  });

  // Parse code blocks
  const codeBlockRegex = /```(\w+)\s+filename="([^"]+)"\n([\s\S]*?)```/g;
  let match;
  const filesFixed: string[] = [];

  while ((match = codeBlockRegex.exec(result.text)) !== null) {
    const [, , filePath, content] = match;
    if (filePath && content) {
      files[filePath] = content.trim();
      filesFixed.push(filePath);
    }
  }

  return {
    filesFixed,
    remainingErrors: [], // In a real impl, would re-check errors
    summary: result.text,
  };
}
