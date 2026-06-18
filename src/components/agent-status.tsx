"use client";

import { Check, Loader2, Sparkles, Wrench, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { type RunStatus,useProjectStore } from "@/stores/project-store";

const STAGES: Array<{ id: RunStatus; label: string; icon: React.ReactNode }> = [
  { id: "planning", label: "Plan", icon: <Sparkles className="h-3 w-3" /> },
  { id: "generating", label: "Generate", icon: <Sparkles className="h-3 w-3" /> },
  { id: "fixing", label: "Fix", icon: <Wrench className="h-3 w-3" /> },
  { id: "reviewing", label: "Review", icon: <Check className="h-3 w-3" /> },
];

const STATUS_ORDER: RunStatus[] = ["idle", "planning", "generating", "fixing", "reviewing"];

export function AgentStatusPanel() {
  const { runStatus, isGenerating, errors } = useProjectStore();

  if (runStatus === "idle" && !isGenerating) {
    return null;
  }

  const currentIndex = STATUS_ORDER.indexOf(runStatus);

  return (
    <div className="flex items-center gap-1 border-b bg-muted/30 px-3 py-1.5">
      {STAGES.map((stage, i) => {
        const stageIndex = STATUS_ORDER.indexOf(stage.id);
        const isActive = stage.id === runStatus;
        const isDone = currentIndex > stageIndex;

        return (
          <div key={stage.id} className="flex items-center gap-1">
            <Badge
              variant={isActive ? "default" : isDone ? "secondary" : "outline"}
              className={`gap-1 text-[10px] px-1.5 py-0 ${
                isActive
                  ? "animate-pulse"
                  : isDone
                  ? "opacity-60"
                  : "opacity-40"
              }`}
            >
              {isActive ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : isDone ? (
                <Check className="h-2.5 w-2.5" />
              ) : (
                stage.icon
              )}
              {stage.label}
            </Badge>
            {i < STAGES.length - 1 && (
              <span className="text-muted-foreground/40 text-xs">→</span>
            )}
          </div>
        );
      })}

      {errors.length > 0 && (
        <Badge variant="destructive" className="ml-2 gap-1 text-[10px] px-1.5 py-0">
          <XCircle className="h-2.5 w-2.5" />
          {errors.length} errors
        </Badge>
      )}
    </div>
  );
}
