import { auth } from "@/app/(auth)/auth";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { convertToUIMessages } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const [session, chat] = await Promise.all([
    auth(),
    getChatById({ id: chatId }),
  ]);

  const isOwner = Boolean(session?.user && session.user.id === chat?.userId);

  // Treat "doesn't exist" and "exists but private, not yours" the same way
  // — a private chat you can't access shouldn't reveal that it exists.
  if (!chat || (chat.visibility === "private" && !isOwner)) {
    return new ChatbotError("not_found:chat").toResponse();
  }

  const messages = await getMessagesByChatId({ id: chatId });

  return Response.json(
    {
      isReadonly: !isOwner,
      messages: convertToUIMessages(messages),
      userId: chat.userId,
      visibility: chat.visibility,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
