"use client";

import { Database, Loader2, Plus, Sparkles, Table2, Trash2 } from "lucide-react";
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
import type { DataModel, FieldType,ModelField } from "@/lib/data-model/types";
import { getDefaultFields, toSnakeCase } from "@/lib/data-model/types";
import { useProjectStore } from "@/stores/project-store";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "DateTime" },
  { value: "text", label: "Text (long)" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "image", label: "Image URL" },
  { value: "phone", label: "Phone" },
  { value: "uuid", label: "UUID" },
  { value: "json", label: "JSON" },
  { value: "enum", label: "Enum" },
  { value: "decimal", label: "Decimal" },
];

function ModelCard({
  model,
  onUpdate,
  onDelete,
}: {
  model: DataModel;
  onUpdate: (m: DataModel) => void;
  onDelete: () => void;
}) {
  const addField = () => {
    onUpdate({
      ...model,
      fields: [
        ...model.fields,
        { name: "new_field", type: "string", required: false, unique: false },
      ],
    });
  };

  const updateField = (idx: number, field: ModelField) => {
    const fields = [...model.fields];
    fields[idx] = field;
    onUpdate({ ...model, fields });
  };

  const removeField = (idx: number) => {
    onUpdate({ ...model, fields: model.fields.filter((_, i) => i !== idx) });
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Table2 className="h-4 w-4 text-primary" />
          <Input
            value={model.name}
            onChange={(e) =>
              onUpdate({
                ...model,
                name: e.target.value.replace(/\s+/g, ""),
                tableName: toSnakeCase(e.target.value),
              })
            }
            className="h-7 w-40 border-0 p-0 text-sm font-semibold focus-visible:ring-0"
          />
          <Badge variant="outline" className="text-[10px]">
            {model.tableName}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>

      <div className="divide-y">
        {model.fields.map((field, idx) => (
          <div key={idx} className="flex items-center gap-2 px-4 py-2 text-xs">
            <Input
              value={field.name}
              onChange={(e) => updateField(idx, { ...field, name: e.target.value })}
              className="h-6 w-28 border-0 p-0 text-xs focus-visible:ring-0"
            />
            <select
              value={field.type}
              onChange={(e) => updateField(idx, { ...field, type: e.target.value as FieldType })}
              className="rounded border bg-background px-1.5 py-0.5 text-xs"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(idx, { ...field, required: e.target.checked })}
                className="h-3 w-3"
              />
              <span className="text-muted-foreground">req</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={field.unique}
                onChange={(e) => updateField(idx, { ...field, unique: e.target.checked })}
                className="h-3 w-3"
              />
              <span className="text-muted-foreground">uniq</span>
            </label>
            {field.isPrimaryKey && (
              <Badge variant="secondary" className="text-[9px] px-1">
                PK
              </Badge>
            )}
            {!field.isPrimaryKey && (
              <button onClick={() => removeField(idx)} className="text-muted-foreground hover:text-destructive">
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="border-t px-4 py-2">
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addField}>
          <Plus className="mr-1 h-3 w-3" />
          Add Field
        </Button>
      </div>
    </div>
  );
}

export function DataModelPanel() {
  const { project, addFile } = useProjectStore();
  const [models, setModels] = useState<DataModel[]>([]);
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [mockCount, setMockCount] = useState(50);

  const addModel = () => {
    const name = `Model${models.length + 1}`;
    setModels([
      ...models,
      {
        id: crypto.randomUUID(),
        name,
        tableName: toSnakeCase(name) + "s",
        fields: getDefaultFields(),
      },
    ]);
  };

  const generateCode = useCallback(async () => {
    if (!project || models.length === 0) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/data-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema: { models, relations: [] },
          action: "generate",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Add generated files to project
        for (const [path, content] of Object.entries(data.files as Record<string, string>)) {
          addFile({ path, content, language: path.endsWith(".sql") ? "sql" : "typescript" });
        }
      }
    } finally {
      setGenerating(false);
    }
  }, [project, models, addFile]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Database className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Models
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Model cards */}
          <div className="grid gap-3 md:grid-cols-2">
            {models.map((model, idx) => (
              <ModelCard
                key={model.id}
                model={model}
                onUpdate={(m) => {
                  const updated = [...models];
                  updated[idx] = m;
                  setModels(updated);
                }}
                onDelete={() => setModels(models.filter((_, i) => i !== idx))}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={addModel}>
              <Plus className="mr-1 h-3 w-3" />
              Add Model
            </Button>

            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={mockCount}
                onChange={(e) => setMockCount(Number(e.target.value))}
                className="h-8 w-16 text-xs"
                min={1}
                max={500}
              />
              <span className="text-xs text-muted-foreground">records</span>
            </div>

            <Button
              size="sm"
              onClick={generateCode}
              disabled={models.length === 0 || generating}
            >
              {generating ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-3 w-3" />
              )}
              Generate Code
            </Button>
          </div>

          {models.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Database className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No models yet</p>
              <p className="text-xs">Add a model to start building your data schema</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
