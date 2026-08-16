"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useCallback, useEffect, useState } from "react";

import { AuthForm } from "@/components/chat/auth-form";
import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/chat/toast";
import { type LoginActionState, login } from "../actions";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    { status: "idle" }
  );

  const { update: updateSession } = useSession();

  // biome-ignore lint/correctness/useExhaustiveDependencies: router, searchParams, and updateSession are stable refs
  useEffect(() => {
    if (state.status === "failed") {
      toast({ description: "Invalid credentials!", type: "error" });
    } else if (state.status === "invalid_data") {
      toast({
        description: "Failed validating your submission!",
        type: "error",
      });
    } else if (state.status === "success") {
      setIsSuccessful(true);
      updateSession();
      const redirectUrl = searchParams.get("redirectUrl");
      router.push(
        redirectUrl?.startsWith("/") && !redirectUrl.startsWith("//")
          ? redirectUrl
          : "/"
      );
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = useCallback(
    (formData: FormData) => {
      setEmail(formData.get("email") as string);
      formAction(formData);
    },
    [formAction]
  );

  return (
    <AuthForm action={handleSubmit} defaultEmail={email}>
      <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
    </AuthForm>
  );
}
