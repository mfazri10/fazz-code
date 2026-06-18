import { type ModelMessage, streamText } from "ai";

import { getSession } from "@/lib/auth-server";
import { getModel } from "@/lib/model-gateway";
import { chatSchema } from "@/lib/validations";

export const maxDuration = 60;

// In-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

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
  const sessionData = await getSession();
  if (!sessionData?.session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(sessionData.session.userId)) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { messages, model } = parsed.data;
  const recentMessages = messages.slice(-20) as ModelMessage[];

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
