"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Square,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  User,
  Loader2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export function ChatPanel() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, stop, regenerate, error } = useChat();

  const isLoading =
    messages.length > 0 && messages[messages.length - 1]?.role === "assistant"
      ? false
      : false;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const getTextContent = (message: { parts?: Array<{ type: string; text?: string }> }) => {
    return (
      message.parts
        ?.filter((p) => p.type === "text")
        .map((p) => p.text || "")
        .join("") || ""
    );
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
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

              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
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
              </div>

              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <p className="font-medium">Error</p>
              <p className="text-xs mt-1">{error.message}</p>
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
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => regenerate()}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Press <kbd className="rounded border px-1 py-0.5 text-[9px]">Cmd+Enter</kbd> to send
        </p>
      </div>
    </div>
  );
}
