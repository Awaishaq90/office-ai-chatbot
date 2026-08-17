"use client";

import { ArrowLeftIcon, PencilIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useCallback, useEffect, useState } from "react";
import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/chat/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type UpdateProjectState, updateProject } from "../actions";
import { DeleteProjectButton } from "./delete-project-button";

export function ProjectHeader({
  projectId,
  name,
  visibility,
  canManage,
}: {
  projectId: string;
  name: string;
  visibility: "public" | "private";
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(visibility === "public");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [state, formAction] = useActionState<UpdateProjectState, FormData>(
    updateProject,
    { status: "idle" }
  );

  useEffect(() => {
    if (state.status === "success") {
      setIsSuccessful(true);
      toast({ description: "Project saved.", type: "success" });
      setOpen(false);
    } else if (state.status === "error") {
      toast({
        description: state.error ?? "Failed to save project.",
        type: "error",
      });
    }
  }, [state]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) {
        setIsPublic(visibility === "public");
        setIsSuccessful(false);
      }
    },
    [visibility]
  );

  const handleVisibilityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsPublic(e.target.checked);
    },
    []
  );

  return (
    <div className="flex flex-col gap-4">
      <Link
        className="flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        href="/"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back to chat
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{name}</h1>
          {canManage ? (
            <Dialog onOpenChange={handleOpenChange} open={open}>
              <DialogTrigger asChild>
                <Button
                  aria-label="Edit project"
                  size="icon-sm"
                  variant="ghost"
                >
                  <PencilIcon className="size-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit project</DialogTitle>
                </DialogHeader>
                <form action={formAction} className="flex flex-col gap-4">
                  <input name="id" type="hidden" value={projectId} />
                  <div className="flex flex-col gap-2">
                    <Label
                      className="font-normal text-muted-foreground"
                      htmlFor="name"
                    >
                      Name
                    </Label>
                    <Input defaultValue={name} id="name" name="name" required />
                  </div>
                  <label
                    className="flex items-center gap-2 text-muted-foreground text-sm"
                    htmlFor="visibility-checkbox"
                  >
                    <input
                      checked={isPublic}
                      id="visibility-checkbox"
                      onChange={handleVisibilityChange}
                      type="checkbox"
                    />
                    Visible to everyone (not just me)
                  </label>
                  <input
                    name="visibility"
                    type="hidden"
                    value={isPublic ? "public" : "private"}
                  />
                  <SubmitButton isSuccessful={isSuccessful}>Save</SubmitButton>
                </form>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
        {canManage ? (
          <DeleteProjectButton projectId={projectId} projectName={name} />
        ) : null}
      </div>

      <p className="text-muted-foreground text-sm">
        {visibility === "public" ? "Visible to everyone" : "Only you"}
        {canManage ? "" : " · view only"}
      </p>

      <Link
        className="flex w-full items-center gap-2 rounded-2xl border border-border/30 bg-card/30 px-4 py-3 text-left text-muted-foreground/60 text-sm transition-colors hover:border-border/50 hover:text-muted-foreground"
        href={`/?project=${projectId}`}
      >
        <SparklesIcon className="size-4" />
        Start a new chat in this project
      </Link>
    </div>
  );
}
