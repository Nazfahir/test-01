'use client';

import { useActionState } from 'react';
import { advanceRoundAction, lockRoundAction, revealRoundAction, submitMostLikelyVoteAction, submitNoRepeatAnswerAction, submitWouldYouRatherChoiceAction } from '@/features/rooms/actions';
import { Button } from '@/components/ui/Button';
import type { RoundRevealPayload } from '@/features/rooms/reveal';

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
  participants: { id: string; display_name: string | null }[];
  actorParticipantId: string | null;
  revealSnapshot: RoundRevealPayload | null;
};

export function PlayControls({ roomId, matchId, roundId, roundStatus, gameType, question, options, isHost, hasSubmitted, participants, actorParticipantId, revealSnapshot }: Props) {
  const [lockState, lockFormAction] = useActionState(lockRoundAction, {});
  const [revealState, revealFormAction] = useActionState(revealRoundAction, {});
  const [advanceState, advanceFormAction] = useActionState(advanceRoundAction, {});
  const [submitWyrState, submitWyrFormAction] = useActionState(submitWouldYouRatherChoiceAction, {});
  const [submitMostLikelyState, submitMostLikelyFormAction] = useActionState(submitMostLikelyVoteAction, {});
  const [submitNoRepeatState, submitNoRepeatFormAction] = useActionState(submitNoRepeatAnswerAction, {});

  return (
    <div className="space-y-3">
      {gameType === 'would_you_rather' ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-700">¿Qué prefieres?</p>
          <p className="text-sm text-slate-700">{question}</p>
          {roundStatus === 'question' && !hasSubmitted && options.length === 2 ? (
            <form action={submitWyrFormAction} className="space-y-2">
              <input type="hidden" name="roomId" value={roomId} /><input type="hidden" name="matchId" value={matchId} /><input type="hidden" name="roundId" value={roundId} />
              {options.map((option) => (
                <Button key={option} type="submit" name="choiceKey" value={option} className="w-full">{option}</Button>
              ))}
            </form>
          ) : null}
          {(hasSubmitted || submitWyrState.ok) ? <p className="text-sm text-emerald-700">Respuesta enviada ✨</p> : null}
          {submitWyrState.error ? <p className="text-sm text-rose-600">{submitWyrState.error}</p> : null}
        </div>
      ) : null}

      {gameType === 'most_likely_to' ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-700">¿Quién es más probable?</p>
          <p className="text-sm text-slate-700">{question}</p>
          <p className="text-xs text-slate-500">Tu voto queda oculto hasta reveal. Sí, te puedes votar a ti ✨</p>
          {roundStatus === 'question' && !hasSubmitted ? (
            <form action={submitMostLikelyFormAction} className="space-y-2">
              <input type="hidden" name="roomId" value={roomId} /><input type="hidden" name="matchId" value={matchId} /><input type="hidden" name="roundId" value={roundId} />
              {participants.map((participant) => (
                <Button key={participant.id} type="submit" name="targetParticipantId" value={participant.id} className="w-full">
                  {participant.display_name ?? `Jugador ${participant.id.slice(0, 4)}`}
                  {participant.id === actorParticipantId ? ' (Tú)' : ''}
                </Button>
              ))}
            </form>
          ) : null}
          {(hasSubmitted || submitMostLikelyState.ok) ? <p className="text-sm text-emerald-700">Voto enviado ✨</p> : null}
          {submitMostLikelyState.error ? <p className="text-sm text-rose-600">{submitMostLikelyState.error}</p> : null}
        </div>
      ) : null}


      {gameType === 'dont_repeat' ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-700">No repitas</p>
          <p className="text-sm text-slate-700">{question}</p>
          <p className="text-xs text-slate-500">Ronda por turnos con timer: respuesta corta, sin artículos, sin acentos y en minúsculas.</p>
          {roundStatus === 'question' && !hasSubmitted ? (
            <form action={submitNoRepeatFormAction} className="space-y-2">
              <input type="hidden" name="roomId" value={roomId} /><input type="hidden" name="matchId" value={matchId} /><input type="hidden" name="roundId" value={roundId} />
              <input type="text" name="text" maxLength={30} required placeholder="Tu respuesta (máx 30)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <Button type="submit" className="w-full">Enviar respuesta</Button>
            </form>
          ) : null}
          {(hasSubmitted || submitNoRepeatState.ok) ? <p className="text-sm text-emerald-700">Respuesta enviada ✨ Queda oculta hasta reveal.</p> : null}
          {submitNoRepeatState.error ? <p className="text-sm text-rose-600">{submitNoRepeatState.error}</p> : null}
        </div>
      ) : null}

      {roundStatus === 'reveal' && revealSnapshot ? (
        <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">Resultados de la ronda 🎉</p>
          {revealSnapshot.game_type === 'would_you_rather' ? revealSnapshot.by_option.map((group) => (
            <p key={group.option} className="text-sm text-emerald-900">{group.option}: {group.count}</p>
          )) : null}
          {revealSnapshot.game_type === 'most_likely_to' ? revealSnapshot.distribution.map((item) => (
            <p key={item.target_participant_id} className="text-sm text-emerald-900">{item.display_name}: {item.votes} votos</p>
          )) : null}
          {revealSnapshot.game_type === 'dont_repeat' ? (
            <>
              <p className="text-sm text-emerald-900">Únicas: {revealSnapshot.unique_answers.length}</p>
              <p className="text-sm text-emerald-900">Repetidas: {revealSnapshot.repeated_groups.length}</p>
            </>
          ) : null}
          {revealSnapshot.skipped.length > 0 ? <p className="text-xs text-emerald-700">Sin respuesta: {revealSnapshot.skipped.map((s) => s.display_name).join(', ')}</p> : null}
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
