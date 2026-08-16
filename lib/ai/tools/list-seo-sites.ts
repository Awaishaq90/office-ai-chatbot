import { tool } from "ai";
import { z } from "zod";
import { getSeoSites } from "@/lib/db/queries";

export const listSeoSites = tool({
  description:
    "List the sites configured for Search Console and/or Clarity reporting, and which of the two each one has set up. Call this first if you don't already know the exact site name to pass to queryFromSearchConsole or queryFromClarity.",
  execute: async () => {
    const sites = await getSeoSites();

    return {
      sites: sites.map((site) => ({
        hasClarity: Boolean(site.clarityProjectToken),
        hasSearchConsole: Boolean(site.searchConsoleSiteUrl),
        name: site.name,
      })),
      status: "success",
    };
  },
  inputSchema: z.object({}),
});
