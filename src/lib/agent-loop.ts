import { generateText } from "ai";
import { getModel } from "@/lib/model-gateway";
import { useProjectStore } from "@/stores/project-store";
import { z } from "zod";

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
}

export async function runGenerator({
  prompt,
  model = "claude-sonnet-4-20250514",
  onProgress,
  onComplete,
  onError,
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
    });

    // Parse code blocks from the response
    const codeBlockRegex = /```(\w+)\s+filename="([^"]+)"\n([\s\S]*?)```/g;
    let match;
    let filesCreated = 0;

    while ((match = codeBlockRegex.exec(result.text)) !== null) {
      const [, , filePath, content] = match;
      if (filePath && content) {
        const ext = filePath.split(".").pop() || "";
        const langMap: Record<string, string> = {
          tsx: "typescript",
          ts: "typescript",
          jsx: "javascript",
          js: "javascript",
          css: "css",
          html: "html",
          json: "json",
          md: "markdown",
        };

        const existing = store.files.find((f) => f.path === filePath);
        if (existing) {
          store.updateFile(filePath, content.trim());
        } else {
          store.addFile({
            path: filePath,
            content: content.trim(),
            language: langMap[ext] || "plaintext",
          });
        }
        filesCreated++;
        onProgress?.(`Created: ${filePath}`);
      }
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
