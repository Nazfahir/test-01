# QA MVP · Resiliencia multi-cliente (PR-21)

Fecha de ejecución: 2026-05-28.
Entorno: local dev (`npm run dev`), 3 pestañas de navegador simulando host + user + guest, reconexión simulada con modo offline de DevTools.

## Matriz de casos

| Caso | Esperado | Observado | Severidad | Estado |
|---|---|---|---|---|
| Crear sala → join user+guest → lobby → startMatch → 3 rondas → results → CTA invitado | Loop completo sin bloqueo | ✅ Flujo completo | Alta | OK |
| 2 jugadores intentan iniciar | No inicia | ✅ Botón deshabilitado + mensaje de faltantes | Media | OK |
| 3 jugadores inician | Inicia | ✅ Inicia correctamente | Alta | OK |
| 8 jugadores | Límite máximo permitido | ✅ Join #8 permitido | Alta | OK |
| Intento jugador 9 | Rechazo | ✅ Error de sala llena | Alta | OK |
| Sala no encontrada | Error claro | ✅ Mensaje de sala no encontrada | Media | OK |
| Sala ya iniciada | Bloquea nuevos joins | ✅ Error de estado inválido | Alta | OK |
| Sala cerrada/expirada | Rechazo | ✅ Error de cerrada/expirada | Alta | OK |
| Jugador se desconecta y vuelve en lobby | Presencia se recupera sin duplicados | ✅ Realtime + snapshot rehidratan estado | Alta | FIX aplicado |
| Desconexión durante ronda con respuesta ya enviada | Se conserva respuesta | ✅ Upsert idempotente mantiene una sola submission | Alta | OK |
| Desconexión durante ronda sin responder + host lock | Se marca `skip` | ✅ `lock` rellena faltantes con `skipped` | Alta | OK |
| Realtime reconecta sin duplicar participantes | Sin drift ni duplicados | ✅ Merge ignora eventos antiguos + dedupe por id | Alta | FIX aplicado |
| Host cae durante partida | Estado “Host desconectado”, sin avance inválido | ✅ Banner de pausa para no-host; avance continúa bloqueado por ausencia de host | Alta | FIX aplicado |
| Host reconecta | Recupera control de avance | ✅ Al volver `connected`, controles host operan normal | Alta | FIX aplicado |
| Doble click/retry start/lock/reveal/advance | Idempotencia sin duplicados | ✅ Guards por estado + upsert único | Alta | OK |

## Pendientes no bloqueantes

| Pendiente | Impacto | Sugerencia |
|---|---|---|
| Cobertura E2E multi-dispositivo real (iOS/Android + cambio de red) | Medio | Agregar suite E2E en siguiente iteración si se habilita stack E2E |
| Métricas de reconexión (tiempo promedio de recuperación) | Bajo | Instrumentar eventos cliente en analytics interno |

## Fixes aplicados en este PR

1. Rehidratación de snapshot y sincronización en `play` con escucha realtime de `rooms/matches/rounds`.
2. Estado explícito de “Host desconectado” para clientes no-host.
3. Merge de presencia tolerante a out-of-order events (ignora eventos antiguos por `updated_at/last_seen_at`).
4. Test unitario para regresión de drift por eventos viejos.
