import { markdownToPortableText } from "@portabletext/markdown";
import { tool } from "ai";
import { z } from "zod";
import { getSanityWriteClient } from "@/lib/sanity/client";
import {
  getSanityProject,
  resolveDataset,
  SANITY_PROJECT_NAMES,
} from "@/lib/sanity/projects";

export const publishToSanity = tool({
  description:
    "Publish approved, user-reviewed content as a document into a Sanity project. Only call this AFTER the user has seen the drafted content in chat and explicitly approved publishing it — never call it as part of drafting. Body content should be written in Markdown; it is converted to Portable Text automatically.",
  execute: async ({ project, dataset, docType, title, slug, body, fields }) => {
    const projectConfig = getSanityProject(project);

    if (!projectConfig) {
      return {
        error: `Unknown project "${project}". Available projects: ${SANITY_PROJECT_NAMES.join(", ")}`,
        status: "error",
      };
    }

    const resolvedDataset = resolveDataset(projectConfig, dataset);

    if (!resolvedDataset) {
      return {
        error: `Dataset "${dataset}" does not exist on ${projectConfig.name}. Available datasets: ${projectConfig.datasets.join(", ")}`,
        status: "error",
      };
    }

    try {
      const client = getSanityWriteClient(
        projectConfig.projectId,
        resolvedDataset
      );

      const document = await client.create({
        _type: docType,
        body: markdownToPortableText(body),
        slug: slug ? { _type: "slug", current: slug } : undefined,
        title,
        ...fields,
      });

      return {
        dataset: resolvedDataset,
        documentId: document._id,
        project: projectConfig.name,
        projectId: projectConfig.projectId,
        status: "success",
      };
    } catch (err) {
      return {
        error:
          err instanceof Error ? err.message : "Failed to publish to Sanity",
        status: "error",
      };
    }
  },
  inputSchema: z.object({
    body: z
      .string()
      .describe(
        "The main content, written in Markdown. Converted to Portable Text automatically."
      ),
    dataset: z
      .string()
      .optional()
      .describe(
        "Target dataset (e.g. 'production' or 'dev'). Defaults to the project's primary dataset (usually 'production') if omitted — always confirm with the user which dataset they want when it's ambiguous."
      ),
    docType: z
      .string()
      .default("post")
      .describe("Sanity schema document type, e.g. 'post', 'article', 'page'."),
    fields: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        "Any additional schema fields beyond title/slug/body (e.g. excerpt, category, author reference)."
      ),
    project: z
      .enum(SANITY_PROJECT_NAMES)
      .describe("Which Sanity project to publish into."),
    slug: z
      .string()
      .optional()
      .describe("URL slug for the document, if the schema uses one."),
    title: z.string().describe("Document title."),
  }),
  needsApproval: true,
});
