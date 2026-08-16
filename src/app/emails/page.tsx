'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { 
  accountApprovedEmail, 
  accountRejectedEmail, 
  rolePromotedEmail, 
  notePublishedEmail, 
  noteRejectedEmail, 
  semesterAdvancedEmail, 
  graduatedEmail, 
  departmentAnnouncementEmail, 
  newRegistrationAlertEmail, 
  noteSubmittedAlertEmail,
  passwordResetEmail 
} from '@/lib/emails/templates'
import { 
  Desktop, 
  DeviceMobile, 
  ArrowsOut, 
  ArrowLeft, 
  EnvelopeSimple, 
  Eye, 
  Copy, 
  Check 
} from '@phosphor-icons/react'
import Link from 'next/link'

const TEMPLATES = [
  {
    id: 'approved',
    name: '1. Welcome / Account Approved',
    badge: 'Student',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    getSample: () => accountApprovedEmail({
      name: 'Umer Kashif',
      role: 'STUDENT',
      semester: 5
    })
  },
  {
    id: 'rejected',
    name: '2. Application Rejected',
    badge: 'Student',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    getSample: () => accountRejectedEmail({
      name: 'Ahmed Khan',
      reason: 'Registration number 2024-CE-999 could not be matched against current department session records.'
    })
  },
  {
    id: 'promoted',
    name: '3. Promoted to Note Contributor',
    badge: 'Contributor',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    getSample: () => rolePromotedEmail({
      name: 'Fatima Noor',
      newRole: 'Note Contributor'
    })
  },
  {
    id: 'note-published',
    name: '4. Note Published to Library',
    badge: 'Contributor',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    getSample: () => notePublishedEmail({
      authorName: 'Umer Kashif',
      noteTitle: 'Microprocessor Architecture - Midterm Comprehensive Handwritten Summary',
      subjectName: 'Computer Architecture & Organization',
      subjectCode: 'CE-301'
    })
  },
  {
    id: 'note-rejected',
    name: '5. Note Submission Rejected',
    badge: 'Contributor',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    getSample: () => noteRejectedEmail({
      authorName: 'Bilal Tariq',
      noteTitle: 'Digital Logic Lab Manual Lecture 1-4',
      subjectCode: 'CE-201',
      reason: 'Scanned pages 12-18 are cut off and partially unreadable. Please re-upload with high-contrast scan.'
    })
  },
  {
    id: 'semester-advanced',
    name: '6. Semester Advanced',
    badge: 'Academic',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    getSample: () => semesterAdvancedEmail({
      name: 'Zainab Ali',
      fromSem: 4,
      toSem: 5,
      periodName: 'Fall 2026'
    })
  },
  {
    id: 'graduated',
    name: '7. Graduation Congratulations',
    badge: 'Alumni',
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    getSample: () => graduatedEmail({
      name: 'Muhammad Usman',
      batchYear: 2022
    })
  },
  {
    id: 'announcement-standard',
    name: '8. Department Notice (Standard)',
    badge: 'Notice',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    getSample: () => departmentAnnouncementEmail({
      title: 'Midterm Examination Schedule for Fall 2026',
      body: 'The tentative timetable for Fall 2026 Midterm Examinations has been released. All students must ensure their laboratory records and assignment submissions are completed before Monday next week.\n\nRoom allocations will be displayed outside the department notice board.',
      audienceLabel: 'All Students'
    })
  },
  {
    id: 'announcement-image',
    name: '9. Department Notice (With Image)',
    badge: 'Notice',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    getSample: () => departmentAnnouncementEmail({
      title: 'Lab Relocation & Electrical Safety Guidelines',
      body: 'Please review the attached official circular regarding the temporary relocation of Computer Architecture & Embedded Systems labs to Block C.',
      audienceLabel: 'Semester 5 & 6',
      hasImage: true
    })
  },
  {
    id: 'admin-reg-alert',
    name: '10. New Registration (Admin Alert)',
    badge: 'Admin',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    getSample: () => newRegistrationAlertEmail({
      name: 'Hamza Sheikh',
      regNumber: '2024-CE-42',
      semester: 3,
      section: 'B',
      isContributor: true,
      email: 'hamza.sheikh@student.uet.edu.pk'
    })
  },
  {
    id: 'admin-note-alert',
    name: '11. Note Review (Admin Alert)',
    badge: 'Admin',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    getSample: () => noteSubmittedAlertEmail({
      contributorName: 'Umer Kashif',
      noteTitle: 'Signals & Systems Solved Past Papers 2021-2025',
      subjectCode: 'CE-204',
      pages: 48,
      fileSize: '14.2 MB'
    })
  },
  {
    id: 'password-reset',
    name: '12. Password Reset OTP Verification',
    badge: 'Security',
    badgeColor: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20',
    getSample: () => passwordResetEmail({
      name: 'Umer Kashif',
      code: '849201'
    })
  }
]

export default function EmailPreviewPage() {
  const [mounted, setMounted] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('approved')
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'full'>('desktop')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const activeTemplate = useMemo(() => {
    return TEMPLATES.find(t => t.id === selectedId) || TEMPLATES[0]
  }, [selectedId])

  const renderedEmail = useMemo(() => {
    return activeTemplate.getSample()
  }, [activeTemplate])

  const copyHtml = () => {
    navigator.clipboard.writeText(renderedEmail.html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header Bar */}
      <header className="border-b bg-card px-4 sm:px-8 py-4 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary px-3 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft size={14} /> Back to App
          </Link>
          <div className="h-4 w-px bg-border/80 hidden sm:block" />
          <div className="flex items-center gap-2">
            <EnvelopeSimple size={20} className="text-primary" />
            <h1 className="text-base font-bold tracking-tight">Semstack Email Preview Studio</h1>
          </div>
        </div>

        {/* Viewport controls & Copy HTML */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary rounded-full p-1 text-xs">
            <button
              onClick={() => setViewMode('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                viewMode === 'desktop' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Desktop View (620px)"
            >
              <Desktop size={14} />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                viewMode === 'mobile' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Mobile View (375px)"
            >
              <DeviceMobile size={14} />
              <span className="hidden sm:inline">Mobile</span>
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                viewMode === 'full' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Full Width"
            >
              <ArrowsOut size={14} />
              <span className="hidden sm:inline">Full</span>
            </button>
          </div>

          <button
            onClick={copyHtml}
            className="flex items-center gap-1.5 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground px-3.5 py-2 rounded-full transition-colors cursor-pointer"
            title="Copy Raw HTML"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span className="hidden sm:inline">{copied ? 'Copied HTML!' : 'Copy HTML'}</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Left Sidebar Template Switcher */}
        <aside className="w-full md:w-80 lg:w-96 border-r bg-card/60 p-4 overflow-y-auto max-h-[40vh] md:max-h-[calc(100vh-65px)] modal-scroll flex flex-col gap-1.5 shrink-0">
          <div className="px-2 py-1 mb-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Email Catalog ({TEMPLATES.length})
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Select any template to inspect live HTML rendering
            </p>
          </div>

          {TEMPLATES.map(t => {
            const isSelected = selectedId === t.id
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`flex items-start justify-between gap-2.5 p-3 rounded-2xl text-left text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-secondary font-bold text-foreground shadow-xs border border-border/80'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-transparent'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{t.name}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${t.badgeColor}`}>
                  {t.badge}
                </span>
              </button>
            )
          })}
        </aside>

        {/* Right Preview Area */}
        <main className="flex-1 bg-secondary/30 p-4 sm:p-8 flex flex-col items-center justify-start overflow-y-auto max-h-[calc(100vh-65px)]">
          {/* Metadata Bar */}
          <div className="w-full max-w-2xl bg-card border rounded-2xl p-4 mb-5 shadow-xs text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-muted-foreground w-16 shrink-0">Subject:</span>
              <span className="font-semibold text-foreground break-words">{renderedEmail.subject}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-bold text-muted-foreground w-16 shrink-0">From:</span>
              <span className="font-mono text-[11px]">Semstack &lt;onboarding@resend.dev&gt;</span>
            </div>
          </div>

          {/* Iframe Viewport */}
          <div
            className={`transition-all duration-300 shadow-2xl rounded-[28px] overflow-hidden border border-border/80 bg-white ${
              viewMode === 'mobile'
                ? 'w-[375px] h-[720px]'
                : viewMode === 'desktop'
                ? 'w-full max-w-[620px] h-[780px]'
                : 'w-full h-[820px]'
            }`}
          >
            {mounted ? (
              <iframe
                title="Email Preview"
                srcDoc={renderedEmail.html}
                className="w-full h-full border-0 bg-[#f7f5f2]"
                sandbox="allow-same-origin"
                suppressHydrationWarning
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#f7f5f2] text-xs text-muted-foreground">
                Rendering preview...
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
