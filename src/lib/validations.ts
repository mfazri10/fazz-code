import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared context (project file snapshot sent to chat / generate)
// ---------------------------------------------------------------------------
const MAX_CONTEXT_FILES = 100;
const MAX_CONTEXT_CHARS = 400_000; // ~100K tokens worth of context
const MAX_FILE_CHARS = 200_000;

export const filesRecordSchema = z
  .record(z.string().min(1).max(500), z.string().max(MAX_FILE_CHARS))
  .refine((files) => Object.keys(files).length <= MAX_CONTEXT_FILES, {
    message: `Too many files (max ${MAX_CONTEXT_FILES})`,
  })
  .refine(
    (files) =>
      Object.values(files).reduce((sum, c) => sum + c.length, 0) <=
      MAX_CONTEXT_CHARS,
    { message: `Context too large (max ${MAX_CONTEXT_CHARS} chars)` }
  );

// ---------------------------------------------------------------------------
// Chat API
// ---------------------------------------------------------------------------
export const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })
    )
    .min(1)
    .max(20),
  model: z.string().optional().default("claude-sonnet-4-20250514"),
  // Optional project context — validated here instead of read from the raw body.
  files: filesRecordSchema.optional().default({}),
  activeFile: z.string().max(500).optional(),
  projectName: z.string().max(200).optional(),
});

// ---------------------------------------------------------------------------
// Generate API
// ---------------------------------------------------------------------------
export const generateSchema = z.object({
  prompt: z.string().min(1).max(10000),
  model: z.string().optional().default("claude-sonnet-4-20250514"),
  skipPlan: z.boolean().optional().default(false),
  skipReview: z.boolean().optional().default(false),
  maxFixIterations: z.number().int().min(1).max(5).optional().default(3),
  files: filesRecordSchema.optional().default({}),
  errors: z
    .array(
      z.object({
        file: z.string(),
        message: z.string(),
        severity: z.string(),
      })
    )
    .optional()
    .default([]),
  projectId: z.string().optional().default("global"),
});

// ---------------------------------------------------------------------------
// AI output schemas — validate model JSON before trusting it
// ---------------------------------------------------------------------------
export const planResultSchema = z.object({
  summary: z.string(),
  files: z
    .array(
      z.object({
        path: z.string(),
        description: z.string(),
        components: z.array(z.string()).optional(),
      })
    )
    .default([]),
  components: z
    .array(
      z.object({
        name: z.string(),
        file: z.string(),
        description: z.string(),
      })
    )
    .default([]),
  notes: z.string().optional(),
});

export const reviewResultSchema = z.object({
  verdict: z.enum(["approve", "request_changes"]),
  issues: z
    .array(
      z.object({
        file: z.string(),
        severity: z.enum(["error", "warning", "info"]),
        detail: z.string(),
        suggestion: z.string().optional().default(""),
      })
    )
    .default([]),
  summary: z.string(),
});

export type PlanResultSchema = z.infer<typeof planResultSchema>;
export type ReviewResultSchema = z.infer<typeof reviewResultSchema>;

/**
 * Extract the first balanced JSON object from a string.
 *
 * More robust than a greedy `/\{[\s\S]*\}/` regex: it respects string literals
 * and nested braces, so it won't accidentally swallow trailing prose or stop
 * early inside a string. Throws if no balanced object is found.
 */
export function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in response");

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return JSON.parse(text.slice(start, i + 1));
      }
    }
  }

  throw new Error("Unbalanced JSON object in response");
}

// ---------------------------------------------------------------------------
// Project / file / message / version
// ---------------------------------------------------------------------------
export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["active", "archived", "deleted"]).optional(),
});

export const upsertFileSchema = z.object({
  path: z.string().min(1).max(500),
  content: z.string(),
  language: z.string().optional().default("plaintext"),
});

export const createMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
  meta: z
    .object({
      model: z.string().optional(),
      tokens: z.number().int().optional(),
      cost: z.number().optional(),
    })
    .optional(),
});

export const createVersionSchema = z.object({
  files: z.record(z.string(), z.string()),
  description: z.string().max(500).optional(),
});

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
});
