# Orbitas — Product Brief v0.2

## Estado

Versión: 0.2  
Estado: borrador consolidado  
Nombre provisional: **Orbitas**

Este documento define la visión del producto. Debe cambiar poco. Si cambia mucho, probablemente cambió la dirección general del proyecto.

---

## 1. Resumen

**Orbitas** es una PWA mobile-first de socialización gamificada para juntas pequeñas y reuniones donde una persona conoce a parte del grupo, pero no a todos.

La app permite crear salas mediante QR, código o link, entrar como usuario registrado o invitado, jugar una partida corta de 3 rondas y ver al final una representación gráfica del aumento de vínculo entre los participantes.

La visión a largo plazo es que esos vínculos transformen un mundo virtual basado en planetas, órbitas, amistades persistentes y eventos sociales. Para el MVP, el mundo virtual completo queda fuera de alcance.

Loop central del MVP:

> Sala rápida → minijuegos sociales → aumento de vínculo visible → moneda visual persistente → invitación a guardar progreso.

---

## 2. Frase principal

> Juega con tus amigos, conózcanse mejor y ve cómo sus vínculos transforman su mundo virtual.

---

## 3. Problema

A muchas personas les cuesta iniciar conversaciones o integrarse a grupos donde conocen a pocas personas.

Los juegos sociales reducen esa fricción, pero normalmente no dejan una memoria persistente ni ayudan a construir vínculos más allá del momento.

Orbitas busca convertir esas interacciones sociales en progreso visible, primero mediante una representación gráfica del vínculo y recompensas simples, y más adelante mediante un mundo virtual vivo.

---

## 4. Usuario objetivo inicial

Personas jóvenes/adultas que ya tienen algunos amigos, pero sienten fricción al integrarse en grupos donde conocen a poca gente.

Casos típicos:

- Junta pequeña donde alguien solo conoce a una persona.
- Reunión de amigos de amigos.
- Previa, cumpleaños o noche casual.
- Grupo presencial donde hay confianza parcial.
- Personas con ansiedad social leve o dificultad para encontrar temas de conversación.

El MVP no está pensado para conocer desconocidos aleatorios, funcionar como app de citas, reemplazar chats ni convertirse en red social abierta.

---

## 5. Situación principal de uso

La situación principal del MVP es:

> Una reunión presencial de 4 a 6 personas donde algunos jugadores se conocen y otros no.

Límites:

- Mínimo: 3 jugadores.
- Ideal: 4 a 6 jugadores.
- Máximo: 8 jugadores.

Flujo esperado:

1. Una persona crea una sala.
2. La app genera QR, código y link.
3. Los demás entran desde el celular.
4. Los jugadores pueden entrar como invitados sin crear cuenta.
5. El host elige modo: Suave o Fiesta.
6. La app crea automáticamente una playlist de 3 rondas.
7. El grupo juega.
8. La app muestra aumento de vínculo y moneda ganada.
9. Los invitados reciben una invitación a crear cuenta local.

---

## 6. Tono y dirección visual

Orbitas debe sentirse:

- cozy;
- desenfadado;
- algo absurdo;
- cartoon;
- seguro;
- ligero;
- socialmente cálido.

Referencias visuales:

- Animal Crossing;
- Webfishing;
- Tomodachi Life;
- mundos pequeños;
- avatares simples;
- estética 2D con sabor low-poly/cartoon.

Metáfora central:

> Cada persona tiene un planeta. Sus vínculos crean órbitas, rutas, conexiones y sistemas sociales.

Para el MVP basta con planetas/constelaciones/líneas que representen vínculo. No construir mundo virtual completo.

---

## 7. Decisiones confirmadas del MVP

- Nombre provisional: **Orbitas**.
- Plataforma: **PWA mobile-first**.
- Stack: **Next.js + TypeScript + Supabase + Tailwind CSS**.
- Cuenta: **cuenta local**, sin login social en MVP.
- Entrada a sala: QR, código o link.
- Modo de entrada: usuario registrado o invitado temporal.
- Partida: exactamente 3 rondas.
- Playlist: automática.
- Modos: Suave y Fiesta.
- Jugadores: mínimo 3, máximo 8, ideal 4-6.
- Auto-voto: permitido en “Quién es el más probable”.
- No respuesta: se trata como `skipped` y no cuenta para estadísticas de la ronda.
- Moneda: visual inicialmente, pero persistente con monto y origen.
- Mundo virtual completo: fuera del MVP.

---

## 8. Definición de éxito

El MVP funciona si:

> Un grupo de 4-6 personas puede jugar presencialmente, descubrir cosas entre ellos y ver una representación gráfica de ese aumento de “amistad”.

Indicadores cualitativos:

- Los jugadores entienden cómo entrar a la sala.
- La partida puede comenzar sin explicación larga.
- Al menos una pregunta genera conversación.
- El resultado final se entiende.
- El grupo percibe que el vínculo aumentó.
- Al menos una persona quiere jugar otra ronda.

Indicadores cuantitativos iniciales:

- Crear sala e iniciar partida: idealmente menos de 2 minutos.
- Duración de partida: 5-12 minutos.
- Tasa de finalización en pruebas: objetivo inicial sobre 70%.
- Porcentaje de invitados que crean cuenta después: métrica futura.

---

## 9. No objetivos del MVP

Orbitas no es, en su MVP:

- red social abierta;
- app de citas;
- chat;
- juego 3D;
- clon completo de Animal Crossing, Tomodachi Life o Los Sims;
- sistema de matching con desconocidos;
- plataforma de comunidades masivas;
- juego competitivo con rankings globales.

---

## 10. Visión futura

Después del MVP, Orbitas podrá evolucionar hacia:

- planetas personales;
- personalización de planeta/avatar;
- visitantes;
- recuerdos compartidos;
- mudanza simbólica de amigos cercanos;
- amigos de amigos;
- eventos entre avatares;
- economía funcional;
- inventario;
- regalos;
- minijuegos adicionales;
- permisos por respuesta;
- mundo social persistente.
