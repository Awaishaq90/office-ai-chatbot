"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  deleteProject as deleteProjectRecord,
  getProjectById,
  updateProject as updateProjectRecord,
} from "@/lib/db/queries";

async function requireProjectManager(projectId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const proj = await getProjectById(projectId);

  if (!proj) {
    throw new Error("Not found");
  }

  if (proj.userId !== session.user.id && session.user.type !== "admin") {
    throw new Error("Forbidden");
  }

  return proj;
}

const updateSchema = z.object({
  instructions: z.string().max(50_000).optional(),
  name: z.string().trim().min(1).max(100),
  visibility: z.enum(["public", "private"]),
});

export type UpdateProjectState = {
  status: "idle" | "success" | "error";
  error?: string;
};

export async function updateProject(
  _: UpdateProjectState,
  formData: FormData
): Promise<UpdateProjectState> {
  const id = String(formData.get("id"));

  try {
    await requireProjectManager(id);

    const { name, instructions, visibility } = updateSchema.parse({
      instructions: formData.get("instructions") || undefined,
      name: formData.get("name"),
      visibility: formData.get("visibility"),
    });

    await updateProjectRecord({
      id,
      instructions: instructions?.trim() || null,
      name,
      visibility,
    });

    revalidatePath(`/projects/${id}`);

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Enter a project name.", status: "error" };
    }

    return { error: "Failed to save project.", status: "error" };
  }
}

export type DeleteProjectResult =
  | { status: "success" }
  | { status: "error"; error: string };

export async function deleteProject(id: string): Promise<DeleteProjectResult> {
  try {
    await requireProjectManager(id);
    await deleteProjectRecord(id);

    return { status: "success" };
  } catch {
    return { error: "Failed to delete project.", status: "error" };
  }
}
