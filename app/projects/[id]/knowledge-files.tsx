"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "@/components/chat/toast";
import { Button } from "@/components/ui/button";
import type { ProjectKnowledgeFile } from "@/lib/db/schema";

const CONTENT_TYPE_BADGES: Record<string, string> = {
  "application/pdf": "PDF",
  "text/markdown": "MD",
  "text/plain": "TXT",
};

function fileMeta(file: ProjectKnowledgeFile): string {
  if (!file.extractedText) {
    return "Not readable";
  }

  if (file.contentType === "application/pdf") {
    return "Extracted";
  }

  const lines = file.extractedText.split("\n").length;
  return `${lines} line${lines === 1 ? "" : "s"}`;
}

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
        <span className="font-medium text-sm">Files</span>
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
              aria-label="Upload file"
              disabled={isUploading}
              onClick={handleUploadClick}
              size="icon-sm"
              variant="ghost"
            >
              <PlusIcon className="size-4" />
            </Button>
          </>
        ) : null}
      </div>

      {files.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No files yet. Upload .txt, .md, or .pdf files for the AI to reference
          in every chat in this project.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {files.map((file) => (
            <KnowledgeFileCard
              canManage={canManage}
              file={file}
              isDeleting={deletingId === file.id}
              key={file.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KnowledgeFileCard({
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
    <div className="group relative flex flex-col gap-2 rounded-lg border border-border/40 bg-card/40 p-3">
      {canManage ? (
        <Button
          aria-label={`Remove ${file.name}`}
          className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100"
          disabled={isDeleting}
          onClick={handleClick}
          size="icon-sm"
          variant="ghost"
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      ) : null}
      <span className="truncate pr-6 font-medium text-sm">{file.name}</span>
      <span className="text-muted-foreground text-xs">{fileMeta(file)}</span>
      <span className="w-fit rounded border border-border/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
        {CONTENT_TYPE_BADGES[file.contentType] ?? "FILE"}
      </span>
    </div>
  );
}
