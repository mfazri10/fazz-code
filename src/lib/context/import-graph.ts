/**
 * Import Graph Analyzer
 * Parses all project files to build a dependency graph.
 * Used by AI Context Awareness to send related files as context.
 */

export interface ImportNode {
  path: string;
  imports: string[];      // files this file imports
  importedBy: string[];   // files that import this file
  exports: string[];      // named exports
}

export interface ImportGraph {
  nodes: Map<string, ImportNode>;
  getImportedBy(filePath: string): string[];
  getImports(filePath: string): string[];
  getAffectedFiles(filePath: string): string[];
}

// Simple regex-based import parser (works for TS/JSX)
const IMPORT_RE = /import\s+(?:{[^}]+}|[\w*]+(?:\s+as\s+\w+)?|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
const EXPORT_RE = /export\s+(?:default\s+)?(?:function|const|class|interface|type|enum)\s+(\w+)/g;

function resolvePath(fromFile: string, importPath: string): string | null {
  // Skip external packages
  if (!importPath.startsWith(".") && !importPath.startsWith("@/")) return null;

  let resolved = importPath;

  // Handle @/ alias → src/
  if (resolved.startsWith("@/")) {
    resolved = "src/" + resolved.slice(2);
  }

  // Handle relative imports
  if (resolved.startsWith(".")) {
    const dir = fromFile.split("/").slice(0, -1).join("/");
    const parts = (dir + "/" + resolved).split("/");
    const resolvedParts: string[] = [];
    for (const part of parts) {
      if (part === "..") { if (resolvedParts.length > 0) resolvedParts.pop(); }
      else if (part !== ".") resolvedParts.push(part);
    }
    resolved = resolvedParts.join("/");
  }

  // Add extensions if missing
  if (!resolved.match(/\.\w+$/)) {
    return resolved + ".tsx";
  }

  return resolved;
}

export function buildImportGraph(files: Record<string, string>): ImportGraph {
  const nodes = new Map<string, ImportNode>();

  // Initialize all nodes
  for (const path of Object.keys(files)) {
    nodes.set(path, { path, imports: [], importedBy: [], exports: [] });
  }

  // Parse imports and exports
  for (const [path, content] of Object.entries(files)) {
    const node = nodes.get(path)!;

    // Find imports
    let match;
    IMPORT_RE.lastIndex = 0;
    while ((match = IMPORT_RE.exec(content)) !== null) {
      const importPath = match[1];
      if (!importPath) continue;
      const resolved = resolvePath(path, importPath);
      if (resolved && nodes.has(resolved)) {
        node.imports.push(resolved);
      }
    }

    // Find exports
    EXPORT_RE.lastIndex = 0;
    while ((match = EXPORT_RE.exec(content)) !== null) {
      if (match[1]) node.exports.push(match[1]);
    }
  }

  // Build reverse mapping (importedBy)
  for (const [path, node] of nodes) {
    for (const imported of node.imports) {
      const target = nodes.get(imported);
      if (target && !target.importedBy.includes(path)) {
        target.importedBy.push(path);
      }
    }
  }

  return {
    nodes,
    getImportedBy: (filePath: string) => nodes.get(filePath)?.importedBy ?? [],
    getImports: (filePath: string) => nodes.get(filePath)?.imports ?? [],
    getAffectedFiles: (filePath: string) => {
      const affected = new Set<string>();
      const queue = [filePath];
      while (queue.length > 0) {
        const current = queue.pop()!;
        const node = nodes.get(current);
        if (!node) continue;
        for (const parent of node.importedBy) {
          if (!affected.has(parent)) {
            affected.add(parent);
            queue.push(parent);
          }
        }
      }
      return Array.from(affected);
    },
  };
}
