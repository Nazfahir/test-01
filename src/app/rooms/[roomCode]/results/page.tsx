import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';

export default async function ResultsPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;

  return <PlaceholderScreen title={`Resultados ${roomCode}`} description="Vínculo y moneda visual (placeholder)" />;
}
