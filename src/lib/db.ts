import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/fazzcode",
  max: 20,                    // Maximum connections in pool
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail if can't connect in 5s
});

// Graceful shutdown
process.on("SIGINT", () => pool.end());
process.on("SIGTERM", () => pool.end());

export default pool;

// Helper functions for database operations
export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Project operations
export async function getProjects(userId: string, limit = 20, cursor?: string) {
  let sql = "SELECT * FROM projects WHERE user_id = $1 AND status = 'active'";
  const params: unknown[] = [userId];

  if (cursor) {
    sql += " AND updated_at < $2";
    params.push(cursor);
  }

  sql += " ORDER BY updated_at DESC LIMIT $" + (params.length + 1);
  params.push(limit + 1);

  const result = await query(sql, params);
  const rows = result.rows;
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  return {
    items: rows,
    nextCursor: hasMore ? rows[rows.length - 1]?.updated_at : null,
  };
}

export async function getProject(id: string) {
  const result = await query("SELECT * FROM projects WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function createProject(name: string, userId: string, description?: string) {
  const result = await query(
    "INSERT INTO projects (name, user_id, description) VALUES ($1, $2, $3) RETURNING *",
    [name, userId, description]
  );
  return result.rows[0];
}

export async function updateProject(id: string, updates: { name?: string; description?: string; status?: string }) {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name) {
    setClauses.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    setClauses.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.status) {
    setClauses.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE projects SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteProject(id: string) {
  await query("UPDATE projects SET status = 'deleted' WHERE id = $1", [id]);
}

// File operations
export async function getProjectFiles(projectId: string) {
  const result = await query(
    "SELECT * FROM files WHERE project_id = $1 ORDER BY path",
    [projectId]
  );
  return result.rows;
}

export async function upsertFile(projectId: string, path: string, content: string, language: string = "plaintext") {
  const result = await query(
    `INSERT INTO files (project_id, path, content, language) 
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (project_id, path) 
     DO UPDATE SET content = $3, language = $4, updated_at = NOW()
     RETURNING *`,
    [projectId, path, content, language]
  );
  return result.rows[0];
}

export async function deleteFile(projectId: string, path: string) {
  await query("DELETE FROM files WHERE project_id = $1 AND path = $2", [projectId, path]);
}

// Message operations
export async function getProjectMessages(projectId: string) {
  const result = await query(
    "SELECT * FROM messages WHERE project_id = $1 ORDER BY created_at",
    [projectId]
  );
  return result.rows;
}

export async function createMessage(
  projectId: string,
  role: "user" | "assistant" | "system",
  content: string,
  meta?: { model?: string; tokens?: number; cost?: number }
) {
  const result = await query(
    `INSERT INTO messages (project_id, role, content, model, tokens, cost)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [projectId, role, content, meta?.model, meta?.tokens, meta?.cost]
  );
  return result.rows[0];
}

// Version operations
export async function createVersion(projectId: string, filesSnapshot: unknown, description?: string) {
  // Get current max version
  const maxResult = await query(
    "SELECT MAX(version_number) as max_version FROM versions WHERE project_id = $1",
    [projectId]
  );
  const nextVersion = (maxResult.rows[0]?.max_version || 0) + 1;

  const result = await query(
    `INSERT INTO versions (project_id, version_number, description, files_snapshot)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [projectId, nextVersion, description, JSON.stringify(filesSnapshot)]
  );
  return result.rows[0];
}

export async function getVersions(projectId: string, limit = 20, cursor?: string) {
  let q = "SELECT id, version_number, description, created_at FROM versions WHERE project_id = $1";
  const params: unknown[] = [projectId];

  if (cursor) {
    q += " AND version_number < $2";
    params.push(cursor);
  }

  q += " ORDER BY version_number DESC LIMIT $" + (params.length + 1);
  params.push(limit + 1);

  const result = await query(q, params);
  const rows = result.rows;
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  return {
    items: rows,
    nextCursor: hasMore ? rows[rows.length - 1]?.version_number : null,
  };
}
