import { create } from "zustand";

export interface FileNode {
  path: string;
  content: string;
  language: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  status: "thinking" | "streaming" | "done" | "error";
  model?: string;
  tokens?: number;
  cost?: number;
}

export interface BuildError {
  file: string;
  message: string;
  severity: "error" | "warning";
}

export type RunStatus = "idle" | "planning" | "generating" | "fixing" | "reviewing";

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectState {
  // Project
  project: Project | null;
  setProject: (project: Project | null) => void;

  // Files
  files: FileNode[];
  setFiles: (files: FileNode[]) => void;
  addFile: (file: FileNode) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  selectedFile: string | null;
  setSelectedFile: (path: string | null) => void;

  // Messages
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;

  // Errors
  errors: BuildError[];
  setErrors: (errors: BuildError[]) => void;
  addError: (error: BuildError) => void;
  clearErrors: () => void;

  // Generation state
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  runStatus: RunStatus;
  setRunStatus: (status: RunStatus) => void;

  // Model selection
  selectedModel: string;
  setSelectedModel: (model: string) => void;

  // Persistence
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  loadProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  saveFile: (path: string, content: string, language?: string) => Promise<void>;
  deleteFileRemote: (path: string) => Promise<void>;
  saveMessage: (message: ChatMessage) => Promise<void>;
  loadProjects: () => Promise<Project[]>;
  createNewProject: (name: string, description?: string) => Promise<Project>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Project
  project: null,
  setProject: (project) => set({ project }),

  // Files
  files: [],
  setFiles: (files) => set({ files }),
  addFile: (file) =>
    set((state) => {
      // Deduplicate by path
      if (state.files.some((f) => f.path === file.path)) {
        return {
          files: state.files.map((f) =>
            f.path === file.path ? { ...f, content: file.content, language: file.language } : f
          ),
        };
      }
      return { files: [...state.files, file] };
    }),
  updateFile: (path, content) =>
    set((state) => ({
      files: state.files.map((f) => (f.path === path ? { ...f, content } : f)),
    })),
  deleteFile: (path) =>
    set((state) => ({
      files: state.files.filter((f) => f.path !== path),
      selectedFile: state.selectedFile === path ? null : state.selectedFile,
    })),
  selectedFile: null,
  setSelectedFile: (path) => set({ selectedFile: path }),

  // Messages
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  // Errors
  errors: [],
  setErrors: (errors) => set({ errors }),
  addError: (error) =>
    set((state) => ({ errors: [...state.errors, error] })),
  clearErrors: () => set({ errors: [] }),

  // Generation state
  isGenerating: false,
  setIsGenerating: (v) => set({ isGenerating: v }),
  runStatus: "idle",
  setRunStatus: (status) => set({ runStatus: status }),

  // Model selection
  selectedModel: "mimo-v2.5-pro",
  setSelectedModel: (model) => set({ selectedModel: model }),

  // Persistence
  isLoading: false,
  setIsLoading: (v) => set({ isLoading: v }),

  loadProject: async (id: string) => {
    set({ isLoading: true });
    try {
      const [projRes, filesRes, msgRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/files`),
        fetch(`/api/projects/${id}/messages`),
      ]);

      if (!projRes.ok) throw new Error("Project not found");

      const project = await projRes.json();
      const files = filesRes.ok ? await filesRes.json() : [];
      const messages = msgRes.ok ? await msgRes.json() : [];

      set({
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: new Date(project.created_at),
          updatedAt: new Date(project.updated_at),
        },
        files: files.map((f: { path: string; content: string; language: string }) => ({
          path: f.path,
          content: f.content,
          language: f.language,
        })),
        messages: messages.map((m: { id: string; role: string; content: string; created_at: string; model?: string; tokens?: number; cost?: number }) => ({
          id: m.id,
          role: m.role as ChatMessage["role"],
          content: m.content,
          timestamp: new Date(m.created_at),
          status: "done" as const,
          model: m.model,
          tokens: m.tokens,
          cost: m.cost,
        })),
        selectedFile: files.length > 0 ? files[0].path : null,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  saveProject: async () => {
    const { project, files } = get();
    if (!project) return;

    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: project.name }),
    });

    // Save all files
    for (const file of files) {
      await fetch(`/api/projects/${project.id}/files`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(file),
      });
    }
  },

  saveFile: async (path: string, content: string, language?: string) => {
    const { project } = get();
    if (!project) return;

    await fetch(`/api/projects/${project.id}/files`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content, language }),
    });
  },

  deleteFileRemote: async (path: string) => {
    const { project } = get();
    if (!project) return;

    await fetch(`/api/projects/${project.id}/files?path=${encodeURIComponent(path)}`, {
      method: "DELETE",
    });
  },

  saveMessage: async (message: ChatMessage) => {
    const { project } = get();
    if (!project) return;

    await fetch(`/api/projects/${project.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: message.role,
        content: message.content,
        meta: { model: message.model, tokens: message.tokens, cost: message.cost },
      }),
    });
  },

  loadProjects: async () => {
    const res = await fetch("/api/projects");
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.items || data; // support paginated and flat response
    return items.map((p: { id: string; name: string; description?: string; created_at: string; updated_at: string }) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at),
    }));
  },

  createNewProject: async (name: string, description?: string) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });

    if (!res.ok) throw new Error("Failed to create project");

    const data = await res.json();
    const project: Project = {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    set({ project, files: [], messages: [], selectedFile: null });
    return project;
  },
}));
