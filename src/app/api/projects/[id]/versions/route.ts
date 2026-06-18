import { getSession } from "@/lib/auth-server";
import { createVersion, getProject, getVersions } from "@/lib/db";

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

  const versions = await getVersions(id);
  return Response.json(versions);
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
  const { files, description } = body;

  if (!files || typeof files !== "object") {
    return Response.json({ error: "files snapshot required" }, { status: 400 });
  }

  const version = await createVersion(id, files, description);
  return Response.json(version, { status: 201 });
}
