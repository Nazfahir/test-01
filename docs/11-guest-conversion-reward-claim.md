# 11. Conversión de invitado y reclamo de progreso

## Objetivo

Definir el flujo exacto para convertir una sesión invitada en cuenta local sin perder progreso de vínculo/moneda en el MVP.

---

## 1) ¿Cuándo se ofrece la conversión?

La conversión se ofrece en **dos momentos**:

1. **Post-partida inmediato** (momento principal):
   - luego de mostrar resultados de vínculo y recompensa visual;
   - CTA: “Guarda tus monedas y progreso”.
2. **Reingreso con la misma sesión invitada activa** (momento secundario):
   - si existe progreso pendiente y aún no expiró la ventana de reclamo.

No se bloquea el juego por no convertir. La conversión debe sentirse opcional, clara y de baja fricción.

---

## 2) ¿Cómo se vinculan `guest_sessions.converted_user_id` y recompensas pendientes?

Modelo de asociación:

- `guest_sessions.converted_user_id` guarda el `auth.users.id` final al que quedó asociada la sesión.
- Las recompensas pendientes de invitado se identifican por `guest_session_id` (en `currency_transactions` con `user_id = null` y/o eventos equivalentes de vínculo pendientes).

Regla:

- La conversión se considera **completada** solo cuando:
  1. `guest_sessions.converted_user_id` está seteado,
  2. las recompensas pendientes elegibles pasan a `user_id = <nuevo usuario>`,
  3. y se marcan como reclamadas para evitar doble otorgamiento (idempotencia por `source_id`).

---

## 3) Límite temporal para reclamar progreso

Ventana de reclamo propuesta para MVP:

- **72 horas** desde `guest_sessions.created_at`.

Criterio:

- dentro de la ventana: se permite migrar recompensas pendientes;
- fuera de la ventana: la cuenta puede crearse/entrar, pero ya no reclama ese progreso histórico de invitado.

Razonamiento MVP:

- reduce complejidad operativa;
- limita ambigüedad de identidad a largo plazo;
- mantiene una UX simple y predecible.

---

## 4) ¿Qué pasa si la asociación falla? (mensaje UX + fallback)

Si falla la asociación transaccional (por error temporal, conflicto o timeout):

Mensaje UX recomendado:

- “Tu cuenta se creó, pero no pudimos vincular tu progreso de esta partida todavía. No te preocupes: puedes reintentarlo desde esta misma sesión.”

Fallback funcional:

1. la cuenta local queda creada/iniciada igualmente;
2. la sesión invitada **no** se marca como convertida de forma definitiva;
3. las recompensas pendientes se mantienen como pendientes, sin duplicación;
4. se habilita botón “Reintentar vinculación” mientras no expire la ventana de 72h.

Nunca mostrar lenguaje punitivo ni culpar a la persona usuaria.

---

## 5) Tablas actualizadas en orden transaccional

Para evitar estados parciales, ejecutar en una única transacción lógica:

1. **Validar elegibilidad**
   - `guest_sessions` (existencia, no expirada, no convertida previamente o misma conversión idempotente).
2. **Bloquear sesión invitada objetivo**
   - `guest_sessions` con lock transaccional por `id`.
3. **Migrar recompensas pendientes**
   - `currency_transactions`: mover filas elegibles de `guest_session_id` al `user_id` nuevo (manteniendo `source_id`).
4. **Registrar/actualizar estado de reclamo**
   - tabla de apoyo de reclamo pendiente (si existe) y/o marca equivalente en ledger para no reprocesar.
5. **Marcar conversión de sesión**
   - `guest_sessions.converted_user_id = <auth.users.id>` y `converted_at` (si existe el campo).
6. **Commit**
   - solo si todos los pasos anteriores finalizan correctamente.

Si cualquier paso falla: rollback completo.

---

## Notas de consistencia con MVP

- Mantener separación entre estado temporal de sala y datos persistentes.
- Mantener idempotencia de recompensa por `source_id`.
- No introducir economía funcional, tienda o inventario en este flujo.
