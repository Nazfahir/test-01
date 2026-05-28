'use client';

import { useActionState } from 'react';
import { advanceRoundAction, lockRoundAction, revealRoundAction, submitWouldYouRatherChoiceAction } from '@/features/rooms/actions';
import { Button } from '@/components/ui/Button';

type Props = {
  roomId: string;
  matchId: string;
  roundId: string;
  roundStatus: 'waiting' | 'question' | 'locked' | 'reveal' | 'finished';
  gameType: 'would_you_rather' | 'most_likely_to' | 'dont_repeat';
  question: string;
  options: string[];
  isHost: boolean;
  hasSubmitted: boolean;
};

export function PlayControls({ roomId, matchId, roundId, roundStatus, gameType, question, options, isHost, hasSubmitted }: Props) {
  const [lockState, lockFormAction] = useActionState(lockRoundAction, {});
  const [revealState, revealFormAction] = useActionState(revealRoundAction, {});
  const [advanceState, advanceFormAction] = useActionState(advanceRoundAction, {});
  const [submitState, submitFormAction] = useActionState(submitWouldYouRatherChoiceAction, {});

  return (
    <div className="space-y-3">
      {gameType === 'would_you_rather' ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-700">¿Qué prefieres?</p>
          <p className="text-sm text-slate-700">{question}</p>
          {roundStatus === 'question' && !hasSubmitted && options.length === 2 ? (
            <form action={submitFormAction} className="space-y-2">
              <input type="hidden" name="roomId" value={roomId} /><input type="hidden" name="matchId" value={matchId} /><input type="hidden" name="roundId" value={roundId} />
              {options.map((option) => (
                <Button key={option} type="submit" name="choiceKey" value={option} className="w-full">{option}</Button>
              ))}
            </form>
          ) : null}
          {(hasSubmitted || submitState.ok) ? <p className="text-sm text-emerald-700">Respuesta enviada ✨</p> : null}
          {submitState.error ? <p className="text-sm text-rose-600">{submitState.error}</p> : null}
        </div>
      ) : null}

      {isHost ? (
        <>
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
        </>
      ) : <p className="text-sm text-slate-600">Esperando al host para avanzar de ronda ✨</p>}
    </div>
  );
}
