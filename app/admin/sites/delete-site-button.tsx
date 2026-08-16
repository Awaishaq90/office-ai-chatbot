"use client";

import { Trash2Icon } from "lucide-react";
import { useCallback, useTransition } from "react";
import { toast } from "@/components/chat/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { removeSeoSite } from "../actions";

export function DeleteSiteButton({
  siteId,
  name,
}: {
  siteId: string;
  name: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const result = await removeSeoSite(siteId);

      if (result.status === "error") {
        toast({ description: result.error, type: "error" });
      } else {
        toast({ description: "Site removed.", type: "success" });
      }
    });
  }, [siteId]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          aria-label={`Remove ${name}`}
          disabled={isPending}
          size="icon-sm"
          variant="ghost"
        >
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes its Search Console and Clarity configuration. This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} variant="destructive">
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
