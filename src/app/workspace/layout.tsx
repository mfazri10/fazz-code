"use client";

import {
  ChevronDownIcon,
  CodeIcon,
  DownloadIcon,
  EyeIcon,
  FolderPlusIcon,
  MessageSquareIcon,
  SettingsIcon,
} from "lucide-react";
import { useState } from "react";

import { AgentStatusPanel } from "@/components/agent-status";
import { ChatPanel } from "@/components/chat-panel";
import { CommandPalette } from "@/components/command-palette";
import { EditorPanel } from "@/components/editor-panel";
import { FileTree } from "@/components/file-tree";
import { PreviewPanel } from "@/components/preview-panel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { UserMenu } from "@/components/user-menu";
import { VersionHistory } from "@/components/version-history";
import { useProjectStore } from "@/stores/project-store";

type MobileTab = "chat" | "editor" | "preview";

const MODELS = [
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { selectedModel, setSelectedModel } = useProjectStore();
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  const currentModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0]!;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight">
            Fazz Code
          </span>

          {/* Command Palette */}
          <CommandPalette />

          {/* Model Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm" className="gap-1.5 h-7">
                <span className="text-xs">{currentModel.label}</span>
                <ChevronDownIcon className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {MODELS.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                >
                  {model.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <FolderPlusIcon className="h-4 w-4" />
          </Button>
          <VersionHistory />
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <DownloadIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <SettingsIcon className="h-4 w-4" />
          </Button>
          <UserMenu />
        </div>
      </header>

      {/* Agent Status */}
      <AgentStatusPanel />

      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden border-b">
        {([
          { id: "chat" as const, label: "Chat", icon: MessageSquareIcon },
          { id: "editor" as const, label: "Editor", icon: CodeIcon },
          { id: "preview" as const, label: "Preview", icon: EyeIcon },
        ]).map((tab) => (
          <button
            key={tab.id}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              mobileTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setMobileTab(tab.id)}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Three-pane resizable layout (desktop) */}
      <ResizablePanelGroup className="flex-1 hidden md:flex" {...({ direction: "horizontal" } as Record<string, unknown>)}>
        {/* Left: Chat Panel */}
        <ResizablePanel
          defaultSize={25}
          minSize={15}
          collapsible
          collapsedSize={4}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Chat
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatPanel />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center: File Tree + Code Editor */}
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="flex h-full">
            {/* File Tree Sidebar */}
            <div className="w-48 border-r overflow-hidden">
              <FileTree />
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <CodeIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Editor
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <EditorPanel />
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Preview Panel */}
        <ResizablePanel
          defaultSize={25}
          minSize={15}
          collapsible
          collapsedSize={4}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <EyeIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Preview
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <PreviewPanel />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Mobile Panels */}
      <div className="flex-1 flex md:hidden overflow-hidden">
        {mobileTab === "chat" && <ChatPanel />}
        {mobileTab === "editor" && <EditorPanel />}
        {mobileTab === "preview" && <PreviewPanel />}
      </div>

      {children}
    </div>
  );
}
