import ChatPageClient from "@/components/chat/ChatPageClient";

type ChatPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;
  return <ChatPageClient initialConversationId={id} />;
}
