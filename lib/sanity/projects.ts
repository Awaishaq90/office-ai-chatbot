export type SanityProject = {
  /** Human-friendly name shown in chat and picked by the model. */
  name: string;
  projectId: string;
  /** Datasets that exist on this project, in preference order. */
  datasets: string[];
};

/**
 * Registry of Sanity projects in the organization. Pulled from
 * `sanity.io/manage` (org o5v3TcQri) — update here if projects/datasets
 * are added, renamed, or removed.
 */
export const SANITY_PROJECTS: SanityProject[] = [
  { datasets: ["dev"], name: "Time Technologies Site", projectId: "q4lg9c3x" },
  {
    datasets: ["production", "dev"],
    name: "Centaurus Academy",
    projectId: "b00pjm37",
  },
  { datasets: ["production"], name: "zahid-law", projectId: "6xhidle3" },
  {
    datasets: ["production", "dev"],
    name: "Rooter Website",
    projectId: "zd6jmjpm",
  },
  {
    datasets: ["production", "dev"],
    name: "Mirha Exams",
    projectId: "i1e9rwuo",
  },
  {
    datasets: ["production", "production-comments"],
    name: "Mirha CRM",
    projectId: "xqecxbcp",
  },
  { datasets: ["production"], name: "Mirha-Exams", projectId: "c6jbkea5" },
  { datasets: ["production"], name: "Athemiq", projectId: "ta87x98b" },
  {
    datasets: ["production"],
    name: "Apexity Technologies",
    projectId: "i0ew7ih6",
  },
  { datasets: ["production"], name: "Redaction", projectId: "0edw530a" },
  {
    datasets: ["production"],
    name: "Marketing Landing Page",
    projectId: "y0cfvqi7",
  },
  { datasets: ["production"], name: "Meridian Law", projectId: "lkrezp2i" },
];

export const SANITY_PROJECT_NAMES = SANITY_PROJECTS.map((p) => p.name) as [
  string,
  ...string[],
];

export function getSanityProject(name: string): SanityProject | undefined {
  return SANITY_PROJECTS.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}

export function resolveDataset(
  project: SanityProject,
  requested?: string
): string | null {
  if (!requested) {
    return project.datasets[0] ?? null;
  }
  const match = project.datasets.find(
    (d) => d.toLowerCase() === requested.toLowerCase()
  );
  return match ?? null;
}
