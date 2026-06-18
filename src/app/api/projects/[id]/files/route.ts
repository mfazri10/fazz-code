import { getSession } from "@/lib/auth-server";
import { deleteFile,getProject, getProjectFiles, upsertFile } from "@/lib/db";

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

  const files = await getProjectFiles(id);
  return Response.json(files);
}

export async function PUT(
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
  const { path, content, language } = body;

  if (!path || typeof content !== "string") {
    return Response.json({ error: "path and content required" }, { status: 400 });
  }

  const file = await upsertFile(id, path, content, language);
  return Response.json(file);
}

export async function DELETE(
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

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  if (!path) {
    return Response.json({ error: "path required" }, { status: 400 });
  }

  await deleteFile(id, path);
  return Response.json({ ok: true });
}
