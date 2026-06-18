import { type ModelMessage,streamText } from "ai";

import { getSession } from "@/lib/auth-server";
import { getModel } from "@/lib/model-gateway";

export const maxDuration = 60;

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  // 1. Auth check
  const sessionData = await getSession();
  if (!sessionData?.session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Rate limit
  if (!checkRateLimit(sessionData.session.userId)) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // 3. Parse & validate
  let body: { messages?: unknown[]; model?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, model = "claude-sonnet-4-20250514" } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Messages array required" }, { status: 400 });
  }

  // Limit message history to prevent token abuse
  const recentMessages = messages.slice(-20) as ModelMessage[];

  // 4. Stream
  const result = streamText({
    model: getModel(model),
    system: `You are Fazz Code, an expert AI code generator. You help users build web applications by generating clean, production-ready code.

When generating code:
- Always use TypeScript
- Use React/Next.js App Router conventions
- Use Tailwind CSS for styling
- Use shadcn/ui components when appropriate
- Write clean, well-structured code with proper types
- Explain what you're building briefly before generating code

When asked to create UI components or pages, provide the complete file contents in code blocks with the filename as the language identifier (e.g. \`\`\`tsx filename="src/app/page.tsx").`,
    messages: recentMessages,
  });

  return result.toTextStreamResponse();
}
