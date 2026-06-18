"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { ChatPanel } from "@/components/chat-panel";
import { EditorPanel } from "@/components/editor-panel";
import { PreviewPanel } from "@/components/preview-panel";
import { useProjectStore } from "@/stores/project-store";

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { project, isLoading, loadProject } = useProjectStore();

  useEffect(() => {
    if (params.id) {
      loadProject(params.id).catch(() => {
        router.push("/workspace");
      });
    }
  }, [params.id, loadProject, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        <p>Project not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-49px)]">
      {/* Chat Panel */}
      <div className="w-[350px] min-w-[300px] border-r">
        <ChatPanel />
      </div>

      {/* Editor Panel */}
      <div className="flex-1 border-r">
        <EditorPanel />
      </div>

      {/* Preview Panel */}
      <div className="w-[40%] min-w-[300px]">
        <PreviewPanel />
      </div>
    </div>
  );
}
