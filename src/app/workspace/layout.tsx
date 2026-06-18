"use client";

import { useDefaultLayout } from "react-resizable-panels";
import { ChatPanel } from "@/components/chat-panel";
import {
  ChevronDownIcon,
  FolderPlusIcon,
  DownloadIcon,
  SettingsIcon,
  MessageSquareIcon,
  CodeIcon,
  EyeIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const MODELS = [
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
];

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "fazz-workspace-panels",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    panelIds: ["chat", "editor", "preview"],
  });

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight">
            Fazz Code
          </span>

          {/* Model Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted">
              {MODELS[0]?.label}
              <ChevronDownIcon className="size-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {MODELS.map((model) => (
                <DropdownMenuItem key={model.id}>
                  {model.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <FolderPlusIcon />
            </TooltipTrigger>
            <TooltipContent>New Project</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <DownloadIcon />
            </TooltipTrigger>
            <TooltipContent>Export</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <SettingsIcon />
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Three-pane resizable layout */}
      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1"
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
      >
        {/* Left: Chat Panel */}
        <ResizablePanel
          id="chat"
          defaultSize={25}
          minSize={15}
          collapsible
          collapsedSize={4}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <MessageSquareIcon className="size-4 text-muted-foreground" />
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

        {/* Center: Code Editor Panel */}
        <ResizablePanel id="editor" defaultSize={50} minSize={20}>
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <CodeIcon className="size-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Editor
              </span>
            </div>
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Editor
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Preview Panel */}
        <ResizablePanel
          id="preview"
          defaultSize={25}
          minSize={15}
          collapsible
          collapsedSize={4}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <EyeIcon className="size-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Preview
              </span>
            </div>
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Preview
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {children}
    </div>
  );
}
