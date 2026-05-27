import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Orbitas MVP Scaffold',
  description: 'Base técnica del MVP Orbitas',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <main className="mx-auto min-h-screen w-full max-w-md px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
