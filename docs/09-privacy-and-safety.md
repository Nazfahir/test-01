# Orbitas — Privacy and Safety v0.2

## Estado

Versión: 0.2  
Estado: borrador inicial

---

## 1. Objetivo

Orbitas maneja respuestas, votos y dinámicas sociales. Aunque el MVP no implementa permisos granulares completos, debe evitar exposición innecesaria, incomodidad y presión social.

---

## 2. Principios

- Seguridad por defecto.
- Datos mínimos.
- Respuestas dentro del contexto de sala.
- Resultados celebratorios.
- Diseño preparado para permisos futuros.

---

## 3. Contenido permitido

### Modo Suave

- Preferencias cotidianas.
- Preguntas ligeras.
- Dilemas simples.
- Humor blanco.

### Modo Fiesta

- Humor absurdo.
- Situaciones sociales ridículas.
- Votaciones caóticas.
- No explícito.

---

## 4. Contenido fuera del MVP

No incluir preguntas sobre:

- sexo explícito;
- traumas;
- salud mental sensible;
- política partidista;
- religión conflictiva;
- dinero personal;
- apariencia física de forma crítica;
- violencia realista;
- secretos íntimos;
- actividades ilegales;
- discriminación.

No implementar modo Picante ni Profundo.

---

## 5. Respuestas y visibilidad

Regla MVP:

> Las respuestas se revelan solo dentro de la partida y sala correspondiente.

Antes del reveal:

- no mostrar votos;
- no mostrar elecciones;
- no mostrar respuestas textuales.

Después del reveal:

- participantes de la sala pueden ver resultados de la ronda;
- no exponer fuera de la sala.

---

## 6. Invitados

Invitados:

- no tienen perfil público;
- pueden jugar con nickname;
- pueden ver resultados;
- pueden crear cuenta local al final;
- no deberían quedar rastreados indefinidamente sin necesidad.

Guest sessions deben expirar o minimizarse.

---

## 7. Datos que no se piden en MVP

No pedir:

- nombre real obligatorio;
- edad;
- ubicación;
- género;
- teléfono;
- dirección;
- contactos;
- redes sociales.

Nombre visible puede ser nickname.

---

## 8. Skips

No responder es válido.

Reglas:

- no mostrar “falló”;
- no contar para estadísticas;
- no penalizar socialmente;
- no obligar a responder.

---

## 9. Resultados sociales

Evitar:

- “Nadie te eligió.”
- “Tu amistad es baja.”
- “No conectaste con nadie.”
- “Perdiste.”

Usar:

- “La constelación se movió un poquito.”
- “Hubo coincidencias inesperadas.”
- “El grupo generó energía social.”

---

## 10. Moderación MVP

Moderación avanzada queda fuera.

Mitigaciones iniciales:

- prompts curados;
- sin preguntas creadas por usuarios;
- sin chat;
- salas cerradas por QR/código;
- host controla avance;
- modos seguros.

---

## 11. Permisos futuros

Diseñar pensando en permisos como:

```txt
private
session_only
friends
close_friends
usable_in_trivia
not_usable_in_trivia
```

En MVP, asumir `session_only` para la mayoría de respuestas.

---

## 12. Seguridad técnica mínima

- Validar pertenencia a sala.
- No exponer datos de otras salas.
- No permitir editar respuestas de otros.
- No revelar antes de tiempo.
- No permitir otorgarse moneda desde cliente.
- Usar RLS.
- No exponer service role key en cliente.
