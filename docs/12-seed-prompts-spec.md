# Orbitas — Seed Spec de prompts MVP v0.1

## Estado

Versión: 0.1  
Estado: draft operativo

---

## 1. Objetivo

Definir un formato de seed consistente para prompts de minijuegos del MVP que:

- evite faltantes por `game_type`, `mode` y tamaño de sala;
- permita carga reproducible vía JSON o SQL;
- aplique reglas de contenido seguro alineadas con `09-privacy-and-safety.md`;
- defina fallback cuando no haya prompt elegible.

---

## 2. Alcance MVP

Aplica a los 3 minijuegos MVP:

- `would_you_rather` (Qué prefieres)
- `most_likely_to` (Quién es el más probable)
- `no_repeat` (No repitas)

Y a los 2 modos MVP:

- `suave`
- `fiesta`

No incluye modo `picante` ni `profundo`.

---

## 3. Cantidad mínima para evitar faltantes

> Nota: una partida usa exactamente 3 rondas (1 por minijuego), pero el seed debe soportar rotación y filtros por tamaño de grupo.

### 3.1 Mínimo por combinación (`game_type` + `mode`)

Mínimo recomendado por combinación:

- `would_you_rather` + `suave`: **24** prompts activos
- `would_you_rather` + `fiesta`: **24** prompts activos
- `most_likely_to` + `suave`: **24** prompts activos
- `most_likely_to` + `fiesta`: **24** prompts activos
- `no_repeat` + `suave`: **24** prompts activos
- `no_repeat` + `fiesta`: **24** prompts activos

Total mínimo base: **144 prompts activos**.

Racional:

- permite rotación sin repetición frecuente entre salas;
- tolera desactivaciones (`is_active = false`);
- tolera filtros por tamaño de sala (`min_players`/`max_players`).

### 3.2 Cobertura por tamaño de sala

Dentro de cada combinación (`game_type` + `mode`), garantizar como mínimo:

- **8** prompts válidos para `3-4` jugadores;
- **8** prompts válidos para `5-6` jugadores;
- **8** prompts válidos para `7-8` jugadores.

Un prompt puede cubrir más de un rango si su `min_players`/`max_players` lo permite (ej. `3-8`).

---

## 4. Esquema canónico de datos

Campos mínimos por prompt:

- `game_type`: enum de minijuego MVP.
- `mode`: `suave | fiesta`.
- `text`: enunciado visible del prompt.
- `options`: arreglo JSON de opciones (puede ser vacío según juego).
- `min_players`: mínimo de jugadores para habilitar el prompt.
- `max_players`: máximo de jugadores para habilitar el prompt.
- `is_active`: bandera para habilitar/deshabilitar sin borrar.

Campos recomendados (operación):

- `locale`: p. ej. `es-AR`.
- `content_tags`: etiquetas internas (ej. `humor_blanco`, `caotico`).
- `safety_version`: versión de política aplicada al curado.
- `created_at` / `updated_at`.

### Reglas por campo

- `text`: obligatorio, no vacío, longitud recomendada `<= 180`.
- `options`:
  - obligatorio para `would_you_rather` (exactamente 2 opciones);
  - para `most_likely_to` y `no_repeat`, usar `[]`.
- `min_players`/`max_players`:
  - MVP permitido: `3 <= min_players <= max_players <= 8`;
  - no sembrar prompts fuera del rango MVP.
- `is_active`: default `true`.

---

## 5. Formato de carga JSON

Formato recomendado de archivo (`docs/examples/prompts.seed.json`):

```json
[
  {
    "game_type": "would_you_rather",
    "mode": "suave",
    "text": "¿Qué prefieres para una tarde de lluvia?",
    "options": ["Maratón de pelis", "Cocinar algo raro"],
    "min_players": 3,
    "max_players": 8,
    "is_active": true
  },
  {
    "game_type": "most_likely_to",
    "mode": "fiesta",
    "text": "¿Quién es más probable que invente un baile nuevo en 10 segundos?",
    "options": [],
    "min_players": 4,
    "max_players": 8,
    "is_active": true
  }
]
```

Validaciones mínimas en import:

1. enums válidos (`game_type`, `mode`);
2. `text` no vacío;
3. `options` según regla de juego;
4. rango de jugadores válido;
5. `is_active` boolean.

---

## 6. Formato de carga SQL (Supabase/Postgres)

Ejemplo orientativo:

```sql
insert into public.prompts (
  game_type,
  mode,
  text,
  options,
  min_players,
  max_players,
  is_active
)
values
  (
    'would_you_rather',
    'suave',
    '¿Qué prefieres para una tarde de lluvia?',
    '["Maratón de pelis", "Cocinar algo raro"]'::jsonb,
    3,
    8,
    true
  ),
  (
    'most_likely_to',
    'fiesta',
    '¿Quién es más probable que invente un baile nuevo en 10 segundos?',
    '[]'::jsonb,
    4,
    8,
    true
  );
```

Recomendado para idempotencia de seed:

- definir una `unique key` funcional por (`game_type`, `mode`, `text`);
- usar `upsert` para evitar duplicados en re-seed.

---

## 7. Reglas de contenido seguro (alineadas a 09)

### 7.1 Permitido por modo

- `suave`: preferencias cotidianas, humor blanco, dilemas ligeros.
- `fiesta`: humor absurdo/social caótico, sin explicitud.

### 7.2 Prohibido en ambos modos

No sembrar prompts sobre:

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

### 7.3 Reglas editoriales de tono

Todo prompt debe ser:

- socialmente cálido;
- no humillante;
- no punitivo;
- apto para grupo mixto de confianza media.

Además:

- evitar formulaciones que presionen a revelar datos sensibles;
- evitar lenguaje de derrota social en resultados derivados del prompt.

---

## 8. Criterio de selección en runtime

Un prompt es elegible si cumple:

1. coincide con `game_type` de la ronda;
2. coincide con `mode` de la sala;
3. `is_active = true`;
4. `min_players <= player_count <= max_players`;
5. no fue usado previamente en la partida actual.

Recomendado:

- selección aleatoria uniforme entre elegibles;
- logging de descarte (solo técnico, sin PII sensible).

---

## 9. Fallback cuando no hay prompt disponible

Fallback MVP (orden estricto):

1. **Reintento sin historial de partida**: permitir repetición dentro de la misma partida solo si no existe elegible no usado.
2. **Expandir rango de jugadores de forma controlada**:
   - permitir prompts con diferencia máxima de `±1` jugador respecto al `player_count`;
   - nunca salir del rango absoluto MVP `3-8`.
3. **Fallback canónico por combinación**:
   - usar un prompt “safe default” pre-curado para cada (`game_type`, `mode`), siempre activo.
4. **Fail-safe de UX**:
   - si todo falla, mostrar mensaje neutro (“Estamos alineando la constelación…”) y avanzar a siguiente ronda sin penalizar.

Reglas del fallback:

- no saltar a otro `mode`;
- no saltar a otro `game_type`;
- no cargar contenido fuera de política de seguridad;
- registrar evento técnico para reposición de catálogo.

---

## 10. Checklist de aceptación del seed

- [ ] Cada combinación (`game_type` + `mode`) tiene al menos 24 prompts activos.
- [ ] Hay cobertura 3-4, 5-6, 7-8 por combinación.
- [ ] 100% de prompts cumplen reglas de contenido seguro.
- [ ] Existe al menos 1 “safe default” por combinación.
- [ ] El import JSON/SQL pasa validaciones.
- [ ] Re-seed no duplica registros (idempotente).

---

## 11. Próximos pasos sugeridos (no bloqueantes)

- Script de validación de seed en CI (conteo + seguridad básica por keywords).
- Tabla de auditoría de curation (`curated_by`, `reviewed_at`, `safety_notes`).
- Métrica de cobertura real por combinación en producción.
