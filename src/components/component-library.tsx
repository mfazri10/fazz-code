"use client";

import { Blocks, Eye, Plus, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

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
import { ALL_COMPONENTS, CATEGORIES, type LibraryComponent } from "@/lib/component-library/registry";
import { useProjectStore } from "@/stores/project-store";

function ComponentCard({
  component,
  onInsert,
}: {
  component: LibraryComponent;
  onInsert: (c: LibraryComponent) => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col rounded-lg border p-4 transition-colors hover:bg-accent">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-2xl">{component.icon}</span>
            <h3 className="mt-2 font-semibold text-sm">{component.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {component.description}
            </p>
          </div>
          <Badge variant="outline" className="text-[9px] shrink-0">
            {component.category}
          </Badge>
        </div>
        {component.dependencies.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {component.dependencies.map((dep) => (
              <Badge key={dep} variant="secondary" className="text-[9px] px-1">
                {dep}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-1.5 mt-3">
          <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={() => setPreviewOpen(true)}>
            <Eye className="mr-1 h-3 w-3" />
            Preview
          </Button>
          <Button size="sm" className="h-7 flex-1 text-xs" onClick={() => onInsert(component)}>
            <Plus className="mr-1 h-3 w-3" />
            Insert
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{component.icon}</span>
              {component.name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{component.description}</p>
          <div className="rounded-lg border bg-muted/30 p-4">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
              <code>{component.code}</code>
            </pre>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onInsert(component); setPreviewOpen(false); }}>
              <Plus className="mr-1 h-3 w-3" />
              Insert into Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ComponentLibrary() {
  const { addFile, files } = useProjectStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    let result = ALL_COMPONENTS;
    if (category !== "All") {
      result = result.filter((c) => c.category === category);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [query, category]);

  const handleInsert = useCallback(
    (component: LibraryComponent) => {
      // Check if components file already exists
      const existing = files.find((f) => f.path === "src/components/generated.tsx");
      if (existing) {
        const updatedContent = existing.content + "\n\n" + component.code;
        addFile({ path: "src/components/generated.tsx", content: updatedContent, language: "typescript" });
      } else {
        addFile({
          path: "src/components/generated.tsx",
          content: `// Auto-generated components from Fazz Code Library\n\n${component.code}`,
          language: "typescript",
        });
      }
    },
    [files, addFile]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Component Library">
          <Blocks className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Blocks className="h-5 w-5" />
            Component Library
            <Badge variant="secondary" className="text-xs">{ALL_COMPONENTS.length} components</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Search + Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search components..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Blocks className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No components found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map((component) => (
                <ComponentCard
                  key={component.id}
                  component={component}
                  onInsert={handleInsert}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
