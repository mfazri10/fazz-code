-- Fazz Code Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'plaintext',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, path)
);

CREATE INDEX idx_files_project_id ON files(project_id);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL DEFAULT '',
  status TEXT CHECK (status IN ('thinking', 'streaming', 'done', 'error')),
  model TEXT,
  tokens INTEGER,
  cost NUMERIC(10, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Agent runs table
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('planner', 'generator', 'fixer', 'reviewer')),
  model TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  tokens_used INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_runs_project_id ON agent_runs(project_id);
CREATE INDEX idx_agent_runs_agent_type ON agent_runs(agent_type);

-- Versions table
CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  description TEXT,
  files_snapshot JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, version_number)
);

CREATE INDEX idx_versions_project_id ON versions(project_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

-- Policies (basic - adjust based on your auth setup)
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (user_id = auth.uid()::text);

-- Files policies (through project ownership)
CREATE POLICY "Users can view project files" ON files
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can manage project files" ON files
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text)
  );

-- Messages policies
CREATE POLICY "Users can view project messages" ON messages
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can manage project messages" ON messages
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text)
  );

-- Agent runs policies
CREATE POLICY "Users can view project agent runs" ON agent_runs
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can manage project agent runs" ON agent_runs
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text)
  );

-- Versions policies
CREATE POLICY "Users can view project versions" ON versions
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can manage project versions" ON versions
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text)
  );
