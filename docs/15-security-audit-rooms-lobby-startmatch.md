# Security audit baseline (rooms/lobby/startMatch)

## Hallazgos

- Había dependencia de `participantId` enviado por cliente para acciones sensibles (`updateSelectedModeAction`, `startMatchAction`).
- El lobby podía renderizarse con `service_role` aun para usuarios no participantes, permitiendo fuga de metadatos de sala.
- El cliente enviaba campos ocultos de identidad que podían manipularse.

## Correcciones aplicadas

- Las server actions resuelven el participante actor server-side usando sesión autenticada o cookie de invitado (`guest_session_id`) y validan pertenencia activa en la sala.
- Se elimina la dependencia de `participantId` del formulario para modo/inicio.
- El lobby bloquea acceso cuando el visitante no es participante activo de la sala.

## Matriz de permisos (MVP actual)

| Flujo | Quién puede leer | Quién puede escribir | Validaciones clave |
|---|---|---|---|
| Ver sala/lobby | Solo participantes activos | N/A | `currentParticipant` obligatorio |
| Join por código/link | Usuario autenticado o invitado con sesión | Inserta participante (si lobby y cupo) | estado `lobby`, no expirada, 3-8, evita duplicado activo |
| Cambiar modo | Participante host activo | `rooms.selected_mode` | host-only + sala en `lobby` + modo válido |
| Start match | Participante host activo | `rooms.status`, `matches`, `rounds` | host-only + sala `lobby` + 3-8 + modo seleccionado + prompts + idempotencia |

## Checklist para PRs futuros

- No confiar en `participantId`, `userId`, `host` enviados por cliente.
- Resolver actor desde sesión/cookie server-side y revalidar pertenencia activa.
- Para toda lectura por `roomCode`, verificar pertenencia antes de renderizar datos.
- Mantener writes sensibles en server actions/RPC; no writes directas desde cliente.
- Unificar errores de auth/negocio (`ROOM_NOT_ACCESSIBLE`, `NOT_HOST`, `FORBIDDEN`).
- Probar explícitamente casos cross-room y no-host.
