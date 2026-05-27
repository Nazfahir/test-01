# Orbitas — Minigames GDD v0.2

## Estado

Versión: 0.2  
Estado: borrador consolidado

---

## 1. Objetivo

Los minijuegos no existen principalmente para competir. Su objetivo es:

- reducir fricción social;
- generar conversación;
- descubrir gustos, percepciones y humor;
- crear eventos medibles para vínculo;
- otorgar moneda visual.

---

## 2. Partida MVP

Cada partida contiene exactamente 3 rondas:

1. **Qué prefieres**.
2. **Quién es el más probable**.
3. **No repitas**.

El host solo elige modo:

- Suave.
- Fiesta.

---

## 3. Reglas comunes

- Jugadores: 3 a 8.
- Respuestas ocultas hasta reveal.
- Host puede avanzar.
- Si alguien no responde, queda `skipped`.
- `skipped` no cuenta en estadísticas específicas de la ronda.
- Resultados deben ser celebratorios.

---

## 4. Qué prefieres

### Objetivo

Jugadores eligen entre dos opciones y se revelan coincidencias.

### Flujo

1. Mostrar pregunta y dos opciones.
2. Cada jugador elige una opción.
3. Elecciones quedan ocultas.
4. Host avanza.
5. Faltantes quedan `skipped`.
6. Reveal muestra grupos por opción.
7. Se calculan vínculo y moneda.

### Eventos sugeridos

- `same_choice`: jugadores que eligieron lo mismo.
- `played_together`: todos los participantes activos.
- bonus grupal si todos eligieron lo mismo.

### Ejemplos Suave

- ¿Qué prefieres: playa o montaña?
- ¿Qué prefieres: café o té?
- ¿Qué prefieres: película o serie?

### Ejemplos Fiesta

- ¿Qué prefieres: poder hablar con patos o que los patos hablen de ti?
- ¿Qué prefieres: casa embrujada gratis o arriendo eterno?
- ¿Qué prefieres: música dramática al entrar o aplausos al salir?

---

## 5. Quién es el más probable

### Objetivo

Jugadores votan quién del grupo es más probable que haga o viva una situación.

### Flujo

1. Mostrar prompt.
2. Cada jugador vota por alguien.
3. Auto-voto permitido.
4. Votos quedan ocultos.
5. Host avanza.
6. Faltantes quedan `skipped`.
7. Reveal muestra votos y más votados.
8. Se calculan vínculo y moneda.

### Eventos sugeridos

- `voted_for_player`: votante → votado.
- `received_vote`: jugador recibió voto.
- `played_together`: todos.

### Ejemplos Suave

- ¿Quién es más probable que llegue con snacks para todos?
- ¿Quién es más probable que se haga amigo de un animal callejero?
- ¿Quién es más probable que organice una junta improvisada?

### Ejemplos Fiesta

- ¿Quién es más probable que arruine una misión secreta por reírse?
- ¿Quién es más probable que intente hablar con extraterrestres primero?
- ¿Quién es más probable que se convierta en alcalde de una fiesta?

---

## 6. No repitas

### Objetivo

Jugadores responden a un prompt intentando no repetir respuestas.

### Flujo

1. Mostrar prompt.
2. Cada jugador escribe respuesta corta.
3. Respuestas quedan ocultas.
4. Host avanza.
5. Faltantes quedan `skipped`.
6. Reveal muestra respuestas únicas y repetidas.
7. Se calculan vínculo y moneda.

### Reglas técnicas

Comparación MVP:

- pasar a minúsculas;
- quitar espacios extra;
- opcionalmente quitar tildes;
- comparación exacta normalizada.

No implementar detección semántica avanzada.

### Eventos sugeridos

- `repeated_answer`: quienes repitieron.
- `unique_answer_bonus`: respuesta única.
- `played_together`: todos.

### Ejemplos Suave

- Nombra una fruta.
- Nombra una comida para picnic.
- Nombra una película para ver un domingo.

### Ejemplos Fiesta

- Nombra algo que llevarías a una fiesta en otro planeta.
- Nombra una excusa mala para llegar tarde.
- Nombra un poder mágico poco conveniente.

---

## 7. Vínculo inicial sugerido

Valores provisionales:

```txt
played_together: +1
same_choice: +2
voted_for_player: +1
repeated_answer: +1
completed_match: +2
```

Debe estar centralizado y testeado.

---

## 8. Moneda inicial sugerida

Valores provisionales:

```txt
round_completed: +5
match_completed: +20
same_choice_bonus: +2
unique_answer_bonus: +3
received_vote_bonus: +1 por voto
group_bonus: +5
```

Moneda visual, persistente, sin tienda.

---

## 9. Fuera de alcance

No implementar:

- preguntas generadas por IA;
- preguntas creadas por usuarios;
- modo Picante;
- modo Profundo;
- retos físicos;
- drinking game explícito;
- rankings globales;
- integración con mundo virtual.
