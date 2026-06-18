import { getSession } from "@/lib/auth-server";
import { createProject, getProjects } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await getProjects(session.session.userId);
  return Response.json(projects);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description } = body;

  if (!name || typeof name !== "string") {
    return Response.json({ error: "Name required" }, { status: 400 });
  }

  const project = await createProject(name, session.session.userId, description);
  return Response.json(project, { status: 201 });
}
