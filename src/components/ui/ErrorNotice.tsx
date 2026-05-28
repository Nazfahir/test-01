import Link from 'next/link';
import { getErrorUX, type OrbitasErrorCode } from '@/features/errors/catalog';
const STYLES = { error: 'border-rose-300 bg-rose-50', warning: 'border-amber-300 bg-amber-50', info: 'border-sky-300 bg-sky-50' } as const;
export function ErrorNotice({ code }: { code: OrbitasErrorCode }) {
  const error = getErrorUX(code);
  return <div className={`rounded-lg border p-3 text-sm ${STYLES[error.severity]}`}><p className="font-semibold">{error.title}</p><p className="mt-1 text-slate-700">{error.description}</p>{error.actionHref ? <Link href={error.actionHref} className="mt-2 inline-block underline">{error.actionLabel}</Link> : <p className="mt-2 text-xs">{error.actionLabel}</p>}</div>;
}
