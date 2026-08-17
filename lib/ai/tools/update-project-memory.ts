import { tool } from "ai";
import { z } from "zod";
import { updateProjectMemory as updateProjectMemoryRecord } from "@/lib/db/queries";

const MAX_MEMORY_CHARS = 8000;

export const updateProjectMemory = ({ projectId }: { projectId: string }) =>
  tool({
    description:
      "Update this project's memory — a compact, evolving summary of durable facts, preferences, and context you've picked up in this project (not one-off details already answered in the current message, and not a transcript). Call this whenever you learn something worth remembering for future chats in this project. You already have the current memory in your context above, so provide the full updated summary, not a diff.",
    execute: async ({ content }) => {
      const trimmed = content.trim().slice(0, MAX_MEMORY_CHARS);

      try {
        await updateProjectMemoryRecord({ memory: trimmed, projectId });
        return { status: "success" };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "Failed to update memory",
          status: "error",
        };
      }
    },
    inputSchema: z.object({
      content: z
        .string()
        .max(MAX_MEMORY_CHARS)
        .describe(
          "The full updated memory summary for this project, replacing the previous one."
        ),
    }),
    needsApproval: false,
  });
