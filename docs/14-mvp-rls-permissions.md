# MVP RLS y matriz de permisos (flujo real inicial)

Fecha: 2026-05-27.

Este documento define la capa mínima de seguridad con Row Level Security (RLS) para evitar fuga de datos entre salas y bloquear escrituras inválidas desde cliente durante el MVP.

## Matriz de permisos (MVP)

| Recurso | Host registrado (cliente) | Jugador registrado (cliente) | Invitado (cliente directo) | Backend (server action / RPC con service role) |
|---|---|---|---|---|
| `profiles` | Leer/escribir solo su perfil | Leer/escribir solo su perfil | No aplica | Sí |
| `guest_sessions` | No acceso directo | No acceso directo | No acceso directo | Sí |
| `rooms` | Leer solo si pertenece a sala | Leer solo si pertenece a sala | No acceso directo | Sí |
| `room_participants` | Leer solo su sala. Insert de participante registrado solo para sí mismo | Igual que host (sin privilegios extra en cliente) | No acceso directo | Sí |
| `matches` | Leer solo su sala | Leer solo su sala | No acceso directo | Sí |
| `rounds` | Leer solo su sala | Leer solo su sala | No acceso directo | Sí |
| `round_submissions` | Leer solo su sala. Insert solo de su propio `participant_id` | Igual | No acceso directo | Sí |
| `relationship_events` | Leer solo su sala | Leer solo su sala | No acceso directo | Sí |
| `relationship_summaries` | Leer solo pares donde participa | Leer solo pares donde participa | No acceso directo | Sí |
| `currency_transactions` | Leer solo sus transacciones | Leer solo sus transacciones | No acceso directo | Sí |

## Decisiones clave de seguridad

- **Sin fuga entre salas**: lecturas de `rooms`, `matches`, `rounds`, `round_submissions` y `relationship_events` quedan restringidas por membresía en la sala.
- **Submissions protegidas**: un usuario autenticado solo puede insertar submissions para su propio `participant_id`.
- **Sin mutación histórica arbitraria de submissions**: no se crean políticas `UPDATE`/`DELETE` para `round_submissions` desde cliente.
- **Moneda protegida**: `currency_transactions` permite solo lectura propia en cliente; escrituras quedan para backend.
- **Vínculo resumido privado**: `relationship_summaries` solo visible para participantes del par.

## Operaciones delegadas obligatoriamente a backend

Estas operaciones deben ejecutarse por **server action / RPC** con validaciones adicionales (rol host + estado válido):

- iniciar partida;
- avanzar ronda;
- lock/reveal/finalización;
- creación/actualización de `matches` y `rounds`;
- inserción de `relationship_events`/`relationship_summaries`;
- inserción de `currency_transactions`.

## Compatibilidad y limitación actual de invitados

Los invitados del MVP no dependen de `auth.uid()` en cliente, por lo que su identidad no puede ser validada de forma robusta con RLS estándar de `authenticated`.

**Decisión temporal (MVP-safe):**

- bloquear acceso directo de cliente a tablas sensibles para invitados;
- canalizar sus operaciones sensibles (join, submissions, avance de partida) por backend/service role con validaciones de sesión invitado + membresía de sala.

Esto mantiene iteración rápida sin abrir exposición cross-room, y deja espacio para endurecer el modelo de identidad guest en iteraciones siguientes.
