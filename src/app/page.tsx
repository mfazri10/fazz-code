"use client";

import { ArrowUp, Clock, Code2, Plus, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Placeholder project data
const INITIAL_PROJECTS = [
  {
    id: "1",
    name: "Landing Page SaaS",
    description: "Hero section with pricing table",
    updatedAt: "2 hours ago",
    status: "active",
  },
  {
    id: "2",
    name: "Portfolio Website",
    description: "Personal portfolio with blog",
    updatedAt: "1 day ago",
    status: "active",
  },
  {
    id: "3",
    name: "E-commerce Dashboard",
    description: "Admin panel with analytics",
    updatedAt: "3 days ago",
    status: "draft",
  },
];

const SUGGESTIONS = [
  "Landing page SaaS dengan pricing table",
  "Dashboard admin dengan analytics",
  "Portfolio pribadi dengan blog",
  "Toko online sederhana",
];

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [prompt, setPrompt] = useState("");

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    const newProject = {
      id: String(Date.now()),
      name: newProjectName,
      description: "New project",
      updatedAt: "Just now",
      status: "active",
    };

    setProjects([newProject, ...projects]);
    setNewProjectName("");
    setIsDialogOpen(false);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    router.push(`/workspace?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient gradient backdrop */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-gradient-to-b from-primary/10 via-primary/[0.04] to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-[-12%] h-[460px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Code2 className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              Fazz Code
            </span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger>
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Give your project a name to get started.
                </DialogDescription>
              </DialogHeader>
              <Input
                placeholder="My awesome project"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6">
        {/* Hero */}
        <section className="flex flex-col items-center pb-14 pt-20 text-center">
          <Badge
            variant="secondary"
            className="mb-5 gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Multi-agent app builder
          </Badge>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Bangun aplikasi web hanya dengan{" "}
            <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              mendeskripsikannya
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-balance text-muted-foreground">
            Fazz Code memakai agen Planner, Generator, Reviewer, dan Fixer untuk
            menulis, meninjau, dan memperbaiki kode secara otomatis.
          </p>

          {/* Prompt box */}
          <div className="mt-8 w-full max-w-2xl">
            <div className="group rounded-2xl border border-border/70 bg-card p-2 text-left shadow-sm transition focus-within:border-primary/60 focus-within:shadow-md">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                rows={3}
                placeholder="Deskripsikan aplikasi yang ingin kamu buat... mis. 'Landing page untuk aplikasi kebugaran dengan form pendaftaran'"
                className="w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between gap-2 px-3 pb-1">
                <span className="text-xs text-muted-foreground">
                  Tekan ⌘ / Ctrl + Enter untuk mulai
                </span>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={!prompt.trim()}
                  onClick={handleGenerate}
                >
                  Generate
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Suggestions */}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPrompt(s)}
                  className="rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Projects */}
        <section className="pb-20">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold">Proyek kamu</h2>
              <p className="text-sm text-muted-foreground">
                {projects.length} proyek
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-20 text-muted-foreground">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Code2 className="h-6 w-6 opacity-60" />
              </div>
              <p className="text-lg font-medium text-foreground">
                Belum ada proyek
              </p>
              <p className="mt-1 text-sm">
                Buat proyek pertamamu untuk mulai membangun
              </p>
              <Button className="mt-5" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                New Project
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="group relative overflow-hidden border-border/60 transition hover:border-primary/50 hover:shadow-md"
                >
                  <Link href="/workspace" className="block">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                            <Code2 className="h-4 w-4" />
                          </div>
                          <CardTitle className="text-base">
                            {project.name}
                          </CardTitle>
                        </div>
                        <Badge
                          variant={
                            project.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          className="text-[10px] uppercase tracking-wide"
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <CardDescription className="mt-2">
                        {project.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {project.updatedAt}
                      </div>
                    </CardContent>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 opacity-0 transition group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteProject(project.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
