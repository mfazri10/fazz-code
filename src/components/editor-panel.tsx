"use client";

import Editor, { DiffEditor } from "@monaco-editor/react";
import { Check, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/project-store";

export function EditorPanel() {
  const { files, selectedFile, setSelectedFile, updateFile } = useProjectStore();
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());
  const [diffMode, setDiffMode] = useState<Map<string, string>>(new Map()); // path → original content
  const originalRef = useRef<Map<string, string>>(new Map());

  const activeFileData = files.find((f) => f.path === selectedFile);

  // Add to open tabs when active file changes
  useEffect(() => {
    if (selectedFile && !openTabs.includes(selectedFile)) {
      setOpenTabs((prev) => [...prev, selectedFile]);
    }
  }, [selectedFile, openTabs]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (selectedFile && value !== undefined) {
        // Store original if not already stored
        if (!originalRef.current.has(selectedFile)) {
          const currentContent = files.find((f) => f.path === selectedFile)?.content;
          if (currentContent) {
            originalRef.current.set(selectedFile, currentContent);
            setDiffMode(new Map(originalRef.current));
          }
        }
        updateFile(selectedFile, value);
        setModifiedFiles((prev) => new Set(prev).add(selectedFile));
      }
    },
    [selectedFile, files, updateFile]
  );

  const handleAccept = useCallback(
    (path: string) => {
      originalRef.current.delete(path);
      setDiffMode(new Map(originalRef.current));
      setModifiedFiles((prev) => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
    },
    []
  );

  const handleReject = useCallback(
    (path: string) => {
      const original = originalRef.current.get(path);
      if (original) {
        updateFile(path, original);
        originalRef.current.delete(path);
        setDiffMode(new Map(originalRef.current));
        setModifiedFiles((prev) => {
          const next = new Set(prev);
          next.delete(path);
          return next;
        });
      }
    },
    [updateFile]
  );

  const handleCloseTab = useCallback(
    (path: string) => {
      setOpenTabs((prev) => prev.filter((t) => t !== path));
      if (selectedFile === path) {
        const remaining = openTabs.filter((t) => t !== path);
        setSelectedFile(remaining.length > 0 ? remaining[remaining.length - 1]! : null);
      }
    },
    [openTabs, selectedFile, setSelectedFile]
  );

  const isDiffing = selectedFile ? diffMode.has(selectedFile) : false;

  return (
    <div className="flex h-full flex-col">
      {/* Tab Bar */}
      <div className="flex items-center border-b bg-muted/30">
        <div className="flex flex-1 overflow-x-auto">
          {openTabs.map((path) => (
            <div
              key={path}
              className={`flex items-center gap-1.5 border-r px-3 py-2 text-xs cursor-pointer transition-colors ${
                selectedFile === path
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
              onClick={() => setSelectedFile(path)}
            >
              <span className="truncate max-w-[120px]">
                {path.split("/").pop()}
              </span>
              {modifiedFiles.has(path) && (
                <span className="h-2 w-2 rounded-full bg-orange-500" />
              )}
              <button
                className="ml-1 rounded p-0.5 hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(path);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Diff controls */}
        {selectedFile && modifiedFiles.has(selectedFile) && (
          <div className="flex items-center gap-1 px-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-green-600"
              onClick={() => handleAccept(selectedFile)}
            >
              <Check className="mr-1 h-3 w-3" />
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-red-600"
              onClick={() => handleReject(selectedFile)}
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* Editor / Diff Editor */}
      <div className="flex-1">
        {!activeFileData ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a file to edit</p>
          </div>
        ) : isDiffing ? (
          <DiffEditor
            original={originalRef.current.get(selectedFile!) ?? activeFileData.content}
            modified={activeFileData.content}
            language={activeFileData.language}
            theme="vs-dark"
            options={{
              readOnly: false,
              renderSideBySide: true,
              minimap: { enabled: false },
              fontSize: 13,
            }}
          />
        ) : (
          <Editor
            height="100%"
            language={activeFileData.language}
            value={activeFileData.content}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              wordWrap: "on",
              scrollBeyondLastLine: false,
            }}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between border-t px-3 py-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          {activeFileData && (
            <>
              <span>{activeFileData.path}</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0">
                {activeFileData.language}
              </Badge>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>{files.length} files</span>
          {modifiedFiles.size > 0 && (
            <span className="text-orange-500">
              {modifiedFiles.size} modified
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
