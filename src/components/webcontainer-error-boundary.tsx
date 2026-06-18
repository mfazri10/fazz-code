"use client";

import { AlertTriangle, Monitor, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class WebContainerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[WebContainer Error]", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-yellow-500/10 p-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold">Preview Unavailable</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            The live preview sandbox couldn&apos;t start. This can happen in some
            browsers or with resource-heavy projects.
          </p>
          <div className="mt-4 rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground max-w-md overflow-auto">
            {this.state.error?.message || "Unknown error"}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              <RefreshCw className="mr-2 h-3 w-3" />
              Try Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const blob = new Blob(
                  [JSON.stringify(this.state.error, null, 2)],
                  { type: "application/json" }
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "error-report.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download Error Report
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Fallback when WebContainer is not supported at all.
 */
export function WebContainerUnsupported() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <Monitor className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">Browser Not Supported</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Live preview requires a Chromium-based browser (Chrome, Edge, Brave).
        Safari and Firefox have limited support.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        You can still edit code and use the chat — the preview just won&apos;t
        run in-browser.
      </p>
    </div>
  );
}
