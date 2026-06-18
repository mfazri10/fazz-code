import { streamText } from "ai";

import { getModel } from "@/lib/model-gateway";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, model = "claude-sonnet-4-20250514" } = await req.json();

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
    messages,
  });

  return result.toTextStreamResponse();
}
