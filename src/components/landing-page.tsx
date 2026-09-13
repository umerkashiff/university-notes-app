'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SemstackLogo } from '@/components/logo';
import { ArrowRight } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

// Dynamically import ColorBends to prevent any SSR WebGL hydration issues
const ColorBends = dynamic(() => import('@/components/color-bends'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#0a0a0f]" />
});

export interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

// Deep, saturated violet and purple color palette matching the original reference screenshot
const SIGNATURE_PURPLE_COLORS = [
  '#8a5cff', // Neon Violet
  '#7c3aed', // Deep Purple
  '#a855f7', // Bright Orchid
  '#c084fc', // Soft Lavender
  '#4f46e5'  // Electric Indigo
];

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="relative h-[100dvh] max-h-[100dvh] h-screen w-full overflow-hidden bg-[#0a0a0f] text-white selection:bg-[#8a5cff]/30 selection:text-white flex flex-col justify-between font-sans select-none">
      {/* ── Background ColorBends Shader Animation ──────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-auto overflow-hidden">
        <ColorBends
          colors={SIGNATURE_PURPLE_COLORS}
          rotation={isMobile ? 38 : 75}
          speed={0.16}
          scale={isMobile ? 0.9 : 1.05}
          frequency={1.0}
          warpStrength={0.88}
          mouseInfluence={0.8}
          parallax={0.45}
          noise={0.06}
          iterations={2}
          intensity={1.05}
          bandWidth={4.8}
          transparent={true}
          className="w-full h-full"
        />

        {/* Ambient Dark Radial Gradient Vignette for perfect text contrast */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(10,10,15,0.2) 0%, rgba(10,10,15,0.7) 65%, #0a0a0f 100%)'
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* ── Top Floating Pill Navbar (matching Semstack pill styling) ─── */}
      <header className="relative z-30 w-full pt-3 sm:pt-6 px-4 shrink-0">
        <nav 
          aria-label="Main Navigation"
          className="mx-auto max-w-lg w-full rounded-full border border-white/10 bg-[#121316]/75 backdrop-blur-xl px-4 py-1.5 sm:py-2 shadow-2xl shadow-black/80 flex items-center justify-between"
        >
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 pl-1">
            <SemstackLogo size={24} alt="Semstack" className="object-contain" />
            <span className="text-sm font-bold tracking-tight text-white">
              Semstack
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={onSignIn}
              className="h-8 rounded-full px-3 text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              Sign in
            </button>
            <button 
              type="button"
              onClick={onGetStarted}
              className="h-8 rounded-full bg-white text-[#0a0a0f] px-4 text-xs font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </nav>
      </header>

      {/* ── Main Hero Section (Guaranteed to fit on any mobile/desktop viewport) ── */}
      <main className="relative z-20 mx-auto max-w-3xl px-5 sm:px-6 py-2 sm:py-6 flex-1 min-h-0 flex flex-col items-center justify-center text-center">
        {/* Big Bold Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="text-balance text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08] drop-shadow-sm max-w-2xl"
        >
          For students, by students
        </motion.h1>

        {/* Supporting Tagline */}
        <motion.p 
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease: "easeOut" }}
          className="mt-3 sm:mt-5 max-w-xs sm:max-w-md md:max-w-lg text-xs sm:text-sm md:text-base text-white/70 font-normal leading-relaxed text-balance"
        >
          Curated lecture notes, verified past midterm &amp; final papers, and semester study guides built for UET Lahore Computer Engineering.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24, ease: "easeOut" }}
          className="mt-6 sm:mt-8 flex items-center justify-center gap-3 w-full sm:w-auto shrink-0"
        >
          <button
            type="button"
            onClick={onGetStarted}
            className="h-10 sm:h-11 rounded-full bg-white text-[#0a0a0f] font-semibold px-6 sm:px-7 text-xs sm:text-sm hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/10 cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>Get started</span>
            <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onSignIn}
            className="h-10 sm:h-11 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md px-6 sm:px-7 text-xs sm:text-sm font-semibold active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          >
            <span>Sign in</span>
          </button>
        </motion.div>
      </main>

      {/* ── Minimal Footer (Shrink-0, safe-area padded, no overflow) ─── */}
      <footer className="relative z-30 w-full pb-3 sm:pb-6 px-4 text-center shrink-0">
        <p className="text-[10px] sm:text-xs text-white/40 tracking-tight">
          Department of Computer Engineering · UET Lahore
        </p>
      </footer>
    </div>
  );
}
