import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSeoSites } from "@/lib/db/queries";
import { DeleteSiteButton } from "./delete-site-button";
import { SiteDialog } from "./site-dialog";

export default async function AdminSitesPage() {
  const sites = await getSeoSites();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-base">Sites</h2>
          <p className="text-muted-foreground text-sm">
            Search Console and Clarity configuration per site, used by the AI's
            reporting tools in chat. Adding a new site here doesn't require any
            code change or redeploy.
          </p>
        </div>
        <SiteDialog trigger={<Button size="sm">Add site</Button>} />
      </div>

      <div className="overflow-hidden rounded-lg border border-border/50">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-normal">Name</th>
              <th className="px-4 py-2 font-normal">Search Console</th>
              <th className="px-4 py-2 font-normal">Clarity</th>
              <th className="px-4 py-2 font-normal" />
            </tr>
          </thead>
          <tbody>
            {sites.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-muted-foreground"
                  colSpan={4}
                >
                  No sites configured yet.
                </td>
              </tr>
            ) : (
              sites.map((site) => (
                <tr className="border-border/50 border-t" key={site.id}>
                  <td className="px-4 py-2">{site.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {site.searchConsoleSiteUrl ? "✓" : "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {site.clarityProjectToken ? "✓" : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      <SiteDialog
                        site={site}
                        trigger={
                          <Button
                            aria-label={`Edit ${site.name}`}
                            size="icon-sm"
                            variant="ghost"
                          >
                            <PencilIcon />
                          </Button>
                        }
                      />
                      <DeleteSiteButton name={site.name} siteId={site.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
