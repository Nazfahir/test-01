# AGENTS.md

## Proyecto

Estamos construyendo **Orbitas**, una PWA mobile-first de socialización gamificada.

Orbitas permite que grupos pequeños creen salas mediante QR, código o link para jugar minijuegos sociales. El objetivo inicial es reducir la fricción social, ayudar a que las personas se conozcan mejor y mostrar una representación gráfica del aumento de vínculo entre jugadores.

La visión futura incluye mundos virtuales basados en planetas, órbitas, visitantes, recuerdos y vínculos persistentes. Esa visión NO debe implementarse en el MVP salvo que una tarea lo indique explícitamente.

---

## Stack confirmado

Usar:

- Next.js
- TypeScript
- Supabase
- Tailwind CSS
- Vitest

No cambiar el stack principal sin explicar el motivo y pedir aprobación.

---

## Documentos relevantes

Antes de implementar features importantes, leer los documentos relevantes en `/docs`:

- `00-product-brief.md`
- `01-mvp-scope.md`
- `02-user-flows.md`
- `03-technical-architecture.md`
- `04-data-model.md`
- `05-realtime-rooms.md`
- `06-minigames-gdd.md`
- `07-relationship-system.md`
- `08-currency-system.md`
- `09-privacy-and-safety.md`

Si existe una contradicción entre documentos, detenerse y reportarla antes de implementar.

---

## Decisiones confirmadas

- Nombre provisional: Orbitas.
- Plataforma: PWA mobile-first.
- Stack: Next.js + TypeScript + Supabase + Tailwind.
- Cuenta: local, sin login social en MVP.
- Sala: QR, código o link.
- Jugadores: mínimo 3, máximo 8, ideal 4-6.
- Partida: exactamente 3 rondas.
- Playlist: automática.
- Modos: Suave y Fiesta.
- Minijuegos: Qué prefieres, Quién es el más probable, No repitas.
- Auto-voto: permitido.
- No respuesta: `skipped`, no cuenta en estadísticas de ronda.
- Moneda: visual, pero persistente con ledger/origen.
- Mundo virtual completo: fuera del MVP.

---

## Prioridad del MVP

El MVP debe enfocarse en:

1. Crear salas mediante QR/código/link.
2. Permitir entrada como usuario registrado o invitado.
3. Mostrar lobby de participantes.
4. Permitir que el host elija modo Suave o Fiesta.
5. Generar playlist automática de 3 rondas.
6. Jugar una ronda de cada minijuego MVP.
7. Tratar no-respuestas como `skipped`.
8. Permitir auto-voto en “Quién es el más probable”.
9. Mostrar representación gráfica del aumento de vínculo.
10. Mostrar recompensa visual en moneda.
11. Guardar moneda con monto y origen para usuarios registrados.
12. Invitar a invitados a crear cuenta local al final.

---

## Fuera de alcance del MVP

No implementar todavía:

- mundo virtual completo;
- planetas personalizables;
- visitantes;
- recuerdos desbloqueados;
- mudanza de amigos;
- amigos de amigos;
- economía funcional;
- tienda;
- inventario;
- intercambio;
- chat;
- app nativa;
- P2P;
- IA de avatares;
- eventos autónomos;
- modos Picante y Profundo;
- preguntas creadas por usuarios;
- ranking global;
- comunidades o clanes;
- matchmaking con desconocidos;
- salas públicas cercanas;
- sistema completo de permisos por respuesta;
- login social con Google/Apple/Discord.

Si una tarea parece requerir algo de esta lista, proponer una alternativa mínima compatible con el MVP.

---

## Reglas de implementación

- Trabajar en TypeScript.
- Mantener cambios pequeños y revisables.
- No introducir dependencias nuevas sin justificar.
- No implementar funcionalidades fuera del alcance de la tarea.
- Separar lógica de juego de componentes visuales.
- Separar estado temporal de sala de datos persistentes.
- Centralizar cálculos de vínculo y moneda.
- Evitar lógica duplicada.
- Priorizar claridad sobre optimización prematura.
- Agregar tests para lógica crítica.
- Mantener UI mobile-first.
- No guardar datos sensibles innecesarios.

---

## Tono

La experiencia debe sentirse:

- cozy;
- desenfadada;
- algo absurda;
- cartoon;
- segura;
- ligera;
- socialmente cálida.

Evitar lenguaje humillante, competitivo en exceso o demasiado serio.

---

## Skips

Si un jugador no responde y el host avanza:

- marcar como `skipped`;
- no contar para estadísticas de esa ronda;
- no tratar como error;
- no penalizar con lenguaje negativo.

Los cálculos de vínculo y moneda deben ignorar skips para eventos específicos de ronda.

---

## Auto-voto

En “Quién es el más probable”, el auto-voto está permitido.

No validar como error:

```txt
voter_participant_id === target_participant_id
```

---

## Moneda

La moneda existe en el MVP como recompensa visual, pero debe guardarse de forma persistente para usuarios registrados.

Guardar, cuando aplique:

- usuario;
- monto;
- origen;
- partida;
- sala;
- ronda;
- tipo de evento;
- timestamp.

No implementar tienda, compras, inventario ni economía real todavía.

---

## Invitados

Los invitados deben poder:

- entrar a sala sin crear cuenta;
- elegir nombre visible;
- jugar una partida;
- ver resultados;
- recibir invitación a crear cuenta local al final.

No asumir que todo participante tiene cuenta.

---

## Privacidad

Reglas iniciales:

- No exponer respuestas fuera del contexto de la sala.
- No crear perfiles públicos completos.
- No guardar información sensible innecesaria.
- Evitar prompts sensibles en el MVP.
- Prever que en el futuro cada respuesta pueda tener nivel de acceso o permiso.

---

## Antes de modificar código

Para tareas grandes o ambiguas, primero responder con:

1. Qué entendiste.
2. Qué archivos planeas revisar.
3. Qué archivos esperas modificar.
4. Qué está dentro de alcance.
5. Qué queda fuera de alcance.
6. Riesgos o ambigüedades.

No modificar código hasta que el plan sea claro.

---

## Al terminar una tarea

Reportar:

1. Resumen de cambios.
2. Archivos modificados.
3. Comandos ejecutados.
4. Resultado de lint/typecheck/tests.
5. Riesgos o pendientes.
6. Cómo probar manualmente si aplica.

---

## Comandos esperados

Usar los comandos definidos en `package.json`.

Comandos esperados cuando existan:

```bash
npm run lint
npm run typecheck
npm test
npm run dev
```

---

## Regla de oro

Construir primero el loop jugable mínimo:

> Sala rápida → partida de 3 rondas → resultado de vínculo → moneda visual persistente → invitación a guardar progreso.

Todo lo demás debe esperar.
