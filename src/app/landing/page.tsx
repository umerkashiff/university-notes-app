'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LandingPage } from '@/components/landing-page';

export default function LandingPageRoute() {
  const router = useRouter();

  return (
    <LandingPage
      onGetStarted={() => router.push('/?auth=signup')}
      onSignIn={() => router.push('/?auth=login')}
    />
  );
}
