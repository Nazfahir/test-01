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

Crear `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

> Esta base solo prepara wiring técnico. No implementa lógica de auth, salas, juego, vínculo ni moneda todavía.
