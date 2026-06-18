import { z } from "zod";

import { useProjectStore } from "@/stores/project-store";

// Tool schemas
export const writeFileSchema = z.object({
  path: z.string().describe("File path relative to project root"),
  content: z.string().describe("File content to write"),
});

export const readFileSchema = z.object({
  path: z.string().describe("File path relative to project root"),
});

export const listFilesSchema = z.object({
  path: z.string().optional().describe("Directory path, defaults to root"),
});

export const deleteFileSchema = z.object({
  path: z.string().describe("File path to delete"),
});

export const readErrorsSchema = z.object({});

// Tool implementations
export function createAgentTools() {
  const store = useProjectStore.getState();

  return {
    writeFile: {
      description: "Write content to a file in the project. Creates the file if it doesn't exist.",
      parameters: writeFileSchema,
      execute: async ({ path, content }: z.infer<typeof writeFileSchema>) => {
        const existing = store.files.find((f) => f.path === path);
        if (existing) {
          store.updateFile(path, content);
        } else {
          const ext = path.split(".").pop() || "";
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
          store.addFile({
            path,
            content,
            language: langMap[ext] || "plaintext",
          });
        }
        return `File written: ${path}`;
      },
    },

    readFile: {
      description: "Read the content of a file in the project.",
      parameters: readFileSchema,
      execute: async ({ path }: z.infer<typeof readFileSchema>) => {
        const file = store.files.find((f) => f.path === path);
        if (!file) {
          return `Error: File not found: ${path}`;
        }
        return file.content;
      },
    },

    listFiles: {
      description: "List all files in the project or a specific directory.",
      parameters: listFilesSchema,
      execute: async ({ path }: z.infer<typeof listFilesSchema>) => {
        const files = store.files.map((f) => f.path);
        if (path) {
          return files.filter((f) => f.startsWith(path)).join("\n");
        }
        return files.join("\n");
      },
    },

    deleteFile: {
      description: "Delete a file from the project.",
      parameters: deleteFileSchema,
      execute: async ({ path }: z.infer<typeof deleteFileSchema>) => {
        store.deleteFile(path);
        return `File deleted: ${path}`;
      },
    },

    readErrors: {
      description: "Read current build/runtime errors from the preview.",
      parameters: readErrorsSchema,
      execute: async () => {
        const errors = store.errors;
        if (errors.length === 0) {
          return "No errors";
        }
        return errors
          .map((e) => `[${e.severity}] ${e.file}: ${e.message}`)
          .join("\n");
      },
    },
  };
}
