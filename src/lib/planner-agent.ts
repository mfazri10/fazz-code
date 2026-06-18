import { generateText } from "ai";

import { getModel } from "@/lib/model-gateway";

const PLANNER_SYSTEM_PROMPT = `You are Fazz Code Planner, an expert at breaking down UI/app requests into structured plans.

Given a user request, output a JSON plan with this structure:
{
  "summary": "Brief description of what will be built",
  "files": [
    {
      "path": "src/app/page.tsx",
      "description": "Main page component",
      "components": ["Hero", "Pricing"]
    }
  ],
  "components": [
    {
      "name": "Hero",
      "file": "src/components/hero.tsx",
      "description": "Hero section with headline and CTA"
    }
  ],
  "notes": "Any additional implementation notes"
}

Only output valid JSON. No markdown, no explanation outside the JSON.`;

export interface PlanResult {
  summary: string;
  files: Array<{
    path: string;
    description: string;
    components?: string[];
  }>;
  components: Array<{
    name: string;
    file: string;
    description: string;
  }>;
  notes?: string;
}

export async function runPlanner(
  prompt: string,
  model: string = "claude-sonnet-4-20250514"
): Promise<PlanResult> {
  const result = await generateText({
    model: getModel(model),
    system: PLANNER_SYSTEM_PROMPT,
    prompt: `User request: ${prompt}`,
  });

  const jsonMatch = result.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse plan JSON from response");
  }

  return JSON.parse(jsonMatch[0]) as PlanResult;
}
