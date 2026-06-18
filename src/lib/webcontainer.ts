import { WebContainer } from "@webcontainer/api";

let instance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

// Check if we're in a browser environment
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export async function getWebContainer(): Promise<WebContainer> {
  if (!isBrowser()) {
    throw new Error("WebContainer can only be used in the browser");
  }

  if (instance) return instance;
  if (bootPromise) return bootPromise;

  bootPromise = WebContainer.boot().then((wc) => {
    instance = wc;
    return wc;
  });

  return bootPromise;
}

interface FileNode {
  file?: { contents: string };
  directory?: Record<string, FileNode>;
}

export async function mountFiles(
  files: Record<string, string>
): Promise<void> {
  const wc = await getWebContainer();

  const tree: Record<string, FileNode> = {};

  for (const [path, content] of Object.entries(files)) {
    const parts = path.split("/").filter(Boolean);
    let current: Record<string, FileNode> = tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part && !current[part]) {
        current[part] = { directory: {} };
      }
      if (part && current[part]?.directory) {
        current = current[part].directory as Record<string, FileNode>;
      }
    }

    const fileName = parts[parts.length - 1];
    if (fileName) {
      current[fileName] = { file: { contents: content } };
    }
  }

  await wc.mount(tree as Parameters<typeof wc.mount>[0]);
}

export async function writeFile(path: string, content: string): Promise<void> {
  const wc = await getWebContainer();
  await wc.fs.writeFile(path, content);
}

export async function readFile(path: string): Promise<string> {
  const wc = await getWebContainer();
  return wc.fs.readFile(path, "utf-8");
}

export async function deleteFile(path: string): Promise<void> {
  const wc = await getWebContainer();
  await wc.fs.rm(path);
}

export async function listFiles(path: string = "/"): Promise<string[]> {
  const wc = await getWebContainer();
  const entries = await wc.fs.readdir(path, { withFileTypes: true });
  return entries.map((e) => e.name);
}

export async function installDependencies(): Promise<number> {
  const wc = await getWebContainer();
  const proc = await wc.spawn("npm", ["install"]);

  return new Promise((resolve) => {
    proc.exit.then((code) => {
      resolve(code ?? 1);
    });
  });
}

export async function startDevServer(): Promise<{
  url: string;
  port: number;
}> {
  const wc = await getWebContainer();
  const proc = await wc.spawn("npm", ["run", "dev"]);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Dev server start timed out"));
    }, 30000);

    wc.on("server-ready", (port, url) => {
      clearTimeout(timeout);
      resolve({ url, port });
    });

    proc.exit.then((code) => {
      if (code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Dev server exited with code ${code}`));
      }
    });
  });
}

export function isWebContainerSupported(): boolean {
  if (!isBrowser()) return false;
  return typeof WebContainer !== "undefined";
}

export function getWebContainerInstance(): WebContainer | null {
  return instance;
}

export function onPreviewReady(
  callback: (port: number, url: string) => void
): () => void {
  if (!isBrowser()) return () => {};

  const wc = instance;
  if (!wc) {
    console.warn("WebContainer not booted yet");
    return () => {};
  }

  wc.on("server-ready", callback);
  return () => {
    // Cleanup
  };
}

export async function destroyWebContainer(): Promise<void> {
  if (instance) {
    instance.teardown();
    instance = null;
    bootPromise = null;
  }
}
