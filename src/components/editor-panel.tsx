"use client";

import Editor from "@monaco-editor/react";
import { Save,X } from "lucide-react";
import { useCallback, useEffect,useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/project-store";

export function EditorPanel() {
  const { files, activeFile, setActiveFile, updateFile } = useProjectStore();
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());

  const activeFileData = files.find((f) => f.path === activeFile);

  // Add to open tabs when active file changes
  useEffect(() => {
    if (activeFile && !openTabs.includes(activeFile)) {
      setOpenTabs((prev) => [...prev, activeFile]);
    }
  }, [activeFile, openTabs]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeFile && value !== undefined) {
        updateFile(activeFile, value);
        setModifiedFiles((prev) => new Set(prev).add(activeFile));
      }
    },
    [activeFile, updateFile]
  );

  const handleSave = useCallback(() => {
    if (activeFile) {
      setModifiedFiles((prev) => {
        const next = new Set(prev);
        next.delete(activeFile);
        return next;
      });
      // TODO: Sync to WebContainer and Supabase
    }
  }, [activeFile]);

  const handleCloseTab = useCallback(
    (path: string) => {
      setOpenTabs((prev) => prev.filter((t) => t !== path));
      if (activeFile === path) {
        const remaining = openTabs.filter((t) => t !== path);
        setActiveFile(remaining[remaining.length - 1] || null);
      }
    },
    [activeFile, openTabs, setActiveFile]
  );

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const getLanguage = (path: string): string => {
    const ext = path.split(".").pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      json: "json",
      css: "css",
      scss: "scss",
      html: "html",
      md: "markdown",
      yml: "yaml",
      yaml: "yaml",
    };
    return langMap[ext || ""] || "plaintext";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      {openTabs.length > 0 && (
        <div className="flex items-center border-b bg-muted/30 overflow-x-auto">
          {openTabs.map((tab) => (
            <div
              key={tab}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs border-r cursor-pointer ${
                activeFile === tab
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
              onClick={() => setActiveFile(tab)}
            >
              <span className="truncate max-w-[120px]">
                {tab.split("/").pop()}
              </span>
              {modifiedFiles.has(tab) && (
                <Badge variant="secondary" className="h-1.5 w-1.5 p-0 rounded-full" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(tab);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      {activeFileData ? (
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={getLanguage(activeFileData.path)}
            value={activeFileData.content}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineHeight: 20,
              padding: { top: 12 },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
            }}
          />
          {/* Save indicator */}
          <div className="absolute bottom-2 right-2">
            {modifiedFiles.has(activeFileData.path) && (
              <Button
                variant="secondary"
                size="sm"
                className="h-6 text-xs"
                onClick={handleSave}
              >
                <Save className="mr-1 h-3 w-3" />
                Save
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-sm">No file open</p>
            <p className="text-xs mt-1">
              Select a file from the tree to start editing
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
