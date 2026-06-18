import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth-server";
import { generateAllCode } from "@/lib/data-model/code-generator";
import { generateSchemaMockData } from "@/lib/data-model/mock-generator";
import type { ProjectSchema } from "@/lib/data-model/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { schema?: ProjectSchema; action?: string; mockCount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { schema, action = "generate", mockCount = 50 } = body;

  if (!schema?.models?.length) {
    return NextResponse.json({ error: "Schema with at least one model required" }, { status: 400 });
  }

  try {
    if (action === "generate") {
      // Generate code files
      const files = generateAllCode(schema);
      return NextResponse.json({ files });
    }

    if (action === "mock") {
      // Generate mock data
      const mockData = generateSchemaMockData(schema, mockCount);
      return NextResponse.json({ mockData });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
