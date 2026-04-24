import ChatRoom from '@/components/ChatRoom';

export default function CasualChatPage() {
  return (
    <ChatRoom 
      room="casual" 
      title="Casual Chat" 
      backLink="/dashboard" 
    />
  );
}
