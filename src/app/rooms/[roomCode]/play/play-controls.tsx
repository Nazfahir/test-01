'use client';

import { useActionState } from 'react';
import { advanceRoundAction, lockRoundAction, revealRoundAction } from '@/features/rooms/actions';
import { Button } from '@/components/ui/Button';

type Props = { roomId: string; matchId: string; roundId: string; roundStatus: 'waiting' | 'question' | 'locked' | 'reveal' | 'finished'; isHost: boolean };

export function PlayControls({ roomId, matchId, roundId, roundStatus, isHost }: Props) {
  const [lockState, lockFormAction] = useActionState(lockRoundAction, {});
  const [revealState, revealFormAction] = useActionState(revealRoundAction, {});
  const [advanceState, advanceFormAction] = useActionState(advanceRoundAction, {});

  if (!isHost) return <p className="text-sm text-slate-600">Esperando al host para avanzar de ronda ✨</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700">Control host: avanza la ronda paso a paso para mantener todo ordenado.</p>
      {roundStatus === 'question' && (
        <form action={lockFormAction}>
          <input type="hidden" name="roomId" value={roomId} /><input type="hidden" name="matchId" value={matchId} /><input type="hidden" name="roundId" value={roundId} />
          <Button type="submit">Cerrar respuestas (lock)</Button>
          {lockState.error ? <p className="text-sm text-rose-600">{lockState.error}</p> : null}
        </form>
      )}
      {roundStatus === 'locked' && (
        <form action={revealFormAction}>
          <input type="hidden" name="roomId" value={roomId} /><input type="hidden" name="matchId" value={matchId} /><input type="hidden" name="roundId" value={roundId} />
          <Button type="submit">Revelar ronda</Button>
          {revealState.error ? <p className="text-sm text-rose-600">{revealState.error}</p> : null}
        </form>
      )}
      {roundStatus === 'reveal' && (
        <form action={advanceFormAction}>
          <input type="hidden" name="roomId" value={roomId} /><input type="hidden" name="matchId" value={matchId} /><input type="hidden" name="roundId" value={roundId} />
          <Button type="submit">Finalizar ronda y avanzar</Button>
          {advanceState.error ? <p className="text-sm text-rose-600">{advanceState.error}</p> : null}
        </form>
      )}
    </div>
  );
}
