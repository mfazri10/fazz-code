import { getSession } from "@/lib/auth-server";
import { deleteProject, getProject, updateProject } from "@/lib/db";

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

  return Response.json(project);
}

export async function PATCH(
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
  const updated = await updateProject(id, body);
  return Response.json(updated);
}

export async function DELETE(
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

  await deleteProject(id);
  return Response.json({ ok: true });
}
