# Orbitas — Data Model v0.2

## Estado

Versión: 0.2  
Estado: borrador técnico inicial

Modelo de datos propuesto para Supabase/Postgres.

---

## 1. Principios

- Usar UUIDs.
- Separar usuario registrado de participante de sala.
- Soportar invitados temporales.
- Guardar moneda como ledger.
- Guardar vínculo como eventos.
- Diseñar pensando en permisos futuros.

---

## 2. Tablas principales

```txt
auth.users
profiles
guest_sessions
rooms
room_participants
prompts
matches
rounds
round_submissions
relationship_events
relationship_summaries
currency_transactions
```

---

## 3. profiles

```txt
id uuid pk references auth.users(id)
display_name text not null
avatar_seed text null
created_at timestamptz
updated_at timestamptz
```

Perfil mínimo. No perfil público completo en MVP.

---

## 4. guest_sessions

```txt
id uuid pk
display_name text not null
client_token_hash text null
converted_user_id uuid null references auth.users(id)
created_at timestamptz
expires_at timestamptz null
```

Invitados temporales. Deben expirar o minimizarse si no crean cuenta.

---

## 5. rooms

```txt
id uuid pk
room_code text unique not null
host_participant_id uuid null
status text not null
selected_mode text null
min_players int default 3
max_players int default 8
created_at timestamptz
updated_at timestamptz
expires_at timestamptz null
closed_at timestamptz null
```

Estados:

```txt
lobby
in_game
results
closed
expired
```

Modos:

```txt
soft
party
```

---

## 6. room_participants

```txt
id uuid pk
room_id uuid references rooms(id)
user_id uuid null references auth.users(id)
guest_session_id uuid null references guest_sessions(id)
display_name text not null
role text not null
connection_status text not null
joined_at timestamptz
left_at timestamptz null
last_seen_at timestamptz null
```

Roles:

```txt
host
player
```

Connection status:

```txt
connected
disconnected
left
```

Debe existir `user_id` o `guest_session_id`.

---

## 7. prompts

```txt
id uuid pk
game_type text not null
mode text not null
text text not null
options jsonb null
min_players int default 3
max_players int default 8
is_active boolean default true
created_at timestamptz
updated_at timestamptz
```

Game types:

```txt
most_likely
no_repeat
would_you_rather
```

Modes:

```txt
soft
party
```

---

## 8. matches

```txt
id uuid pk
room_id uuid references rooms(id)
status text not null
mode text not null
current_round_id uuid null
started_at timestamptz null
finished_at timestamptz null
created_at timestamptz
```

Estados:

```txt
created
in_progress
finished
cancelled
```

---

## 9. rounds

```txt
id uuid pk
match_id uuid references matches(id)
room_id uuid references rooms(id)
prompt_id uuid references prompts(id)
game_type text not null
round_order int not null
status text not null
started_at timestamptz null
locked_at timestamptz null
revealed_at timestamptz null
finished_at timestamptz null
created_at timestamptz
```

`round_order` debe ser 1, 2 o 3.

---

## 10. round_submissions

Tabla genérica para votos, elecciones, respuestas y skips.

```txt
id uuid pk
round_id uuid references rounds(id)
match_id uuid references matches(id)
room_id uuid references rooms(id)
participant_id uuid references room_participants(id)
submission_type text not null
value jsonb null
status text not null
submitted_at timestamptz null
created_at timestamptz
```

Submission types:

```txt
vote
text_answer
choice
skip
```

Status:

```txt
submitted
skipped
invalid
```

Ejemplo `most_likely`:

```json
{"target_participant_id": "uuid"}
```

Ejemplo `no_repeat`:

```json
{"raw_text": "Pizza", "normalized_text": "pizza"}
```

Ejemplo `would_you_rather`:

```json
{"option_index": 0, "option_label": "Playa"}
```

---

## 11. relationship_events

```txt
id uuid pk
match_id uuid references matches(id)
round_id uuid null references rounds(id)
room_id uuid references rooms(id)
source_participant_id uuid references room_participants(id)
target_participant_id uuid references room_participants(id)
source_user_id uuid null references auth.users(id)
target_user_id uuid null references auth.users(id)
event_type text not null
amount int not null
metadata jsonb null
created_at timestamptz
```

Event types:

```txt
played_together
same_choice
voted_for_player
received_vote
repeated_answer
completed_match
```

---

## 12. relationship_summaries

```txt
id uuid pk
user_a_id uuid references auth.users(id)
user_b_id uuid references auth.users(id)
total_amount int default 0
last_interaction_at timestamptz null
created_at timestamptz
updated_at timestamptz
```

Solo para usuarios registrados. Guardar pares en orden estable para evitar duplicados.

---

## 13. currency_transactions

```txt
id uuid pk
user_id uuid null references auth.users(id)
guest_session_id uuid null references guest_sessions(id)
participant_id uuid null references room_participants(id)
room_id uuid null references rooms(id)
match_id uuid null references matches(id)
round_id uuid null references rounds(id)
amount int not null
source_type text not null
source_id uuid null
description text null
metadata jsonb null
created_at timestamptz
```

Source types:

```txt
round_completed
match_completed
same_choice_bonus
unique_answer_bonus
received_vote_bonus
group_bonus
guest_pending_reward
manual_adjustment
```

No gastos en MVP.

---

## 14. Índices recomendados

```txt
rooms(room_code)
rooms(status)
room_participants(room_id)
room_participants(user_id)
room_participants(guest_session_id)
matches(room_id)
rounds(match_id)
rounds(room_id, round_order)
round_submissions(round_id)
round_submissions(participant_id)
relationship_events(match_id)
relationship_events(source_user_id, target_user_id)
currency_transactions(user_id)
currency_transactions(guest_session_id)
currency_transactions(match_id)
prompts(game_type, mode, is_active)
```

---

## 15. Reglas de integridad

- No iniciar partida con menos de 3 participantes activos.
- No permitir más de 8 participantes activos.
- Un participante debe tener máximo una submission por ronda.
- Auto-voto permitido en `most_likely`.
- Skips no cuentan para estadísticas de ronda.
- Toda moneda persistente debe ser transacción.

---

## 16. Preguntas abiertas

- ¿Host invitado permitido en MVP real o solo prototipo?
- ¿Cuánto expiran salas y guest sessions?
- ¿Se migran recompensas de invitados automáticamente al crear cuenta?
- ¿Se guardan respuestas de invitados que no crean cuenta?
