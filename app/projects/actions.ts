"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  deleteProject as deleteProjectRecord,
  getProjectById,
  setChatsVisibilityByProjectId,
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
  memory: z.string().max(50_000).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  visibility: z.enum(["public", "private"]).optional(),
});

export type UpdateProjectState = {
  status: "idle" | "success" | "error";
  error?: string;
};

/**
 * Each project-page card (Name/Visibility, Instructions, Memory) submits
 * only the field(s) it owns — any field not present in formData keeps its
 * current value, so cards can save independently without clobbering the
 * others.
 */
export async function updateProject(
  _: UpdateProjectState,
  formData: FormData
): Promise<UpdateProjectState> {
  const id = String(formData.get("id"));

  try {
    const proj = await requireProjectManager(id);

    const parsed = updateSchema.parse({
      instructions: formData.has("instructions")
        ? String(formData.get("instructions"))
        : undefined,
      memory: formData.has("memory")
        ? String(formData.get("memory"))
        : undefined,
      name: formData.has("name") ? String(formData.get("name")) : undefined,
      visibility: formData.has("visibility")
        ? String(formData.get("visibility"))
        : undefined,
    });

    const newVisibility = parsed.visibility ?? proj.visibility;

    await updateProjectRecord({
      id,
      instructions: formData.has("instructions")
        ? parsed.instructions?.trim() || null
        : proj.instructions,
      memory: formData.has("memory")
        ? parsed.memory?.trim() || null
        : proj.memory,
      name: parsed.name ?? proj.name,
      visibility: newVisibility,
    });

    // A public project's chats are visible to the whole team too — keep
    // them in sync whenever the project is (or becomes) public. This is
    // one-directional: going back to private doesn't un-share chats that
    // were already shared.
    if (newVisibility === "public") {
      await setChatsVisibilityByProjectId({
        projectId: id,
        visibility: "public",
      });
    }

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
