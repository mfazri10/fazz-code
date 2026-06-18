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

/**
 * Merge files into a directory tree without overwriting existing files.
 * When a path collides with an existing directory, the file is skipped
 * and a warning is logged.
 */
function mergeFileTree(
  tree: Record<string, FileNode>,
  path: string,
  content: string
): void {
  const parts = path.split("/").filter(Boolean);
  let current: Record<string, FileNode> = tree;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!part) continue;

    if (!current[part]) {
      current[part] = { directory: {} };
    }

    const node = current[part];
    if (node.file) {
      // Collision: a file exists at this directory path — skip
      console.warn(`[WebContainer] Path collision at "${parts.slice(0, i + 1).join("/")}": file exists, skipping`);
      return;
    }

    current = node.directory as Record<string, FileNode>;
  }

  const fileName = parts[parts.length - 1];
  if (!fileName) return;

  if (current[fileName]?.directory) {
    // Collision: directory exists at file path — skip
    console.warn(`[WebContainer] Path collision at "${path}": directory exists, skipping`);
    return;
  }

  current[fileName] = { file: { contents: content } };
}

export async function mountFiles(
  files: Record<string, string>
): Promise<void> {
  const wc = await getWebContainer();

  const tree: Record<string, FileNode> = {};

  for (const [path, content] of Object.entries(files)) {
    mergeFileTree(tree, path, content);
  }

  await wc.mount(tree as Parameters<typeof wc.mount>[0]);
}

/**
 * Write a file, creating parent directories if needed.
 * Uses atomic write to avoid partial writes.
 */
export async function writeFile(path: string, content: string): Promise<void> {
  const wc = await getWebContainer();

  // Ensure parent directories exist
  const parts = path.split("/").filter(Boolean);
  let dir = "";
  for (let i = 0; i < parts.length - 1; i++) {
    dir += "/" + parts[i];
    try {
      await wc.fs.mkdir(dir, { recursive: true });
    } catch {
      // mkdir may fail if already exists — ignore
    }
  }

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

    const cleanup = () => {
      clearTimeout(timeout);
    };

    wc.on("server-ready", (port, url) => {
      cleanup();
      resolve({ url, port });
    });

    proc.exit.then((code) => {
      if (code !== 0) {
        cleanup();
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

/**
 * Listen for server-ready events with proper cleanup.
 * Returns a function to remove the listener.
 */
export function onPreviewReady(
  callback: (port: number, url: string) => void
): () => void {
  if (!isBrowser()) return () => {};

  const wc = instance;
  if (!wc) {
    console.warn("WebContainer not booted yet");
    return () => {};
  }

  // WebContainer.on returns an unsubscribe function
  const off = wc.on("server-ready", callback);
  return () => {
    off();
  };
}

export async function destroyWebContainer(): Promise<void> {
  if (instance) {
    instance.teardown();
    instance = null;
    bootPromise = null;
  }
}
