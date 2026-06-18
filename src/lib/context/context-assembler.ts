/**
 * Context Assembler
 * Main orchestrator that gathers and assembles all context
 * before sending to AI model. Builds a rich, dynamic system prompt.
 */

import { buildConversationContext, type CompressedMessage } from "./conversation-compressor";
import { type DesignTokens,extractDesignTokens, formatTokensForPrompt } from "./design-tokens";
import { buildImportGraph } from "./import-graph";
import { allocateTokenBudget, type ContextSection } from "./token-budget";

export interface ProjectMetadata {
  name: string;
  framework: string;
  language: string;
  styling: string;
  totalFiles: number;
}

export interface FileContext {
  path: string;
  content: string;
  language: string;
  imports: string[];
  importedBy: string[];
}

export interface ContextAssembly {
  metadata: ProjectMetadata;
  activeFile: FileContext | null;
  relatedFiles: FileContext[];
  designTokens: DesignTokens;
  conversationContext: string;
  dataModels?: string;
}

/**
 * Build the full system prompt from assembled context.
 */
export function buildSystemPrompt(assembly: ContextAssembly): string {
  const parts: string[] = [];

  // Core identity
  parts.push(`You are Fazz Code, an expert AI code generator helping build a web application.

## Project Context
- Name: ${assembly.metadata.name}
- Framework: ${assembly.metadata.framework}
- Language: ${assembly.metadata.language}
- Styling: ${assembly.metadata.styling}
- Total files: ${assembly.metadata.totalFiles}`);

  // Design tokens
  const tokenStr = formatTokensForPrompt(assembly.designTokens);
  if (tokenStr) {
    parts.push(`\n${tokenStr}`);
  }

  // Active file
  if (assembly.activeFile) {
    parts.push(`\n## Current File: ${assembly.activeFile.path}
Language: ${assembly.activeFile.language}
Imports: ${assembly.activeFile.imports.join(", ") || "none"}
Imported by: ${assembly.activeFile.importedBy.join(", ") || "none (be careful not to break dependents)"}

\`\`\`${assembly.activeFile.language}
${assembly.activeFile.content}
\`\`\``);
  }

  // Related files (from import graph)
  if (assembly.relatedFiles.length > 0) {
    parts.push("\n## Related Files (imported by or importing the current file)");
    for (const file of assembly.relatedFiles.slice(0, 5)) {
      parts.push(`\n### ${file.path}
\`\`\`${file.language}
${file.content.slice(0, 2000)}${file.content.length > 2000 ? "\n// ... truncated" : ""}
\`\`\``);
    }
  }

  // Data models
  if (assembly.dataModels) {
    parts.push(`\n## Data Models\n${assembly.dataModels}`);
  }

  // Conversation context
  if (assembly.conversationContext) {
    parts.push(`\n## Conversation History\n${assembly.conversationContext}`);
  }

  // Guidelines
  parts.push(`
## Guidelines
- Use existing shadcn/ui components from the project when available
- Follow the established color scheme and typography (see Design System above)
- Maintain TypeScript type safety
- Do not modify files not shown unless explicitly asked
- Prefer minimal, focused changes over large rewrites
- When generating code blocks, use filename format: \`\`\`tsx filename="path/to/file.tsx"`);

  return parts.join("\n");
}

/**
 * Assemble all context for a given prompt and project state.
 */
export function assembleContext(params: {
  prompt: string;
  files: Record<string, string>;
  activeFilePath?: string;
  projectName?: string;
  messages?: CompressedMessage[];
  dataModels?: string;
}): ContextAssembly {
  const {
    files,
    activeFilePath,
    projectName = "Untitled Project",
    messages = [],
    dataModels,
  } = params;

  // Build import graph
  const graph = buildImportGraph(files);

  // Extract design tokens
  const designTokens = extractDesignTokens(files);

  // Get active file context
  let activeFile: FileContext | null = null;
  if (activeFilePath && files[activeFilePath]) {
    const node = graph.nodes.get(activeFilePath);
    activeFile = {
      path: activeFilePath,
      content: files[activeFilePath],
      language: getLanguage(activeFilePath),
      imports: node?.imports ?? [],
      importedBy: node?.importedBy ?? [],
    };
  }

  // Get related files from import graph
  const relatedPaths = new Set<string>();
  if (activeFilePath) {
    // Files that this file imports
    for (const imp of graph.getImports(activeFilePath)) {
      relatedPaths.add(imp);
    }
    // Files that import this file
    for (const parent of graph.getImportedBy(activeFilePath)) {
      relatedPaths.add(parent);
    }
  }

  const relatedFiles: FileContext[] = [];
  for (const path of relatedPaths) {
    if (path !== activeFilePath && files[path]) {
      const node = graph.nodes.get(path);
      relatedFiles.push({
        path,
        content: files[path],
        language: getLanguage(path),
        imports: node?.imports ?? [],
        importedBy: node?.importedBy ?? [],
      });
    }
  }

  // Build conversation context
  const conversationContext = buildConversationContext(messages);

  return {
    metadata: {
      name: projectName,
      framework: "Next.js 15 App Router",
      language: "TypeScript",
      styling: "Tailwind CSS + shadcn/ui",
      totalFiles: Object.keys(files).length,
    },
    activeFile,
    relatedFiles,
    designTokens,
    conversationContext,
    dataModels,
  };
}

/**
 * Assemble context and build system prompt in one call.
 * Uses token budget allocator to fit within limits.
 */
export function buildFullSystemPrompt(params: {
  prompt: string;
  files: Record<string, string>;
  activeFilePath?: string;
  projectName?: string;
  messages?: CompressedMessage[];
  dataModels?: string;
  tokenBudget?: number;
}): string {
  const assembly = assembleContext(params);

  // Build sections for budget allocation
  const sections: ContextSection[] = [
    {
      name: "core",
      priority: 1,
      content: buildSystemPrompt({
        ...assembly,
        relatedFiles: [],
        conversationContext: "",
        dataModels: undefined,
      }),
    },
  ];

  // Add related files as priority 2
  if (assembly.relatedFiles.length > 0) {
    sections.push({
      name: "related_files",
      priority: 2,
      content: assembly.relatedFiles
        .map((f) => `### ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``)
        .join("\n\n"),
    });
  }

  // Add data models as priority 4
  if (assembly.dataModels) {
    sections.push({
      name: "data_models",
      priority: 4,
      content: assembly.dataModels,
    });
  }

  // Add conversation as priority 5
  if (assembly.conversationContext) {
    sections.push({
      name: "conversation",
      priority: 5,
      content: assembly.conversationContext,
    });
  }

  // Allocate budget
  const allocated = allocateTokenBudget(sections, params.tokenBudget ?? 100_000);

  // Combine all allocated sections
  return allocated.map((s) => s.content).filter(Boolean).join("\n\n");
}

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    css: "css",
    html: "html",
    json: "json",
    md: "markdown",
    sql: "sql",
  };
  return map[ext || ""] || "plaintext";
}
