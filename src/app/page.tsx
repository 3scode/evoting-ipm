import { LayoutDashboard, Vote } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="flex items-center justify-center gap-4">
        <Image
          src="/images/logo-smk.png"
          alt="Logo SMK Muhammadiyah Kandanghaur"
          width={264}
          height={384}
          priority
          className="h-28 w-auto"
        />
        <Image
          src="/images/logo-ipm.png"
          alt="Logo IPM"
          width={165}
          height={320}
          priority
          className="h-24 w-auto"
        />
      </div>
      <h1 className="mt-4 text-3xl font-bold">E-Voting IPM</h1>
      <p className="text-slate-600">SMK Muhammadiyah Kandanghaur • Bilik aman, hasil live</p>
      <div className="mt-6 flex gap-2">
        <Link href="/kiosk/login" className="rounded-md bg-sky-600 text-white px-5 py-3 font-bold inline-flex items-center gap-2"><Vote className="h-5 w-5" aria-hidden />Masuk Bilik</Link>
        <Link href="/admin/login" className="rounded-md border px-5 py-3 inline-flex items-center gap-2"><LayoutDashboard className="h-5 w-5" aria-hidden />Command Center</Link>
      </div>
    </main>
  );
}
