"use client";

import {
  ChevronDownIcon,
  CodeIcon,
  DownloadIcon,
  EyeIcon,
  FolderPlusIcon,
  MessageSquareIcon,
  SettingsIcon,
  SparklesIcon,
} from "lucide-react";
import { useState } from "react";

import { AgentStatusPanel } from "@/components/agent-status";
import { ChatPanel } from "@/components/chat-panel";
import { CommandPalette } from "@/components/command-palette";
import { ComponentLibrary } from "@/components/component-library";
import { DataModelPanel } from "@/components/data-model-panel";
import { EditorPanel } from "@/components/editor-panel";
import { FileTree } from "@/components/file-tree";
import { PreviewPanel } from "@/components/preview-panel";
import { RouteManager } from "@/components/route-manager";
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

function PanelLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {children}
      </span>
    </div>
  );
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { selectedModel, setSelectedModel } = useProjectStore();
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  const currentModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0]!;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Navigation Bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CodeIcon className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Fazz Code
            </span>
          </div>

          <div className="mx-1 h-5 w-px bg-border" />

          {/* Command Palette */}
          <CommandPalette />

          {/* Model Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm" className="h-7 gap-1.5">
                <SparklesIcon className="h-3 w-3 text-primary" />
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
          <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/30 p-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6" title="New file">
              <FolderPlusIcon className="h-4 w-4" />
            </Button>
            <VersionHistory />
            <DataModelPanel />
            <RouteManager />
            <ComponentLibrary />
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Download">
              <DownloadIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Settings">
              <SettingsIcon className="h-4 w-4" />
            </Button>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Agent Status */}
      <AgentStatusPanel />

      {/* Mobile Tab Switcher */}
      <div className="flex border-b md:hidden">
        {(
          [
            { id: "chat" as const, label: "Chat", icon: MessageSquareIcon },
            { id: "editor" as const, label: "Editor", icon: CodeIcon },
            { id: "preview" as const, label: "Preview", icon: EyeIcon },
          ]
        ).map((tab) => (
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
      <ResizablePanelGroup
        className="hidden flex-1 md:flex"
        {...({ direction: "horizontal" } as Record<string, unknown>)}
      >
        {/* Left: Chat Panel */}
        <ResizablePanel defaultSize={25} minSize={15} collapsible collapsedSize={4}>
          <div className="flex h-full flex-col">
            <PanelLabel icon={<MessageSquareIcon className="h-4 w-4" />}>
              Chat
            </PanelLabel>
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
            <div className="w-48 overflow-hidden border-r">
              <FileTree />
            </div>

            {/* Editor */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <PanelLabel icon={<CodeIcon className="h-4 w-4" />}>Editor</PanelLabel>
              <div className="flex-1 overflow-hidden">
                <EditorPanel />
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Preview Panel */}
        <ResizablePanel defaultSize={25} minSize={15} collapsible collapsedSize={4}>
          <div className="flex h-full flex-col">
            <PanelLabel icon={<EyeIcon className="h-4 w-4" />}>Preview</PanelLabel>
            <div className="flex-1 overflow-hidden">
              <PreviewPanel />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Mobile Panels */}
      <div className="flex flex-1 overflow-hidden md:hidden">
        {mobileTab === "chat" && <ChatPanel />}
        {mobileTab === "editor" && <EditorPanel />}
        {mobileTab === "preview" && <PreviewPanel />}
      </div>

      {children}
    </div>
  );
}
