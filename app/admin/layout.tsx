import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (session?.user?.type !== "admin") {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 p-8 md:p-12">
      <div className="flex flex-col gap-4">
        <Link
          className="flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          href="/"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to chat
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
          <nav className="flex gap-1 text-sm">
            <Link
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              href="/admin/users"
            >
              Users
            </Link>
            <Link
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              href="/admin/usage"
            >
              Usage
            </Link>
            <Link
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              href="/admin/sites"
            >
              Sites
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
