import { type ModelMessage, streamText } from "ai";

import { getSession } from "@/lib/auth-server";
import { buildFullSystemPrompt } from "@/lib/context/context-assembler";
import { getModel } from "@/lib/model-gateway";
import { chatSchema } from "@/lib/validations";

export const maxDuration = 60;

// In-memory rate limiter.
// NOTE: per-instance only. For serverless / multi-instance, back this with a
// shared store (Redis/Upstash) so the limit applies globally.
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

  const { messages, model, files, activeFile, projectName } = parsed.data;

  // Build dynamic system prompt with full context awareness.
  const systemPrompt =
    Object.keys(files).length > 0
      ? buildFullSystemPrompt({
          prompt: messages[messages.length - 1]?.content || "",
          files,
          activeFilePath: activeFile,
          projectName,
          tokenBudget: 80_000,
        })
      : `You are Fazz Code, an expert AI code generator. Generate clean, production-ready code using TypeScript, React/Next.js App Router, Tailwind CSS, and shadcn/ui components. When generating code, use code blocks with the filename format: \`\`\`tsx filename="src/app/page.tsx".`;

  const recentMessages = messages.slice(-20) as ModelMessage[];

  const result = streamText({
    model: getModel(model),
    system: systemPrompt,
    messages: recentMessages,
  });

  return result.toTextStreamResponse();
}
