export type Participant = { id: string; displayName: string; isGuest: boolean };
export type RelationshipEvent = { actorParticipantId: string; targetParticipantId: string; pointsDelta: number; eventType: string };
export type CurrencyTx = { participantId?: string | null; amount: number; sourceType: string };

export type RelationshipHighlight = {
  pairKey: string;
  pairLabel: string;
  totalPoints: number;
  topEvents: string[];
};

export function buildRelationshipHighlights(participants: Participant[], events: RelationshipEvent[], top = 3): RelationshipHighlight[] {
  const names = new Map(participants.map((p) => [p.id, p.displayName]));
  const buckets = new Map<string, { a: string; b: string; total: number; events: Map<string, number> }>();

  for (const event of events) {
    if (!event.actorParticipantId || !event.targetParticipantId) continue;
    if (event.actorParticipantId === event.targetParticipantId) continue;
    if (event.pointsDelta <= 0) continue;
    const [a, b] = [event.actorParticipantId, event.targetParticipantId].sort();
    const key = `${a}:${b}`;
    const bucket = buckets.get(key) ?? { a, b, total: 0, events: new Map<string, number>() };
    bucket.total += event.pointsDelta;
    bucket.events.set(event.eventType, (bucket.events.get(event.eventType) ?? 0) + event.pointsDelta);
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries())
    .map(([pairKey, bucket]) => ({
      pairKey,
      pairLabel: `${names.get(bucket.a) ?? 'Jugador'} ✦ ${names.get(bucket.b) ?? 'Jugador'}`,
      totalPoints: bucket.total,
      topEvents: Array.from(bucket.events.entries()).sort((x, y) => y[1] - x[1]).map(([event]) => event).slice(0, 2),
    }))
    .sort((x, y) => y.totalPoints - x.totalPoints)
    .slice(0, top);
}

export function buildCurrencySummary(currencyRows: CurrencyTx[]) {
  const bySource = new Map<string, number>();
  let total = 0;
  for (const row of currencyRows) {
    total += row.amount;
    bySource.set(row.sourceType, (bySource.get(row.sourceType) ?? 0) + row.amount);
  }

  return {
    total,
    breakdown: Array.from(bySource.entries())
      .map(([sourceType, amount]) => ({ sourceType, amount }))
      .sort((a, b) => b.amount - a.amount || a.sourceType.localeCompare(b.sourceType)),
  };
}
