import { getSession } from "@/lib/auth-server";
import { createProject, getProjects } from "@/lib/db";
import { createProjectSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
  const cursor = searchParams.get("cursor") || undefined;

  const result = await getProjects(session.session.userId, limit, cursor);
  return Response.json(result);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, description } = parsed.data;
  const project = await createProject(name, session.session.userId, description);
  return Response.json(project, { status: 201 });
}
