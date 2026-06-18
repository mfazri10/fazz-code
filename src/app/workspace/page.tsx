"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TEMPLATES } from "@/lib/templates";
import { useProjectStore } from "@/stores/project-store";

export default function WorkspacePage() {
  const router = useRouter();
  const { loadProjects, createNewProject } = useProjectStore();
  const [projects, setProjects] = useState<
    Array<{ id: string; name: string; description?: string; updatedAt: Date }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("blank");

  useEffect(() => {
    loadProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, [loadProjects]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const project = await createNewProject(newName.trim());

      // Apply template files
      const template = TEMPLATES.find((t) => t.id === selectedTemplate);
      if (template && Object.keys(template.files).length > 0) {
        for (const [path, content] of Object.entries(template.files)) {
          await fetch(`/api/projects/${project.id}/files`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path, content, language: "typescript" }),
          });
        }
        await useProjectStore.getState().loadProject(project.id);
      }

      setDialogOpen(false);
      setNewName("");
      setSelectedTemplate("blank");
      router.push(`/project/${project.id}`);
    } finally {
      setCreating(false);
    }
  }, [newName, selectedTemplate, createNewProject, router]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build and manage your AI-generated apps
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Project name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />

              {/* Template picker */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Template
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`flex items-start gap-2 rounded-lg border p-3 text-left transition-colors ${
                        selectedTemplate === t.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedTemplate(t.id)}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="w-full"
              >
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Plus className="h-10 w-10 mb-4 opacity-30" />
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/project/${p.id}`)}
              className="flex items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-accent"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                {p.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {p.description}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {p.updatedAt.toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
