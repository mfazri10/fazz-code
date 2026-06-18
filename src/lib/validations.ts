import { z } from "zod";

// Chat API
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
});

// Generate API
export const generateSchema = z.object({
  prompt: z.string().min(1).max(10000),
  model: z.string().optional().default("claude-sonnet-4-20250514"),
  skipPlan: z.boolean().optional().default(false),
  skipReview: z.boolean().optional().default(false),
  maxFixIterations: z.number().int().min(1).max(5).optional().default(3),
  files: z.record(z.string(), z.string()).optional().default({}),
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

// Project create
export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// Project update
export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["active", "archived", "deleted"]).optional(),
});

// File upsert
export const upsertFileSchema = z.object({
  path: z.string().min(1).max(500),
  content: z.string(),
  language: z.string().optional().default("plaintext"),
});

// Message create
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

// Version create
export const createVersionSchema = z.object({
  files: z.record(z.string(), z.string()),
  description: z.string().max(500).optional(),
});

// Sign-up
export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
});
