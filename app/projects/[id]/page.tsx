import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { Button } from "@/components/ui/button";
import {
  getChatsByProjectId,
  getProjectById,
  getProjectKnowledgeFiles,
} from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";
import { DeleteProjectButton } from "./delete-project-button";
import { KnowledgeFiles } from "./knowledge-files";
import { ProjectInstructionsForm } from "./project-instructions-form";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense>
      <ProjectPageContent params={params} />
    </Suspense>
  );
}

async function ProjectPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const proj = await getProjectById(id);

  if (!proj) {
    notFound();
  }

  const isOwner = proj.userId === session.user.id;
  const isAdmin = session.user.type === "admin";
  const canView = isOwner || isAdmin || proj.visibility === "public";

  if (!canView) {
    notFound();
  }

  const canManage = isOwner || isAdmin;

  const [files, chats] = await Promise.all([
    getProjectKnowledgeFiles(id),
    getChatsByProjectId({ projectId: id }),
  ]);

  const newChatId = generateUUID();

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
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {proj.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {proj.visibility === "public" ? "Visible to everyone" : "Private"}
              {canManage ? "" : " · view only"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href={`/chat/${newChatId}?project=${id}`}>
                New chat in this project
              </Link>
            </Button>
            {canManage ? (
              <DeleteProjectButton projectId={id} projectName={proj.name} />
            ) : null}
          </div>
        </div>
      </div>

      <ProjectInstructionsForm
        canManage={canManage}
        initialInstructions={proj.instructions ?? ""}
        initialName={proj.name}
        initialVisibility={proj.visibility}
        projectId={id}
      />

      <KnowledgeFiles canManage={canManage} files={files} projectId={id} />

      <div className="flex flex-col gap-2">
        <h2 className="font-medium text-base">Chats in this project</h2>
        {chats.length === 0 ? (
          <p className="text-muted-foreground text-sm">No chats yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {chats.map((chat) => (
              <li key={chat.id}>
                <Link
                  className="text-foreground/80 text-sm hover:underline"
                  href={`/chat/${chat.id}`}
                >
                  {chat.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
