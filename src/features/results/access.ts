export type ViewerIdentity = { userId: string | null; guestSessionId: string | null };
export type RoomParticipantAccess = { userId: string | null; guestSessionId: string | null; leftAt: string | null };

export function canViewRoomResults(viewer: ViewerIdentity, participants: RoomParticipantAccess[]): boolean {
  if (viewer.userId) {
    return participants.some((p) => p.leftAt === null && p.userId === viewer.userId);
  }
  if (viewer.guestSessionId) {
    return participants.some((p) => p.leftAt === null && p.guestSessionId === viewer.guestSessionId);
  }
  return false;
}
