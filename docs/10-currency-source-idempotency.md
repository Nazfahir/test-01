# Orbitas — Currency Source Idempotency (MVP)

## Estado

Versión: 0.1  
Estado: decisión técnica para MVP

---

## Objetivo

Definir un esquema **cerrado** para `source_type` y una regla de idempotencia estable para evitar dobles créditos de moneda en reintentos de backend.

---

## 1) Catálogo cerrado de `source_type` (MVP)

Para MVP, `currency_transactions.source_type` **solo** puede tomar estos valores:

```txt
round_completed
match_completed
same_choice_bonus
unique_answer_bonus
received_vote_bonus
group_bonus
```

No se permiten tipos libres en MVP.

---

## 2) `source_id` por tipo

`source_id` debe ser un identificador **determinístico** por evento de recompensa.

| source_type | source_id (formato exacto) | Motivo |
|---|---|---|
| `round_completed` | `round:{round_id}:participant:{participant_id}` | Una recompensa por participante por ronda. |
| `match_completed` | `match:{match_id}:participant:{participant_id}` | Una recompensa por participante al finalizar partida. |
| `same_choice_bonus` | `round:{round_id}:participant:{participant_id}:same_choice` | Bonus único de coincidencia por ronda/participante. |
| `unique_answer_bonus` | `round:{round_id}:participant:{participant_id}:unique_answer` | Bonus único por respuesta única por ronda/participante. |
| `received_vote_bonus` | `round:{round_id}:target:{participant_id}:vote:{voter_participant_id}` | Premio por voto recibido; permite 1 crédito por par votante→target (incluye auto-voto). |
| `group_bonus` | `match:{match_id}:participant:{participant_id}:group_bonus` | Bonus grupal único por partida/participante. |

Notas:
- `participant_id` se refiere a `room_participants.id`.
- `source_id` se guarda como `text`.
- Este formato evita dependencia en `metadata` para unicidad.

---

## 3) Constraint SQL exacto de unicidad

En `currency_transactions`, aplicar:

```sql
ALTER TABLE public.currency_transactions
  ADD CONSTRAINT currency_transactions_user_source_unique
  UNIQUE (user_id, source_type, source_id);
```

Este constraint es la barrera final anti-duplicado para usuarios registrados.

---

## 4) Comportamiento ante reintentos

Toda inserción de recompensa debe usar upsert idempotente:

```sql
INSERT INTO public.currency_transactions (
  user_id,
  amount,
  source_type,
  source_id,
  match_id,
  round_id,
  room_id,
  metadata
)
VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8
)
ON CONFLICT (user_id, source_type, source_id) DO NOTHING;
```

Regla operativa:
- Si es el primer intento: inserta 1 fila.
- Si hay retry del mismo evento: no inserta nada.
- La operación se considera exitosa funcionalmente aunque el retry no inserte (idempotencia).

---

## 5) Ejemplo concreto (partida de 3 rondas)

Supongamos:
- `match_id = m1`
- rondas: `r1`, `r2`, `r3`
- usuario registrado vinculado a `participant_id = pA`
- otro participante `pB`

Filas de ejemplo en `currency_transactions` para `user_id = uA`:

| amount | source_type | source_id | match_id | round_id | comentario |
|---:|---|---|---|---|---|
| 5 | `round_completed` | `round:r1:participant:pA` | `m1` | `r1` | Ronda 1 completada |
| 2 | `same_choice_bonus` | `round:r1:participant:pA:same_choice` | `m1` | `r1` | Bonus coincidencia en ronda 1 |
| 1 | `received_vote_bonus` | `round:r1:target:pA:vote:pB` | `m1` | `r1` | Voto recibido de pB |
| 5 | `round_completed` | `round:r2:participant:pA` | `m1` | `r2` | Ronda 2 completada |
| 3 | `unique_answer_bonus` | `round:r2:participant:pA:unique_answer` | `m1` | `r2` | Bonus respuesta única |
| 5 | `round_completed` | `round:r3:participant:pA` | `m1` | `r3` | Ronda 3 completada |
| 1 | `received_vote_bonus` | `round:r3:target:pA:vote:pA` | `m1` | `r3` | Auto-voto permitido |
| 5 | `group_bonus` | `match:m1:participant:pA:group_bonus` | `m1` | `NULL` | Bonus grupal |
| 20 | `match_completed` | `match:m1:participant:pA` | `m1` | `NULL` | Partida completada |

### Retry ejemplo

Si el backend vuelve a ejecutar `round_completed` de `r2` para `pA`, reutiliza:

```txt
source_type = round_completed
source_id   = round:r2:participant:pA
```

El `ON CONFLICT ... DO NOTHING` evita una fila duplicada y evita otorgar +5 adicional.
