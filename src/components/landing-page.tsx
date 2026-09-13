'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { SemstackLogo } from '@/components/logo';
import { 
  Sparkle, 
  ArrowRight, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  ShieldCheck, 
  X, 
  Check, 
  CaretRight,
  DownloadSimple
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import ColorBends with ssr: false to guarantee clean client-side WebGL canvas initialization
const ColorBends = dynamic(() => import('@/components/color-bends'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#08090c]" />
});

export interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const COLOR_PRESETS = [
  {
    name: 'Cosmic Violet',
    colors: ['#ff5c7a', '#8a5cff', '#00ffd1'],
    accent: '#8a5cff'
  },
  {
    name: 'Semstack Emerald',
    colors: ['#10b981', '#06b6d4', '#8b5cf6'],
    accent: '#10b981'
  },
  {
    name: 'Neon Sunset',
    colors: ['#f43f5e', '#fb923c', '#a855f7'],
    accent: '#f43f5e'
  }
];

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [colorPresetIdx, setColorPresetIdx] = useState(0);
  const [showDemoContent, setShowDemoContent] = useState(false);
  const [showFeaturesDrawer, setShowFeaturesDrawer] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const activePreset = COLOR_PRESETS[colorPresetIdx];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#08090c] text-white selection:bg-[#8a5cff]/30 selection:text-white flex flex-col justify-between font-sans">
      {/* ── Background ColorBends Shader Animation ──────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <ColorBends
          colors={activePreset.colors}
          rotation={90}
          speed={0.22}
          scale={1}
          frequency={1.05}
          warpStrength={1.15}
          mouseInfluence={0.9}
          parallax={0.5}
          noise={0.12}
          iterations={2}
          intensity={1.55}
          bandWidth={6}
          transparent={true}
          className="w-full h-full"
        />

        {/* Cinematic Vignette Overlay to ensure text readability */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 45%, rgba(8,9,12,0.1) 0%, rgba(8,9,12,0.65) 65%, #08090c 100%)'
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* ── Floating Header Pill Navbar (matching exact reference design) ── */}
      <header className="relative z-30 w-full pt-5 px-4 sm:px-6">
        <nav 
          aria-label="Main Navigation"
          className="mx-auto max-w-4xl rounded-full border border-white/10 bg-[#121316]/65 backdrop-blur-xl px-4 sm:px-6 py-2.5 shadow-2xl shadow-black/80 flex items-center justify-between transition-all"
        >
          {/* Brand Logo & Name */}
          <button 
            type="button"
            onClick={() => { setShowDemoContent(false); setShowFeaturesDrawer(false); }}
            className="flex items-center gap-2.5 group cursor-pointer text-left"
          >
            <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/20 shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
              <SemstackLogo size={20} alt="Semstack Logo" className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Semstack
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7">
            <button 
              type="button"
              onClick={() => setShowFeaturesDrawer(true)}
              className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button 
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => setColorPresetIdx((prev) => (prev + 1) % COLOR_PRESETS.length)}
              className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              title="Click to cycle aesthetic color themes"
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: activePreset.accent }} />
              <span>Theme</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              type="button"
              onClick={onSignIn}
              className="text-xs sm:text-sm font-medium text-white/80 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
            >
              Sign in
            </button>
            <button 
              type="button"
              onClick={onGetStarted}
              className="rounded-full bg-white text-[#0d0e12] px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-md shadow-white/10 cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </nav>
      </header>

      {/* ── Main Hero Section (matching exact headline & badge layout) ──── */}
      <main className="relative z-20 mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col items-center justify-center text-center">
        {/* Top Badge Pill */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6 sm:mb-8"
        >
          <button
            type="button"
            onClick={() => setShowFeaturesDrawer(true)}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs text-white/85 shadow-lg shadow-black/20 transition-all cursor-pointer group"
          >
            <span className="rounded-full bg-white/20 group-hover:bg-white/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors">
              NEW
            </span>
            <span className="font-medium tracking-tight">
              UET Computer Engineering Academic Hub
            </span>
            <CaretRight size={12} weight="bold" className="text-white/60 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>

        {/* Big Punchy Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-balance text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.08] drop-shadow-sm"
        >
          You have the power to <br className="hidden sm:inline" />
          reshape your own destiny
        </motion.h1>

        {/* Supporting Department Tagline */}
        <motion.p 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-5 sm:mt-6 max-w-2xl text-sm sm:text-base md:text-lg text-white/70 font-normal leading-relaxed text-balance"
        >
          Curated lecture notes, verified past midterm &amp; final papers, and semester study guides built by and for UET Lahore Computer Engineering students.
        </motion.p>

        {/* Call to Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4"
        >
          <button
            type="button"
            onClick={onGetStarted}
            className="rounded-full bg-white text-[#0d0e12] font-semibold px-7 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/10 cursor-pointer flex items-center gap-2 group"
          >
            <span>Get started</span>
            <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => setShowFeaturesDrawer(true)}
            className="rounded-full bg-white/10 hover:bg-white/15 text-white/95 border border-white/15 backdrop-blur-md px-7 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-medium active:scale-95 transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            <span>Learn more</span>
          </button>
        </motion.div>

        {/* Interactive Demo Content Preview (shown when toggle is ON) */}
        <AnimatePresence>
          {showDemoContent && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.96 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mt-10 w-full max-w-3xl rounded-3xl border border-white/15 bg-[#121316]/80 backdrop-blur-2xl p-6 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-red-400" />
                  <div className="size-2.5 rounded-full bg-yellow-400" />
                  <div className="size-2.5 rounded-full bg-green-400" />
                  <span className="text-xs font-mono text-white/50 ml-2">semstack-demo-preview.ce</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/80">
                  Semester 1 – 8 Syllabus
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 hover:bg-white/10 transition-colors">
                  <span className="font-bold text-white block text-sm">CS-101</span>
                  <p className="text-white/60 mt-1">Programming Fundamentals</p>
                  <span className="inline-block mt-3 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    18 Notes &amp; Exams
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 hover:bg-white/10 transition-colors">
                  <span className="font-bold text-white block text-sm">EE-220</span>
                  <p className="text-white/60 mt-1">Digital Logic Design</p>
                  <span className="inline-block mt-3 text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                    24 Notes &amp; Exams
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 hover:bg-white/10 transition-colors">
                  <span className="font-bold text-white block text-sm">CE-310</span>
                  <p className="text-white/60 mt-1">Computer Architecture</p>
                  <span className="inline-block mt-3 text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    15 Notes &amp; Exams
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                <span>Direct PDF previewer &amp; high-speed Cloudflare R2 downloads</span>
                <button 
                  type="button" 
                  onClick={onGetStarted}
                  className="text-white hover:underline font-semibold flex items-center gap-1"
                >
                  Create free account <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Bottom Controls & Footer Pill Bar (matching screenshot toggle) ── */}
      <footer className="relative z-30 w-full pb-6 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between text-xs text-white/50">
          {/* Left copyright / institution label */}
          <div className="flex items-center gap-2">
            <span>© 2026 Department of Computer Engineering, UET Lahore</span>
          </div>

          {/* Right Demo Content Toggle (matching the reference image switch) */}
          <div className="flex items-center gap-3">
            <label 
              htmlFor="demo-toggle"
              className="rounded-2xl border border-white/10 bg-[#121316]/70 backdrop-blur-xl px-4 py-2 flex items-center gap-3 cursor-pointer select-none hover:border-white/20 transition-all shadow-lg"
            >
              <span className="font-medium text-white/80 text-xs">Demo Content</span>
              <button
                id="demo-toggle"
                type="button"
                role="switch"
                aria-checked={showDemoContent}
                onClick={() => setShowDemoContent(!showDemoContent)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showDemoContent ? 'bg-[#8a5cff]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    showDemoContent ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      </footer>

      {/* ── Slide-Over Features Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {showFeaturesDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeaturesDrawer(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative z-10 w-full max-w-xl rounded-3xl border border-white/15 bg-[#121316]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                    <Sparkle size={18} weight="fill" className="text-[#8a5cff]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Platform Features</h3>
                    <p className="text-xs text-white/50">Designed specifically for UET Lahore Computer Engineering</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFeaturesDrawer(false)}
                  className="size-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="size-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen size={18} weight="bold" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">All 8 Semesters Covered</h4>
                    <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                      Structured curriculum from foundational math &amp; programming to advanced VLSI, DSP, AI, and Final Year Projects.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={18} weight="bold" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Past Exam Repository</h4>
                    <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                      Access verified previous years’ midterm and final exam papers with solved keys and student tips.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="size-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck size={18} weight="bold" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Verified Peer Review &amp; Admin Desk</h4>
                    <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                      Every submission is vetted before publishing to guarantee academic accuracy and clean document formatting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/50">Free for all verified UET students</span>
                <button
                  type="button"
                  onClick={() => { setShowFeaturesDrawer(false); onGetStarted(); }}
                  className="rounded-full bg-white text-[#0d0e12] px-5 py-2 text-xs font-semibold hover:bg-white/90 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Sign up now</span>
                  <ArrowRight size={14} weight="bold" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── About Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAboutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAboutModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-white/15 bg-[#121316]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                    <GraduationCap size={20} weight="fill" className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">About Semstack</h3>
                    <p className="text-xs text-white/50">UET Lahore Computer Engineering Department</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAboutModal(false)}
                  className="size-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-5 space-y-3 text-xs sm:text-sm text-white/75 leading-relaxed">
                <p>
                  <strong>Semstack</strong> is the official digital academic resource platform created for the students and faculty of the Computer Engineering Department at University of Engineering and Technology (UET) Lahore.
                </p>
                <p>
                  Our mission is to eliminate fragmented file sharing across chat groups by maintaining a permanent, peer-reviewed, and high-speed archive of study materials for every cohort.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAboutModal(false)}
                  className="rounded-full bg-white/10 hover:bg-white/20 px-5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
