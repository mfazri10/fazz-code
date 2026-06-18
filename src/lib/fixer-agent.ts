import { generateText } from "ai";
import { getModel } from "@/lib/model-gateway";
import { useProjectStore } from "@/stores/project-store";

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
  summary: string;
}

export async function runFixer(
  errors: Array<{ file: string; message: string; severity: string }>,
  model: string = "claude-sonnet-4-20250514"
): Promise<FixResult> {
  const store = useProjectStore.getState();
  store.setRunStatus("fixing");

  try {
    const errorContext = errors
      .map((e) => `[${e.severity}] ${e.file}: ${e.message}`)
      .join("\n");

    const fileContext = store.files
      .map((f) => `\n### ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``)
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
        const existing = store.files.find((f) => f.path === filePath);
        if (existing) {
          store.updateFile(filePath, content.trim());
          filesFixed.push(filePath);
        }
      }
    }

    store.addMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content: `🔧 **Fixed ${filesFixed.length} files:**\n${filesFixed.map((f) => `- \`${f}\``).join("\n")}`,
      timestamp: new Date(),
      status: "done",
    });

    return { filesFixed, summary: result.text };
  } finally {
    store.setRunStatus("idle");
  }
}
