import { tool } from "ai";
import { z } from "zod";
import { getSeoSiteByName } from "@/lib/db/queries";
import { getSearchConsoleAccessToken } from "@/lib/seo/google-auth";

const MAX_ROW_LIMIT = 100;

export const queryFromSearchConsole = tool({
  description:
    "Get Google Search Console performance data (clicks, impressions, CTR, average position) for a site over a date range. Use listSeoSites first if you don't know the exact site name. Read-only, safe to call without approval.",
  execute: async ({ site, startDate, endDate, dimensions, rowLimit }) => {
    const seoSite = await getSeoSiteByName(site);

    if (!seoSite) {
      return {
        error: `Unknown site "${site}". Call listSeoSites to see configured sites.`,
        status: "error",
      };
    }

    if (!seoSite.searchConsoleSiteUrl) {
      return {
        error: `"${site}" doesn't have a Search Console property configured yet.`,
        status: "error",
      };
    }

    try {
      const accessToken = await getSearchConsoleAccessToken();
      const encodedSiteUrl = encodeURIComponent(seoSite.searchConsoleSiteUrl);

      const res = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
        {
          body: JSON.stringify({
            dimensions,
            endDate,
            rowLimit: Math.min(rowLimit, MAX_ROW_LIMIT),
            startDate,
          }),
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      );

      if (!res.ok) {
        const body = await res.text();
        return {
          error: `Search Console API error (${res.status}): ${body}`,
          status: "error",
        };
      }

      const json = await res.json();

      return {
        rows: json.rows ?? [],
        site,
        status: "success",
      };
    } catch (err) {
      return {
        error:
          err instanceof Error ? err.message : "Failed to query Search Console",
        status: "error",
      };
    }
  },
  inputSchema: z.object({
    dimensions: z
      .array(
        z.enum([
          "query",
          "page",
          "country",
          "device",
          "date",
          "searchAppearance",
        ])
      )
      .optional()
      .describe(
        "How to break down the results, e.g. ['query'] for top search queries or ['page'] for top pages."
      ),
    endDate: z.string().describe("End date, YYYY-MM-DD (inclusive)."),
    rowLimit: z
      .number()
      .int()
      .min(1)
      .max(MAX_ROW_LIMIT)
      .default(25)
      .describe("Max rows to return."),
    site: z.string().describe("The site name, as returned by listSeoSites."),
    startDate: z.string().describe("Start date, YYYY-MM-DD."),
  }),
});
