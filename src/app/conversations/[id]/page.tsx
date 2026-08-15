import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getUser } from "@/lib/auth";
import {
  getConversationForCustomer,
  getMessagesForConversation,
} from "@/lib/chat/conversations";
import { ChatScreen } from "@/components/chat/chat-screen";

export const metadata: Metadata = {
  title: "Chat — One Place",
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/conversations");
  }

  const { id } = await params;
  const conversation = await getConversationForCustomer(id);
  if (!conversation) {
    notFound();
  }

  const messages = await getMessagesForConversation(id);

  return (
    <ChatScreen
      conversationId={conversation.id}
      businessName={conversation.businessName}
      businessSlug={conversation.businessSlug}
      initialStatus={conversation.status}
      initialMessages={messages}
    />
  );
}
