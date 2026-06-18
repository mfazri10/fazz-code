"use client";

import {
  FileText,
  FolderOpen,
  FolderPlus,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/stores/project-store";

interface RouteNode {
  path: string;       // file path: src/app/page.tsx
  route: string;      // URL route: /
  name: string;       // display name: Home
  type: "page" | "layout" | "loading" | "error" | "not-found";
  children: RouteNode[];
}

const PAGE_TEMPLATES = [
  { id: "blank", name: "Blank Page", icon: "📄", description: "Empty page with layout" },
  { id: "list", name: "List Page", icon: "📋", description: "Data table with search" },
  { id: "detail", name: "Detail Page", icon: "🔍", description: "Item detail view" },
  { id: "form", name: "Form Page", icon: "📝", description: "Create/edit form" },
  { id: "dashboard", name: "Dashboard", icon: "📊", description: "Stats + charts" },
  { id: "landing", name: "Landing Page", icon: "🚀", description: "Hero + features + CTA" },
  { id: "settings", name: "Settings", icon: "⚙️", description: "Settings with tabs" },
  { id: "auth", name: "Auth Page", icon: "🔐", description: "Login/register" },
  { id: "404", name: "404 Page", icon: "❌", description: "Not found" },
];

const TEMPLATE_CONTENT: Record<string, (name: string, route: string) => string> = {
  blank: (name) => `export default function ${name}Page() {
  return (
    <main className="container mx-auto py-10">
      <h1 className="text-3xl font-bold">${name}</h1>
      <p className="mt-2 text-muted-foreground">This page is under construction.</p>
    </main>
  );
}`,
  list: (name) => `export default function ${name}ListPage() {
  return (
    <main className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">${name}</h1>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
          Add New
        </button>
      </div>
      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b"><td className="px-4 py-3 text-sm" colSpan={3}>No items yet</td></tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}`,
  detail: (name) => `export default function ${name}DetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="container mx-auto py-10">
      <h1 className="text-3xl font-bold">${name} Detail</h1>
      <p className="mt-2 text-muted-foreground">Viewing item {params.id}</p>
    </main>
  );
}`,
  form: (name) => `export default function ${name}FormPage() {
  return (
    <main className="container mx-auto py-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create ${name}</h1>
      <form className="space-y-4">
        <div>
          <label className="text-sm font-medium">Name</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Enter name" />
        </div>
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
          Save
        </button>
      </form>
    </main>
  );
}`,
  dashboard: (name) => `export default function ${name}DashboardPage() {
  return (
    <main className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">${name} Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {["Total Items", "Active", "Revenue"].map((label) => (
          <div key={label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">0</p>
          </div>
        ))}
      </div>
    </main>
  );
}`,
  landing: (name) => `export default function ${name}LandingPage() {
  return (
    <main className="min-h-screen">
      <section className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-5xl font-bold">Welcome to ${name}</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl">
          Build something amazing with the power of AI.
        </p>
        <div className="mt-8 flex gap-3">
          <a href="#features" className="rounded-lg bg-primary px-6 py-3 text-sm text-primary-foreground">Get Started</a>
          <a href="#about" className="rounded-lg border px-6 py-3 text-sm">Learn More</a>
        </div>
      </section>
    </main>
  );
}`,
  settings: (name) => `export default function ${name}SettingsPage() {
  return (
    <main className="container mx-auto py-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">General</h2>
          <p className="text-sm text-muted-foreground mt-1">Basic project settings</p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage notification preferences</p>
        </div>
      </div>
    </main>
  );
}`,
  auth: (name) => `export default function ${name}AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border p-6">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        <form className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input type="password" className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
          <button className="w-full rounded-lg bg-primary py-2 text-sm text-primary-foreground">
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}`,
  "404": () => `export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">Page not found</p>
      <a href="/" className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm text-primary-foreground">
        Go Home
      </a>
    </main>
  );
}`,
};

function RouteTreeNode({
  node,
  depth = 0,
  onDelete,
}: {
  node: RouteNode;
  depth?: number;
  onDelete: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <span className="text-xs text-muted-foreground">{expanded ? "▼" : "▶"}</span>
        ) : (
          <span className="w-3" />
        )}
        {node.type === "page" ? (
          <FileText className="h-3.5 w-3.5 text-blue-500" />
        ) : (
          <FolderOpen className="h-3.5 w-3.5 text-yellow-500" />
        )}
        <span className="flex-1 truncate">{node.name}</span>
        <Badge variant="outline" className="text-[9px] px-1">
          {node.route}
        </Badge>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.path);
          }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      {expanded &&
        node.children.map((child) => (
          <RouteTreeNode key={child.path} node={child} depth={depth + 1} onDelete={onDelete} />
        ))}
    </div>
  );
}

export function RouteManager() {
  const { files, addFile, deleteFile } = useProjectStore();
  const [open, setOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pageName, setPageName] = useState("");
  const [pageRoute, setPageRoute] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [creating, setCreating] = useState(false);

  // Build route tree from files
  const routeTree = useCallback((): RouteNode[] => {
    const appFiles = files.filter((f) => f.path.startsWith("src/app/"));
    const nodes: RouteNode[] = [];
    const nodeMap = new Map<string, RouteNode>();

    // Sort by path depth
    const sorted = [...appFiles].sort((a, b) => a.path.split("/").length - b.path.split("/").length);

    for (const file of sorted) {
      const parts = file.path.replace("src/app/", "").split("/");
      const fileName = parts[parts.length - 1] || "";
      const isPage = fileName === "page.tsx" || fileName === "page.ts";
      const isLayout = fileName === "layout.tsx" || fileName === "layout.ts";
      const isLoading = fileName === "loading.tsx";
      const isError = fileName === "error.tsx";
      const isNotFound = fileName === "not-found.tsx";

      const name = isPage || isLayout || isLoading || isError || isNotFound
        ? parts.slice(0, -1).pop() || "root"
        : fileName.replace(/\.\w+$/, "");

      const route = "/" + parts.slice(0, -1).join("/").replace(/\[([^\]]+)\]/g, ":$1");

      const node: RouteNode = {
        path: file.path,
        route: route === "/" ? "/" : route.replace(/\/$/, ""),
        name: name === "root" ? "Home" : name,
        type: isPage ? "page" : isLayout ? "layout" : isLoading ? "loading" : isError ? "error" : "not-found",
        children: [],
      };

      nodeMap.set(file.path, node);

      // Find parent
      const parentPath = parts.slice(0, -2).join("/");
      const parentNode = parentPath ? nodeMap.get(`src/app/${parentPath}/page.tsx`) || nodeMap.get(`src/app/${parentPath}/layout.tsx`) : null;

      if (parentNode) {
        parentNode.children.push(node);
      } else {
        nodes.push(node);
      }
    }

    return nodes;
  }, [files]);

  const handleCreate = useCallback(async () => {
    if (!pageName.trim()) return;
    setCreating(true);

    try {
      const route = pageRoute || `/${pageName.toLowerCase().replace(/\s+/g, "-")}`;
      const dirPath = route === "/" ? "src/app" : `src/app${route}`;
      const filePath = `${dirPath}/page.tsx`;

      const templateFn = TEMPLATE_CONTENT[selectedTemplate] || TEMPLATE_CONTENT.blank;
      const content = templateFn!(pageName, route);

      addFile({ path: filePath, content, language: "typescript" });
      setAddDialogOpen(false);
      setPageName("");
      setPageRoute("");
      setSelectedTemplate("blank");
    } finally {
      setCreating(false);
    }
  }, [pageName, pageRoute, selectedTemplate, addFile]);

  const handleDelete = useCallback(
    (path: string) => {
      deleteFile(path);
    },
    [deleteFile]
  );

  const tree = routeTree();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Route Manager">
            <FolderPlus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Route Manager</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Route tree */}
            <div className="rounded-lg border">
              {tree.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No routes yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {tree.map((node) => (
                    <RouteTreeNode key={node.path} node={node} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Add Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Page Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Page name (e.g., Products)"
              value={pageName}
              onChange={(e) => {
                setPageName(e.target.value);
                if (!pageRoute) {
                  setPageRoute("/" + e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }
              }}
              autoFocus
            />
            <Input
              placeholder="URL path (e.g., /products)"
              value={pageRoute}
              onChange={(e) => setPageRoute(e.target.value)}
            />

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Template</p>
              <div className="grid grid-cols-3 gap-2">
                {PAGE_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors ${
                      selectedTemplate === t.id ? "border-primary bg-primary/5" : "hover:bg-accent"
                    }`}
                    onClick={() => setSelectedTemplate(t.id)}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <p className="text-xs font-medium">{t.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleCreate} disabled={!pageName.trim() || creating} className="w-full">
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
