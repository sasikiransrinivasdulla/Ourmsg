import ChatRoom from '@/components/ChatRoom';

export default async function UnitChatPage({ params }) {
  const { subject, unit } = await params;
  
  const roomName = `${subject}-${unit}`;
  const title = `${subject.toUpperCase()} - ${unit}`;

  return (
    <ChatRoom 
      room={roomName} 
      title={title} 
      backLink={`/academics/${subject}`} 
    />
  );
}
