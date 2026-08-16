"use client";

import { FolderIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useCallback, useState } from "react";
import useSWR from "swr";
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
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Project } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";
import { toast } from "./toast";

export function SidebarProjects({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, mutate } = useSWR<{ projects: Project[] }>(
    user ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/projects` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const closeMobile = useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/projects`,
        {
          body: JSON.stringify({ name, visibility }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast({
          description: body?.error ?? "Failed to create project.",
          type: "error",
        });
        return;
      }

      const created = await res.json();
      setOpen(false);
      setName("");
      setVisibility("private");
      mutate();
      closeMobile();
      router.push(`/projects/${created.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [name, visibility, mutate, closeMobile, router]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
    },
    []
  );

  const handleVisibilityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVisibility(e.target.checked ? "public" : "private");
    },
    []
  );

  if (!user) {
    return null;
  }

  const projects = data?.projects ?? [];

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogTrigger asChild>
          <SidebarGroupAction title="New project">
            <PlusIcon />
            <span className="sr-only">New project</span>
          </SidebarGroupAction>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label
                className="font-normal text-muted-foreground"
                htmlFor="project-name"
              >
                Name
              </Label>
              <Input
                id="project-name"
                onChange={handleNameChange}
                placeholder="e.g. Meridian Law"
                value={name}
              />
            </div>
            <label
              className="flex items-center gap-2 text-muted-foreground text-sm"
              htmlFor="project-visibility"
            >
              <input
                checked={visibility === "public"}
                id="project-visibility"
                onChange={handleVisibilityChange}
                type="checkbox"
              />
              Visible to everyone (not just me)
            </label>
            <Button
              disabled={isSubmitting || !name.trim()}
              onClick={handleCreate}
              type="button"
            >
              Create project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SidebarGroupContent>
        {isLoading ? (
          <div className="flex flex-col gap-0.5 px-1">
            {[60, 40].map((w) => (
              <div
                className="flex h-8 items-center gap-2 rounded-lg px-2"
                key={w}
              >
                <div
                  className="h-3 flex-1 animate-pulse rounded-md bg-sidebar-foreground/[0.06]"
                  style={{ maxWidth: `${w}%` }}
                />
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && projects.length === 0 ? (
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 py-2 text-[13px] text-sidebar-foreground/60">
            No projects yet
          </div>
        ) : null}

        {!isLoading && projects.length > 0 ? (
          <SidebarMenu>
            {projects.map((proj) => (
              <SidebarMenuItem key={proj.id}>
                <SidebarMenuButton
                  asChild
                  className="h-8 rounded-none text-[13px] text-sidebar-foreground/50 transition-all duration-150 hover:bg-transparent hover:text-sidebar-foreground data-[active=true]:font-medium data-[active=true]:text-sidebar-foreground"
                  isActive={pathname === `/projects/${proj.id}`}
                >
                  <Link href={`/projects/${proj.id}`} onClick={closeMobile}>
                    <FolderIcon className="size-3.5" />
                    <span className="truncate">{proj.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        ) : null}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
