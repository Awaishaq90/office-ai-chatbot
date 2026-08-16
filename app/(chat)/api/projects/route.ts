import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { createProject, getProjectsForUser } from "@/lib/db/queries";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await getProjectsForUser(session.user.id);

  return NextResponse.json({ projects });
}

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  visibility: z.enum(["public", "private"]).default("private"),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { name, visibility } = createProjectSchema.parse(json);

    const created = await createProject({
      name,
      userId: session.user.id,
      visibility,
    });

    return NextResponse.json(created);
  } catch {
    return NextResponse.json(
      { error: "Enter a valid project name." },
      { status: 400 }
    );
  }
}
