import { format } from "date-fns";
import { MessageSquareIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import {
  getChatsByProjectId,
  getProjectById,
  getProjectKnowledgeFiles,
} from "@/lib/db/queries";
import { KnowledgeFiles } from "./knowledge-files";
import { ProjectHeader } from "./project-header";
import { ProjectTextCard } from "./project-text-card";

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

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-5xl grid-cols-1 gap-8 p-8 md:grid-cols-[minmax(0,1fr)_320px] md:p-12">
      <div className="flex min-w-0 flex-col gap-8">
        <ProjectHeader
          canManage={canManage}
          name={proj.name}
          projectId={id}
          visibility={proj.visibility}
        />

        <div className="flex flex-col gap-2">
          <h2 className="font-medium text-base">Recents</h2>
          {chats.length === 0 ? (
            <p className="text-muted-foreground text-sm">No chats yet.</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <Link
                    className="flex min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
                    href={`/chat/${chat.id}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <MessageSquareIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-foreground/80">
                        {chat.title}
                      </span>
                    </span>
                    <span className="shrink-0 text-muted-foreground text-xs">
                      {format(new Date(chat.createdAt), "MMM d")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <ProjectTextCard
          canManage={canManage}
          emptyText="Nothing remembered yet."
          field="memory"
          helperText="Maintained automatically by the AI as it learns durable facts about this project."
          label="Memory"
          placeholder="Nothing remembered yet — this fills in automatically as you chat."
          projectId={id}
          value={proj.memory ?? ""}
        />

        <ProjectTextCard
          canManage={canManage}
          emptyText="No instructions set."
          field="instructions"
          label="Instructions"
          placeholder="Tone, rules, and context every chat in this project should follow..."
          projectId={id}
          value={proj.instructions ?? ""}
        />

        <KnowledgeFiles canManage={canManage} files={files} projectId={id} />
      </div>
    </div>
  );
}
