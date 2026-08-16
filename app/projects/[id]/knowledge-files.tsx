"use client";

import { FileTextIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "@/components/chat/toast";
import { Button } from "@/components/ui/button";
import type { ProjectKnowledgeFile } from "@/lib/db/schema";

export function KnowledgeFiles({
  projectId,
  files,
  canManage,
}: {
  projectId: string;
  files: ProjectKnowledgeFile[];
  canManage: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUploadClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/projects/${projectId}/knowledge`,
          { body: formData, method: "POST" }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          toast({
            description: body?.error ?? "Upload failed.",
            type: "error",
          });
          return;
        }

        toast({ description: "File uploaded.", type: "success" });
        router.refresh();
      } finally {
        setIsUploading(false);
      }
    },
    [projectId, router]
  );

  const handleDelete = useCallback(
    async (fileId: string) => {
      setDeletingId(fileId);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/projects/${projectId}/knowledge?fileId=${fileId}`,
          { method: "DELETE" }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          toast({
            description: body?.error ?? "Failed to delete file.",
            type: "error",
          });
          return;
        }

        toast({ description: "File removed.", type: "success" });
        router.refresh();
      } finally {
        setDeletingId(null);
      }
    },
    [projectId, router]
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/50 p-4">
      <div className="flex items-center justify-between">
        <Label>Knowledge files</Label>
        {canManage ? (
          <>
            <input
              accept=".txt,.md,application/pdf,text/plain,text/markdown"
              className="hidden"
              onChange={handleFileChange}
              ref={inputRef}
              type="file"
            />
            <Button
              disabled={isUploading}
              onClick={handleUploadClick}
              size="sm"
              variant="outline"
            >
              <UploadIcon />
              {isUploading ? "Uploading..." : "Upload file"}
            </Button>
          </>
        ) : null}
      </div>

      {files.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No knowledge files yet. Upload .txt, .md, or .pdf files for the AI to
          reference in every chat in this project.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {files.map((file) => (
            <KnowledgeFileRow
              canManage={canManage}
              file={file}
              isDeleting={deletingId === file.id}
              key={file.id}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function KnowledgeFileRow({
  file,
  canManage,
  isDeleting,
  onDelete,
}: {
  file: ProjectKnowledgeFile;
  canManage: boolean;
  isDeleting: boolean;
  onDelete: (fileId: string) => void;
}) {
  const handleClick = useCallback(() => {
    onDelete(file.id);
  }, [file.id, onDelete]);

  return (
    <li className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50">
      <div className="flex min-w-0 items-center gap-2">
        <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{file.name}</span>
        {!file.extractedText && (
          <span className="shrink-0 text-muted-foreground text-xs">
            (not readable — stored but not used as context)
          </span>
        )}
      </div>
      {canManage ? (
        <Button
          aria-label={`Remove ${file.name}`}
          disabled={isDeleting}
          onClick={handleClick}
          size="icon-sm"
          variant="ghost"
        >
          <Trash2Icon />
        </Button>
      ) : null}
    </li>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-normal text-muted-foreground text-sm">
      {children}
    </span>
  );
}
