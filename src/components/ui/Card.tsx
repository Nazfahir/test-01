import type { ReactNode } from 'react';

export function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-2xl bg-card p-4 shadow-sm">{children}</section>;
}
