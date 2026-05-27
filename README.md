# Orbitas Docs v0.2

Este paquete contiene la documentación inicial para construir el MVP de **Orbitas** con Codex.

## Estructura recomendada en el repositorio

```txt
/
  AGENTS.md
  README.md
  /docs
    00-product-brief.md
    01-mvp-scope.md
    02-user-flows.md
    03-technical-architecture.md
    04-data-model.md
    05-realtime-rooms.md
    06-minigames-gdd.md
    07-relationship-system.md
    08-currency-system.md
    09-privacy-and-safety.md
```

## Primer prompt sugerido para Codex

```txt
Lee AGENTS.md y todos los documentos en /docs.

No escribas código todavía.

Quiero construir el MVP de Orbitas. Analiza la documentación y propón:

1. Arquitectura de implementación.
2. Orden de hitos.
3. Riesgos técnicos.
4. Ambigüedades o contradicciones.
5. Primeras tareas pequeñas, cada una pensada para un PR separado.

Respeta estrictamente el alcance del MVP.
```
