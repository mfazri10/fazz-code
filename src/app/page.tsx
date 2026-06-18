"use client";

import { Clock, Code2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
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

export default function DashboardPage() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Fazz Code</span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
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
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateProject}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Project Grid */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold mb-1">Your Projects</h1>
        <p className="text-muted-foreground mb-6">
          {projects.length} project{projects.length !== 1 ? "s" : ""}
        </p>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Code2 className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm mt-1">
              Create your first project to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="group relative transition-colors hover:border-primary/50"
              >
                <Link href="/workspace">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">
                        {project.name}
                      </CardTitle>
                      <Badge
                        variant={
                          project.status === "active"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <CardDescription>{project.description}</CardDescription>
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
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
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
      </main>
    </div>
  );
}
