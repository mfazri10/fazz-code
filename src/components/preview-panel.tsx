"use client";

import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useProjectStore } from "@/stores/project-store";

type DeviceSize = "desktop" | "tablet" | "mobile";

const DEVICE_SIZES: Record<DeviceSize, { width: string; height: string }> = {
  desktop: { width: "100%", height: "100%" },
  tablet: { width: "768px", height: "1024px" },
  mobile: { width: "375px", height: "812px" },
};

export function PreviewPanel() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { files, errors: buildErrors } = useProjectStore();

  const refreshPreview = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  const openInNewTab = useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, "_blank");
    }
  }, [previewUrl]);

  // Listen for preview URL from WebContainer
  useEffect(() => {
    const handlePreviewReady = (event: CustomEvent<{ url: string }>) => {
      setPreviewUrl(event.detail.url);
      setIsLoading(false);
      setError(null);
    };

    const handlePreviewError = (event: CustomEvent<{ message: string }>) => {
      setError(event.detail.message);
      setIsLoading(false);
    };

    window.addEventListener(
      "fazz-preview-ready",
      handlePreviewReady as EventListener
    );
    window.addEventListener(
      "fazz-preview-error",
      handlePreviewError as EventListener
    );

    return () => {
      window.removeEventListener(
        "fazz-preview-ready",
        handlePreviewReady as EventListener
      );
      window.removeEventListener(
        "fazz-preview-error",
        handlePreviewError as EventListener
      );
    };
  }, []);

  const deviceStyles = DEVICE_SIZES[deviceSize];

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <div className="flex items-center gap-1">
          <Button
            variant={deviceSize === "desktop" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setDeviceSize("desktop")}
          >
            <Monitor className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={deviceSize === "tablet" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setDeviceSize("tablet")}
          >
            <Tablet className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={deviceSize === "mobile" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setDeviceSize("mobile")}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={refreshPreview}
            disabled={!previewUrl}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={openInNewTab}
            disabled={!previewUrl}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-hidden bg-white">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 mb-3 animate-spin" />
            <p className="text-sm font-medium">Starting preview...</p>
            <p className="text-xs mt-1">Installing dependencies</p>
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center p-4 text-destructive">
            <AlertCircle className="h-8 w-8 mb-3" />
            <p className="text-sm font-medium">Preview Error</p>
            <p className="text-xs mt-1 text-center max-w-[300px]">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setError(null);
                setIsLoading(true);
              }}
            >
              <RotateCcw className="mr-2 h-3 w-3" />
              Retry
            </Button>
          </div>
        ) : previewUrl ? (
          <div className="flex h-full items-center justify-center">
            <div
              style={{
                width: deviceStyles.width,
                height: deviceStyles.height,
                maxWidth: "100%",
                maxHeight: "100%",
              }}
              className="border shadow-lg"
            >
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="h-full w-full"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Monitor className="h-8 w-8 mb-3 opacity-50" />
            <p className="text-sm font-medium">No preview</p>
            <p className="text-xs mt-1 text-center max-w-[200px]">
              Generate code to see a live preview of your app
            </p>
          </div>
        )}
      </div>

      {/* Build Errors */}
      {buildErrors.length > 0 && (
        <div className="border-t p-2 max-h-32 overflow-auto">
          <p className="text-xs font-medium text-destructive mb-1">
            Build Errors ({buildErrors.length})
          </p>
          {buildErrors.map((err, i) => (
            <div key={i} className="text-xs text-muted-foreground">
              <span className="font-mono">{err.file}</span>: {err.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
