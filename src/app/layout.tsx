import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AgentationDev } from '@/components/AgentationDev';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const display = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'E-Voting IPM — SMK Muhammadiyah Kandanghaur',
  description: 'Bilik aman, hasil live, tanpa HP pribadi.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${display.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      {/* suppressHydrationWarning: atribut tambahan dari browser extension
          (mis. `__processed_<uuid>__` di <body>) tidak ikut di-SSR. */}
      <body
        className="min-h-screen bg-slate-50 text-slate-900 antialiased"
        suppressHydrationWarning
      >
        {children}
        <AgentationDev />
      </body>
    </html>
  );
}
