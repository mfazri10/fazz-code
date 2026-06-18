/**
 * Code Generator
 * Generates TypeScript interfaces, Zod schemas, API routes, and mock data
 * from data model definitions.
 */

import type { DataModel, ModelField, ProjectSchema } from "./types";
import { toSnakeCase } from "./types";

// ── TypeScript Interface ──────────────────────────────────────────

function fieldToTypeScript(field: ModelField): string {
  const typeMap: Record<string, string> = {
    string: "string",
    number: "number",
    boolean: "boolean",
    date: "string",
    datetime: "string",
    text: "string",
    email: "string",
    url: "string",
    image: "string",
    phone: "string",
    uuid: "string",
    json: "Record<string, unknown>",
    enum: field.enumValues?.map((v) => `'${v}'`).join(" | ") || "string",
    decimal: "number",
  };
  return typeMap[field.type] || "string";
}

export function generateTypeScriptInterface(model: DataModel): string {
  const lines: string[] = [];
  lines.push(`export interface ${model.name} {`);

  for (const field of model.fields) {
    const optional = !field.required ? "?" : "";
    lines.push(`  ${field.name}${optional}: ${fieldToTypeScript(field)};`);
  }

  lines.push("}");
  return lines.join("\n");
}

// ── Zod Schema ────────────────────────────────────────────────────

function fieldToZod(field: ModelField): string {
  if (field.isPrimaryKey || field.name === "id") return "z.string().uuid()";
  if (field.name === "created_at" || field.name === "updated_at") return "z.string().datetime()";

  const zodMap: Record<string, string> = {
    string: "z.string()",
    number: "z.number()",
    boolean: "z.boolean()",
    date: "z.string().date()",
    datetime: "z.string().datetime()",
    text: "z.string()",
    email: "z.string().email()",
    url: "z.string().url()",
    image: "z.string().url()",
    phone: "z.string()",
    uuid: "z.string().uuid()",
    json: "z.record(z.unknown())",
    enum: field.enumValues?.length
      ? `z.enum([${field.enumValues.map((v) => `'${v}'`).join(", ")}])`
      : "z.string()",
    decimal: "z.number()",
  };

  let zod = zodMap[field.type] || "z.string()";

  if (!field.required) zod += ".optional()";
  if (field.defaultValue) zod += `.default('${field.defaultValue}')`;

  return zod;
}

export function generateZodSchema(model: DataModel): string {
  const createFields = model.fields.filter(
    (f) => !f.isPrimaryKey && f.name !== "created_at" && f.name !== "updated_at"
  );

  const lines: string[] = [`import { z } from 'zod';`, ""];
  lines.push(`export const create${model.name}Schema = z.object({`);
  for (const field of createFields) {
    lines.push(`  ${field.name}: ${fieldToZod(field)},`);
  }
  lines.push("});");
  lines.push("");
  lines.push(`export const update${model.name}Schema = create${model.name}Schema.partial();`);
  lines.push("");
  lines.push(`export type Create${model.name}Input = z.infer<typeof create${model.name}Schema>;`);
  lines.push(`export type Update${model.name}Input = z.infer<typeof update${model.name}Schema>;`);

  return lines.join("\n");
}

// ── API Route ─────────────────────────────────────────────────────

export function generateApiRoute(model: DataModel): string {
  const tableName = model.tableName || toSnakeCase(model.name);
  const lcModel = model.name.toLowerCase();

  return `import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { create${model.name}Schema } from '@/lib/validations/${lcModel}';

// GET /api/${tableName}
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  const items = await db.query(
    'SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  const countResult = await db.query('SELECT COUNT(*) FROM ${tableName}');

  return NextResponse.json({
    items: items.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
  });
}

// POST /api/${tableName}
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = create${model.name}Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const fields = Object.keys(parsed.data);
  const values = Object.values(parsed.data);
  const placeholders = values.map((_, i) => \`$\${i + 1}\`);

  const result = await db.query(
    \`INSERT INTO ${tableName} (\${fields.join(', ')}) VALUES (\${placeholders.join(', ')}) RETURNING *\`,
    values
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
`;
}

export function generateApiRouteById(model: DataModel): string {
  const tableName = model.tableName || toSnakeCase(model.name);
  const lcModel = model.name.toLowerCase();

  return `import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { update${model.name}Schema } from '@/lib/validations/${lcModel}';

// GET /api/${tableName}/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await db.query('SELECT * FROM ${tableName} WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

// PUT /api/${tableName}/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = update${model.name}Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const fields = Object.keys(parsed.data);
  const values = Object.values(parsed.data);
  const setClauses = fields.map((f, i) => \`\${f} = $\${i + 1}\`);

  const result = await db.query(
    \`UPDATE ${tableName} SET \${setClauses.join(', ')}, updated_at = NOW() WHERE id = $\${fields.length + 1} RETURNING *\`,
    [...values, id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

// DELETE /api/${tableName}/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.query('DELETE FROM ${tableName} WHERE id = $1', [id]);
  return NextResponse.json({ ok: true });
}
`;
}

// ── SQL Migration ─────────────────────────────────────────────────

function fieldToSQL(field: ModelField): string {
  const typeMap: Record<string, string> = {
    string: "TEXT",
    number: "INTEGER",
    boolean: "BOOLEAN DEFAULT FALSE",
    date: "DATE",
    datetime: "TIMESTAMPTZ DEFAULT NOW()",
    text: "TEXT",
    email: "TEXT",
    url: "TEXT",
    image: "TEXT",
    phone: "TEXT",
    uuid: "UUID DEFAULT gen_random_uuid()",
    json: "JSONB DEFAULT '{}'",
    enum: field.enumValues?.length
      ? `TEXT CHECK (${field.name} IN (${field.enumValues.map((v) => `'${v}'`).join(", ")}))`
      : "TEXT",
    decimal: "NUMERIC(10,2)",
  };

  let sql = `${field.name} ${typeMap[field.type] || "TEXT"}`;
  if (field.isPrimaryKey) sql += " PRIMARY KEY";
  if (field.required && !field.isPrimaryKey) sql += " NOT NULL";
  if (field.unique) sql += " UNIQUE";
  if (field.defaultValue && !typeMap[field.type]?.includes("DEFAULT")) {
    sql += ` DEFAULT '${field.defaultValue}'`;
  }
  return sql;
}

export function generateSQLMigration(schema: ProjectSchema): string {
  const lines: string[] = ["-- Auto-generated by Fazz Code Data Model Builder", ""];

  for (const model of schema.models) {
    const tableName = model.tableName || toSnakeCase(model.name);
    lines.push(`CREATE TABLE IF NOT EXISTS ${tableName} (`);
    const fieldLines = model.fields.map((f) => `  ${fieldToSQL(f)}`);
    lines.push(fieldLines.join(",\n"));
    lines.push(");");
    lines.push("");

    // Add indexes for foreign keys
    for (const field of model.fields) {
      if (field.isForeignKey) {
        lines.push(`CREATE INDEX IF NOT EXISTS idx_${tableName}_${field.name} ON ${tableName}(${field.name});`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ── Full Schema Export ────────────────────────────────────────────

export function generateAllCode(schema: ProjectSchema): Record<string, string> {
  const files: Record<string, string> = {};

  for (const model of schema.models) {
    const lc = model.name.toLowerCase();
    const tableName = model.tableName || toSnakeCase(model.name);

    // TypeScript interface
    files[`src/models/${lc}.ts`] = generateTypeScriptInterface(model);

    // Zod schema
    files[`src/validations/${lc}.ts`] = generateZodSchema(model);

    // API routes
    files[`src/app/api/${tableName}/route.ts`] = generateApiRoute(model);
    files[`src/app/api/${tableName}/[id]/route.ts`] = generateApiRouteById(model);
  }

  // SQL migration
  files["supabase/migrations/002_data_models.sql"] = generateSQLMigration(schema);

  return files;
}
