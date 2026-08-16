CREATE TABLE IF NOT EXISTS "Usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
  "modelId" text NOT NULL,
  "inputTokens" integer NOT NULL DEFAULT 0,
  "outputTokens" integer NOT NULL DEFAULT 0,
  "estimatedCostUsd" double precision,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
