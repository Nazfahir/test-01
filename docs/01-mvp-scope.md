# Orbitas — MVP Scope v0.2

## Estado

Versión: 0.2  
Estado: borrador consolidado

Este documento define qué entra y qué queda fuera del MVP. Debe usarse para evitar que Codex implemente funcionalidades de la visión futura demasiado pronto.

---

## 1. Objetivo del MVP

Validar que un grupo pequeño puede:

1. Entrar rápidamente a una sala mediante QR, código o link.
2. Jugar una partida social corta de 3 rondas desde sus celulares.
3. Descubrir cosas sobre los demás.
4. Ver una representación gráfica del aumento de vínculo.
5. Recibir una recompensa visual en moneda del juego.
6. Sentir que la experiencia redujo la fricción social.

El MVP no busca validar todavía el mundo virtual completo.

---

## 2. Plataforma y stack

Incluido:

- PWA mobile-first.
- Navegador móvil moderno.
- Next.js.
- TypeScript.
- Supabase.
- Tailwind CSS.
- Vitest para lógica crítica.

No incluido:

- app nativa iOS/Android;
- desktop app;
- modo offline completo;
- P2P.

---

## 3. Usuarios e invitados

El MVP soporta dos tipos de participante.

### Usuario registrado

- Cuenta local de Orbitas.
- Puede guardar progreso.
- Puede acumular moneda.
- Puede mantener historial básico de partidas.
- Puede asociar vínculo con otros usuarios registrados.

### Invitado temporal

- Puede unirse sin cuenta.
- Debe elegir nombre visible.
- Puede jugar.
- Puede ver resultados.
- Recibe invitación a crear cuenta local al final.

No incluido:

- login con Google, Apple, Discord u otros proveedores;
- perfil público completo;
- recuperación avanzada de invitados antiguos;
- configuración completa de privacidad.

---

## 4. Salas

Incluido:

- Crear sala.
- Generar código corto.
- Mostrar QR.
- Compartir link.
- Entrar con QR/código/link.
- Lobby de participantes.
- Host visible.
- Selector de modo Suave/Fiesta.
- Inicio controlado por host.

Límites:

- Mínimo para iniciar: 3 jugadores.
- Máximo por sala: 8 jugadores.
- Grupo ideal: 4-6 jugadores.

No incluido:

- salas públicas globales;
- descubrimiento cercano;
- matchmaking;
- chat;
- moderación avanzada.

---

## 5. Partida MVP

Cada partida tiene exactamente 3 rondas.

La playlist es automática:

1. Una ronda de **Qué prefieres**.
2. Una ronda de **Quién es el más probable**.
3. Una ronda de **No repitas**.

El host solo elige modo:

- Suave.
- Fiesta.

No incluido:

- selección manual de minijuegos;
- cantidad configurable de rondas;
- playlists personalizadas;
- modos Picante o Profundo.

---

## 6. Reglas clave

### Auto-voto

En “Quién es el más probable”, el auto-voto está permitido.

### No respuesta

Si un jugador no responde antes de que el host avance:

- queda como `skipped`;
- no cuenta para estadísticas de la ronda;
- no cuenta como voto, elección, repetición ni respuesta única;
- no recibe lenguaje negativo;
- puede seguir jugando rondas posteriores.

### Host

El host puede avanzar rondas aunque falten respuestas.

---

## 7. Sistema de vínculo

Incluido:

- eventos básicos de vínculo durante partida;
- representación gráfica final;
- persistencia básica para usuarios registrados;
- resultados celebratorios.

Eventos posibles:

- jugar juntos;
- elegir lo mismo;
- votar por alguien;
- recibir votos;
- repetir respuesta;
- completar partida.

No incluido:

- niveles avanzados de amistad;
- mudanza;
- amigos de amigos;
- decaimiento por inactividad;
- solicitudes de amistad.

---

## 8. Moneda

La moneda existe como recompensa visual y dato persistente.

Incluido:

- mostrar moneda ganada al final;
- guardar monto y origen para usuarios registrados;
- opcionalmente guardar recompensa pendiente para invitados;
- usar ledger/transacciones.

No incluido:

- tienda;
- compras;
- inventario;
- intercambio;
- regalos;
- moneda premium;
- pagos reales.

Principio:

> Moneda en MVP significa sensación de progreso, no economía completa.

---

## 9. Resultado final

Debe mostrar:

- participantes;
- aumento de vínculo;
- constelación/planetas/líneas;
- moneda ganada;
- resumen social;
- CTA para crear cuenta si es invitado.

Los resultados deben ser celebratorios, no humillantes.

---

## 10. Persistencia mínima

Guardar:

- usuarios registrados;
- invitados temporales;
- salas;
- participantes;
- partidas;
- rondas;
- prompts;
- respuestas/votos/elecciones/skips;
- eventos de vínculo;
- transacciones de moneda.

---

## 11. Fuera de alcance explícito

No implementar:

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
- comunidades/clanes;
- sistema completo de permisos por respuesta.
