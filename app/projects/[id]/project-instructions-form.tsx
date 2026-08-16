"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/chat/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type UpdateProjectState, updateProject } from "../actions";

export function ProjectInstructionsForm({
  projectId,
  initialName,
  initialInstructions,
  initialVisibility,
  canManage,
}: {
  projectId: string;
  initialName: string;
  initialInstructions: string;
  initialVisibility: "public" | "private";
  canManage: boolean;
}) {
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isPublic, setIsPublic] = useState(initialVisibility === "public");
  const [state, formAction] = useActionState<UpdateProjectState, FormData>(
    updateProject,
    { status: "idle" }
  );

  useEffect(() => {
    if (state.status === "success") {
      setIsSuccessful(true);
      toast({ description: "Project saved.", type: "success" });
    } else if (state.status === "error") {
      toast({
        description: state.error ?? "Failed to save project.",
        type: "error",
      });
    }
  }, [state]);

  const handleSubmit = useCallback(() => {
    setIsSuccessful(false);
  }, []);

  const handleVisibilityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsPublic(e.target.checked);
    },
    []
  );

  if (!canManage) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border/50 p-4">
        <div>
          <Label className="font-normal text-muted-foreground">
            Instructions
          </Label>
          <p className="mt-1 whitespace-pre-wrap text-sm">
            {initialInstructions || "No instructions set."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-border/50 p-4"
      onSubmit={handleSubmit}
    >
      <input name="id" type="hidden" value={projectId} />
      <div className="flex flex-col gap-2">
        <Label className="font-normal text-muted-foreground" htmlFor="name">
          Name
        </Label>
        <Input defaultValue={initialName} id="name" name="name" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label
          className="font-normal text-muted-foreground"
          htmlFor="instructions"
        >
          Instructions
        </Label>
        <Textarea
          defaultValue={initialInstructions}
          id="instructions"
          name="instructions"
          placeholder="Tone, rules, and context every chat in this project should follow..."
          rows={8}
        />
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
  );
}
