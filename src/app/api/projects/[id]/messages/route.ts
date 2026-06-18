import { getSession } from "@/lib/auth-server";
import { createMessage, getProject, getProjectMessages } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await getProject(id);
  if (!project || project.user_id !== session.session.userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await getProjectMessages(id);
  return Response.json(messages);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await getProject(id);
  if (!project || project.user_id !== session.session.userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { role, content, meta } = body;

  if (!role || typeof content !== "string") {
    return Response.json({ error: "role and content required" }, { status: 400 });
  }

  const message = await createMessage(id, role, content, meta);
  return Response.json(message, { status: 201 });
}
