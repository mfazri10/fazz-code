"use client";

import {
  Check,
  Copy,
  Loader2,
  Send,
  Sparkles,
  Square,
  User,
  Wrench,
} from "lucide-react";
import { useCallback,useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { runNetwork } from "@/lib/agent-network";
import { useProjectStore } from "@/stores/project-store";

export function ChatPanel() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentStage, setCurrentStage] = useState("");

  const {
    messages,
    addMessage,
    isGenerating,
    selectedModel,
  } = useProjectStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isGenerating) return;

      const userPrompt = input;
      setInput("");

      // Add user message
      addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: userPrompt,
        timestamp: new Date(),
        status: "done",
      });

      // Run agent network
      setIsStreaming(true);
      setStreamingContent("");
      setCurrentStage("starting");

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        await runNetwork({
          prompt: userPrompt,
          model: selectedModel,
          onProgress: (stage, message) => {
            setCurrentStage(stage);
            setStreamingContent(message);
          },
          onComplete: () => {
            setStreamingContent("");
            setCurrentStage("");
          },
          onError: (error) => {
            if (abortController.signal.aborted) return;
            addMessage({
              id: crypto.randomUUID(),
              role: "system",
              content: `Error: ${error.message}`,
              timestamp: new Date(),
              status: "error",
            });
          },
        });
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
        setStreamingContent("");
        setCurrentStage("");
      }
    },
    [input, isGenerating, selectedModel, addMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setStreamingContent("");
    setCurrentStage("");
  }, []);

  const getTextContent = (message: {
    parts?: Array<{ type: string; text?: string }>;
    content?: string;
  }) => {
    if (message.content) return message.content;
    return (
      message.parts
        ?.filter((p) => p.type === "text")
        .map((p) => p.text || "")
        .join("") || ""
    );
  };

  const getStageLabel = (stage: string): string => {
    switch (stage) {
      case "planning":
        return "Planning...";
      case "generating":
        return "Generating code...";
      case "reviewing":
        return "Reviewing...";
      case "fixing":
        return "Fixing errors...";
      case "done":
        return "Complete!";
      case "error":
        return "Error";
      default:
        return "Processing...";
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "planning":
        return <Sparkles className="h-3 w-3" />;
      case "generating":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "reviewing":
        return <Check className="h-3 w-3" />;
      case "fixing":
        return <Wrench className="h-3 w-3" />;
      default:
        return <Loader2 className="h-3 w-3 animate-spin" />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Sparkles className="h-8 w-8 mb-3 opacity-50" />
              <p className="text-sm font-medium">Start building</p>
              <p className="text-xs mt-1 text-center max-w-[200px]">
                Describe what you want to create and I will generate the code
                for you.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : ""
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              )}

              {message.role === "system" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <Wrench className="h-4 w-4 text-destructive" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : message.role === "system"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          const codeStr = String(children).replace(/\n$/, "");
                          const codeId = `${message.id}-${codeStr.slice(0, 20)}`;

                          if (match) {
                            return (
                              <div className="relative group">
                                <div className="flex items-center justify-between bg-[#282c34] px-4 py-1.5 rounded-t-md">
                                  <span className="text-xs text-gray-400">
                                    {match[1]}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleCopy(codeStr, codeId)}
                                  >
                                    {copiedId === codeId ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  className="!mt-0 !rounded-t-none"
                                >
                                  {codeStr}
                                </SyntaxHighlighter>
                              </div>
                            );
                          }
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {getTextContent(message)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{getTextContent(message)}</p>
                )}

                {/* Token tracking */}
                {message.role === "assistant" && (message.tokens || message.cost) && (
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                    {message.tokens && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-muted-foreground/10 px-1.5 py-0.5">
                        {message.tokens.toLocaleString()} tokens
                      </span>
                    )}
                    {message.cost !== undefined && message.cost > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-yellow-500/10 px-1.5 py-0.5 text-yellow-600">
                        ${message.cost.toFixed(4)}
                      </span>
                    )}
                    {message.model && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-muted-foreground/10 px-1.5 py-0.5">
                        {message.model.split("/").pop()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                {getStageIcon(currentStage)}
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getStageIcon(currentStage)}
                  <span>{getStageLabel(currentStage)}</span>
                </div>
                {streamingContent && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {streamingContent}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            className="min-h-[60px] max-h-[200px] resize-none"
            rows={2}
          />
          <div className="flex flex-col gap-1">
            {isStreaming ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleStop}
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Press{" "}
          <kbd className="rounded border px-1 py-0.5 text-[9px]">
            ⌘ Enter
          </kbd>{" "}
          to send
        </p>
      </div>
    </div>
  );
}
