# Orbitas — Relationship System v0.2

## Estado

Versión: 0.2  
Estado: borrador inicial

---

## 1. Objetivo

Convertir interacciones de juego en progreso social visible.

En el MVP, el sistema no intenta modelar relaciones humanas complejas. Solo debe mostrar:

> “Jugar juntos hizo que el vínculo aumentara.”

---

## 2. Principios

- Simple y explicable.
- Celebratorio.
- No terapéutico.
- Sin presión social.
- Sin castigos por inactividad.
- Preparado para mundo futuro.

---

## 3. Alcance MVP

Incluido:

- eventos de vínculo durante partida;
- aumento visual final;
- resumen entre pares/grupo;
- persistencia para usuarios registrados;
- soporte de invitados en sesión.

No incluido:

- niveles avanzados;
- mudanza;
- amigos de amigos;
- decaimiento;
- solicitudes de amistad;
- perfil social público.

---

## 4. Tipos de vínculo

### Vínculo de sesión

Existe durante una sala/partida. Aplica a invitados y usuarios.

### Vínculo persistente

Solo se guarda de forma estable para usuario registrado ↔ usuario registrado.

### Vínculo pendiente

Si un invitado crea cuenta después, se puede intentar asociar parte del progreso reciente.

---

## 5. Eventos

```txt
played_together
same_choice
voted_for_player
received_vote
repeated_answer
completed_match
```

Valores iniciales sugeridos:

```txt
played_together: +1
same_choice: +2
voted_for_player: +1
repeated_answer: +1
completed_match: +2
```

`received_vote` puede usarse para moneda o resultados, no necesariamente para vínculo.

---

## 6. Pares de vínculo

El vínculo se calcula entre pares de participantes.

Para A, B, C:

- A-B;
- A-C;
- B-C.

Eventos grupales se traducen a pares.

---

## 7. Skips

Si un jugador queda `skipped`, no cuenta en eventos específicos de esa ronda.

Ejemplos:

- no eligió en “Qué prefieres”: no participa en `same_choice`;
- no votó: no genera `voted_for_player`;
- no respondió en “No repitas”: no participa en `repeated_answer`.

Puede contar para `completed_match` si llegó al final.

---

## 8. Auto-voto

En “Quién es el más probable”, auto-voto es válido.

Efecto:

- se registra;
- no genera vínculo con otro jugador;
- puede generar resultado individual o moneda si se define;
- no es error.

---

## 9. Visualización

MVP recomendado:

- constelación simple;
- planetas como jugadores;
- líneas como vínculo ganado;
- lista breve de pares destacados.

Textos:

- “La órbita entre Nico y Vale se fortaleció.”
- “El grupo creó una nueva constelación.”
- “Hubo coincidencias inesperadas.”

Evitar:

- “Tu amistad es baja.”
- “Nadie conectó contigo.”
- “Fallaste.”

---

## 10. Persistencia

`relationship_events` es la fuente histórica.

`relationship_summaries` es cache para usuarios registrados.

No guardar resumen persistente entre invitados no convertidos salvo decisión posterior.

---

## 11. Tests

Probar:

- pares correctos para 3-8 jugadores;
- skip no cuenta;
- auto-voto no rompe;
- same_choice suma solo entre coincidencias;
- repeated_answer suma entre repetidos;
- completed_match suma al final.
