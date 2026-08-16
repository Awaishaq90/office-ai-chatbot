"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { createUser, deleteUserById, getUser } from "@/lib/db/queries";

const addUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

async function requireAdmin() {
  const session = await auth();

  if (session?.user?.type !== "admin") {
    throw new Error("Forbidden");
  }
}

export type AddUserState = {
  status: "idle" | "success" | "error";
  error?: string;
};

export async function addUser(
  _: AddUserState,
  formData: FormData
): Promise<AddUserState> {
  await requireAdmin();

  try {
    const { email, password } = addUserSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const existing = await getUser(email);

    if (existing.length > 0) {
      return {
        error: "A user with that email already exists.",
        status: "error",
      };
    }

    await createUser(email, password);
    revalidatePath("/admin/users");

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: "Enter a valid email and a password of at least 6 characters.",
        status: "error",
      };
    }

    return { error: "Failed to add user.", status: "error" };
  }
}

export type RemoveUserResult =
  | { status: "success" }
  | { status: "error"; error: string };

export async function removeUser(userId: string): Promise<RemoveUserResult> {
  await requireAdmin();

  try {
    await deleteUserById(userId);
    revalidatePath("/admin/users");

    return { status: "success" };
  } catch {
    return {
      error:
        "Couldn't remove this user — they may still have documents or other content referencing them.",
      status: "error",
    };
  }
}
