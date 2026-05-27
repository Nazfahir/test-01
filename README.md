# Orbitas MVP - Base técnica

Scaffold inicial del MVP mobile-first con Next.js + TypeScript + Supabase + Tailwind + Vitest.

## Requisitos

- Node.js 20+
- npm 10+

## Instalación

```bash
npm install
```

## Desarrollo local

```bash
npm run dev
```

## Checks

```bash
npm run lint
npm run typecheck
npm test
```

## Variables de entorno

1. Copia `.env.example` a `.env.local`.
2. Completa valores del proyecto Supabase.

```bash
cp .env.example .env.local
```

### Variables públicas (cliente + servidor)

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon key para operaciones permitidas por RLS.

### Variables privadas (solo servidor)

- `SUPABASE_SERVICE_ROLE_KEY`: service role key para tareas server-only.

> Regla: nunca usar `SUPABASE_SERVICE_ROLE_KEY` en client components ni exponerla al navegador.

## Integración base de Supabase

Utilidades centralizadas:

- Browser client: `getSupabaseBrowserClient` desde `@/lib/supabase`.
- Server client (cookies-aware): `getSupabaseServerClient` desde `@/lib/supabase`.
- Service role client (server-only): `getSupabaseServiceRoleClient` desde `@/lib/supabase`.

La validación de entorno está centralizada en `src/lib/env.ts` y falla rápido con mensajes claros si falta configuración crítica.

## Check técnico mínimo

Con el servidor corriendo, valida wiring/config con:

```bash
curl http://localhost:3000/api/health/config
```

Debe responder `status: "ok"` y flags `supabase.configured/hasUrl/hasAnonKey` en `true`.

## Enlazar proyecto Supabase (referencia rápida)

1. Crear proyecto en Supabase.
2. Copiar `Project URL` y `anon key` en `.env.local`.
3. Copiar `service_role key` en `.env.local` como variable privada server-only.

> Esta base solo prepara wiring técnico. No implementa lógica de auth, salas, juego, vínculo ni moneda todavía.

## Migraciones de base de datos (Supabase)

Con Supabase CLI instalado y el proyecto linkeado:

```bash
supabase db reset
```

Aplica todas las migraciones locales (incluyendo schema MVP inicial y seed técnico de prompts).

Para crear nuevas migraciones:

```bash
supabase migration new <nombre_migracion>
```

Para revertir en local, la vía recomendada en este MVP es reconstruir la DB local con `supabase db reset` (drop + recreate + reapply migrations).
