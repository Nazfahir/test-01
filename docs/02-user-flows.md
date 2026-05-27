# Orbitas — User Flows v0.2

## Estado

Versión: 0.2  
Estado: borrador inicial

Este documento describe los flujos principales del MVP.

---

## 1. Roles

### Host

Crea sala, comparte QR/código/link, elige modo, inicia partida y avanza rondas.

### Usuario registrado

Tiene cuenta local, puede entrar a salas, jugar y guardar moneda/progreso.

### Invitado

Puede entrar sin cuenta, elegir nombre visible, jugar y ver resultados. Al final recibe invitación para crear cuenta local.

---

## 2. Rutas sugeridas

```txt
/
/auth/login
/auth/register
/rooms/create
/rooms/join
/rooms/[roomCode]
/rooms/[roomCode]/lobby
/rooms/[roomCode]/play
/rooms/[roomCode]/results
/profile
```

La estructura puede ajustarse, pero el flujo debe mantenerse simple.

---

## 3. Crear sala

1. Usuario abre Orbitas.
2. Presiona “Crear sala”.
3. App crea sala.
4. App crea participante host.
5. App genera QR, código y link.
6. Host entra al lobby.

Criterios:

- La sala inicia en `lobby`.
- El host aparece como participante.
- Código/QR/link son visibles.
- La sala permite máximo 8 jugadores.

---

## 4. Unirse como invitado

1. Jugador escanea QR o abre link.
2. App carga sala.
3. Si no tiene sesión, ofrece entrar como invitado.
4. Jugador ingresa nombre visible.
5. App valida que la sala exista, esté en lobby y no esté llena.
6. Invitado entra al lobby.

Criterios:

- No requiere cuenta.
- Nombre visible no puede estar vacío.
- Si sala está llena, mostrar error.
- Si partida ya empezó, no entrar como jugador activo.

---

## 5. Unirse como usuario registrado

1. Usuario abre QR/link/código.
2. Si no tiene sesión, inicia sesión local.
3. App lo agrega como participante registrado.
4. Aparece en lobby.
5. Juega partida.
6. Al final, moneda y eventos se guardan.

---

## 6. Lobby

Debe mostrar:

- código/QR/link;
- participantes;
- host;
- estado de conexión básico;
- selector de modo Suave/Fiesta solo para host;
- botón “Iniciar partida” solo para host.

Reglas:

- mínimo 3 para iniciar;
- máximo 8;
- solo host inicia;
- si faltan jugadores, botón deshabilitado;
- lobby se actualiza en tiempo real.

---

## 7. Selección de modo y playlist

1. Host elige Suave o Fiesta.
2. App genera playlist automática de 3 rondas:
   - Qué prefieres;
   - Quién es el más probable;
   - No repitas.
3. App selecciona prompts activos del modo elegido.
4. App crea partida y rondas.
5. Clientes pasan a pantalla de juego.

---

## 8. Ronda: Qué prefieres

1. Se muestra pregunta con dos opciones.
2. Jugadores eligen una opción.
3. Elecciones quedan ocultas.
4. Host avanza.
5. Quien no respondió queda `skipped`.
6. Reveal muestra grupos por opción y coincidencias.

---

## 9. Ronda: Quién es el más probable

1. Se muestra prompt.
2. Jugadores votan por alguien de la sala.
3. Auto-voto permitido.
4. Votos quedan ocultos.
5. Host avanza.
6. Quien no respondió queda `skipped`.
7. Reveal muestra votos y más votados.

---

## 10. Ronda: No repitas

1. Se muestra prompt.
2. Jugadores escriben respuesta corta.
3. Respuestas quedan ocultas.
4. Host avanza.
5. Quien no respondió queda `skipped`.
6. Reveal muestra respuestas únicas y repetidas.

---

## 11. Resultado final

Debe mostrar:

- constelación o representación visual de vínculo;
- moneda ganada;
- resumen social;
- CTA de crear cuenta local para invitados;
- opción de volver al lobby o jugar otra partida futura.

Textos ejemplo:

- “La constelación del grupo se fortaleció.”
- “La órbita entre Nico y Vale brilló un poco más.”
- “Ganaste +34 monedas.”

---

## 12. Crear cuenta después de jugar

1. Invitado ve resultados.
2. App ofrece “Guarda tus monedas y progreso”.
3. Invitado crea cuenta local.
4. App intenta asociar recompensa reciente a la cuenta.
5. Usuario vuelve a resultados o perfil.

Si no se puede asociar progreso, mostrar mensaje honesto.

---

## 13. Errores principales

Manejar:

- sala no encontrada;
- sala llena;
- partida ya iniciada;
- conexión perdida;
- host desconectado;
- no hay suficientes jugadores;
- prompt no disponible;
- error al enviar respuesta;
- error al guardar moneda;
- error al crear cuenta.
