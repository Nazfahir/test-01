import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';

export default async function PlayPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;

  return <PlaceholderScreen title={`Partida ${roomCode}`} description="Partida de 3 rondas (placeholder)" />;
}
