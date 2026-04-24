import ChatRoom from '@/components/ChatRoom';

export default function NaughtyChatPage() {
  return (
    <ChatRoom 
      room="naughty" 
      title="Private Space 🌙" 
      theme="naughty"
      backLink="/dashboard" 
    />
  );
}
