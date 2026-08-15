import { markdownToPortableText } from "@portabletext/markdown";
import { tool } from "ai";
import { z } from "zod";
import { resolveSanityTarget } from "@/lib/sanity/client";
import { SANITY_PROJECT_NAMES } from "@/lib/sanity/projects";

export const updateSanityDocument = tool({
  description:
    "Update fields on an EXISTING Sanity document. Only call this AFTER the user has seen the proposed changes in chat and explicitly approved them — never call it speculatively. Use queryFromSanity first to find the document's _id if you don't already have it. Only the fields you provide are changed; everything else on the document is left untouched.",
  execute: async ({
    project,
    dataset,
    documentId,
    title,
    slug,
    body,
    fields,
  }) => {
    const target = resolveSanityTarget(project, dataset);

    if (!target.ok) {
      return { error: target.error, status: "error" };
    }

    const set: Record<string, unknown> = { ...fields };
    if (title !== undefined) {
      set.title = title;
    }
    if (slug !== undefined) {
      set.slug = { _type: "slug", current: slug };
    }
    if (body !== undefined) {
      set.body = markdownToPortableText(body);
    }

    if (Object.keys(set).length === 0) {
      return {
        error:
          "No fields provided to update. Supply at least one of title, slug, body, or fields.",
        status: "error",
      };
    }

    try {
      const updated = await target.client.patch(documentId).set(set).commit();

      return {
        dataset: target.dataset,
        documentId: updated._id,
        project: target.project.name,
        status: "success",
        updatedFields: Object.keys(set),
      };
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : "Failed to update Sanity document",
        status: "error",
      };
    }
  },
  inputSchema: z.object({
    body: z
      .string()
      .optional()
      .describe(
        "Replacement body content, written in Markdown. Converted to Portable Text automatically."
      ),
    dataset: z
      .string()
      .optional()
      .describe(
        "Target dataset (e.g. 'production' or 'dev'). Defaults to the project's primary dataset if omitted."
      ),
    documentId: z.string().describe("The _id of the document to update."),
    fields: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Any other schema fields to set, beyond title/slug/body."),
    project: z
      .enum(SANITY_PROJECT_NAMES)
      .describe("Which Sanity project the document lives in."),
    slug: z.string().optional().describe("Replacement URL slug."),
    title: z.string().optional().describe("Replacement title."),
  }),
  needsApproval: true,
});
