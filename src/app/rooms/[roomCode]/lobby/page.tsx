import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';

export default async function LobbyPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;

  return <PlaceholderScreen title={`Lobby ${roomCode}`} description="Lobby de participantes (placeholder)" />;
}
