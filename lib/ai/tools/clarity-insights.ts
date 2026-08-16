import { tool } from "ai";
import { z } from "zod";
import { getSeoSiteByName } from "@/lib/db/queries";

const CLARITY_DIMENSIONS = [
  "Browser",
  "Device",
  "Country/Region",
  "OS",
  "Source",
  "Medium",
  "Campaign",
  "Channel",
  "URL",
] as const;

export const queryFromClarity = tool({
  description:
    "Get Microsoft Clarity behavior analytics (traffic, engagement time, scroll depth, rage clicks, dead clicks, etc.) for a site. Use listSeoSites first if you don't know the exact site name. Read-only, safe to call without approval. IMPORTANT limits: only the last 1-3 days of data are available (no historical range), and Clarity allows at most 10 API requests per site per day — don't call this repeatedly for the same site in one conversation.",
  execute: async ({ site, numOfDays, dimension1, dimension2, dimension3 }) => {
    const seoSite = await getSeoSiteByName(site);

    if (!seoSite) {
      return {
        error: `Unknown site "${site}". Call listSeoSites to see configured sites.`,
        status: "error",
      };
    }

    if (!seoSite.clarityProjectToken) {
      return {
        error: `"${site}" doesn't have a Clarity project token configured yet.`,
        status: "error",
      };
    }

    try {
      const params = new URLSearchParams({ numOfDays: String(numOfDays) });
      if (dimension1) {
        params.set("dimension1", dimension1);
      }
      if (dimension2) {
        params.set("dimension2", dimension2);
      }
      if (dimension3) {
        params.set("dimension3", dimension3);
      }

      const res = await fetch(
        `https://www.clarity.ms/export-data/api/v1/project-live-insights?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${seoSite.clarityProjectToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const body = await res.text();
        return {
          error: `Clarity API error (${res.status}): ${body}`,
          status: "error",
        };
      }

      const json = await res.json();

      return {
        insights: json,
        site,
        status: "success",
      };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Failed to query Clarity",
        status: "error",
      };
    }
  },
  inputSchema: z.object({
    dimension1: z
      .enum(CLARITY_DIMENSIONS)
      .optional()
      .describe("First dimension to break down insights by."),
    dimension2: z.enum(CLARITY_DIMENSIONS).optional(),
    dimension3: z.enum(CLARITY_DIMENSIONS).optional(),
    numOfDays: z
      .union([z.literal(1), z.literal(2), z.literal(3)])
      .default(3)
      .describe(
        "How many of the last days to cover (max 3 — Clarity has no longer history via this API)."
      ),
    site: z.string().describe("The site name, as returned by listSeoSites."),
  }),
});
