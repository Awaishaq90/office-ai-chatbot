"use client";

import type { ReactNode } from "react";
import { useActionState, useCallback, useEffect, useState } from "react";
import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/chat/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type SiteState, saveSeoSite } from "../actions";

type SiteDialogProps = {
  trigger: ReactNode;
  site?: {
    id: string;
    name: string;
    searchConsoleSiteUrl: string | null;
    clarityProjectToken: string | null;
  };
};

export function SiteDialog({ trigger, site }: SiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [state, formAction] = useActionState<SiteState, FormData>(saveSeoSite, {
    status: "idle",
  });

  useEffect(() => {
    if (state.status === "success") {
      setIsSuccessful(true);
      toast({ description: "Site saved.", type: "success" });
      setOpen(false);
    } else if (state.status === "error") {
      toast({
        description: state.error ?? "Failed to save site.",
        type: "error",
      });
    }
  }, [state]);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (next) {
      setIsSuccessful(false);
    }
  }, []);

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{site ? "Edit site" : "Add site"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {site ? <input name="id" type="hidden" value={site.id} /> : null}
          <div className="flex flex-col gap-2">
            <Label className="font-normal text-muted-foreground" htmlFor="name">
              Name
            </Label>
            <Input
              defaultValue={site?.name}
              id="name"
              name="name"
              placeholder="e.g. Rooter Website"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              className="font-normal text-muted-foreground"
              htmlFor="searchConsoleSiteUrl"
            >
              Search Console site URL (optional)
            </Label>
            <Input
              defaultValue={site?.searchConsoleSiteUrl ?? ""}
              id="searchConsoleSiteUrl"
              name="searchConsoleSiteUrl"
              placeholder="https://example.com/ or sc-domain:example.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              className="font-normal text-muted-foreground"
              htmlFor="clarityProjectToken"
            >
              Clarity API token (optional)
            </Label>
            <Input
              defaultValue={site?.clarityProjectToken ?? ""}
              id="clarityProjectToken"
              name="clarityProjectToken"
              placeholder="from Clarity → Settings → Data Export"
              type="password"
            />
          </div>
          <SubmitButton isSuccessful={isSuccessful}>Save site</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
