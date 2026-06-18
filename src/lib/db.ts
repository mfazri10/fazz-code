import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type File = Database["public"]["Tables"]["files"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];
type AgentRun = Database["public"]["Tables"]["agent_runs"]["Row"];
type Version = Database["public"]["Tables"]["versions"]["Row"];

// Projects
export async function getProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createProject(
  name: string,
  userId: string,
  description?: string
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ name, user_id: userId, description })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(
  id: string,
  updates: Database["public"]["Tables"]["projects"]["Update"]
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ status: "deleted" })
    .eq("id", id);

  if (error) throw error;
}

// Files
export async function getProjectFiles(projectId: string): Promise<File[]> {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("project_id", projectId)
    .order("path");

  if (error) throw error;
  return data ?? [];
}

export async function upsertFile(
  projectId: string,
  path: string,
  content: string,
  language: string = "plaintext"
): Promise<File> {
  const { data, error } = await supabase
    .from("files")
    .upsert(
      { project_id: projectId, path, content, language },
      { onConflict: "project_id,path" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFile(projectId: string, path: string): Promise<void> {
  const { error } = await supabase
    .from("files")
    .delete()
    .eq("project_id", projectId)
    .eq("path", path);

  if (error) throw error;
}

export async function upsertFiles(
  projectId: string,
  files: Array<{ path: string; content: string; language?: string }>
): Promise<void> {
  const { error } = await supabase.from("files").upsert(
    files.map((f) => ({
      project_id: projectId,
      path: f.path,
      content: f.content,
      language: f.language ?? "plaintext",
    })),
    { onConflict: "project_id,path" }
  );

  if (error) throw error;
}

// Messages
export async function getProjectMessages(projectId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at");

  if (error) throw error;
  return data ?? [];
}

export async function createMessage(
  projectId: string,
  role: Message["role"],
  content: string,
  meta?: { model?: string; tokens?: number; cost?: number }
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      project_id: projectId,
      role,
      content,
      model: meta?.model,
      tokens: meta?.tokens,
      cost: meta?.cost,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMessage(
  id: string,
  updates: Database["public"]["Tables"]["messages"]["Update"]
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Agent Runs
export async function createAgentRun(
  run: Database["public"]["Tables"]["agent_runs"]["Insert"]
): Promise<AgentRun> {
  const { data, error } = await supabase
    .from("agent_runs")
    .insert(run)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAgentRun(
  id: string,
  updates: Database["public"]["Tables"]["agent_runs"]["Update"]
): Promise<AgentRun> {
  const { data, error } = await supabase
    .from("agent_runs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Versions
export async function createVersion(
  projectId: string,
  filesSnapshot: Database["public"]["Tables"]["versions"]["Row"]["files_snapshot"],
  description?: string
): Promise<Version> {
  // Get current max version number
  const { data: maxVersion } = await supabase
    .from("versions")
    .select("version_number")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (maxVersion?.version_number ?? 0) + 1;

  const { data, error } = await supabase
    .from("versions")
    .insert({
      project_id: projectId,
      version_number: nextVersion,
      description,
      files_snapshot: filesSnapshot,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getVersions(projectId: string): Promise<Version[]> {
  const { data, error } = await supabase
    .from("versions")
    .select("*")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
