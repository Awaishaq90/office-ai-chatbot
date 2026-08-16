import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function Page() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="text-sm text-muted-foreground">
        Sign in to your account to continue
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
