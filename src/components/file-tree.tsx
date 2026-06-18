"use client";

import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback,useState } from "react";

import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/project-store";

interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

function buildTree(files: string[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  for (const file of files) {
    const parts = file.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const existing = current.find((n) => n.name === part);

      if (existing) {
        if (!isFile && existing.children) {
          current = existing.children;
        }
      } else if (part) {
        const node: FileTreeNode = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          type: isFile ? "file" : "directory",
          children: isFile ? undefined : [],
        };
        current.push(node);
        if (!isFile && node.children) {
          current = node.children;
        }
      }
    }
  }

  return root;
}

function FileTreeItem({
  node,
  depth = 0,
  selectedFile,
  onSelect,
  onDelete,
}: {
  node: FileTreeNode;
  depth?: number;
  selectedFile: string | null;
  onSelect: (path: string) => void;
  onDelete: (path: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(depth < 2);

  if (node.type === "directory") {
    return (
      <div>
        <button
          className="flex w-full items-center gap-1 px-2 py-1 text-sm hover:bg-accent rounded-sm"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <ChevronDown className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen &&
          node.children?.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
      </div>
    );
  }

  return (
    <div className="group flex items-center">
      <button
        className={`flex flex-1 items-center gap-1 px-2 py-1 text-sm rounded-sm ${
          selectedFile === node.path
            ? "bg-accent text-accent-foreground"
            : "hover:bg-accent/50"
        }`}
        style={{ paddingLeft: `${depth * 12 + 20}px` }}
        onClick={() => onSelect(node.path)}
      >
        <File className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{node.name}</span>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(node.path);
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function FileTree() {
  const { files, selectedFile, setSelectedFile, deleteFile } = useProjectStore();

  const tree = buildTree(files.map((f) => f.path));

  const handleSelect = useCallback(
    (path: string) => {
      setSelectedFile(path);
    },
    [setSelectedFile]
  );

  const handleDelete = useCallback(
    (path: string) => {
      deleteFile(path);
    },
    [deleteFile]
  );

  return (
    <div className="h-full overflow-auto">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-medium text-muted-foreground">
          Files
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="p-1">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-muted-foreground">
            <Folder className="h-6 w-6 mb-2 opacity-50" />
            <p className="text-xs">No files yet</p>
          </div>
        ) : (
          tree.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
              selectedFile={selectedFile}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
