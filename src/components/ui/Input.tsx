import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none ring-primary focus:ring-2 ${className}`}
      {...props}
    />
  );
}
