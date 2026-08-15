import { createClient, type SanityClient } from "@sanity/client";
import {
  getSanityProject,
  resolveDataset,
  SANITY_PROJECT_NAMES,
  type SanityProject,
} from "./projects";

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

export type SanityTarget =
  | { ok: true; client: SanityClient; project: SanityProject; dataset: string }
  | { ok: false; error: string };

/** Resolves a project/dataset pair (as named by the model) into a ready-to-use client. */
export function resolveSanityTarget(
  projectName: string,
  requestedDataset?: string
): SanityTarget {
  const project = getSanityProject(projectName);

  if (!project) {
    return {
      error: `Unknown project "${projectName}". Available projects: ${SANITY_PROJECT_NAMES.join(", ")}`,
      ok: false,
    };
  }

  const dataset = resolveDataset(project, requestedDataset);

  if (!dataset) {
    return {
      error: `Dataset "${requestedDataset}" does not exist on ${project.name}. Available datasets: ${project.datasets.join(", ")}`,
      ok: false,
    };
  }

  return {
    client: getSanityWriteClient(project.projectId, dataset),
    dataset,
    ok: true,
    project,
  };
}
