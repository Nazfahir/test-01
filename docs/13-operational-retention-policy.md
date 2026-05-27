# Orbitas — Política Operativa de TTL, Cierre y Retención (MVP) v0.1

## Estado

Versión: 0.1  
Estado: propuesta operativa MVP

---

## 1. Objetivo

Definir reglas operativas mínimas para:

- TTL de `guest_sessions`, `rooms` y salas inactivas;
- estrategia de cierre (`closed` / `expired`) y limpieza;
- retención mínima para auditoría del MVP;
- impacto en privacidad y recuperación post-partida.

Estas reglas priorizan el loop jugable MVP sin implementar archivado avanzado ni una economía completa.

---

## 2. TTL propuesto (MVP)

### 2.1 `guest_sessions`

- TTL base: **24 horas** desde `created_at`.
- Campo de control: `expires_at = created_at + interval '24 hours'`.
- Si el invitado convierte cuenta local:
  - mantener la fila solo como puente de trazabilidad (`converted_user_id`);
  - extender disponibilidad operativa máxima a **7 días** para recuperación de incidencias post-conversión;
  - pasado ese plazo, anonimizar `display_name` y eliminar `client_token_hash`.

### 2.2 `rooms`

- Al crear sala en `lobby`:
  - `expires_at = created_at + interval '2 hours'`.
- Si la sala inicia partida (`in_game`):
  - mover `expires_at` a `now() + interval '6 hours'` para tolerar reconexiones y consulta de resultados.
- Si la sala termina partida (`results`):
  - mantener ventana de recuperación de **24 horas** para reingreso por link/código solo con fines de consulta de resultados de esa sesión.

### 2.3 Salas inactivas (actividad realtime)

Se considera inactividad cuando:

- no hay participantes `connected`; y
- `last_seen_at` de todos excede el umbral.

Umbrales:

- `lobby`: inactiva tras **15 minutos**;
- `in_game`: inactiva tras **20 minutos** (mayor tolerancia por desconexiones móviles);
- `results`: inactiva tras **60 minutos**.

Al detectar inactividad no se borran datos inmediatamente; primero se cambia estado según política de cierre.

---

## 3. Estrategia de cierre (`closed` / `expired`) y limpieza

## 3.1 Semántica de estado

- `closed`: cierre explícito por flujo de producto (host finaliza, partida terminada y ventana de consulta cerrada, o cierre administrativo).
- `expired`: vencimiento automático por TTL/inactividad sin cierre explícito.

Regla práctica MVP:

- preferir `closed` cuando la partida alcanzó `results`;
- usar `expired` para salas que nunca comenzaron o quedaron abandonadas.

## 3.2 Transiciones recomendadas

- `lobby` + TTL vencido o inactividad > 15 min → `expired`.
- `in_game` + inactividad > 20 min sin reconexión → `expired`.
- `results` + fin de ventana de consulta (24 h) → `closed`.
- cualquier estado + acción manual de cierre del host/backend → `closed`.

Al marcar `closed` o `expired`:

1. setear `rooms.status`;
2. setear `closed_at = now()` cuando aplique;
3. invalidar ingreso por `room_code`/link;
4. desconectar presencia realtime asociada.

## 3.3 Limpieza (job programado)

Ejecutar un job periódico (por ejemplo, cada 15 minutos) que:

1. marque estados vencidos (`expired`/`closed`);
2. aplique limpieza por lotes pequeños;
3. registre métricas de filas afectadas.

Orden de limpieza sugerido:

1. **Sesiones invitado vencidas no convertidas**: borrar duro (`DELETE`) tras **7 días** desde `expires_at`.
2. **Salas cerradas/expiradas**: conservar datos de gameplay para auditoría mínima (ver sección 4) y remover solo artefactos efímeros de presencia.
3. **Tokens/hash efímeros**: purgar de forma temprana (máx. 7 días) aunque el resto de la fila se retenga por auditoría.

---

## 4. Retención mínima de datos para auditoría (MVP)

Objetivo: poder investigar abuso básico, errores de moneda/vínculo y reclamos de conversión sin sobre-retener datos personales.

Retención mínima recomendada:

- `rooms`, `matches`, `rounds`: **30 días**.
- `round_submissions`: **30 días** con minimización de payload sensible cuando sea posible.
- `relationship_events` y `currency_transactions`: **90 días** para trazabilidad de cálculos y ledger MVP.
- `room_participants`:
  - mantener identificadores relacionales mínimos por **30 días**;
  - anonimizar `display_name` a los **30 días** si no hay cuenta registrada asociada.
- `guest_sessions`:
  - no convertidas: borrar antes (máximo 7 días post-expiración);
  - convertidas: conservar enlace técnico limitado para auditoría de conversión hasta **30 días**.

Después del plazo de auditoría:

- borrar o anonimizar irreversible;
- conservar únicamente agregados no reidentificables para analítica de producto.

---

## 5. Impacto en privacidad y recuperación post-partida

## 5.1 Privacidad

Beneficios:

- reduce retención de identificadores de invitados;
- limita exposición temporal de resultados de sala;
- disminuye superficie de fuga de datos por enlaces antiguos.

Riesgos a controlar:

- sobre-retener `display_name` de invitados;
- conservar hashes de cliente más tiempo del necesario;
- no cortar acceso por `room_code` después de cierre.

Mitigaciones MVP:

- expiración activa + limpieza por lotes;
- anonimización progresiva;
- invalidación dura de enlaces al cerrar/expirar;
- RLS estricta para impedir lectura cross-room.

## 5.2 Recuperación post-partida

La recuperación se limita a un periodo corto y controlado:

- hasta 24 h para consultar resultados de una sala finalizada;
- tolerancia breve de reconexión durante `in_game`;
- soporte a reclamos de moneda/vínculo durante la ventana de auditoría mínima.

Fuera de esa ventana:

- no prometer restauración completa de contexto social detallado;
- priorizar datos agregados o anonimizados sobre datos crudos de respuestas.

---

## 6. Checklist operativo (MVP)

- Definir `expires_at` al crear `guest_sessions` y `rooms`.
- Implementar job periódico de expiración/cierre y limpieza.
- Diferenciar claramente `closed` vs `expired` en backend.
- Invalidar códigos/links al cierre.
- Auditar retención real con métricas semanales.
- Revisar cumplimiento de minimización en tablas con datos de invitados.
