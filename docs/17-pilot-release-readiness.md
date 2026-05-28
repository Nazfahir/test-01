# Pilot Release Readiness (MVP)

Fecha: 2026-05-28.  
Owner sugerido: Producto + Ingeniería + Operaciones MVP.

Este documento define un proceso operativo de **Go/No-Go** para lanzar un piloto con riesgo controlado del MVP de Orbitas, sin agregar nuevas features de producto.

---

## 1) Go/No-Go pre-lanzamiento

> Resultado esperado: cada check queda en ✅ (Go), ⚠️ (Go condicional) o ❌ (No-Go).

### 1.1 Configuración de entorno

- [ ] Variables requeridas cargadas en entorno de despliegue (`production` o `pilot`) y verificadas manualmente:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (solo backend/server actions)
  - [ ] URL base pública correcta para links QR/invitación
- [ ] Validar que no hay claves de desarrollo en entorno de piloto.
- [ ] Validar que cookies/sesión de invitado funcionan en dominio real del piloto.

**No-Go inmediato** si faltan variables críticas o hay mezcla de claves dev/prod.

### 1.2 Migraciones + RLS

- [ ] Migraciones DB aplicadas en el entorno objetivo.
- [ ] Políticas RLS activas para tablas de sala/partida/resultados/ledger.
- [ ] Validación rápida de acceso:
  - [ ] participante activo puede leer su sala;
  - [ ] no participante no puede leer datos de sala;
  - [ ] writes sensibles pasan por server action/RPC.

**No-Go inmediato** si RLS permite lectura cruzada o escritura no autorizada.

### 1.3 Dataset mínimo de prompts

- [ ] Dataset activo para ambos modos: `suave` y `fiesta`.
- [ ] Cobertura mínima de tipos de minijuego MVP:
  - [ ] `que_prefieres`
  - [ ] `quien_es_mas_probable`
  - [ ] `no_repitas`
- [ ] Validar que playlist automática de 3 rondas puede construirse sin fallback roto.

**No-Go** si falta cobertura de prompts para algún modo/tipo requerido por MVP.

### 1.4 Rutas críticas operativas

- [ ] `/` o entry principal permite crear sala.
- [ ] `join` por código/link funciona.
- [ ] `lobby` refleja participantes y estado host.
- [ ] `play` permite secuencia lock/reveal/advance en 3 rondas.
- [ ] `results` muestra vínculo + recompensa visual + CTA conversión invitado.

### 1.5 Calidad base

Ejecutar en commit candidato:

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`

**Go** solo si todo está en verde (o excepción explícitamente aprobada por ingeniería responsable).

---

## 2) Smoke test operativo reproducible (10–15 min)

> Objetivo: validar loop jugable mínimo real del MVP antes de abrir tráfico del piloto.

### Preparación (2 min)

- 3 clientes (3 tabs o 2 dispositivos + 1 tab):
  - Cliente A: host (registrado)
  - Cliente B: jugador registrado
  - Cliente C: invitado
- Confirmar red estable y consola limpia de errores críticos.

### Pasos + criterio pass/fail

1. **Crear sala (A)**
   - Acción: crear sala nueva.
   - Esperado: código/link visible y sala en estado `lobby`.
   - Pass: sala creada y compartible.
   - Fail: error de creación o estado inválido.

2. **Join registrado (B)**
   - Acción: entrar con código/link.
   - Esperado: B aparece en lobby.
   - Pass: join exitoso, sin duplicados.
   - Fail: rechazo inesperado o desincronización.

3. **Join invitado (C)**
   - Acción: entrar como invitado con nombre visible.
   - Esperado: C aparece en lobby como invitado activo.
   - Pass: join exitoso y tipo invitado correcto.
   - Fail: no permite entrar o crea identidad inválida.

4. **Iniciar partida (A host)**
   - Acción: elegir modo (`suave` o `fiesta`) e iniciar.
   - Esperado: transición a `play` y ronda 1 activa.
   - Pass: `startMatch` exitoso.
   - Fail: error de inicio o mismatch de estado entre clientes.

5. **Completar 3 rondas**
   - Acción: responder, lock/reveal/advance hasta ronda 3.
   - Esperado: secuencia completa sin bloqueo.
   - Pass: 3 rondas terminadas y navegación a resultados.
   - Fail: freeze de flujo, reveal inconsistente o avance imposible.

6. **Ver resultados**
   - Acción: abrir pantalla de resultados en A/B/C.
   - Esperado: vínculo representado + recompensa visual visible.
   - Pass: resultados consistentes entre clientes.
   - Fail: datos faltantes/inconsistentes.

7. **Verificación rápida de persistencia (operador)**
   - Acción: revisar registros básicos en DB/observabilidad:
     - `match` finalizado
     - al menos 1 actualización de vínculo
     - al menos 1 grant de moneda para usuario registrado
   - Pass: persistencia consistente sin errores críticos.
   - Fail: ledger ausente o escritura clave fallida.

### Criterio final del smoke

- **PASS global**: 7/7 pasos en pass.
- **FAIL global (No-Go)**: falla en pasos 1, 3, 4, 5 o 7.
- **Go condicional**: falla menor en UX no bloqueante + mitigación definida + owner asignado.

---

## 3) Runbook de incidentes MVP (respuesta rápida)

Tiempo objetivo inicial:
- Detección: < 5 min
- Mitigación temporal: < 15 min
- Decisión de escalamiento: < 30 min

### Incidente A · No se puede unir a sala

- **Síntomas**: tasa de `room_join_failed` elevada, quejas de “código inválido/sala inaccesible”.
- **Diagnóstico rápido**:
  1. verificar estado de sala (`lobby`, cupo, expiración);
  2. validar claves/URL deploy correctas;
  3. revisar errores de server action join.
- **Mitigación temporal**:
  - pausar difusión de nuevos links;
  - crear salas manualmente para grupos afectados;
  - reiniciar clientes con código nuevo.
- **Escalamiento**:
  - ingeniería backend si error > 10 min;
  - producto/comunidad si impacto > 3 grupos concurrentes.

### Incidente B · Realtime desincronizado

- **Síntomas**: estados distintos entre clientes (lobby/play/ronda), participantes duplicados/fantasma.
- **Diagnóstico rápido**:
  1. comparar snapshot DB vs estado cliente;
  2. revisar reconexiones websocket;
  3. validar timestamps `updated_at/last_seen_at`.
- **Mitigación temporal**:
  - instruir refresh controlado de clientes;
  - host pausa avance hasta rehidratar snapshot;
  - si persiste, cerrar sala y recrear.
- **Escalamiento**: ingeniería frontend+realtime inmediatamente.

### Incidente C · Host desconectado

- **Síntomas**: partida no avanza; no-host ven bloqueo de controles.
- **Diagnóstico rápido**:
  1. confirmar presencia host;
  2. confirmar sesión host no expirada;
  3. revisar conectividad host.
- **Mitigación temporal**:
  - reconectar host en < 3 min;
  - si no vuelve, finalizar sala y reiniciar sesión de juego nueva.
- **Escalamiento**: soporte operativo + ingeniería si recurrente.

### Incidente D · `startMatch` falla

- **Síntomas**: lobby no transiciona a partida tras iniciar.
- **Diagnóstico rápido**:
  1. validar mínimo 3 participantes;
  2. validar modo seleccionado;
  3. validar disponibilidad prompts + error backend.
- **Mitigación temporal**:
  - reintento único controlado;
  - recrear sala si quedó estado inconsistente;
  - cambiar modo solo si dataset incompleto en uno.
- **Escalamiento**: backend (acciones/RPC) + datos prompts.

### Incidente E · Reveal inconsistente

- **Síntomas**: respuestas/resultados de ronda no coinciden entre clientes.
- **Diagnóstico rápido**:
  1. revisar estado `round_locked/revealed/finished` en DB;
  2. verificar orden de eventos;
  3. revisar duplicidad de submissions.
- **Mitigación temporal**:
  - host no avanza hasta sincronizar;
  - refresh en todos los clientes;
  - si no converge, cerrar ronda con criterio operativo y seguir.
- **Escalamiento**: frontend state + backend de ronda.

### Incidente F · Moneda no persistida

- **Síntomas**: recompensa visual aparece pero ledger no guarda para registrados.
- **Diagnóstico rápido**:
  1. validar evento `currency_grant_fail`;
  2. revisar inserción ledger/idempotencia;
  3. confirmar usuario registrado (no invitado).
- **Mitigación temporal**:
  - registrar compensación manual en backlog de grants;
  - comunicar “recompensa en verificación” al usuario piloto.
- **Escalamiento**: backend persistencia/DB.

### Incidente G · Conversión de invitado fallida

- **Síntomas**: CTA final no completa creación de cuenta local o claim de progreso.
- **Diagnóstico rápido**:
  1. revisar flujo de alta local;
  2. revisar mapeo guest-session → user;
  3. revisar errores de claim/reward.
- **Mitigación temporal**:
  - guardar referencia de sesión invitado;
  - instruir reintento en canal de soporte;
  - ejecutar recuperación manual si aplica.
- **Escalamiento**: auth local + onboarding.

---

## 4) Métricas mínimas del piloto (observabilidad básica)

### Eventos mínimos a instrumentar/monitorear

- `room_created`
- `room_join_succeeded`
- `room_join_failed`
- `match_started`
- `round_locked`
- `round_revealed`
- `round_finished`
- `match_finished`
- `results_viewed`
- `guest_conversion_attempt`
- `guest_conversion_success`
- `guest_conversion_fail`
- `currency_grant_success`
- `currency_grant_fail`

### Umbrales iniciales de alerta (MVP piloto)

Medir en ventana móvil de 30 minutos con mínimo N=20 intentos cuando aplique.

- Join fail rate = `room_join_failed / (room_join_succeeded + room_join_failed)`
  - ⚠️ alerta: > 5%
  - 🚨 crítica: > 10%
- Start fail rate = intentos inicio fallidos / intentos inicio totales
  - ⚠️ > 3%
  - 🚨 > 7%
- Match completion rate = `match_finished / match_started`
  - ⚠️ < 80%
  - 🚨 < 65%
- Currency grant fail rate = `currency_grant_fail / (currency_grant_success + currency_grant_fail)`
  - ⚠️ > 2%
  - 🚨 > 5%
- Guest conversion technical fail rate = `guest_conversion_fail / guest_conversion_attempt`
  - ⚠️ > 8%
  - 🚨 > 15%

### Regla operativa

Si cualquier umbral 🚨 se mantiene por 15 minutos consecutivos: activar kill-switch operativo y pasar a modo contención.

---

## 5) Rollback / kill-switch operativo

Objetivo: reducir impacto sin corromper sesiones en curso.

### Switches operativos recomendados

- **KS1: Pause room creation**
  - Efecto: bloquea creación de salas nuevas.
  - No afecta partidas ya iniciadas.
- **KS2: Pause match start**
  - Efecto: permite lobby/join, bloquea `startMatch` temporalmente.
  - Útil cuando la falla está en la transición a juego.
- **KS3: Read-only de contención (último recurso)**
  - Efecto: bloquear acciones críticas mutables nuevas.
  - Mantener acceso de lectura para diagnóstico y cierre ordenado.

### Procedimiento de activación (operaciones)

1. Declarar incidente y severidad en canal operativo.
2. Activar KS1 o KS2 según falla dominante.
3. Comunicar estado a facilitadores del piloto (mensaje corto con ETA).
4. Monitorear métricas por 15 min y confirmar caída de errores.
5. Decidir:
   - mantener contención,
   - desactivar parcial,
   - escalar a rollback total.

### Procedimiento de desactivación

1. Confirmar métricas debajo de umbral ⚠️ por al menos 30 min.
2. Desactivar en orden:
   - primero KS2 (inicio de partida),
   - luego KS1 (creación de salas).
3. Ejecutar smoke test rápido post-desactivación (pasos 1, 4, 5).

### Garantía para sesiones en curso

- No cerrar conexiones activas de salas jugando, salvo riesgo de corrupción.
- Priorizar que partidas ya iniciadas terminen con consistencia.
- Evitar cambios de esquema/config en caliente durante incidentes activos.

---

## 6) Alcance recomendado del piloto

- **Tamaño sugerido**: 10–20 grupos totales (4–6 personas por grupo).
- **Sesiones objetivo**: 20–40 partidas completas.
- **Duración sugerida**: 1–2 semanas (ideal 10 días corridos con ventanas supervisadas).
- **Perfil objetivo**:
  - grupos presenciales pequeños;
  - contexto social casual (amigos/compañeros);
  - facilitador disponible para soporte ligero.

### Objetivos de validación del piloto

1. Validar estabilidad del loop completo de 3 rondas.
2. Medir comprensión del flujo (crear/join/jugar/resultados).
3. Confirmar percepción social positiva (cozy, ligera, no humillante).
4. Verificar robustez mínima de ledger de moneda y conversión invitado.

---

## 7) Criterios de éxito y salida del piloto

### KPIs mínimos para avanzar a siguiente fase

- Start success rate ≥ 95%.
- Match completion rate ≥ 80%.
- Errores críticos (P0/P1) ≤ 1 por cada 20 partidas.
- Recuperación de reconexión satisfactoria en ≥ 90% de casos observados.
- Feedback cualitativo:
  - ≥ 70% reporta claridad de flujo;
  - ≥ 70% reporta tono social cálido/divertido.

### Decisiones al cierre

- **Avanzar**: se cumplen KPIs y no hay riesgo crítico abierto.
- **Extender piloto** (1 semana extra): KPIs borderline pero tendencia positiva + plan de fixes claro.
- **Pausar**: breach de umbrales críticos sostenidos o incidentes de seguridad/privacidad.
- **Iterar antes de reabrir**: fallas recurrentes en join/start/completion o persistencia de moneda.

---

## 8) Plantilla de decisión Go/No-Go (resumen ejecutivo)

- Fecha/hora de evaluación:
- Build/commit:
- Responsable decisión:

### Estado checks

- Entorno/config: ✅/⚠️/❌
- Migraciones + RLS: ✅/⚠️/❌
- Dataset prompts: ✅/⚠️/❌
- Rutas críticas: ✅/⚠️/❌
- Lint/typecheck/test: ✅/⚠️/❌
- Smoke test: ✅/⚠️/❌

### Decisión

- [ ] GO
- [ ] GO CONDICIONAL (mitigaciones + owner + fecha)
- [ ] NO-GO

### Notas / riesgos abiertos

- 
