import { tool } from "ai";
import { z } from "zod";
import { resolveSanityTarget } from "@/lib/sanity/client";
import { SANITY_PROJECT_NAMES } from "@/lib/sanity/projects";

const MAX_RESULT_CHARS = 100_000;

export const queryFromSanity = tool({
  description:
    "Read existing documents from a Sanity project using a GROQ query. Use this to find a document's _id before calling updateSanityDocument or deleteSanityDocument, or to check what already exists before publishing something new. Read-only — safe to call without user approval. Examples: '*[_type == \"post\"] | order(_createdAt desc)[0...10]{_id, title}' or '*[_id == $id][0]'.",
  execute: async ({ project, dataset, query, params }) => {
    const target = resolveSanityTarget(project, dataset);

    if (!target.ok) {
      return { error: target.error, status: "error" };
    }

    try {
      const result = await target.client.fetch(query, params ?? {});
      let serialized = JSON.stringify(result, null, 2);
      let truncated = false;

      if (serialized.length > MAX_RESULT_CHARS) {
        serialized = `${serialized.slice(0, MAX_RESULT_CHARS)}...`;
        truncated = true;
      }

      return {
        dataset: target.dataset,
        project: target.project.name,
        result: serialized,
        status: "success",
        truncated,
      };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Failed to query Sanity",
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
    params: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        "GROQ query parameters, e.g. { id: '...' } for a $id reference in the query."
      ),
    project: z
      .enum(SANITY_PROJECT_NAMES)
      .describe("Which Sanity project to query."),
    query: z
      .string()
      .describe(
        "A GROQ query string, e.g. '*[_type == \"post\"][0...10]{_id, title, slug}'."
      ),
  }),
});
