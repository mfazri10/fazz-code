import { create } from "zustand";

export interface FileItem {
  path: string;
  content: string;
  language: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  status?: "thinking" | "streaming" | "done" | "error";
}

export interface ProjectState {
  // Project
  projectId: string | null;
  projectName: string;
  setProjectId: (id: string | null) => void;
  setProjectName: (name: string) => void;

  // Files
  files: FileItem[];
  activeFile: string | null;
  setFiles: (files: FileItem[]) => void;
  setActiveFile: (path: string | null) => void;
  updateFile: (path: string, content: string) => void;
  addFile: (file: FileItem) => void;
  deleteFile: (path: string) => void;

  // Chat
  messages: ChatMessage[];
  isGenerating: boolean;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, content: string) => void;
  setMessageStatus: (
    id: string,
    status: ChatMessage["status"]
  ) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  clearMessages: () => void;

  // Run status
  runStatus: "idle" | "planning" | "generating" | "reviewing" | "fixing";
  setRunStatus: (status: ProjectState["runStatus"]) => void;

  // Errors
  errors: Array<{ file: string; message: string; severity: "error" | "warning" }>;
  addError: (error: {
    file: string;
    message: string;
    severity: "error" | "warning";
  }) => void;
  clearErrors: () => void;

  // Selected model
  selectedModel: string;
  setSelectedModel: (model: string) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  projectId: null,
  projectName: "Untitled Project",
  files: [],
  activeFile: null,
  messages: [],
  isGenerating: false,
  runStatus: "idle" as const,
  errors: [],
  selectedModel: "claude-sonnet-4-20250514",
};

export const useProjectStore = create<ProjectState>((set) => ({
  ...initialState,

  setProjectId: (id) => set({ projectId: id }),
  setProjectName: (name) => set({ projectName: name }),

  setFiles: (files) => set({ files }),
  setActiveFile: (path) => set({ activeFile: path }),
  updateFile: (path, content) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.path === path ? { ...f, content } : f
      ),
    })),
  addFile: (file) =>
    set((state) => ({ files: [...state.files, file] })),
  deleteFile: (path) =>
    set((state) => ({
      files: state.files.filter((f) => f.path !== path),
      activeFile: state.activeFile === path ? null : state.activeFile,
    })),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content } : m
      ),
    })),
  setMessageStatus: (id, status) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, status } : m
      ),
    })),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  clearMessages: () => set({ messages: [] }),

  setRunStatus: (runStatus) => set({ runStatus }),

  addError: (error) =>
    set((state) => ({ errors: [...state.errors, error] })),
  clearErrors: () => set({ errors: [] }),

  setSelectedModel: (model) => set({ selectedModel: model }),

  reset: () => set(initialState),
}));
