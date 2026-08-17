"use client";

import { PencilIcon } from "lucide-react";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { type UpdateProjectState, updateProject } from "../actions";

export function ProjectTextCard({
  projectId,
  field,
  label,
  helperText,
  placeholder,
  emptyText,
  value,
  canManage,
}: {
  projectId: string;
  field: "instructions" | "memory";
  label: string;
  helperText?: string;
  placeholder: string;
  emptyText: string;
  value: string;
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [state, formAction] = useActionState<UpdateProjectState, FormData>(
    updateProject,
    { status: "idle" }
  );
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.status === "success") {
      setIsSuccessful(true);
      toast({ description: `${label} saved.`, type: "success" });
      setOpen(false);
      successTimeoutRef.current = setTimeout(() => {
        setIsSuccessful(false);
      }, 1000);
    } else if (state.status === "error") {
      toast({
        description: state.error ?? `Failed to save ${label.toLowerCase()}.`,
        type: "error",
      });
    }

    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, [state, label]);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
  }, []);

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/50 p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{label}</span>
        {canManage ? (
          <Dialog onOpenChange={handleOpenChange} open={open}>
            <DialogTrigger asChild>
              <Button
                aria-label={`Edit ${label}`}
                size="icon-sm"
                variant="ghost"
              >
                <PencilIcon className="size-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit {label}</DialogTitle>
              </DialogHeader>
              <form action={formAction} className="flex flex-col gap-4">
                <input name="id" type="hidden" value={projectId} />
                <Textarea
                  defaultValue={value}
                  name={field}
                  placeholder={placeholder}
                  rows={10}
                />
                <SubmitButton isSuccessful={isSuccessful}>Save</SubmitButton>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
      {helperText ? (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      ) : null}
      <p className="line-clamp-4 whitespace-pre-wrap text-muted-foreground text-sm">
        {value || emptyText}
      </p>
    </div>
  );
}
