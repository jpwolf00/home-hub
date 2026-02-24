'use client';

import { useNightMode } from './NightModeProvider';
import PageTransition from './PageTransition';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { isNightMode } = useNightMode();

  return (
    <div data-night-mode={isNightMode}>
      <PageTransition>
        {children}
      </PageTransition>
    </div>
  );
}
