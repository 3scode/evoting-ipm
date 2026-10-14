import { KioskHeartbeat } from '@/components/kiosk/KioskHeartbeat';

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <KioskHeartbeat />
      {children}
    </>
  );
}
