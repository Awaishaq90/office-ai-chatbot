import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createProjectKnowledgeFile,
  deleteProjectKnowledgeFile,
  getProjectById,
  getProjectKnowledgeFiles,
} from "@/lib/db/queries";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_LENGTH = 200_000;
const ALLOWED_CONTENT_TYPES = [
  "text/plain",
  "text/markdown",
  "application/pdf",
];

async function canManageProject(
  projectId: string,
  userId: string,
  isAdmin: boolean
) {
  const proj = await getProjectById(projectId);

  if (!proj) {
    return { allowed: false as const, project: null };
  }

  return { allowed: isAdmin || proj.userId === userId, project: proj };
}

async function extractText(
  file: Blob,
  contentType: string
): Promise<string | null> {
  try {
    if (contentType === "text/plain" || contentType === "text/markdown") {
      const text = await file.text();
      return text.slice(0, MAX_EXTRACTED_TEXT_LENGTH);
    }

    if (contentType === "application/pdf") {
      const { default: pdfParse } = await import("pdf-parse");
      const buffer = Buffer.from(await file.arrayBuffer());
      const data = await pdfParse(buffer);
      return data.text.slice(0, MAX_EXTRACTED_TEXT_LENGTH);
    }
  } catch {
    return null;
  }

  return null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const { allowed, project } = await canManageProject(
    projectId,
    session.user.id,
    session.user.type === "admin"
  );

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size should be less than 10MB" },
        { status: 400 }
      );
    }

    if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type should be .txt, .md, or .pdf" },
        { status: 400 }
      );
    }

    const filename = (formData.get("file") as File).name;
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileBuffer = await file.arrayBuffer();

    const blob = await put(`projects/${projectId}/${safeName}`, fileBuffer, {
      access: "public",
    });

    const extractedText = await extractText(file, file.type);

    const created = await createProjectKnowledgeFile({
      contentType: file.type,
      extractedText,
      name: filename,
      projectId,
      url: blob.url,
    });

    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  const { allowed, project } = await canManageProject(
    projectId,
    session.user.id,
    session.user.type === "admin"
  );

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const files = await getProjectKnowledgeFiles(projectId);
  const target = files.find((f) => f.id === fileId);

  if (!target) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const deleted = await deleteProjectKnowledgeFile(fileId);

  try {
    await del(target.url);
  } catch {
    /* blob may already be gone, not fatal */
  }

  return NextResponse.json(deleted);
}
