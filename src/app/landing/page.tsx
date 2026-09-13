'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LandingPage } from '@/components/landing-page';

export default function LandingPageRoute() {
  const router = useRouter();

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden">
      <LandingPage
        onGetStarted={() => router.push('/?auth=signup')}
        onSignIn={() => router.push('/?auth=login')}
      />
    </div>
  );
}
