"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { AuthForm } from "@/components/chat/auth-form";
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
import { type AddUserState, addUser } from "../actions";

export function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [state, formAction] = useActionState<AddUserState, FormData>(addUser, {
    status: "idle",
  });

  useEffect(() => {
    if (state.status === "success") {
      setIsSuccessful(true);
      toast({ description: "User added.", type: "success" });
      setOpen(false);
    } else if (state.status === "error") {
      toast({
        description: state.error ?? "Failed to add user.",
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
      <DialogTrigger asChild>
        <Button size="sm">Add user</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>
        <AuthForm action={formAction}>
          <SubmitButton isSuccessful={isSuccessful}>Add user</SubmitButton>
        </AuthForm>
      </DialogContent>
    </Dialog>
  );
}
