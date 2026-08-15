import { tool } from "ai";
import { z } from "zod";
import { resolveSanityTarget } from "@/lib/sanity/client";
import { SANITY_PROJECT_NAMES } from "@/lib/sanity/projects";

export const deleteSanityDocument = tool({
  description:
    "Permanently delete an existing Sanity document. This is destructive and cannot be undone — only call this AFTER the user has explicitly confirmed they want this specific document deleted (by ID or by a clearly identified title). Use queryFromSanity first to confirm you have the right document.",
  execute: async ({ project, dataset, documentId }) => {
    const target = resolveSanityTarget(project, dataset);

    if (!target.ok) {
      return { error: target.error, status: "error" };
    }

    try {
      await target.client.delete(documentId);

      return {
        dataset: target.dataset,
        documentId,
        project: target.project.name,
        status: "success",
      };
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : "Failed to delete Sanity document",
        status: "error",
      };
    }
  },
  inputSchema: z.object({
    dataset: z
      .string()
      .optional()
      .describe(
        "Target dataset (e.g. 'production' or 'dev'). Defaults to the project's primary dataset if omitted."
      ),
    documentId: z.string().describe("The _id of the document to delete."),
    project: z
      .enum(SANITY_PROJECT_NAMES)
      .describe("Which Sanity project the document lives in."),
  }),
  needsApproval: true,
});
