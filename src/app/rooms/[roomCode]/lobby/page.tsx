import Link from 'next/link';
import { getSupabaseServiceRoleClient } from '@/lib/supabaseServer';
import { Card } from '@/components/ui/Card';

export default async function LobbyPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  const normalizedRoomCode = roomCode.toUpperCase();
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/rooms/${normalizedRoomCode}`;

  const supabase = getSupabaseServiceRoleClient();
  const { data: room } = await supabase
    .from('rooms')
    .select('id, room_code')
    .eq('room_code', normalizedRoomCode)
    .maybeSingle();

  const { count: participants } = await supabase
    .from('room_participants')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room?.id ?? '')
    .is('left_at', null);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold text-primary">Lobby de sala</h1>
      <p className="text-sm text-gray-600">Todo listo. Comparte y esperen al resto del grupo 🚀</p>

      <Card>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            Código: <strong>{normalizedRoomCode}</strong>
          </p>
          <p>Participantes conectados: {participants ?? 0}</p>
          <p className="break-all">
            Link de invitación: <span className="font-medium">{inviteLink}</span>
          </p>
          <p className="text-xs text-gray-500">QR: placeholder técnico (pendiente render visual).</p>
        </div>
      </Card>

      <Link className="text-sm font-medium text-primary underline" href="/rooms/join">
        Usar otro código
      </Link>
    </main>
  );
}
