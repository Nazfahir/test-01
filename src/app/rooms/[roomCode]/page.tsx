import { redirect } from 'next/navigation';

export default async function RoomCodeResolverPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  redirect(`/rooms/join?roomCode=${roomCode.toUpperCase()}`);
}
