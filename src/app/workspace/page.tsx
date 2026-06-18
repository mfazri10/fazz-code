"use client";

import { Clock, Code2, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyek Saya</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bangun dan kelola aplikasi hasil AI kamu
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
              <DialogTitle>Buat Proyek</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Nama proyek"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />

              {/* Template picker */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
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
                        <p className="mt-0.5 text-xs text-muted-foreground">
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
                Buat
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-border/60 bg-muted/40"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-20 text-muted-foreground">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Code2 className="h-6 w-6 opacity-60" />
          </div>
          <p className="text-lg font-medium text-foreground">Belum ada proyek</p>
          <p className="mt-1 text-sm">Buat proyek pertamamu untuk mulai membangun</p>
          <Button className="mt-5" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <Card
              key={p.id}
              onClick={() => router.push(`/project/${p.id}`)}
              className="group cursor-pointer border-border/60 transition hover:border-primary/50 hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {p.description && (
                  <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                )}
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {p.updatedAt.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
