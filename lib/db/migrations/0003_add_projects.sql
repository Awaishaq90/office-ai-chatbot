CREATE TABLE IF NOT EXISTS "Project" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "name" text NOT NULL,
  "instructions" text,
  "visibility" varchar NOT NULL DEFAULT 'private',
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ProjectKnowledgeFile" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL REFERENCES "Project"("id"),
  "name" text NOT NULL,
  "url" text NOT NULL,
  "contentType" text NOT NULL,
  "extractedText" text,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "projectId" uuid REFERENCES "Project"("id");
