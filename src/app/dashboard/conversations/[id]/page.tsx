import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getUser } from "@/lib/auth";
import { getMessagesForConversation } from "@/lib/chat/conversations";
import { getStaffConversation } from "@/lib/chat/staff";
import { StaffChatScreen } from "@/components/chat/staff-chat-screen";

export const metadata: Metadata = {
  title: "Conversation — OnePlace",
};

export default async function StaffConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { id } = await params;
  const conversation = await getStaffConversation(id);
  if (!conversation) {
    notFound();
  }

  const messages = await getMessagesForConversation(id);

  return (
    <StaffChatScreen
      conversationId={conversation.id}
      businessId={conversation.businessId}
      businessName={conversation.businessName}
      customerName={conversation.customerName}
      initialStatus={conversation.status}
      initialMessages={messages}
    />
  );
}
