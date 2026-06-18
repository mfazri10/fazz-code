import { generateText } from "ai";

import { getModel } from "@/lib/model-gateway";
import { useProjectStore } from "@/stores/project-store";

const GENERATOR_SYSTEM_PROMPT = `You are Fazz Code Generator, an expert AI code generator. You help users build web applications by generating clean, production-ready code.

When generating code:
- Always use TypeScript
- Use React/Next.js App Router conventions
- Use Tailwind CSS for styling
- Use shadcn/ui components when appropriate
- Write clean, well-structured code with proper types
- Create complete files, not partial snippets

Project structure conventions:
- src/app/ - Next.js App Router pages and layouts
- src/components/ - React components
- src/components/ui/ - shadcn/ui components
- src/lib/ - Utility functions and services
- src/stores/ - State management (Zustand)

Output format: For each file, use a code block with the filename as the language identifier:
\`\`\`tsx filename="src/app/page.tsx"
// file content here
\`\`\`

After writing all files, provide a brief summary of what was created.`;

export interface AgentRunOptions {
  prompt: string;
  model?: string;
  onProgress?: (message: string) => void;
  onComplete?: (summary: string) => void;
  onError?: (error: Error) => void;
  abortSignal?: AbortSignal;
}

/**
 * Parse code blocks from AI response text.
 * Handles multiple formats and validates content.
 */
function parseCodeBlocks(text: string): Array<{ path: string; content: string; language: string }> {
  const results: Array<{ path: string; content: string; language: string }> = [];
  const seen = new Set<string>();

  const langMap: Record<string, string> = {
    tsx: "typescript",
    ts: "typescript",
    jsx: "javascript",
    js: "javascript",
    css: "css",
    html: "html",
    json: "json",
    md: "markdown",
    sql: "sql",
    sh: "shell",
    bash: "shell",
  };

  // Pattern 1: ```lang filename="path"
  const regex1 = /```(\w+)\s+filename="([^"]+)"\n([\s\S]*?)```/g;
  // Pattern 2: ```filename="path"``` (no lang)
  const regex2 = /```filename="([^"]+)"\n([\s\S]*?)```/g;

  let match;

  // Try pattern 1 first
  while ((match = regex1.exec(text)) !== null) {
    const [, lang, filePath, content] = match;
    if (filePath && content?.trim()) {
      const ext = filePath.split(".").pop() || lang || "";
      if (!seen.has(filePath)) {
        seen.add(filePath);
        results.push({ path: filePath, content: content.trim(), language: langMap[ext] || "plaintext" });
      }
    }
  }

  // Try pattern 2 if pattern 1 found nothing
  if (results.length === 0) {
    while ((match = regex2.exec(text)) !== null) {
      const [, filePath, content] = match;
      if (filePath && content?.trim()) {
        const ext = filePath.split(".").pop() || "";
        if (!seen.has(filePath)) {
          seen.add(filePath);
          results.push({ path: filePath, content: content.trim(), language: langMap[ext] || "plaintext" });
        }
      }
    }
  }

  // Pattern 3: generic code blocks — skip, too ambiguous
  return results;
}

export async function runGenerator({
  prompt,
  model = "claude-sonnet-4-20250514",
  onProgress,
  onComplete,
  onError,
  abortSignal,
}: AgentRunOptions): Promise<void> {
  const store = useProjectStore.getState();

  store.setRunStatus("generating");
  store.setIsGenerating(true);

  try {
    onProgress?.("Starting code generation...");

    const result = await generateText({
      model: getModel(model),
      system: GENERATOR_SYSTEM_PROMPT,
      prompt,
      abortSignal,
    });

    // Parse code blocks from the response
    const parsed = parseCodeBlocks(result.text);
    let filesCreated = 0;

    for (const { path: filePath, content, language } of parsed) {
      const existing = store.files.find((f) => f.path === filePath);
      if (existing) {
        store.updateFile(filePath, content);
      } else {
        store.addFile({ path: filePath, content, language });
      }
      filesCreated++;
      onProgress?.(`Created: ${filePath}`);
    }

    // Add assistant message to chat
    store.addMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content: result.text,
      timestamp: new Date(),
      status: "done",
    });

    onComplete?.(`Generated ${filesCreated} files`);
  } catch (error) {
    if (abortSignal?.aborted) {
      onProgress?.("Generation cancelled");
      store.setRunStatus("idle");
      store.setIsGenerating(false);
      return;
    }

    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);

    store.addMessage({
      id: crypto.randomUUID(),
      role: "system",
      content: `Error: ${err.message}`,
      timestamp: new Date(),
      status: "error",
    });
  } finally {
    store.setRunStatus("idle");
    store.setIsGenerating(false);
  }
}
