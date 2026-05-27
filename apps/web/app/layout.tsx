import { Bricolage_Grotesque } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage-grotesque',
});

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={bricolageGrotesque.variable}>{children}</body>
    </html>
  );
}
