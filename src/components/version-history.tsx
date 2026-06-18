"use client";

import { History, Loader2, RotateCcw, Save } from "lucide-react";
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
import { useProjectStore } from "@/stores/project-store";

interface Version {
  id: string;
  version_number: number;
  description: string | null;
  files_snapshot: Array<{ path: string; content: string; language: string }>;
  created_at: string;
}

export function VersionHistory() {
  const { project, files, setFiles } = useProjectStore();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const loadVersions = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/versions`);
      if (res.ok) {
        setVersions(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (open) loadVersions();
  }, [open, loadVersions]);

  const handleSave = useCallback(async () => {
    if (!project) return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${project.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, description: desc || null }),
      });
      setDesc("");
      await loadVersions();
    } finally {
      setSaving(false);
    }
  }, [project, files, desc, loadVersions]);

  const handleRestore = useCallback(
    (version: Version) => {
      setFiles(
        version.files_snapshot.map((f) => ({
          path: f.path,
          content: f.content,
          language: f.language,
        }))
      );
      setOpen(false);
    },
    [setFiles]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>

        {/* Save new version */}
        <div className="flex gap-2">
          <Input
            placeholder="Version description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Save className="mr-1 h-3 w-3" />
            )}
            Save
          </Button>
        </div>

        {/* Version list */}
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No versions saved yet
            </p>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      v{v.version_number}
                      {v.description && (
                        <span className="ml-2 font-normal text-muted-foreground">
                          — {v.description}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(v.created_at).toLocaleString()} ·{" "}
                      {v.files_snapshot.length} files
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(v)}
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
