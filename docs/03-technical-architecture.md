# Orbitas — Technical Architecture v0.2

## Estado

Versión: 0.2  
Estado: borrador técnico inicial

---

## 1. Stack confirmado

- Next.js.
- TypeScript.
- Supabase Auth para cuenta local.
- Supabase Postgres para persistencia.
- Supabase Realtime para lobby/partida.
- Tailwind CSS.
- Vitest.

---

## 2. Principios técnicos

- MVP primero.
- Separar lógica de juego de UI.
- Separar estado temporal de datos persistentes.
- Guardar eventos importantes en DB.
- Realtime notifica cambios, no reemplaza la DB.
- Mobile-first.
- No sobre-ingeniería.

---

## 3. Estructura sugerida

```txt
/src
  /app
    /auth/login
    /auth/register
    /rooms/create
    /rooms/join
    /rooms/[roomCode]/lobby
    /rooms/[roomCode]/play
    /rooms/[roomCode]/results
  /components
    /ui
    /rooms
    /games
    /results
  /features
    /rooms
    /games
      /most-likely
      /no-repeat
      /would-you-rather
    /relationships
    /currency
    /guests
    /auth
  /lib
    supabaseClient.ts
    supabaseServer.ts
```

---

## 4. Autenticación

MVP usa cuenta local.

Incluido:

- registro local;
- login local;
- logout;
- perfil mínimo.

No incluido:

- Google;
- Apple;
- Discord;
- OAuth social.

Invitados no usan Auth. Se gestionan con sesión temporal y `guest_session_id`.

---

## 5. Salas y realtime

Supabase Realtime se usa para:

- participantes del lobby;
- presencia básica;
- estado de sala;
- ronda actual;
- reveal;
- final de partida.

Regla:

> El estado importante se guarda en Postgres. Los clientes se sincronizan por Realtime.

---

## 6. Motor de partida

Una partida tiene:

- sala;
- modo;
- participantes;
- playlist de 3 rondas;
- estado;
- resultados.

Cada ronda tiene:

- tipo de juego;
- prompt;
- orden;
- estado;
- submissions;
- resultados.

Estados mínimos de ronda:

```txt
waiting
question
locked
reveal
finished
```

---

## 7. Playlist automática

Al iniciar partida:

1. Validar 3-8 participantes activos.
2. Validar modo Suave/Fiesta.
3. Crear `match`.
4. Seleccionar 3 prompts activos:
   - `would_you_rather`;
   - `most_likely`;
   - `no_repeat`.
5. Crear 3 `rounds`.
6. Cambiar sala a `in_game`.

---

## 8. Skips

Si host avanza y faltan respuestas:

- crear o inferir `skip`;
- ignorar en estadísticas específicas;
- no penalizar.

Recomendación: crear skips explícitos al avanzar para facilitar auditoría.

---

## 9. Vínculo y moneda

Lógica centralizada:

- `relationshipScoring.ts`
- `currencyScoring.ts`

No hardcodear scoring en componentes.

Moneda debe guardarse como ledger/transacciones.

---

## 10. Seguridad mínima

Validar:

- solo host inicia/avanza;
- jugador pertenece a sala;
- jugador solo crea su submission;
- no se aceptan respuestas después de reveal;
- no se revela antes de tiempo;
- sala no supera 8 jugadores;
- cliente no puede otorgarse moneda arbitraria.

Usar RLS y/o server actions/RPC para operaciones críticas.

---

## 11. Tests recomendados

Con Vitest:

- generación de playlist;
- límites 3-8;
- auto-voto permitido;
- skip no cuenta;
- detección de repetidos;
- scoring de vínculo;
- scoring de moneda;
- no duplicar transacciones.

Pruebas manuales:

- 3-4 celulares reales;
- invitado + usuario;
- host avanza con faltantes;
- sala llena;
- desconexión.

---

## 12. Fases técnicas

1. Scaffolding.
2. Prototipo navegable fake.
3. Supabase/Auth/DB.
4. Salas reales.
5. Realtime lobby.
6. Motor de partida.
7. Minijuegos.
8. Resultado visual.
9. Moneda persistente.
10. Pulido y pruebas.
