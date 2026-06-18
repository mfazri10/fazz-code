"use client";

import { FileText, FolderOpen, Loader2, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/stores/project-store";

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { files, setSelectedFile, loadProjects } = useProjectStore();

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Load projects when opened
  useEffect(() => {
    if (open && projects.length === 0) {
      setLoading(true);
      loadProjects()
        .then(setProjects)
        .finally(() => setLoading(false));
    }
  }, [open, projects.length, loadProjects]);

  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [];

    // File commands
    files.forEach((f) => {
      cmds.push({
        id: `file-${f.path}`,
        label: f.path,
        icon: <FileText className="h-4 w-4" />,
        action: () => {
          setSelectedFile(f.path);
          setOpen(false);
        },
        category: "Files",
      });
    });

    // Project commands
    projects.forEach((p) => {
      cmds.push({
        id: `project-${p.id}`,
        label: p.name,
        icon: <FolderOpen className="h-4 w-4" />,
        action: () => {
          router.push(`/project/${p.id}`);
          setOpen(false);
        },
        category: "Projects",
      });
    });

    // Action commands
    cmds.push({
      id: "new-project",
      label: "Create New Project",
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        router.push("/workspace");
        setOpen(false);
      },
      category: "Actions",
    });

    return cmds;
  }, [files, projects, setSelectedFile, router]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Command[]>();
    for (const cmd of filtered) {
      const existing = groups.get(cmd.category) || [];
      existing.push(cmd);
      groups.set(cmd.category, existing);
    }
    return groups;
  }, [filtered]);

  return (
    <>
      {/* Trigger button in nav */}
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 text-xs text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="h-3 w-3" />
        <span>Search...</span>
        <kbd className="ml-2 rounded border px-1 py-0.5 text-[9px]">⌘K</kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files, projects, commands..."
              className="border-0 focus-visible:ring-0 shadow-none"
              autoFocus
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              Array.from(grouped.entries()).map(([category, cmds]) => (
                <div key={category}>
                  <p className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase">
                    {category}
                  </p>
                  {cmds.map((cmd) => (
                    <button
                      key={cmd.id}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                      onClick={cmd.action}
                    >
                      {cmd.icon}
                      <span className="truncate">{cmd.label}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
