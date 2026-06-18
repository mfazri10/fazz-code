export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
          status: "active" | "archived" | "deleted";
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          status?: "active" | "archived" | "deleted";
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          updated_at?: string;
          status?: "active" | "archived" | "deleted";
        };
      };
      files: {
        Row: {
          id: string;
          project_id: string;
          path: string;
          content: string;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          path: string;
          content: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          language?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          project_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          status: "thinking" | "streaming" | "done" | "error" | null;
          model: string | null;
          tokens: number | null;
          cost: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          status?: "thinking" | "streaming" | "done" | "error" | null;
          model?: string | null;
          tokens?: number | null;
          cost?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          status?: "thinking" | "streaming" | "done" | "error" | null;
          tokens?: number | null;
          cost?: number | null;
        };
      };
      agent_runs: {
        Row: {
          id: string;
          project_id: string;
          agent_type: "planner" | "generator" | "fixer" | "reviewer";
          model: string;
          input: Json;
          output: Json;
          status: "running" | "completed" | "failed";
          tokens_used: number;
          duration_ms: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          agent_type: "planner" | "generator" | "fixer" | "reviewer";
          model: string;
          input: Json;
          output?: Json;
          status?: "running" | "completed" | "failed";
          tokens_used?: number;
          duration_ms?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          output?: Json;
          status?: "running" | "completed" | "failed";
          tokens_used?: number;
          duration_ms?: number;
        };
      };
      versions: {
        Row: {
          id: string;
          project_id: string;
          version_number: number;
          description: string | null;
          files_snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          version_number: number;
          description?: string | null;
          files_snapshot: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          description?: string | null;
          files_snapshot?: Json;
        };
      };
    };
  };
}
