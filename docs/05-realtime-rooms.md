# Orbitas — Realtime Rooms Spec v0.2

## Estado

Versión: 0.2  
Estado: borrador técnico inicial

---

## 1. Objetivo

Permitir que 3 a 8 jugadores participen en una sala sincronizada con:

- lobby actualizado;
- host visible;
- modo elegido;
- partida de 3 rondas;
- respuestas ocultas hasta reveal;
- avance controlado por host;
- skips si alguien no responde;
- resultados finales compartidos.

---

## 2. Regla principal

> El estado importante debe persistirse en base de datos. Realtime debe notificar cambios, no ser la única fuente de verdad.

Usar Supabase Realtime para presencia, cambios de tablas y, si hace falta, broadcast.

---

## 3. Estados de sala

```txt
lobby
in_game
results
closed
expired
```

### lobby

Jugadores pueden entrar. Host puede elegir modo e iniciar si hay 3-8 activos.

### in_game

Partida activa. No aceptar nuevos jugadores activos.

### results

Partida terminada. Todos ven resultados.

---

## 4. Estados de participante

```txt
connected
disconnected
left
```

Si se desconecta durante ronda:

- si respondió, su respuesta sigue;
- si no respondió y host avanza, queda `skipped`;
- la partida no debe romperse.

---

## 5. Creación de sala

1. Crear `rooms` con estado `lobby`.
2. Crear `room_participants` para host.
3. Asignar `host_participant_id`.
4. Generar `room_code` único.
5. Mostrar QR/link/código.

---

## 6. Unión a sala

Validar:

- sala existe;
- estado `lobby`;
- no llena;
- no expirada/cerrada.

Crear `room_participants` y notificar lobby.

---

## 7. Lobby realtime

Debe sincronizar:

- lista de participantes;
- estado de conexión;
- host;
- modo seleccionado;
- si puede iniciar.

Solo host puede cambiar modo e iniciar partida.

---

## 8. Inicio de partida

Validar:

- sala en `lobby`;
- solicitante es host;
- 3-8 participantes activos;
- modo válido;
- prompts disponibles.

Acciones:

1. Crear `match`.
2. Seleccionar prompts.
3. Crear 3 `rounds`.
4. Activar primera ronda.
5. Cambiar sala a `in_game`.
6. Notificar clientes.

---

## 9. Orden de playlist

Orden recomendado:

1. `would_you_rather`
2. `most_likely`
3. `no_repeat`

Motivo: iniciar fácil, subir interacción, cerrar con caos ligero.

---

## 10. Estados de ronda

```txt
waiting
question
locked
reveal
finished
```

---

## 11. Envío de respuestas

Cada participante puede crear una submission por ronda.

Tipos:

```txt
vote
text_answer
choice
skip
```

No aceptar respuestas después de `locked` o `reveal`.

---

## 12. Avance de ronda

Solo host puede avanzar.

Si faltan respuestas:

- crear skips explícitos para faltantes, o inferirlos;
- recomendación: crearlos explícitamente;
- pasar a reveal.

---

## 13. Reveal

Durante reveal:

- mostrar resultados;
- calcular vínculo;
- calcular moneda;
- permitir avanzar.

No revelar datos antes de tiempo.

---

## 14. Final de partida

Al terminar tercera ronda:

1. Match pasa a `finished`.
2. Sala pasa a `results`.
3. Se calculan resultados finales.
4. Se muestra vínculo visual, moneda y CTA para invitados.

---

## 15. Host desconectado

MVP simple:

- mostrar “Host desconectado”.
- esperar reconexión.
- no implementar transferencia automática salvo que sea trivial.

Futuro: transferir host al participante conectado más antiguo.

---

## 16. Seguridad realtime

Validar en servidor/RLS/RPC cuando sea posible:

- solo host inicia;
- solo host avanza;
- sala no llena;
- jugador pertenece a sala;
- jugador solo crea su submission;
- no respuestas después de lock;
- no reveal antes de tiempo;
- cliente no se otorga moneda.

---

## 17. Pruebas manuales

- 2 jugadores: no inicia.
- 3 jugadores: inicia.
- 8 jugadores: sala llena.
- jugador 9: error.
- host avanza con faltantes: skips.
- auto-voto funciona.
- resultados iguales para todos.
- moneda guardada para usuario registrado.
