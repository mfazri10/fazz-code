"use client";

import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Monitor,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  getWebContainer,
  isWebContainerSupported,
  mountFiles,
  startDevServer,
  writeFile as wcWriteFile,
} from "@/lib/webcontainer";
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
  const [bootLog, setBootLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wcRef = useRef<ReturnType<typeof getWebContainer> extends Promise<infer T> ? T : never | null>(null);

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

  // Boot WebContainer and start dev server
  const bootPreview = useCallback(async () => {
    if (!isWebContainerSupported()) {
      setError("WebContainer is not supported in this browser");
      return;
    }

    setIsLoading(true);
    setError(null);
    setBootLog(["Booting WebContainer..."]);

    try {
      const wc = await getWebContainer();
      wcRef.current = wc;

      // Create starter template
      const starterFiles: Record<string, string> = {
        "package.json": JSON.stringify(
          {
            name: "fazz-preview",
            version: "1.0.0",
            private: true,
            scripts: {
              dev: "vite",
              build: "vite build",
            },
            dependencies: {
              react: "^19.0.0",
              "react-dom": "^19.0.0",
            },
            devDependencies: {
              "@vitejs/plugin-react": "^4.3.0",
              vite: "^5.4.0",
            },
          },
          null,
          2
        ),
        "index.html": `<!DOCTYPE html>
<html>
  <head><title>Fazz Preview</title></head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
        "vite.config.js": `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: true }
})`,
        "src/main.jsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)`,
        "src/App.jsx": `export default function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Fazz Code Preview</h1>
      <p>Generated code will appear here</p>
    </div>
  )
}`,
      };

      setBootLog((prev) => [...prev, "Mounting files..."]);
      await mountFiles(starterFiles);

      setBootLog((prev) => [...prev, "Installing dependencies..."]);
      const exitCode = await new Promise<number>((resolve) => {
        wc.spawn("npm", ["install"]).then((proc) => {
          proc.output.pipeTo(
            new WritableStream({
              write(data) {
                setBootLog((prev) => [...prev, data]);
              },
            })
          );
          proc.exit.then(resolve);
        });
      });

      if (exitCode !== 0) {
        throw new Error("npm install failed");
      }

      setBootLog((prev) => [...prev, "Starting dev server..."]);

      // Listen for server ready
      wc.on("server-ready", (port, url) => {
        setPreviewUrl(url);
        setIsLoading(false);
        setBootLog((prev) => [...prev, `Server ready at ${url}`]);
      });

      await startDevServer();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setIsLoading(false);
      setBootLog((prev) => [...prev, `Error: ${message}`]);
    }
  }, []);

  // Sync files to WebContainer when they change
  useEffect(() => {
    if (!wcRef.current || files.length === 0) return;

    const syncFiles = async () => {
      for (const file of files) {
        try {
          await wcWriteFile(file.path, file.content);
        } catch {
          // File might not exist yet, ignore
        }
      }
    };

    syncFiles();
  }, [files]);

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
          {!previewUrl && !isLoading && (
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs"
              onClick={bootPreview}
            >
              Start Preview
            </Button>
          )}
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
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground p-4">
            <Loader2 className="h-8 w-8 mb-3 animate-spin" />
            <p className="text-sm font-medium">Starting preview...</p>
            <div className="mt-3 w-full max-w-md">
              <div className="bg-muted rounded p-2 text-xs font-mono max-h-32 overflow-auto">
                {bootLog.map((log, i) => (
                  <div key={i} className="text-muted-foreground">
                    {log}
                  </div>
                ))}
              </div>
            </div>
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
              onClick={bootPreview}
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
                sandbox="allow-scripts allow-forms allow-popups"
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Monitor className="h-8 w-8 mb-3 opacity-50" />
            <p className="text-sm font-medium">No preview</p>
            <p className="text-xs mt-1 text-center max-w-[200px]">
              Click &quot;Start Preview&quot; to initialize the sandbox
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
