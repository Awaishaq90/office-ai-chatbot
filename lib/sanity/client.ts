import { createClient, type SanityClient } from "@sanity/client";

const API_VERSION = "2024-01-01";

/**
 * A single org-wide token (Editor role or personal auth token) is used for
 * every project in `lib/sanity/projects.ts`. If per-project isolation is
 * ever needed, swap this for a projectId -> token lookup instead.
 */
export function getSanityWriteClient(
  projectId: string,
  dataset: string
): SanityClient {
  const token = process.env.SANITY_API_TOKEN;

  if (!token) {
    throw new Error(
      "SANITY_API_TOKEN is not configured. Add it to your environment variables."
    );
  }

  return createClient({
    apiVersion: API_VERSION,
    dataset,
    projectId,
    token,
    useCdn: false,
  });
}
