'use client'

import dynamic from 'next/dynamic'
import { useLenis } from 'lenis/react'

import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, Bell, BookOpen, Check, CaretLeft as ChevronLeft, CaretRight as ChevronRight, CaretDown, DownloadSimple as Download, FileText, FolderOpen, House as Home, Tray as Inbox, SquaresFour as LayoutDashboard, SignOut as LogOut, Megaphone, Minus, Plus, MagnifyingGlass as Search, PaperPlaneRight as Send, Gear as Settings, ShieldCheck, UploadSimple, UploadSimple as Upload, User, Users, X, GridFour as LayoutGrid, List, BookmarkSimple as Bookmark, Sparkle, ChatText, GraduationCap, Trash, PlusCircle, Info, PencilSimple, Moon, Sun, Desktop, UserCircle, Lock, Calendar, CheckCircle, Warning, WarningCircle, UserPlus, Eye, Clock, UserCheck, ShieldWarning, EnvelopeSimple } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { login, logout, register } from '@/app/actions/auth'
import { getAdminUsersData, approveUser, rejectUser, updateUserSemester, toggleHeldBack, changeUserRole, submitHeldBackSelfReport, getContentRequests, updateContentRequestStatus, deleteContentRequest } from '@/app/actions/admin'
import { getAcademicPeriods, createAcademicPeriod, getPreAdvancementSummary, advanceSemestersForPeriod, setPeriodStatus } from '@/app/actions/academic'
import { SignUp } from '@/components/signup'
import { PendingScreen } from '@/components/pending-screen'
import { SemstackLogo } from '@/components/logo'
import type { User as PrismaUser } from '@prisma/client'
import { createNote, publishNote, createSubject, deleteSubject, getTotalStorage, createAnnouncement, deleteAnnouncement, broadcastAnnouncementEmail, deleteNote, updateNote, toggleBookmark, submitContentRequest } from '@/app/actions/notes'
import { getPresignedUrl } from '@/app/actions/upload'
import React from 'react'
import { useIsTouch } from '@/lib/use-touch'
import { MobilePresence } from '@/components/mobile-anim'


const PDFViewer = dynamic(() => import('@/components/pdf-viewer').then(mod => mod.PDFViewer), {
  ssr: false,
  loading: () => <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Loading PDF reader...</div>
})

type Role = 'student' | 'senior' | 'admin'
type Screen = 'semesters' | 'subject' | 'notifications' | 'submissions' | 'cms' | 'saved' | 'settings'
type SubjectItem = { id:string; name:string; code:string; semester:number }
type Note = { id:string|number; authorId?:string; fileUrl?:string; status?:string; title:string; subject:string; code:string; author:string; date:string; pages:number; size:string; tone:string; description?:string }

const SEMESTER_COLORS = [
  'bg-sage',      // Sem 1 (Soft green)
  'bg-mist',      // Sem 2 (Soft blue)
  'bg-blush',     // Sem 3 (Soft rose)
  'bg-sand',      // Sem 4 (Warm sand)
  'bg-lavender',  // Sem 5 (Lavender)
  'bg-mint',      // Sem 6 (Mint green)
  'bg-peach',     // Sem 7 (Apricot peach)
  'bg-sky',       // Sem 8 (Soft sky)
]

const SEMESTER_LABELS: Record<number, string> = {
  1: 'First semester',
  2: 'Second semester',
  3: 'Third semester',
  4: 'Fourth semester',
  5: 'Fifth semester',
  6: 'Sixth semester',
  7: 'Seventh semester',
  8: 'Eighth semester',
}

function formatRelativeDate(dateInput?: string | Date | number): string {
  if (!dateInput) return 'Recently'
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return String(dateInput)

  const now = new Date()
  
  // Calculate midnight start of day for accurate comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }
}

export function StudyCompanion({ 
  initialUser, 
  initialNotes = [], 
  initialAnnouncements = [], 
  initialSubjects = [],
  initialBookmarks = []
}: { 
  initialUser: PrismaUser | null, 
  initialNotes?: any[], 
  initialAnnouncements?: any[], 
  initialSubjects?: any[],
  initialBookmarks?: string[]
}){
  const [user, setUser] = useState<PrismaUser | null>(initialUser)
  const role = (user?.role?.toLowerCase() as Role) || null
  const [screen,setScreen]=useState<Screen>(role === 'admin' ? 'cms' : role === 'senior' ? 'submissions' : 'semesters')
  const [reader,setReader]=useState<Note|null>(null)
  const [selectedSubjectName, setSelectedSubjectName] = useState<string | null>(null)

  // Real Bookmark / Saved Notes State from PostgreSQL per user
  const [savedNoteIds, setSavedNoteIds] = useState<string[]>(initialBookmarks)

  // Dark Mode / Appearance Theme State (Default: light)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    const root = document.documentElement
    if (t === 'dark') {
      root.classList.add('dark')
    } else if (t === 'light') {
      root.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) root.classList.add('dark')
      else root.classList.remove('dark')
    }
  }

  const changeTheme = (t: 'light' | 'dark' | 'system') => {
    setTheme(t)
    try {
      localStorage.setItem('semstack_theme', t)
    } catch {}
    applyTheme(t)
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('semstack_theme') as 'light' | 'dark' | 'system' | null
      if (saved) {
        setTheme(saved)
        applyTheme(saved)
      } else {
        setTheme('light')
        applyTheme('light')
      }
    } catch {}
  }, [])

  const toggleSave = async (noteId: string | number) => {
    const idStr = String(noteId)
    setSavedNoteIds(prev => {
      return prev.includes(idStr) ? prev.filter(x => x !== idStr) : [...prev, idStr]
    })
    await toggleBookmark(idStr)
  }

  const mapNote = (n: any): Note => ({
    id: n.id,
    authorId: n.authorId || n.author?.id || undefined,
    title: n.title,
    subject: n.subject?.name || n.subject || '',
    code: n.subject?.code || n.code || '',
    author: n.author?.name || n.author?.email || 'Note Contributor',
    date: formatRelativeDate(n.createdAt),
    pages: n.pages || 1,
    size: n.size || '1.0 MB',
    tone: n.tone || 'bg-sage',
    status: n.status || 'PUBLISHED',
    fileUrl: n.fileUrl,
    description: n.description || undefined
  })
  
  const mapAlert = (a: any) => {
    const isApp = a.kind === 'New note' ||
                  a.title?.toLowerCase().includes('notes published') || 
                  a.title?.toLowerCase().includes('note published') ||
                  a.title?.toLowerCase().includes('account activated') || 
                  a.title?.toLowerCase().includes('account application') ||
                  a.title?.toLowerCase().includes('submission') ||
                  a.type === 'APP_ACTIVITY'

    // Sanitize any legacy 'Senior' wording
    const cleanBody = (a.body || '').replace(/senior contributor/gi, 'Note Contributor').replace(/senior/gi, 'Contributor')
    const cleanTitle = (a.title || '').replace(/senior contributor/gi, 'Note Contributor')

    return {
      id: a.id,
      audience: a.audience || 'ALL',
      kind: isApp ? 'New note' : 'Department',
      title: cleanTitle,
      body: cleanBody,
      time: formatRelativeDate(a.createdAt),
      unread: a.unread ?? true,
      imageUrl: a.imageUrl || undefined
    }
  }

  const [notes, setNotes] = useState<Note[]>(() => (initialNotes && initialNotes.length > 0) ? initialNotes.map(mapNote) : [])
  const [alerts, setAlerts] = useState<any[]>(() => (initialAnnouncements && initialAnnouncements.length > 0) ? initialAnnouncements.map(mapAlert) : [])
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>(() => (initialSubjects && initialSubjects.length > 0) ? initialSubjects : [])

  const [selectedSemester,setSelectedSemester]=useState(1)
  const [query,setQuery]=useState('')
  const [showRole,setShowRole]=useState(false)
  const [isLoggingOut,setIsLoggingOut]=useState(false)
  const [authView,setAuthView]=useState<'login'|'signup'>('login')
  const unread = alerts.filter(a=>a.unread).length

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    const timeStr = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    const firstName = user?.name ? user.name.split(' ')[0] : 'there'
    return `${timeStr}, ${firstName}`
  }, [user])

  const signIn = async (credentials: FormData | { email: string; password?: string }): Promise<string | void> => {
    const res = await login(credentials)
    if (res.error) {
      return res.error
    } else if (res.user) {
      setUser(res.user)
      const next = res.user.role.toLowerCase() as Role
      setScreen(next === 'admin' ? 'cms' : next === 'senior' ? 'submissions' : 'semesters')
    }
  }

  const handleRegister = async (formData: FormData): Promise<string | void> => {
    const res = await register(formData)
    if (res.error) {
      return res.error
    } else if (res.user) {
      setUser(res.user as any)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
    setUser(null)
    setScreen('semesters')
    setShowRole(false)
    setIsLoggingOut(false)
    setAuthView('login')
  }

  const roleLabel = role === 'admin' ? 'Administrator' : role === 'senior' ? 'Note Contributor' : 'Student'

  const title = screen==='cms'
    ? 'Content studio'
    : screen==='submissions'
    ? 'Contributor desk'
    : screen==='notifications'
    ? 'Notifications'
    : screen==='semesters'
    ? 'Semesters'
    : screen==='subject'
    ? `Semester ${selectedSemester}`
    : screen==='saved'
    ? 'Saved notes'
    : screen==='settings'
    ? 'Settings'
    : greeting


  // ─── Mobile device detection (all hooks must be called before any early return) ──
  const isTouch = useIsTouch()

  // ─── MOBILE EARLY RETURN ───────────────────────────────────────────────────────
  // Replaces ALL Framer Motion with CSS @keyframes (compositor-threaded).
  // Desktop AnimatePresence path below is completely unchanged.
  if (isTouch) {
    const isPending = !!user && (user.status === 'PENDING' || user.status === 'REJECTED') && user.role !== 'ADMIN'
    const outerKey = !user ? authView : isPending ? 'pending' : reader ? 'pdf' : 'main'
    return (
      <div key={outerKey} className="m-screen-enter">
        {!user ? (
          authView === 'signup'
            ? <SignUp onRegister={handleRegister} onSwitchToLogin={() => setAuthView('login')} />
            : <Login onLogin={signIn} onSwitchToSignUp={() => setAuthView('signup')} />
        ) : isPending ? (
          <PendingScreen user={user} onLogout={handleLogout} />
        ) : reader ? (
          <PdfReader note={reader} onBack={() => setReader(null)} />
        ) : (
          <main className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background dark:bg-card shadow-xs">
              <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
                <button onClick={() => setScreen(role==='admin'?'cms':role==='senior'?'submissions':'semesters')} className="flex items-center gap-2.5" aria-label="Semstack home">
                  <SemstackLogo size={34} className="size-[34px] -rotate-2" />
                  <span className="text-xl font-bold tracking-tight">Semstack</span>
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => setScreen('notifications')} className="icon-button relative" aria-label={`${unread} unread notifications`}>
                    <Bell size={19}/>
                    {unread>0&&<span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">{unread}</span>}
                  </button>
                  <div className="relative">
                    <button onClick={() => setShowRole(!showRole)} className="flex size-10 items-center justify-center rounded-full bg-mist text-sm font-bold shadow-xs cursor-pointer" aria-label="User account menu">
                      {user?.avatar || (user?.name ? user.name.slice(0,2).toUpperCase() : 'ST')}
                    </button>
                    {showRole && <div className="fixed inset-0 z-30" onClick={() => setShowRole(false)} />}
                    <MobilePresence show={showRole} type="popover" className="popover right-0 w-60 overflow-hidden shadow-xl rounded-2xl origin-top-right border bg-card p-0 z-40">
                      <div className="px-4 py-3 border-b bg-secondary/30">
                        <b className="block truncate text-sm font-bold text-foreground">{user?.name || user?.email}</b>
                        <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}</p>
                      </div>
                      <div className="p-1.5 flex flex-col gap-0.5">
                        <button onClick={() => { setScreen('settings'); setShowRole(false); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium hover:bg-secondary text-foreground transition-colors cursor-pointer">
                          <Settings size={16} className="text-muted-foreground shrink-0" /><span>Settings &amp; Preferences</span>
                        </button>
                        <button onClick={handleLogout} disabled={isLoggingOut} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50">
                          {isLoggingOut?<div className="size-4 border-2 border-destructive/30 border-t-destructive animate-spin rounded-full shrink-0"/>:<LogOut size={16} className="shrink-0"/>}
                          <span>{isLoggingOut?'Signing out...':'Sign out'}</span>
                        </button>
                      </div>
                    </MobilePresence>
                  </div>
                </div>
              </div>
            </header>
            <div className="mx-auto max-w-7xl px-5 py-8 pb-36 md:px-8 md:py-12" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))' }}>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="section-kicker">{screen==='settings'?'Account & Preferences':role==='admin'?'Department CMS':role==='senior'?'Contributor desk':'Your study library'}</p>
                  <h1 className="text-balance text-4xl font-semibold tracking-[-.04em] md:text-5xl">{title}</h1>
                </div>
              </div>
              {/* Keyed div → React unmounts old, mounts new → CSS m-screen-enter fires */}
              <div key={screen} className="w-full m-screen-enter">
                {screen==='saved'&&<SavedNotes notes={notes} subjects={subjectsList} savedNoteIds={savedNoteIds} toggleSave={toggleSave} open={setReader}/>}
                {screen==='semesters'&&<SemesterLibrary user={user} role={role} subjects={subjectsList} notes={notes} select={(n)=>{setSelectedSemester(n);setScreen('subject')}}/>}
                {screen==='subject'&&<SubjectLibrary semester={selectedSemester} subjects={subjectsList} notes={notes} query={query} setQuery={setQuery} savedNoteIds={savedNoteIds} toggleSave={toggleSave} open={setReader} onBack={()=>setScreen('semesters')}/>}
                {screen==='notifications'&&<Notifications alerts={alerts} setAlerts={setAlerts} user={user}/>}
                {screen==='submissions'&&<ContributorDesk user={user} notes={notes} subjects={subjectsList} add={(note)=>setNotes([note,...notes])} onNavigateToSettings={()=>setScreen('settings')}/>}
                {screen==='cms'&&role==='admin'&&<AdminCms notes={notes} setNotes={setNotes} subjects={subjectsList} setSubjects={setSubjectsList} alerts={alerts} setAlerts={setAlerts} publish={(note)=>{setNotes(notes.map(n=>n.id===note.id?{...n,status:'PUBLISHED'}:n));setAlerts([{id:Date.now(),audience:note.subject||'ALL',kind:'New note',title:`${note.subject} notes published`,body:`${note.title} is now available.`,time:'Just now',unread:true},...alerts])}} addAnnouncement={(a)=>setAlerts([mapAlert(a),...alerts])}/>}
                {screen==='settings'&&<SettingsPage user={user} theme={theme} onChangeTheme={changeTheme} onLogout={handleLogout} onNavigate={setScreen} isLoggingOut={isLoggingOut}/>}
              </div>
            </div>
            {/* Mobile nav — CSS background-color transition replaces layoutId spring */}
            <nav className="fixed left-1/2 z-30 flex gap-1 rounded-full border border-border/80 bg-card p-1.5 shadow-xl md:hidden mobile-nav-pill" style={{ bottom:'max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 0.85rem))', transform:'translate3d(-50%, 0, 0)', WebkitBackfaceVisibility:'hidden' }}>
              <MobileNavBtn active={role==='admin'?screen==='cms':role==='senior'?screen==='submissions':(screen==='semesters'||screen==='subject')} onClick={()=>setScreen(role==='admin'?'cms':role==='senior'?'submissions':'semesters')} icon={<Home/>}>Home</MobileNavBtn>
              {role==='student'?<MobileNavBtn active={screen==='saved'} onClick={()=>setScreen('saved')} icon={<Bookmark/>}>Saved</MobileNavBtn>:<MobileNavBtn active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')} icon={<BookOpen/>}>Library</MobileNavBtn>}
              <MobileNavBtn active={screen==='notifications'} onClick={()=>setScreen('notifications')} icon={<Bell/>}>Notices</MobileNavBtn>
            </nav>
          </main>
        )}
      </div>
    )
  }

  // ─── DESKTOP RETURN (completely unchanged) ────────────────────────────────
  return (
    <AnimatePresence mode="wait">
      {!user ? (
        authView === 'signup' ? (
          <motion.div
            key="signup-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full min-h-screen fm-gpu"
          >
            <SignUp onRegister={handleRegister} onSwitchToLogin={() => setAuthView('login')} />
          </motion.div>
        ) : (
          <motion.div
            key="login-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full min-h-screen fm-gpu"
          >
            <Login onLogin={signIn} onSwitchToSignUp={() => setAuthView('signup')} />
          </motion.div>
        )
      ) : ((user.status === 'PENDING' || user.status === 'REJECTED') && user.role !== 'ADMIN') ? (
        <motion.div
          key="pending-screen"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-full min-h-screen fm-gpu"
        >
          <PendingScreen user={user} onLogout={handleLogout} />
        </motion.div>
      ) : reader ? (
        <motion.div
          key="pdf-reader-screen"
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-full min-h-screen fm-gpu"
        >
          <PdfReader note={reader} onBack={() => setReader(null)} />
        </motion.div>
      ) : (
        <motion.main
          key="app-main-shell"
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-screen bg-background text-foreground"
        >
          <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 dark:bg-card/80 backdrop-blur-md shadow-xs">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
              <button onClick={()=>setScreen(role==='admin'?'cms':role==='senior'?'submissions':'semesters')} className="flex items-center gap-2.5" aria-label="Semstack home">
                <SemstackLogo size={34} className="size-[34px] -rotate-2" />
                <span className="text-xl font-bold tracking-tight">Semstack</span>
                <span className="hidden rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground sm:inline">Computer Engineering</span>
              </button>
              <nav className="hidden items-center gap-1 rounded-full bg-secondary p-1 md:flex" aria-label="Primary">
                {role==='student'&&<><Nav active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')}>Home</Nav><Nav active={screen==='saved'} onClick={()=>setScreen('saved')}>Saved</Nav></>}
                {role==='senior'&&<><Nav active={screen==='submissions'} onClick={()=>setScreen('submissions')}>My notes</Nav><Nav active={screen==='semesters'} onClick={()=>setScreen('semesters')}>Library</Nav></>}
                {role==='admin'&&<><Nav active={screen==='cms'} onClick={()=>setScreen('cms')}>Studio</Nav><Nav active={screen==='semesters'} onClick={()=>setScreen('semesters')}>Library</Nav></>}
                <Nav active={screen==='notifications'} onClick={()=>setScreen('notifications')}>Notices</Nav>
              </nav>
              <div className="flex items-center gap-2">
                <button onClick={()=>setScreen('notifications')} className="icon-button relative" aria-label={`${unread} unread notifications`}>
                  <Bell size={19}/>
                  {unread>0&&<span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">{unread}</span>}
                </button>
                <div className="relative">
                  <button 
                    onClick={()=>setShowRole(!showRole)} 
                    className="flex size-10 items-center justify-center rounded-full bg-mist text-sm font-bold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                    aria-label="User account menu"
                  >
                    {user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : "ST")}
                  </button>
                  <AnimatePresence>
                    {showRole && (
                      <>
                        <div 
                          className="fixed inset-0 z-30" 
                          onClick={() => setShowRole(false)} 
                        />
                        <motion.div 
                          initial={{opacity:0, scale:0.95, y:4}} 
                          animate={{opacity:1, scale:1, y:0}} 
                          exit={{opacity:0, scale:0.95, y:4}} 
                          transition={{duration:0.15}} 
                          className="popover right-0 w-60 overflow-hidden shadow-xl rounded-2xl origin-top-right border bg-card p-0 z-40 fm-gpu"
                        >
                          <div className="px-4 py-3 border-b bg-secondary/30">
                            <b className="block truncate text-sm font-bold text-foreground">{user?.name || user?.email}</b>
                            <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}</p>
                          </div>
                          <div className="p-1.5 flex flex-col gap-0.5">
                            <button 
                              onClick={() => { setScreen('settings'); setShowRole(false); }} 
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium hover:bg-secondary text-foreground transition-colors cursor-pointer"
                            >
                              <Settings size={16} className="text-muted-foreground shrink-0" /> 
                              <span>Settings & Preferences</span>
                            </button>
                            <button 
                              onClick={handleLogout} 
                              disabled={isLoggingOut}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isLoggingOut ? (
                                <div className="size-4 border-2 border-destructive/30 border-t-destructive animate-spin rounded-full shrink-0" />
                              ) : (
                                <LogOut size={16} className="shrink-0" />
                              )}
                              <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-5 py-8 pb-36 md:px-8 md:py-12" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))' }}>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="section-kicker">{screen==='settings'?'Account & Preferences':role==='admin'?'Department CMS':role==='senior'?'Contributor desk':'Your study library'}</p>
                <h1 className="text-balance text-4xl font-semibold tracking-[-.04em] md:text-5xl">{title}</h1>
              </div>
            </div>
            <AnimatePresence initial={false}>
              <motion.div key={screen} initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-6}} transition={{duration:0.18, ease: "easeOut"}} className="w-full transform-gpu fm-gpu">
                {screen==='saved'&&<SavedNotes notes={notes} subjects={subjectsList} savedNoteIds={savedNoteIds} toggleSave={toggleSave} open={setReader}/>} 
                {screen==='semesters'&&<SemesterLibrary user={user} role={role} subjects={subjectsList} notes={notes} select={(n)=>{setSelectedSemester(n);setScreen('subject')}}/>} 
                {screen==='subject'&&<SubjectLibrary semester={selectedSemester} subjects={subjectsList} notes={notes} query={query} setQuery={setQuery} savedNoteIds={savedNoteIds} toggleSave={toggleSave} open={setReader} onBack={()=>setScreen('semesters')}/>} 
                {screen==='notifications'&&<Notifications alerts={alerts} setAlerts={setAlerts} user={user}/>} 
                {screen==='submissions'&&<ContributorDesk user={user} notes={notes} subjects={subjectsList} add={(note)=>setNotes([note,...notes])} onNavigateToSettings={()=>setScreen('settings')}/>} 
                {screen==='cms'&&role==='admin'&&<AdminCms notes={notes} setNotes={setNotes} subjects={subjectsList} setSubjects={setSubjectsList} alerts={alerts} setAlerts={setAlerts} publish={(note)=>{setNotes(notes.map(n => n.id === note.id ? {...n, status: 'PUBLISHED'} : n));setAlerts([{id:Date.now(),audience: note.subject || 'ALL',kind:'New note',title:`${note.subject} notes published`,body:`${note.title} is now available.`,time:'Just now',unread:true},...alerts])}} addAnnouncement={(a)=>setAlerts([mapAlert(a), ...alerts])}/>}
                {screen==='settings'&&<SettingsPage user={user} theme={theme} onChangeTheme={changeTheme} onLogout={handleLogout} onNavigate={setScreen} isLoggingOut={isLoggingOut}/>}
              </motion.div>
            </AnimatePresence>
          </div>
          <nav 
            className="fixed left-1/2 z-30 flex gap-1 rounded-full border border-border/80 bg-card/95 dark:bg-card/95 backdrop-blur-xl p-1.5 shadow-xl md:hidden mobile-nav-pill"
            style={{
              bottom: 'max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 0.85rem))',
              transform: 'translate3d(-50%, 0, 0)',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <Mobile active={role==='admin'?screen==='cms':role==='senior'?screen==='submissions':(screen==='semesters'||screen==='subject')} onClick={()=>setScreen(role==='admin'?'cms':role==='senior'?'submissions':'semesters')} icon={<Home/>}>Home</Mobile>
            {role==='student'?<Mobile active={screen==='saved'} onClick={()=>setScreen('saved')} icon={<Bookmark/>}>Saved</Mobile>:<Mobile active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')} icon={<BookOpen/>}>Library</Mobile>}
            <Mobile active={screen==='notifications'} onClick={()=>setScreen('notifications')} icon={<Bell/>}>Notices</Mobile>
          </nav>
        </motion.main>
      )}
    </AnimatePresence>
  )
}

function Nav({active,onClick,children,layoutId="nav-pill"}:{active:boolean,onClick:()=>void,children:React.ReactNode,layoutId?:string}){return <button onClick={onClick} className={`relative px-5 py-2 text-sm transition-colors rounded-full ${active?'text-foreground font-semibold':'text-muted-foreground hover:text-foreground'}`}>
  {active && <motion.div layoutId={layoutId} className="absolute inset-0 bg-background shadow-sm rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
  <span className="relative z-10">{children}</span>
</button>}

function Mobile({active,onClick,icon,children}:{active:boolean,onClick:()=>void,icon:React.ReactNode,children:React.ReactNode}){return <button onClick={onClick} className={`relative flex min-w-14 flex-col items-center gap-1 rounded-full px-3 py-2 text-[10px] transition-colors ${active?'text-foreground':'text-muted-foreground hover:text-foreground'}`}>
  {active && <motion.div layoutId="mobile-nav-pill" className="absolute inset-0 bg-secondary rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
  <span className="relative z-10 flex flex-col items-center gap-1">{icon}<span>{children}</span></span>
</button>}

/** Mobile-only nav button: CSS background-color transition instead of Framer Motion layoutId.
 *  No shared-element animation — the active background fades in/out via CSS transition.
 *  Used only in the mobile early-return branch; desktop still uses Mobile above. */
function MobileNavBtn({active,onClick,icon,children}:{active:boolean,onClick:()=>void,icon:React.ReactNode,children:React.ReactNode}){
  return (
    <button
      onClick={onClick}
      className={`relative flex min-w-14 flex-col items-center gap-1 rounded-full px-3 py-2 text-[10px] ${active?'text-foreground':'text-muted-foreground'}`}
      style={{
        backgroundColor: active ? 'var(--secondary)' : 'transparent',
        transition: 'background-color 150ms ease-out, color 150ms ease-out',
      }}
    >
      <span className="flex flex-col items-center gap-1">{icon}<span>{children}</span></span>
    </button>
  )
}

function Header({kicker,title}:{kicker:string,title:string}){return <div className="mb-6"><p className="section-kicker">{kicker}</p><h2 className="text-3xl font-semibold">{title}</h2></div>}

function SettingsPage({
  user,
  theme,
  onChangeTheme,
  onLogout,
  onNavigate,
  isLoggingOut = false
}: {
  user: PrismaUser | null
  theme: 'light' | 'dark' | 'system'
  onChangeTheme: (t: 'light' | 'dark' | 'system') => void
  onLogout: () => void
  onNavigate: (s: Screen) => void
  isLoggingOut?: boolean
}) {
  const isTouch = useIsTouch()
  const role = (user?.role?.toLowerCase() as Role) || 'student'
  const roleLabel = role === 'admin' ? 'Administrator' : role === 'senior' ? 'Note Contributor' : 'Student'

  const userCurrentSem = user?.semester ? Math.min(8, Math.max(1, user.semester)) : 1
  const isAlumni = !!(user?.batchYear && user.batchYear <= 2021)
  const availableSemesters = role === 'admin' || isAlumni
    ? [1, 2, 3, 4, 5, 6, 7, 8]
    : Array.from({ length: userCurrentSem }, (_, i) => i + 1)

  const [reqType, setReqType] = useState('Missing Course / Subject')
  const [reqSem, setReqSem] = useState(userCurrentSem)
  const [reqCourse, setReqCourse] = useState('')
  const [reqMsg, setReqMsg] = useState('')
  const [reqLoading, setReqLoading] = useState(false)
  const [reqSuccess, setReqSuccess] = useState(false)

  React.useEffect(() => {
    if (user?.semester) {
      setReqSem(Math.min(8, Math.max(1, user.semester)))
    }
  }, [user?.semester])

  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false)
  const [semDropdownOpen, setSemDropdownOpen] = useState(false)

  const REQUEST_TYPES = [
    'Missing Course / Subject',
    'Request Lecture Notes',
    'Past Papers & Solutions',
    'Report Broken File / Typo',
    'General Feedback'
  ]

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reqMsg.trim()) return
    setReqLoading(true)
    const res = await submitContentRequest({
      type: reqType,
      semester: reqSem,
      subject: reqCourse.trim() || undefined,
      message: reqMsg.trim()
    })
    if (res.error) {
      alert(res.error)
    } else {
      setReqSuccess(true)
      setReqMsg('')
      setReqCourse('')
      setTimeout(() => setReqSuccess(false), 4000)
    }
    setReqLoading(false)
  }

  const joinDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Active'

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Header Description */}
      <div>
        <p className="text-muted-foreground text-sm">
          {role === 'admin'
            ? 'Customize your display theme, manage system preferences, and inspect administrator account details.'
            : 'Customize your display theme, inspect your university account details, and request lecture notes or courses directly from department administrators.'}
        </p>
      </div>

      {/* 1. Appearance / Dark Mode */}
      <section className="rounded-3xl border bg-card p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Sun size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Select a display theme for Semstack on this device.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light', icon: <Sun size={20} /> },
            { id: 'dark', label: 'Dark', icon: <Moon size={20} /> },
            { id: 'system', label: 'System', icon: <Desktop size={20} /> }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => onChangeTheme(opt.id as any)}
              className={`flex flex-col items-center justify-center gap-2.5 rounded-2xl p-4 border transition-all text-sm font-medium ${
                theme === opt.id
                  ? 'border-primary bg-secondary/80 text-foreground font-semibold shadow-xs'
                  : 'border-border bg-card hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className={theme === opt.id ? 'text-primary' : 'text-muted-foreground'}>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Account Information */}
      <section className="rounded-3xl border bg-card p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <UserCircle size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Account Information</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Verified university portal credentials.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-secondary/60 p-4 border border-border/50">
            <span className="text-xs text-muted-foreground block font-medium">Full Name</span>
            <b className="text-sm font-semibold text-foreground mt-0.5 block">{user?.name || 'Student'}</b>
          </div>
          <div className="rounded-2xl bg-secondary/60 p-4 border border-border/50">
            <span className="text-xs text-muted-foreground block font-medium">Email Address</span>
            <b className="text-sm font-semibold text-foreground mt-0.5 block truncate">{user?.email || 'student@uet.edu'}</b>
          </div>
          <div className="rounded-2xl bg-secondary/60 p-4 border border-border/50">
            <span className="text-xs text-muted-foreground block font-medium">Registration Number</span>
            <b className="text-sm font-semibold text-foreground font-mono mt-0.5 block">{user?.regNumber || 'Not assigned'}</b>
          </div>
          <div className="rounded-2xl bg-secondary/60 p-4 border border-border/50 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Academic Cohort</span>
              <b className="text-sm font-semibold text-foreground mt-0.5 block">
                Semester {user?.semester || 1} {user?.section ? `(Sec ${user.section})` : ''}
              </b>
            </div>
            {user?.batchYear && (
              <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                Batch {user.batchYear}
              </span>
            )}
          </div>
          <div className="rounded-2xl bg-secondary/60 p-4 border border-border/50">
            <span className="text-xs text-muted-foreground block font-medium">Department</span>
            <b className="text-sm font-semibold text-foreground mt-0.5 block">Computer Engineering (UET)</b>
          </div>
          <div className="rounded-2xl bg-secondary/60 p-4 border border-border/50 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Account Role & Standing</span>
              <b className="text-sm font-semibold text-foreground mt-0.5 block">
                {roleLabel} {user?.heldBack ? '· Held Back (Re-take)' : user?.status === 'GRADUATED' ? '· Graduated 🎓' : ''}
              </b>
            </div>
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${
              user?.heldBack 
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                : 'bg-primary/10 text-primary border-primary/20'
            }`}>
              {user?.heldBack ? 'Re-take' : role}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Request Content / Feedback (For Students & Contributors only) */}
      {role !== 'admin' && (
      <section className="rounded-3xl border bg-card p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <ChatText size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Request Content or Report Changes</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Need lecture notes for a specific course, past papers, or want to report an issue to department admins?
        </p>

        <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Custom Request Type Dropdown */}
            <div className="flex flex-col gap-2 text-sm font-medium">
              <span>Request Type</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setTypeDropdownOpen(!typeDropdownOpen); setSemDropdownOpen(false); }}
                  className="flex h-12 w-full items-center justify-between rounded-2xl border bg-background px-4 text-sm font-medium focus:border-foreground transition-colors text-left"
                >
                  <span className="truncate">{reqType}</span>
                  <CaretDown size={16} weight="bold" className={`text-muted-foreground transition-transform shrink-0 ml-2 ${typeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTouch ? (
                  <>
                    {typeDropdownOpen && <div className="fixed inset-0 z-20" onClick={() => setTypeDropdownOpen(false)} />}
                    <MobilePresence show={typeDropdownOpen} type="dropdown" className="absolute top-[calc(100%+6px)] left-0 right-0 z-30 overflow-hidden rounded-2xl border bg-card p-1.5 shadow-xl">
                      <div data-lenis-prevent="true" className="max-h-48 overflow-y-auto overscroll-contain dropdown-scroll flex flex-col gap-1 pr-1" style={{ overscrollBehavior: 'contain' }}>
                        {REQUEST_TYPES.map(t => (
                          <button key={t} type="button" onClick={() => { setReqType(t); setTypeDropdownOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${reqType === t ? 'bg-secondary font-semibold text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
                            <span>{t}</span>{reqType === t && <Check size={16} weight="bold" className="text-primary shrink-0 ml-2" />}
                          </button>
                        ))}
                      </div>
                    </MobilePresence>
                  </>
                ) : (
                  <AnimatePresence>
                    {typeDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setTypeDropdownOpen(false)} />
                        <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.12 }} className="absolute top-[calc(100%+6px)] left-0 right-0 z-30 overflow-hidden rounded-2xl border bg-card p-1.5 shadow-xl fm-gpu">
                          <div data-lenis-prevent="true" className="max-h-48 overflow-y-auto overscroll-contain dropdown-scroll flex flex-col gap-1 pr-1" style={{ overscrollBehavior: 'contain' }}>
                            {REQUEST_TYPES.map(t => (
                              <button key={t} type="button" onClick={() => { setReqType(t); setTypeDropdownOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${reqType === t ? 'bg-secondary font-semibold text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
                                <span>{t}</span>{reqType === t && <Check size={16} weight="bold" className="text-primary shrink-0 ml-2" />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Custom Relevant Semester Dropdown */}
            <div className="flex flex-col gap-2 text-sm font-medium">
              <span>Relevant Semester</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setSemDropdownOpen(!semDropdownOpen); setTypeDropdownOpen(false); }}
                  className="flex h-12 w-full items-center justify-between rounded-2xl border bg-background px-4 text-sm font-medium focus:border-foreground transition-colors text-left"
                >
                  <span className="truncate">Semester {reqSem}</span>
                  <CaretDown size={16} weight="bold" className={`text-muted-foreground transition-transform shrink-0 ml-2 ${semDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTouch ? (
                  <>
                    {semDropdownOpen && <div className="fixed inset-0 z-20" onClick={() => setSemDropdownOpen(false)} />}
                    <MobilePresence show={semDropdownOpen} type="dropdown" className="absolute top-[calc(100%+6px)] left-0 right-0 z-30 overflow-hidden rounded-2xl border bg-card p-1.5 shadow-xl">
                      <div data-lenis-prevent="true" className="max-h-48 overflow-y-auto overscroll-contain dropdown-scroll flex flex-col gap-1 pr-1" style={{ overscrollBehavior: 'contain' }}>
                        {availableSemesters.map(s => (
                          <button key={s} type="button" onClick={() => { setReqSem(s); setSemDropdownOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${reqSem === s ? 'bg-secondary font-semibold text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
                            <span>Semester {s}</span>{reqSem === s && <Check size={16} weight="bold" className="text-primary shrink-0 ml-2" />}
                          </button>
                        ))}
                      </div>
                    </MobilePresence>
                  </>
                ) : (
                  <AnimatePresence>
                    {semDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setSemDropdownOpen(false)} />
                        <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.12 }} className="absolute top-[calc(100%+6px)] left-0 right-0 z-30 overflow-hidden rounded-2xl border bg-card p-1.5 shadow-xl">
                          <div data-lenis-prevent="true" className="max-h-48 overflow-y-auto overscroll-contain dropdown-scroll flex flex-col gap-1 pr-1" style={{ overscrollBehavior: 'contain' }}>
                            {availableSemesters.map(s => (
                              <button key={s} type="button" onClick={() => { setReqSem(s); setSemDropdownOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${reqSem === s ? 'bg-secondary font-semibold text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
                                <span>Semester {s}</span>{reqSem === s && <Check size={16} weight="bold" className="text-primary shrink-0 ml-2" />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

          <label className="field-label">
            Course Name or Code (Optional)
            <input
              value={reqCourse}
              onChange={e => setReqCourse(e.target.value)}
              className="field-input"
              placeholder="e.g. Digital Logic Design (CE 201)"
            />
          </label>

          <label className="field-label">
            Details & Specific Topics
            <textarea
              required
              value={reqMsg}
              onChange={e => setReqMsg(e.target.value)}
              className="field-input min-h-28 py-3 resize-none"
              placeholder="Describe the notes, syllabus, or past papers you are looking for..."
            />
          </label>

          {reqSuccess && (
            <div className="rounded-2xl bg-sage/40 border border-primary/20 p-3.5 text-center text-xs font-semibold text-foreground flex items-center justify-center gap-1.5">
              <Check size={16} className="text-primary" /> Thank you! Your request has been forwarded to department administrators.
            </div>
          )}

          <button
            type="submit"
            disabled={reqLoading}
            className="rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground text-sm hover:opacity-95 transition-opacity shadow-sm self-start"
          >
            {reqLoading ? 'Submitting request...' : 'Send request to department'}
          </button>
        </form>
      </section>
      )}

      {/* 3b. Re-take / Academic Standing Self-Report (For Students) */}
      {role === 'student' && (
        <section className="rounded-3xl border bg-card p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Academic Progression & Re-take Report</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Repeating coursework or need a semester paused? Submit a report so department administrators can verify your status during batch advancement.
          </p>

          <div className="rounded-2xl bg-secondary/60 p-4 border border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <b className="text-xs font-semibold text-foreground">Current Standing:</b>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user?.heldBack ? 'Paused / Held Back for Re-take (Will not auto-advance)' : 'Normal Batch Progression'}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                const note = prompt('Please specify which courses or semester you are repeating:');
                if (note === null) return;
                try {
                  const res = await submitHeldBackSelfReport(note);
                  if (res.success) {
                    alert('Thank you! Your repeat report has been sent to department administrators for review.');
                  }
                } catch (e: any) {
                  alert(e?.message || 'Failed to submit report.');
                }
              }}
              className="rounded-full bg-secondary hover:bg-secondary/80 border text-foreground px-4 py-2 text-xs font-semibold transition-colors cursor-pointer shrink-0"
            >
              Report Repeating Coursework
            </button>
          </div>
        </section>
      )}

      {/* 4. Session Actions */}
      <section className="rounded-3xl border bg-card p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Sign Out</h3>
          <p className="text-xs text-muted-foreground mt-0.5">End your current session on this device.</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="rounded-full border border-destructive/40 text-destructive hover:bg-destructive/10 px-5 py-2.5 text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs active:scale-[0.98]"
        >
          {isLoggingOut ? (
            <div className="size-4 border-2 border-destructive/30 border-t-destructive animate-spin rounded-full" />
          ) : (
            <LogOut size={16} />
          )}
          <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
        </button>
      </section>
    </div>
  )
}

function Login({ 
  onLogin, 
  onSwitchToSignUp 
}: { 
  onLogin: (credentials: FormData | { email: string; password?: string }) => Promise<string | void> | void
  onSwitchToSignUp?: () => void 
}) {
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      const err = await onLogin(formData)
      if (err) setError(err)
    } catch (e: any) {
      setError(e?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell min-h-screen bg-background py-6 sm:py-10 md:py-14 px-3 sm:px-6 md:px-8 flex flex-col justify-center items-center">
      <div className="mx-auto grid w-full max-w-6xl rounded-3xl sm:rounded-[2.2rem] border bg-card shadow-sm md:grid-cols-[1.05fr_.95fr] overflow-hidden my-auto">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-sage p-12 md:flex">
          <div className="flex items-center gap-3">
            <SemstackLogo size={42} className="size-[42px]" />
            <b className="text-xl">Semstack</b>
          </div>
          <div className="max-w-md">
            <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.05] tracking-[-.05em]">
              Every useful note, in one calm place.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Browse by semester, read beautifully, and never miss what matters — built for UET.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-background/60 p-5">
              <FileText/>
              <b className="mt-8 block">Shared by contributors</b>
              <p className="text-sm text-muted-foreground">Reviewed before publishing.</p>
            </div>
            <div className="rounded-3xl bg-background/60 p-5">
              <Bell/>
              <b className="mt-8 block">Department updates</b>
              <p className="text-sm text-muted-foreground">Clear, timely announcements.</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-center p-7 md:p-12">
          <div className="mb-8 flex items-center justify-between md:hidden">
            <div className="flex items-center gap-3">
              <SemstackLogo size={38} className="size-[38px]" />
              <b className="text-xl">Semstack</b>
            </div>
          </div>

          <p className="section-kicker">Welcome back</p>
          <h2 className="text-4xl font-semibold tracking-[-.04em]">Sign in to Semstack</h2>
          <p className="mt-2 text-muted-foreground">Your department's notes and notices await.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <label className="field-label">
              Email address
              <input 
                required 
                name="email"
                value={identity} 
                onChange={e => setIdentity(e.target.value)} 
                type="email" 
                className="field-input" 
                placeholder="student@uet.edu"
                disabled={loading}
              />
            </label>
            <label className="field-label">
              Password
              <input 
                required 
                name="password"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                type="password" 
                className="field-input" 
                placeholder="••••••••"
                disabled={loading}
              />
            </label>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs text-destructive font-medium flex items-center gap-2.5 leading-relaxed shadow-xs"
              >
                <WarningCircle size={17} weight="bold" className="shrink-0 text-destructive" />
                <span>{error}</span>
              </motion.div>
            )}

            <button 
              disabled={loading}
              className="rounded-full bg-primary px-5 py-3.5 font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-70 shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Continue</span>
              )}
            </button>
          </form>
          
          <div className="mt-7 text-center text-sm text-muted-foreground">
            <span>New to Semstack? </span>
            <button 
              type="button" 
              onClick={onSwitchToSignUp}
              className="font-semibold text-foreground underline underline-offset-4 hover:text-primary transition-colors cursor-pointer"
            >
              Sign up for departmental review
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

function SavedNotes({
  notes,
  subjects,
  savedNoteIds,
  toggleSave,
  open
}: {
  notes: Note[]
  subjects: SubjectItem[]
  savedNoteIds: string[]
  toggleSave: (id: string | number) => void
  open: (n: Note) => void
}){
  const [search, setSearch] = useState('')

  // ONLY notes explicitly bookmarked/saved by the student
  const savedList = useMemo(() => {
    return notes.filter(n => savedNoteIds.includes(String(n.id)))
  }, [notes, savedNoteIds])

  const filtered = useMemo(() => {
    return savedList.filter(n => {
      const q = search.toLowerCase()
      return !q || `${n.title} ${n.subject} ${n.author} ${n.code}`.toLowerCase().includes(q)
    })
  }, [savedList, search])

  return (
    <div className="flex flex-col gap-6">
      {savedList.length > 0 && (
        <label className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 text-muted-foreground focus-within:border-primary/40 focus-within:text-foreground transition-colors">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your saved notes..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </label>
      )}

      {savedList.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground border rounded-3xl border-dashed bg-card/40 max-w-xl mx-auto p-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary mx-auto mb-4 text-muted-foreground">
            <Bookmark size={28} />
          </div>
          <h3 className="font-semibold text-lg text-foreground">No saved notes yet</h3>
          <p className="text-sm mt-1.5 text-muted-foreground leading-relaxed">
            Browse course notes in the Library and click the bookmark icon on any note to save it here for quick revision.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border rounded-3xl border-dashed bg-card/40">
          <p className="font-semibold text-foreground text-sm">No matching saved notes found</p>
          <p className="text-xs mt-1">Try a different search term.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((n, i) => (
            <NoteRow 
              key={n.id} 
              note={n} 
              subjects={subjects} 
              isSaved={true} 
              toggleSave={toggleSave} 
              index={i} 
              open={() => open(n)} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SemesterLibrary({ 
  subjects, 
  notes, 
  select,
  user,
  role
}: { 
  subjects: SubjectItem[]
  notes: Note[]
  select: (n: number) => void
  user: PrismaUser | null
  role: Role | null
}) {
  // Dynamically derive all available semesters from DB subjects (at least 1 to 8)
  const semesterNumbers = useMemo(() => {
    const set = new Set<number>()
    subjects.forEach(s => set.add(s.semester))
    const max = Math.max(8, ...Array.from(set))
    const list: number[] = []
    for (let i = 1; i <= max; i++) list.push(i)
    return list
  }, [subjects])

  const userSem = user?.semester || 1
  const isRestrictedBySemester = role !== 'admin' && user?.status !== 'GRADUATED'

  return (
    <div>
      <Header kicker="Computer Engineering" title="Choose a semester" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {semesterNumbers.map(num => {
          const semSubjects = subjects.filter(s => s.semester === num)
          const tone = SEMESTER_COLORS[(num - 1) % SEMESTER_COLORS.length]
          const label = SEMESTER_LABELS[num] || `Semester ${num}`
          const previewItems = semSubjects.map(s => s.name).slice(0, 4)
          const isLocked = isRestrictedBySemester && num > userSem

          if (isLocked) {
            return (
              <div
                key={num}
                className="bg-card/50 border border-dashed border-border/80 flex min-h-64 flex-col justify-between rounded-3xl p-7 text-left opacity-60 select-none relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Lock size={15} /> Semester {num}
                  </span>
                  <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                    Locked
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-muted-foreground tracking-tight flex items-center gap-2">
                    {label}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Unlocks automatically when your batch advances to Semester {num}.
                  </p>
                </div>
              </div>
            )
          }

          return (
            <button
              key={num}
              onClick={() => select(num)}
              className={`${tone} flex min-h-64 flex-col justify-between rounded-3xl p-7 text-left transition hover:-translate-y-1 shadow-xs border border-black/5 cursor-pointer`}
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-semibold text-foreground">Semester {num}</span>
                <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur-sm shadow-xs">
                  {semSubjects.length} {semSubjects.length === 1 ? 'subject' : 'subjects'}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground tracking-tight">{label}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {previewItems.length > 0 ? previewItems.join(' · ') : 'No courses registered yet.'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SubjectLibrary({
  semester,
  subjects,
  notes,
  query,
  setQuery,
  savedNoteIds,
  toggleSave,
  open,
  onBack
}: {
  semester: number
  subjects: SubjectItem[]
  notes: Note[]
  query: string
  setQuery: (s: string) => void
  savedNoteIds: string[]
  toggleSave: (id: string | number) => void
  open: (n: Note) => void
  onBack: () => void
}) {
  const semSubjects = useMemo(() => subjects.filter(s => s.semester === semester), [subjects, semester])
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null)

  const activeSubject = selectedSubject || semSubjects[0] || null

  const list = useMemo(() => {
    if (semSubjects.length === 0) return []

    return notes.filter(n => {
      if (n.status && n.status !== 'PUBLISHED') return false
      if (activeSubject) {
        const matches = n.code === activeSubject.code || n.subject === activeSubject.name
        if (!matches) return false
      } else {
        const isThisSem = semSubjects.some(s => s.code === n.code || s.name === n.subject)
        if (!isThisSem) return false
      }
      const q = query.toLowerCase()
      return !q || `${n.title} ${n.author} ${n.subject} ${n.code}`.toLowerCase().includes(q)
    })
  }, [notes, activeSubject, semSubjects, query])

  const tone = SEMESTER_COLORS[(semester - 1) % SEMESTER_COLORS.length]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button 
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors bg-secondary/80 hover:bg-secondary px-3.5 py-1.5 rounded-full" 
          onClick={onBack}
        >
          <ArrowLeft size={16}/> Back to Semesters
        </button>
        <span className="text-xs font-semibold text-muted-foreground">
          {semSubjects.length} {semSubjects.length === 1 ? 'course' : 'courses'}
        </span>
      </div>

      {/* Mobile Horizontal Pill Bar (Phone only) */}
      {semSubjects.length > 0 && (
        <div className="md:hidden">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 modal-scroll touch-pan-x min-w-0 max-w-full">
            {semSubjects.map(s => {
              const isActive = activeSubject?.code === s.code
              return (
                <button
                  key={s.code}
                  onClick={() => setSelectedSubject(s)}
                  className={`relative px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-colors select-none shrink-0 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                  }`}
                >
                  <span>{s.name}</span>
                  <span className="opacity-70 ml-1 text-[10px]">({s.code})</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] items-start">
        {/* Desktop Sticky Sidebar (PC/Tablet only) */}
        <aside className="hidden md:block sticky top-24 self-start w-full">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Courses</p>
          <div className="flex flex-col gap-1.5">
            {semSubjects.length === 0 ? (
              <div className="p-4 rounded-2xl bg-card border border-dashed text-xs text-muted-foreground">
                No subjects registered for Semester {semester}.
              </div>
            ) : (
              semSubjects.map((s) => {
                const isActive = activeSubject?.code === s.code
                return (
                  <button
                    key={s.code}
                    onClick={() => setSelectedSubject(s)}
                    className={`rounded-2xl p-4 text-left text-sm transition-colors flex items-center justify-between gap-2 ${
                      isActive ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {s.code}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Main Content with Stable Min Height */}
        <section className="min-w-0 min-h-[420px] flex flex-col">
          {activeSubject ? (
            <div className={`rounded-3xl ${tone} p-7 border border-black/5 shadow-xs transition-colors`}>
              <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-bold text-foreground">
                {activeSubject.code}
              </span>
              <h2 className="mt-4 text-3xl font-semibold text-foreground tracking-tight">{activeSubject.name}</h2>
              <p className="mt-1.5 text-muted-foreground text-sm">
                Foundations, worked examples and past questions shared by your contributors.
              </p>
            </div>
          ) : (
            <div className={`rounded-3xl ${tone} p-7 border border-black/5`}>
              <h2 className="text-3xl font-semibold text-foreground">Semester {semester}</h2>
              <p className="mt-2 text-muted-foreground text-sm">Select a course to view uploaded notes.</p>
            </div>
          )}

          <label className="mt-6 flex items-center gap-3 rounded-2xl border bg-card px-4 focus-within:border-primary/40 transition-colors">
            <Search size={18} className="text-muted-foreground shrink-0"/>
            <span className="sr-only">Search notes</span>
            <input 
              value={query} 
              onChange={e=>setQuery(e.target.value)} 
              className="h-14 flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground" 
              placeholder={activeSubject ? `Search ${activeSubject.name} notes...` : "Search notes..."}
            />
          </label>

          <div className="mt-4 flex flex-col gap-3 flex-1">
            {list.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground border rounded-3xl border-dashed bg-card/40 my-auto">
                <FileText size={32} className="mx-auto mb-2 opacity-30"/>
                <p className="font-semibold text-foreground text-sm">No notes available</p>
                <p className="text-xs mt-1">Be the first to contribute notes for {activeSubject?.name || 'this subject'}!</p>
              </div>
            ) : (
              list.map((n,i)=>(
                <NoteRow 
                  key={n.id} 
                  note={n} 
                  subjects={subjects} 
                  isSaved={savedNoteIds.includes(String(n.id))}
                  toggleSave={toggleSave}
                  index={i} 
                  open={()=>open(n)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function NoteRow({
  note,
  subjects = [],
  isSaved = false,
  toggleSave,
  open,
  onDelete,
  index = 0
}: {
  note: Note
  subjects?: SubjectItem[]
  isSaved?: boolean
  toggleSave?: (id: string | number) => void
  open: () => void
  onDelete?: () => void
  index?: number
}){
  const [expanded, setExpanded] = useState(false);
  const semNumber = subjects.find(s => s.code === note.code || s.name === note.subject)?.semester

  return (
    <motion.article initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="flex flex-col rounded-2xl border bg-card p-4 hover:border-primary/30 transition-colors shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${note.tone}`}><FileText size={20}/></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">{note.title}</h3>
            {note.description && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  expanded
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-secondary border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                <GraduationCap size={14} className="text-primary" />
                <span>{expanded ? 'Hide advice' : 'Contributor advice'}</span>
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {note.author} · {note.date} · {semNumber ? `Semester ${semNumber} · ` : ''}{note.pages} pages · {note.size}
          </p>
        </div>
        <div className="flex gap-2 shrink-0 items-center">
          {toggleSave && (
            <button 
              type="button" 
              onClick={() => toggleSave(note.id)} 
              className={`icon-button border transition-colors ${
                isSaved ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
              }`}
              title={isSaved ? "Remove from saved" : "Save note"}
            >
              <Bookmark size={18} weight={isSaved ? "fill" : "regular"} />
            </button>
          )}
          {open && (
            <button 
              onClick={open} 
              className="icon-button border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Read note in browser"
            >
              <Eye size={18} />
            </button>
          )}
          <a 
            href={note.fileUrl || `/api/download?title=${encodeURIComponent(note.title)}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="icon-button bg-primary text-primary-foreground hover:opacity-90 transition-opacity" 
            title="Download PDF file"
          >
            <Download size={18}/>
          </a>
          {onDelete && (
            <button 
              onClick={onDelete} 
              className="icon-button border text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors" 
              title="Delete note"
              aria-label={`Delete ${note.title}`}
            >
              <Trash size={18} />
            </button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {expanded && note.description && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <div className="rounded-xl bg-sage/40 border border-primary/20 p-3.5 text-sm">
                <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
                  <GraduationCap size={16} className="text-primary shrink-0" />
                  <span>Contributor Advice & Tips</span>
                  <span className="text-xs text-muted-foreground font-normal ml-auto">by {note.author}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-6 whitespace-pre-wrap">{note.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

function downloadNote(note:Note){const blob=new Blob([`${note.title}\n${note.subject}\nShared on Semstack by ${note.author}`],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${note.title}.txt`;a.click();URL.revokeObjectURL(url)}

function Notifications({alerts,setAlerts,user}:{alerts:any[],setAlerts:(a:any[])=>void,user:PrismaUser|null}){
  const [filter, setFilter] = useState<'dept' | 'app' | 'all' | 'unread'>('dept')

  const baseFiltered = useMemo(() => {
    return alerts.filter(a => {
      // Internal admin records are handled in Admin CMS Requests & Users studios
      if (a.audience === 'ADMIN' || a.title?.startsWith('Request:')) return false
      // If user has a semester and alert is for a specific semester, check match
      if (user?.role !== 'ADMIN' && a.audience && a.audience !== 'ALL' && a.audience !== 'All students' && a.audience !== 'Department') {
        const match = a.audience.match(/Semester\s*(\d)/i) || a.audience.match(/SEM_(\d)/i)
        if (match) {
          const targetSem = parseInt(match[1], 10)
          if (targetSem !== user?.semester) return false
        }
      }
      return true
    })
  }, [alerts, user])

  const shown = useMemo(() => {
    return baseFiltered.filter(a => {
      if (filter === 'unread') return !!a.unread
      if (filter === 'dept') return a.kind !== 'New note'
      if (filter === 'app') return a.kind === 'New note'
      return true
    })
  }, [baseFiltered, filter])

  const counts = useMemo(() => ({
    all: baseFiltered.length,
    dept: baseFiltered.filter(a => a.kind !== 'New note').length,
    app: baseFiltered.filter(a => a.kind === 'New note').length,
    unread: baseFiltered.filter(a => a.unread).length
  }), [baseFiltered])

  return (
    <section className="max-w-3xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex rounded-full bg-secondary p-1 w-fit overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Nav layoutId="notify-nav" active={filter==='dept'} onClick={()=>setFilter('dept')}>
            Department Notices {counts.dept > 0 && `(${counts.dept})`}
          </Nav>
          <Nav layoutId="notify-nav" active={filter==='app'} onClick={()=>setFilter('app')}>
            App Activity {counts.app > 0 && `(${counts.app})`}
          </Nav>
          <Nav layoutId="notify-nav" active={filter==='all'} onClick={()=>setFilter('all')}>
            All ({counts.all})
          </Nav>
          <Nav layoutId="notify-nav" active={filter==='unread'} onClick={()=>setFilter('unread')}>
            Unread {counts.unread > 0 && `(${counts.unread})`}
          </Nav>
        </div>
        {baseFiltered.some(a => a.unread) && (
          <button onClick={()=>setAlerts(alerts.map(a=>({...a,unread:false})))} className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
            Mark all read
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          <motion.div key={filter} initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-6}} transition={{duration:0.15, ease: "easeOut"}} className="flex flex-col gap-3 transform-gpu">
            {shown.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground border rounded-3xl border-dashed bg-card/40">
                <Bell size={32} className="mx-auto mb-2 opacity-30"/>
                <p className="font-semibold text-foreground text-sm">
                  {filter === 'dept' ? 'No department notices yet' : filter === 'app' ? 'No app activity yet' : filter === 'unread' ? 'No unread notifications' : 'No announcements found'}
                </p>
                <p className="text-xs mt-1">
                  {filter === 'dept' ? 'Official announcements broadcast by faculty/admin will appear here.' : 'Updates on published notes and study materials will appear here.'}
                </p>
              </div>
            ) : (
              shown.map(a => (
                <button 
                  key={a.id} 
                  onClick={()=>setAlerts(alerts.map(x=>x.id===a.id?{...x,unread:false}:x))} 
                  className="flex gap-4 rounded-3xl border bg-card p-5 text-left transition hover:shadow-sm hover:border-primary/30 cursor-pointer"
                >
                  <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-foreground">
                    {a.kind==='New note' ? <FileText size={18}/> : <Megaphone size={18}/>}
                  </span>
                  <span className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span className="text-xs text-muted-foreground">{a.time}</span>
                    </div>
                    <span className="flex items-center gap-2">
                      <b className="text-base font-semibold text-foreground">{a.title}</b>
                      {a.unread && <i className="size-2 rounded-full bg-primary shrink-0"/>}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground leading-relaxed">{a.body}</span>
                    {a.imageUrl && (
                      <div className="mt-3 overflow-hidden rounded-2xl border bg-background/50 max-h-72">
                        <a 
                          href={a.imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={e => e.stopPropagation()} 
                          className="block group"
                        >
                          <img 
                            src={a.imageUrl} 
                            alt="Attached notice document" 
                            className="w-full h-auto max-h-72 object-contain bg-black/5 group-hover:opacity-90 transition-opacity" 
                          />
                        </a>
                      </div>
                    )}
                  </span>
                </button>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}


function ContributorDesk({
  user,
  add,
  notes,
  subjects,
  onNavigateToSettings
}: {
  user: PrismaUser | null
  add: (n: Note) => void
  notes: Note[]
  subjects: SubjectItem[]
  onNavigateToSettings?: () => void
}) {
  const isTouch = useIsTouch()
  const [open, setOpen] = useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mounted, setMounted] = useState(false);
  const lenis = useLenis();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      lenis?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      lenis?.start();
      document.body.style.overflow = '';
    }
    return () => {
      lenis?.start();
      document.body.style.overflow = '';
    };
  }, [open, lenis]);

  const [subjectCode, setSubjectCode] = useState('');
  const [seniorAdvice, setSeniorAdvice] = useState('');

  const semesterSubjects = useMemo(() => subjects.filter(s => s.semester === selectedSemester), [subjects, selectedSemester]);

  useEffect(() => {
    if (semesterSubjects.length > 0 && !subjectCode) {
      setSubjectCode(semesterSubjects[0].code);
    }
  }, [semesterSubjects, subjectCode]);

  const handleSemesterChange = (sem: number) => {
    setSelectedSemester(sem);
    const subList = subjects.filter(s => s.semester === sem);
    setSubjectCode(subList.length > 0 ? subList[0].code : '');
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(0);
    const form = new FormData(e.currentTarget);
    const file = selectedFile || (form.get('file') as File | null);
    const title = String(form.get('title') || '').trim();
    
    const matchedSubject = subjects.find(s => s.code === subjectCode);
    if (!matchedSubject) { alert('Please select a course for this semester.'); setUploading(false); return; }
    const finalCode = matchedSubject.code;
    const finalSubjectName = matchedSubject.name;

    if (!file || file.size === 0) { alert('Please select a PDF file'); setUploading(false); return; }
    if (file.type !== 'application/pdf') { alert('Only PDF files are allowed'); setUploading(false); return; }
    if (file.size > 100 * 1024 * 1024) { alert('File size must be less than 100 MB'); setUploading(false); return; }
    if (!finalCode) { alert('Please choose or enter a subject code'); setUploading(false); return; }

    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { url, error: presignError } = await getPresignedUrl(fileName, file.type);
    if (presignError || !url) { alert(presignError || 'Failed to get secure upload link'); setUploading(false); return; }

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error('Failed to upload file to storage'));
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
    } catch (err) {
      alert((err as Error).message); setUploading(false); setUploadProgress(0); return;
    }

    const fileUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`;

    const res = await createNote({
      title,
      subjectCode: finalCode,
      subjectName: finalSubjectName,
      semester: selectedSemester,
      description: seniorAdvice.trim() || undefined,
      fileUrl,
      pages: 12,
      size: (file.size / (1024*1024)).toFixed(1) + ' MB'
    });

    if (res.error) {
      alert(res.error);
    } else if (res.note) {
      add({
        id: res.note.id,
        authorId: user?.id,
        title: res.note.title,
        subject: finalSubjectName,
        code: finalCode,
        author: user?.name || 'You',
        date: 'Just now',
        pages: res.note.pages,
        size: res.note.size,
        tone: res.note.tone,
        status: res.note.status,
        fileUrl,
        description: seniorAdvice.trim() || undefined
      });
      setSubmitted(true);
      setSeniorAdvice('');
      setSelectedFile(null);
      setTimeout(()=>{setOpen(false);setSubmitted(false);setUploadProgress(0);},1500);
    }
    setUploading(false);
  };

  const myNotes = notes.filter(n => (user && n.authorId === user.id) || n.author === user?.name || n.author === 'You');

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_340px]">
      <section>
        <div className="rounded-3xl bg-mist p-7">
          <Upload size={25}/>
          <h2 className="mt-10 text-3xl font-semibold">Share what helped you learn.</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">Every note is reviewed by the department before students can see it.</p>
          <button onClick={()=>setOpen(true)} className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            Submit a note
          </button>
        </div>
        <div className="mt-8">
          <Header kicker="Your contributions" title="Submission history"/>
          {myNotes.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground bg-card/40">
              <FileText size={32} className="mx-auto mb-2 opacity-30"/>
              <p className="font-semibold text-foreground text-sm">No submissions yet</p>
              <p className="text-xs mt-1">Upload lecture notes, formulas, or summaries to help your peers.</p>
            </div>
          ) : (
            myNotes.map(x=>(
              <div key={x.id} className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border bg-card p-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <FileText className="shrink-0 text-muted-foreground"/>
                  <div className="flex-1 min-w-0">
                    <b className="block truncate">{x.title}</b>
                    <p className="text-sm text-muted-foreground truncate">Submitted {x.date} · {x.subject || x.code}</p>
                  </div>
                </div>
                <span className={`bg-secondary rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap w-fit`}>{x.status}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Before you submit sidebar */}
      <aside className="rounded-3xl bg-secondary p-6 lg:self-start border border-border/60">
        <h3 className="font-semibold text-foreground">Before you submit</h3>
        <ul className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
          <li>Select your target semester & subject.</li>
          <li>Add helpful exam tips or study advice.</li>
          <li>Only upload material you can share.</li>
          <li>PDF files, up to 100 MB.</li>
        </ul>
      </aside>

      {mounted && (() => {
        // Shared backdrop + form wrapper
        // Mobile: MobilePresence (CSS compositor) + plain form
        // Desktop: AnimatePresence + motion.div + motion.form (Framer Motion)
        const formInner = (
          <>
            {/* Frosted Sticky Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-5 bg-card/90 backdrop-blur-xl border-b border-border/40">
              <div>
                <p className="section-kicker mb-0.5">New submission</p>
                <h2 id="submit-title" className="text-xl sm:text-2xl font-bold tracking-tight">Upload your note</h2>
              </div>
              <button type="button" onClick={()=>setOpen(false)} className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors" aria-label="Close dialog">
                <X size={18}/>
              </button>
            </div>
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto modal-scroll px-6 py-5 mr-2 pr-4 space-y-5">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4"><Check size={28} weight="bold" /></div>
                  <h3 className="text-xl font-bold">Uploaded for review!</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">Your note has been submitted to the department.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <label className="field-label">Note title<input required name="title" className="field-input" placeholder="e.g. Week 1–6 Midterm Summary" /></label>
                  {/* Target Semester Selector */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-foreground">Target semester</span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 modal-scroll touch-pan-x">
                      {[1,2,3,4,5,6,7,8].map(n=>(
                        <button key={n} type="button" onClick={()=>handleSemesterChange(n)} className={`flex shrink-0 h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all ${selectedSemester===n?'bg-primary text-primary-foreground shadow-sm':'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                  {/* Subject Dropdown or Empty Warning */}
                  {semesterSubjects.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-foreground">Subject</span>
                      <div className="relative">
                        <button type="button" onClick={()=>setSubjectDropdownOpen(!subjectDropdownOpen)} className="flex h-12 w-full items-center justify-between rounded-2xl border bg-background px-4 text-sm font-medium focus:border-foreground transition-colors text-left">
                          <span className="truncate">{subjectCode?semesterSubjects.find(s=>s.code===subjectCode)?.name||subjectCode:'Select a course'}</span>
                          <CaretDown size={16} weight="bold" className={`text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${subjectDropdownOpen?'rotate-180':''}`}/>
                        </button>
                        {isTouch ? (
                          <>
                            {subjectDropdownOpen&&<div className="fixed inset-0 z-20" onClick={()=>setSubjectDropdownOpen(false)}/>}
                            <MobilePresence show={subjectDropdownOpen} type="dropdown" className="absolute top-[calc(100%+8px)] left-0 right-0 z-30 overflow-hidden rounded-2xl border bg-card p-1.5 shadow-xl">
                              <div className="max-h-48 overflow-y-auto modal-scroll flex flex-col gap-1 pr-1">
                                {semesterSubjects.map(s=><button key={s.code} type="button" onClick={()=>{setSubjectCode(s.code);setSubjectDropdownOpen(false);}} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${subjectCode===s.code?'bg-secondary font-semibold':'hover:bg-secondary/50'}`}>{s.name} ({s.code})</button>)}
                              </div>
                            </MobilePresence>
                          </>
                        ):(
                          <AnimatePresence>
                            {subjectDropdownOpen&&(
                              <motion.div initial={{opacity:0,y:-8,scale:0.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:0.98}} className="absolute top-[calc(100%+8px)] left-0 right-0 z-30 overflow-hidden rounded-2xl border bg-card p-1.5 shadow-xl">
                                <div className="max-h-48 overflow-y-auto modal-scroll flex flex-col gap-1 pr-1">
                                  {semesterSubjects.map(s=><button key={s.code} type="button" onClick={()=>{setSubjectCode(s.code);setSubjectDropdownOpen(false);}} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${subjectCode===s.code?'bg-secondary font-semibold':'hover:bg-secondary/50'}`}>{s.name} ({s.code})</button>)}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-primary/20 bg-sage/40 p-3.5 text-xs text-foreground flex items-start gap-2.5">
                      <GraduationCap size={18} className="shrink-0 text-primary mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">No courses available for Semester {selectedSemester}</p>
                        <p className="text-muted-foreground leading-relaxed">
                          Department administrators haven&apos;t set up courses for this semester yet. You can{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setOpen(false);
                              onNavigateToSettings?.();
                            }}
                            className="underline underline-offset-2 font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer inline"
                          >
                            Request Content or Report Changes
                          </button>{' '}
                          so that admin adds them.
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Senior Advice */}
                  <label className="field-label flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground"><GraduationCap size={16} className="text-primary"/>Senior Advice &amp; Study Tips (Optional)</span>
                    <div className="flex h-28 rounded-2xl border bg-background overflow-hidden focus-within:border-foreground transition-colors">
                      <textarea value={seniorAdvice} onChange={e=>setSeniorAdvice(e.target.value)} className="h-full w-full bg-transparent px-4 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground" placeholder="e.g. Focus on Chapter 3 formulas and past midterm questions."/>
                    </div>
                  </label>
                  {/* PDF File Upload */}
                  <label className={`relative flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border transition-all p-4 ${selectedFile?'border-primary/40 bg-secondary/80 hover:bg-secondary':'border-dashed border-border/80 bg-secondary/40 hover:border-primary/40 hover:bg-secondary/70'}`}>
                    {selectedFile?(
                      <div className="flex w-full items-center gap-3.5">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><FileText size={22} weight="fill"/></div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{(selectedFile.size/(1024*1024)).toFixed(1)} MB</p>
                        </div>
                        <button type="button" onClick={e=>{e.preventDefault();setSelectedFile(null);}} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary hover:bg-destructive/10 hover:text-destructive transition-colors"><X size={15}/></button>
                      </div>
                    ):(
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary"><UploadSimple size={20} className="text-muted-foreground"/></div>
                        <div><p className="text-sm font-medium">Click to upload PDF</p><p className="text-xs text-muted-foreground mt-0.5">PDF files up to 100 MB</p></div>
                      </div>
                    )}
                    <input type="file" name="file" accept=".pdf" className="sr-only" onChange={e=>{if(e.target.files?.[0])setSelectedFile(e.target.files[0]);}}/>
                  </label>
                  {/* Upload progress */}
                  {uploading&&(
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Uploading PDF…</span><span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{width:`${uploadProgress}%`}}/>
                      </div>
                    </div>
                  )}
                  {/* Submit button */}
                  {!uploading?(
                    <div className="flex flex-col gap-2">
                      <button type="submit" disabled={!selectedFile || semesterSubjects.length === 0} className="rounded-full bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">Submit note for review</button>
                      {selectedFile && semesterSubjects.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground">
                          Upload disabled: Please select a semester with active courses or{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setOpen(false);
                              onNavigateToSettings?.();
                            }}
                            className="underline underline-offset-2 font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                          >
                            Request Content or Report Changes
                          </button>.
                        </p>
                      )}
                    </div>
                  ):(
                    <button className="rounded-full bg-primary p-3.5 font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity mt-1">Submit note for review</button>
                  )}
                </div>
              )}
            </div>
            {/* Bottom cushion spacer */}
            <div className="h-4 w-full bg-card shrink-0 pointer-events-none"/>
          </>
        )
        return createPortal(
          isTouch ? (
            <MobilePresence show={open} type="backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-foreground/45 overscroll-none touch-none" data-lenis-prevent role="dialog" aria-modal={true} aria-labelledby="submit-title" onClick={()=>setSubjectDropdownOpen(false)}>
              <form onSubmit={handleUpload} onClick={e=>e.stopPropagation()} className="relative flex flex-col w-full max-w-lg rounded-[2rem] bg-card border border-border/80 shadow-2xl max-h-[88vh] overflow-hidden m-panel-enter" data-lenis-prevent>
                {formInner}
              </form>
            </MobilePresence>
          ) : (
            <AnimatePresence>
              {open&&(
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}} className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-foreground/40 backdrop-blur-sm overscroll-none touch-none" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="submit-title" onClick={()=>setSubjectDropdownOpen(false)}>
                  <motion.form initial={{scale:0.95,y:15,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0.95,y:15,opacity:0}} transition={{type:'spring',bounce:0.15,duration:0.35}} onSubmit={handleUpload} onClick={e=>e.stopPropagation()} className="relative flex flex-col w-full max-w-lg rounded-[2rem] bg-card border border-border/80 shadow-2xl max-h-[88vh] overflow-hidden fm-gpu" data-lenis-prevent>
                    {formInner}
                  </motion.form>
                </motion.div>
              )}
            </AnimatePresence>
          ),
          document.body
        )
      })()}
    </div>
  )
}

function ReviewQueueCard({
  candidate,
  subjects,
  onPublish,
  onDelete,
  onUpdate
}: {
  candidate: Note
  subjects: SubjectItem[]
  onPublish: (n: Note) => void
  onDelete: (n: Note) => void
  onUpdate: (updated: Note) => void
}) {
  const isTouch = useIsTouch();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(candidate.title);
  const [description, setDescription] = useState(candidate.description || '');
  
  const initialSub = subjects.find(s => s.code === candidate.code || s.name === candidate.subject);
  const [selectedSem, setSelectedSem] = useState<number>(initialSub?.semester || 1);
  const semSubjects = useMemo(() => subjects.filter(s => s.semester === selectedSem), [subjects, selectedSem]);
  const [selectedCode, setSelectedCode] = useState<string>(candidate.code || (semSubjects[0]?.code || ''));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async (publishAfter: boolean) => {
    if (!selectedCode || semSubjects.length === 0) {
      alert(`Cannot save: Semester ${selectedSem} does not have any registered subjects yet. Please add subjects to Semester ${selectedSem} in the Curriculum tab first, or select another semester.`);
      return;
    }

    setLoading(true);
    const res = await updateNote({
      id: String(candidate.id),
      title: title.trim() || candidate.title,
      subjectCode: selectedCode,
      semester: selectedSem,
      description: description.trim(),
      status: publishAfter ? 'PUBLISHED' : 'PENDING'
    });

    if (res.error) {
      alert(res.error);
    } else if (res.note) {
      const updatedSubject = subjects.find(s => s.code === selectedCode);
      const updatedNote: Note = {
        ...candidate,
        title: res.note.title,
        subject: updatedSubject?.name || res.note.subject?.name || candidate.subject,
        code: selectedCode,
        description: res.note.description || undefined,
        status: res.note.status
      };

      onUpdate(updatedNote);
      setIsEditing(false);
    }
    setLoading(false);
  };

  const semNumber = subjects.find(s => s.code === candidate.code || s.name === candidate.subject)?.semester || selectedSem;

  return (
    <div className="grid min-w-0 max-w-full w-full gap-5 lg:grid-cols-[1fr_340px]">
      <section className="min-w-0 max-w-full w-full rounded-3xl border bg-card p-5 sm:p-6 shadow-sm overflow-hidden">
        {isEditing ? (
          <div className="flex flex-col gap-4 min-w-0 max-w-full w-full">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Admin Quick Edit</span>
                <h3 className="text-lg font-semibold text-foreground">Edit submission details</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditing(false)} 
                className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2.5 py-1 rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            </div>

            <label className="field-label">
              Note Title
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="field-input"
                placeholder="Note title"
              />
            </label>

            {/* Target Semester Pills with visible scrollbar */}
            <div className="flex flex-col gap-1.5 min-w-0 max-w-full w-full">
              <span className="text-sm font-semibold text-foreground">Target Semester</span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 modal-scroll touch-pan-x min-w-0 max-w-full w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
                  const isActive = selectedSem === sem;
                  return (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => {
                        setSelectedSem(sem);
                        const subs = subjects.filter(s => s.semester === sem);
                        setSelectedCode(subs.length > 0 ? subs[0].code : '');
                      }}
                      className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors select-none shrink-0 ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      Semester {sem}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Course Dropdown */}
            <div className="flex flex-col gap-1.5 min-w-0 max-w-full w-full">
              <span className="text-sm font-semibold text-foreground">Course / Subject</span>
              {semSubjects.length === 0 ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5 text-center text-xs text-destructive flex items-center justify-center gap-1.5">
                  <Info size={16} /> No subjects registered in Semester {selectedSem}. Add in Curriculum tab first.
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex h-11 w-full items-center justify-between rounded-2xl border bg-background px-4 text-sm font-medium focus:border-foreground transition-colors text-left"
                  >
                    <span className="truncate">
                      {subjects.find(s => s.code === selectedCode)
                        ? `${subjects.find(s => s.code === selectedCode)?.name} (${selectedCode})`
                        : 'Select a course'}
                    </span>
                    <CaretDown size={16} weight="bold" className={`text-muted-foreground transition-transform shrink-0 ml-2 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isTouch ? (
                    <>
                      {dropdownOpen && <div className="fixed inset-0 z-20" onClick={() => setDropdownOpen(false)} />}
                      <MobilePresence show={dropdownOpen} type="dropdown" className="absolute top-[calc(100%+6px)] left-0 right-0 z-30 overflow-hidden rounded-2xl border bg-card p-1.5 shadow-xl">
                        <div data-lenis-prevent="true" className="max-h-48 overflow-y-auto overscroll-contain dropdown-scroll flex flex-col gap-1 pr-1" style={{ overscrollBehavior: 'contain' }}>
                          {semSubjects.map(s => (
                            <button key={s.code} type="button" onClick={() => { setSelectedCode(s.code); setDropdownOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-sm transition-colors ${selectedCode === s.code ? 'bg-secondary font-semibold text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
                              <span className="truncate">{s.name} ({s.code})</span>
                              {selectedCode === s.code && <Check size={16} weight="bold" className="text-primary shrink-0 ml-2" />}
                            </button>
                          ))}
                        </div>
                      </MobilePresence>
                    </>
                  ) : (
                    <AnimatePresence>
                      {dropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setDropdownOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.12 }}
                            className="absolute top-[calc(100%+6px)] left-0 right-0 z-30 overflow-hidden rounded-2xl border bg-card p-1.5 shadow-xl fm-gpu"
                          >
                            <div 
                              data-lenis-prevent="true"
                              className="max-h-48 overflow-y-auto overscroll-contain dropdown-scroll flex flex-col gap-1 pr-1"
                              style={{ overscrollBehavior: 'contain' }}
                            >
                              {semSubjects.map(s => (
                                <button
                                  key={s.code}
                                  type="button"
                                  onClick={() => { setSelectedCode(s.code); setDropdownOpen(false); }}
                                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-sm transition-colors ${
                                    selectedCode === s.code ? 'bg-secondary font-semibold text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                  }`}
                                >
                                  <span className="truncate">{s.name} ({s.code})</span>
                                  {selectedCode === s.code && <Check size={16} weight="bold" className="text-primary shrink-0 ml-2" />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              )}
            </div>

            <label className="field-label">
              Contributor Advice & Tips
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="field-input min-h-24 py-2.5 resize-none"
                placeholder="Senior advice..."
              />
            </label>

            <div className="rounded-2xl bg-secondary/70 p-3 text-xs text-muted-foreground flex items-center justify-between">
              <span>Author attribution: <b className="text-foreground">{candidate.author}</b></span>
              <span className="text-[10px] bg-background px-2 py-0.5 rounded-md border font-semibold">Preserved</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <button
                disabled={loading || !selectedCode || semSubjects.length === 0}
                type="button"
                onClick={() => handleSave(true)}
                className={`flex-1 rounded-full bg-primary py-3 px-4 font-semibold text-primary-foreground text-sm transition-opacity shadow-sm ${
                  !selectedCode || semSubjects.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95'
                }`}
              >
                {loading ? 'Saving...' : 'Save & publish now'}
              </button>
              <button
                disabled={loading || !selectedCode || semSubjects.length === 0}
                type="button"
                onClick={() => handleSave(false)}
                className={`rounded-full border border-border py-3 px-4 text-sm font-semibold transition-colors ${
                  !selectedCode || semSubjects.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary'
                }`}
              >
                Save draft changes
              </button>
            </div>
          </div>
        ) : (
          <div className="min-w-0 max-w-full w-full">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-blush shrink-0"><Inbox/></span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-foreground">Awaiting review</span>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/10 px-3 py-1 rounded-full"
                  >
                    <PencilSimple size={14} />
                    Edit title & location
                  </button>
                </div>
                <h2 className="mt-3 text-2xl font-semibold break-words">{candidate.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {candidate.subject} ({candidate.code}) · Semester {semNumber} · {candidate.pages} pages · {candidate.size}
                </p>
                
                {candidate.description && (
                  <div className="mt-4 rounded-2xl bg-sage/30 border border-primary/20 p-3.5 text-sm">
                    <b className="flex items-center gap-1.5 text-foreground"><GraduationCap size={16} className="text-primary"/> Contributor Advice:</b>
                    <p className="mt-1 text-muted-foreground leading-relaxed break-words">{candidate.description}</p>
                  </div>
                )}

                <p className="mt-5 leading-relaxed text-muted-foreground">
                  <a href={candidate.fileUrl} target="_blank" className="inline-flex items-center gap-1 text-primary underline underline-offset-2 font-medium">
                    Open uploaded PDF ↗
                  </a>
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-secondary p-4 flex items-center justify-between">
              <div>
                <b>Submitted by {candidate.author}</b>
                <p className="mt-0.5 text-xs text-muted-foreground">Note contributor · {candidate.date}</p>
              </div>
              <span className="text-xs bg-background/80 px-2.5 py-1 rounded-full border text-muted-foreground">Attributed to contributor</span>
            </div>
          </div>
        )}
      </section>

      {/* Action sidebar: hide on mobile when editing to prevent duplicate stacked buttons */}
      <aside className={`rounded-3xl bg-sage p-6 h-fit ${isEditing ? 'hidden lg:block' : ''}`}>
        <h3 className="text-xl font-semibold">Ready to publish?</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {isEditing 
            ? 'Save changes or publish immediately. Author attribution is preserved.' 
            : 'Check or edit the title, semester, and course before making it visible to all students.'}
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <button 
            disabled={loading} 
            onClick={() => onPublish(candidate)} 
            className="rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity"
          >
            Approve & publish
          </button>
          <button 
            type="button" 
            onClick={() => setIsEditing(!isEditing)} 
            className="rounded-full border border-foreground/20 px-5 py-3 text-sm font-semibold hover:bg-background/40 transition-colors"
          >
            {isEditing ? 'Close editor' : 'Edit details before publishing'}
          </button>
          <button 
            disabled={loading} 
            onClick={() => onDelete(candidate)} 
            className="px-5 py-2 text-sm text-destructive hover:underline text-center"
          >
            Reject & delete
          </button>
        </div>
      </aside>
    </div>
  );
}

function AdminCms({
  notes,
  setNotes,
  subjects,
  setSubjects,
  alerts,
  setAlerts,
  publish,
  addAnnouncement
}: {
  notes: Note[]
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>
  subjects: SubjectItem[]
  setSubjects: (s: SubjectItem[]) => void
  alerts: any[]
  setAlerts: (a: any[]) => void
  publish: (n: Note) => void
  addAnnouncement: (a: any) => void
}) {
  const isTouch = useIsTouch();
  const [tab,setTab]=useState<'queue'|'content'|'curriculum'|'users'|'calendar'|'notices'|'requests'>('queue');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [doneId,setDoneId]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [curriculumSem, setCurriculumSem] = useState(1);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [creatingSub, setCreatingSub] = useState(false);
  const [subMsg, setSubMsg] = useState('');
  const [storageBytes, setStorageBytes] = useState<number | null>(null);
  const [pendingReqCount, setPendingReqCount] = useState(0);

  React.useEffect(() => {
    getTotalStorage().then(res => {
      if(res.success && res.totalBytes !== undefined) setStorageBytes(res.totalBytes);
    });
  }, [notes]);

  const pending = notes.filter(n => n.status === 'PENDING');
  const published = notes.filter(n => n.status === 'PUBLISHED');

  const handlePublish = async (n: Note) => {
    setLoading(true);
    const res = await publishNote(n.id as string);
    if(res.error) alert(res.error);
    else { publish(n); setDoneId(n.id); setTimeout(() => setDoneId(null), 2000); }
    setLoading(false);
  }

  const [rejectNoteTarget, setRejectNoteTarget] = useState<Note | null>(null);
  const [rejectNoteReason, setRejectNoteReason] = useState('');
  const [rejectNoteLoading, setRejectNoteLoading] = useState(false);

  const handleDeleteNote = async (n: Note) => {
    setRejectNoteTarget(n);
    setRejectNoteReason('');
  };

  const handleConfirmNoteRejection = async () => {
    if (!rejectNoteTarget) return;
    setRejectNoteLoading(true);
    const res = await deleteNote(String(rejectNoteTarget.id), rejectNoteReason.trim());
    if (res.error) {
      alert(res.error);
    } else {
      setNotes(prev => prev.filter(x => x.id !== rejectNoteTarget.id));
      setRejectNoteTarget(null);
      setRejectNoteReason('');
    }
    setRejectNoteLoading(false);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubCode.trim()) return;
    setCreatingSub(true);
    const codeUpper = newSubCode.trim().toUpperCase();
    const res = await createSubject({
      name: newSubName.trim(),
      code: codeUpper,
      semester: curriculumSem
    });

    if (res.error) {
      alert(res.error);
    } else {
      const newSubject: SubjectItem = res.subject || {
        id: `sub-${Date.now()}`,
        name: newSubName.trim(),
        code: codeUpper,
        semester: curriculumSem
      };
      setSubjects([...subjects.filter(s => s.code !== codeUpper), newSubject]);
      setNewSubName('');
      setNewSubCode('');
      setSubMsg('Subject added successfully!');
      setTimeout(() => setSubMsg(''), 2500);
    }
    setCreatingSub(false);
  };

  const handleDeleteSubject = async (id: string, code: string) => {
    if(!confirm(`Delete subject ${code}? All attached notes for this course will also be deleted. This cannot be undone.`)) return;
    const res = await deleteSubject(id);
    if (res.error) {
      setSubMsg(res.error);
      setTimeout(() => setSubMsg(''), 4000);
    } else {
      setSubjects(subjects.filter(s => s.id !== id));
      setNotes(prev => prev.filter(n => n.code !== code));
      setSubMsg(`Deleted subject ${code}.`);
      setTimeout(() => setSubMsg(''), 2500);
    }
  };

  const semSubjects = subjects.filter(s => s.semester === curriculumSem);

  const [pendingUserCount, setPendingUserCount] = useState(0);

  const fetchPendingUserCount = () => {
    getAdminUsersData().then(res => {
      if (res?.pendingUsers) setPendingUserCount(res.pendingUsers.length);
    }).catch(() => {});
    getContentRequests('PENDING').then(res => {
      if (res?.requests) setPendingReqCount(res.requests.length);
    }).catch(() => {});
  };

  React.useEffect(() => {
    fetchPendingUserCount();
  }, [tab]);

  const tabs = [
    { id: 'users', label: `Student Reviews ${pendingUserCount > 0 ? `(${pendingUserCount})` : ''}` },
    { id: 'requests', label: `Student Requests ${pendingReqCount > 0 ? `(${pendingReqCount})` : ''}` },
    { id: 'queue', label: `Notes Review (${pending.length})` },
    { id: 'content', label: `Published (${published.length})` },
    { id: 'curriculum', label: 'Curriculum & Subjects' },
    { id: 'calendar', label: 'Academic Calendar' },
    { id: 'notices', label: 'Announcements' }
  ];
  const activeTabLabel = tabs.find(t => t.id === tab)?.label;

  return <div>
  
  {/* Storage Health UI */}
  {storageBytes !== null && (
    <div className="mb-6 rounded-2xl border bg-card p-5">
      <div className="flex justify-between items-end mb-3">
        <div>
          <p className="text-sm font-semibold flex items-center gap-1.5"><FolderOpen size={16} className="text-primary"/> Storage Health</p>
          <p className="text-xs text-muted-foreground mt-0.5">Cloudflare R2 usage</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{(storageBytes / (1024*1024*1024)).toFixed(2)} GB <span className="text-muted-foreground font-normal">/ 10.0 GB</span></p>
          <p className="text-xs text-muted-foreground mt-0.5">{((storageBytes / (10 * 1024 * 1024 * 1024)) * 100).toFixed(1)}% Used</p>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <motion.div 
          className={`h-full ${storageBytes > 8 * 1024 * 1024 * 1024 ? 'bg-destructive' : 'bg-primary'}`} 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (storageBytes / (10 * 1024 * 1024 * 1024)) * 100)}%` }} 
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      {storageBytes > 9.5 * 1024 * 1024 * 1024 && <p className="text-xs text-destructive mt-3 font-semibold">⚠️ Hard limit of 9.5GB reached. New uploads are blocked.</p>}
    </div>
  )}

  {/* Mobile Dropdown Navigation */}
  <div className="mb-6 md:hidden relative">
    <button 
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      className="flex w-full h-12 items-center justify-between rounded-2xl bg-secondary px-4 text-sm font-semibold"
    >
      <span>{activeTabLabel}</span>
      <ChevronRight size={16} className={`transition-transform duration-200 ${mobileMenuOpen ? '-rotate-90' : 'rotate-90'}`} />
    </button>
    {isTouch ? (
      <MobilePresence
        show={mobileMenuOpen}
        type="dropdown"
        className="absolute left-0 right-0 top-14 z-50 rounded-2xl border bg-popover p-2 shadow-lg"
      >
        {tabs.map(t => (
          <button 
            key={t.id}
            onClick={() => { setTab(t.id as any); setMobileMenuOpen(false); }}
            className={`flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium ${tab === t.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
          >
            {t.label}
            {tab === t.id && <Check size={16} className="text-foreground" />}
          </button>
        ))}
      </MobilePresence>
    ) : (
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -10, scale: 0.95 }} 
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-14 z-50 rounded-2xl border bg-popover p-2 shadow-lg"
          >
            {tabs.map(t => (
              <button 
                key={t.id}
                onClick={() => { setTab(t.id as any); setMobileMenuOpen(false); }}
                className={`flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium ${tab === t.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
              >
                {t.label}
                {tab === t.id && <Check size={16} className="text-foreground" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    )}
  </div>

  {/* Desktop Pill Navigation */}
  <div className="hidden md:flex mb-7 overflow-x-auto scrollbar-none">
    <div className="flex w-max rounded-full bg-secondary p-1">
      <Nav layoutId="admin-nav" active={tab==='users'} onClick={()=>setTab('users')}>
        Student Reviews {pendingUserCount > 0 && <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-primary text-primary-foreground font-bold">{pendingUserCount}</span>}
      </Nav>
      <Nav layoutId="admin-nav" active={tab==='requests'} onClick={()=>setTab('requests')}>
        Student Requests {pendingReqCount > 0 && <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-amber-500 text-white font-bold">{pendingReqCount}</span>}
      </Nav>
      <Nav layoutId="admin-nav" active={tab==='queue'} onClick={()=>setTab('queue')}>
        Notes Review ({pending.length})
      </Nav>
      <Nav layoutId="admin-nav" active={tab==='content'} onClick={()=>setTab('content')}>
        Published ({published.length})
      </Nav>
      <Nav layoutId="admin-nav" active={tab==='curriculum'} onClick={()=>setTab('curriculum')}>
        Curriculum & Subjects
      </Nav>
      <Nav layoutId="admin-nav" active={tab==='calendar'} onClick={()=>setTab('calendar')}>
        Academic Calendar
      </Nav>
      <Nav layoutId="admin-nav" active={tab==='notices'} onClick={()=>setTab('notices')}>
        Department Notices
      </Nav>
      <a
        href="/emails"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-full transition-colors ml-1"
        title="Open interactive email templates preview studio"
      >
        <EnvelopeSimple size={14} /> Email Studio ↗
      </a>
    </div>
  </div>

  <AnimatePresence initial={false}>
    <motion.div key={tab} initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-6}} transition={{duration:0.15, ease: "easeOut"}} className="transform-gpu">
      
      {/* Student Requests & Reports tab */}
      {tab==='requests'&&<RequestsManager onRefreshCount={fetchPendingUserCount} />}

      {/* Review queue */}
      {tab==='queue'&&<div className="flex flex-col gap-5">
        {pending.length === 0 && <p className="text-muted-foreground p-8 text-center border rounded-3xl border-dashed bg-card/50">No notes currently pending review. Submissions from contributors will appear here.</p>}
        {pending.map(candidate => (
          <ReviewQueueCard
            key={candidate.id}
            candidate={candidate}
            subjects={subjects}
            onPublish={handlePublish}
            onDelete={handleDeleteNote}
            onUpdate={(updated) => {
              if (updated.status === 'PUBLISHED') {
                publish(updated);
              } else {
                setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
              }
            }}
          />
        ))}
      </div>}

      {/* Note Rejection Modal with Feedback */}
      {isTouch ? (
        <MobilePresence show={!!rejectNoteTarget} type="backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45">
          {rejectNoteTarget && (
            <div className="w-full max-w-md rounded-3xl bg-card border p-6 shadow-2xl space-y-4 m-panel-enter">
              <h3 className="text-lg font-bold text-foreground">Reject Note Submission</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Rejecting <b className="text-foreground">{rejectNoteTarget.title}</b> submitted by <b className="text-foreground">{rejectNoteTarget.author}</b>.
                An email with your feedback will be sent to the contributor.
              </p>

              {/* Quick Preset Reasons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Select common reason:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Blurry scan / unreadable text',
                    'Incomplete lecture notes',
                    'Duplicate of existing upload',
                    'Incorrect course or semester syllabus'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectNoteReason(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                        rejectNoteReason === preset
                          ? 'bg-primary text-primary-foreground border-primary font-semibold'
                          : 'bg-secondary text-muted-foreground hover:text-foreground border-border/60'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <label className="field-label">
                Feedback for Contributor
                <textarea
                  value={rejectNoteReason}
                  onChange={e => setRejectNoteReason(e.target.value)}
                  placeholder="Explain why this note cannot be published or what needs improvement..."
                  className="field-input text-xs min-h-24 resize-none py-2"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={rejectNoteLoading}
                  onClick={() => setRejectNoteTarget(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={rejectNoteLoading}
                  onClick={handleConfirmNoteRejection}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-destructive text-destructive-foreground hover:opacity-95 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {rejectNoteLoading ? 'Rejecting...' : 'Confirm Rejection & Notify'}
                </button>
              </div>
            </div>
          )}
        </MobilePresence>
      ) : (
        <AnimatePresence>
          {rejectNoteTarget && (
            <div className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-3xl bg-card border p-6 shadow-2xl space-y-4 fm-gpu"
              >
                <h3 className="text-lg font-bold text-foreground">Reject Note Submission</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Rejecting <b className="text-foreground">{rejectNoteTarget.title}</b> submitted by <b className="text-foreground">{rejectNoteTarget.author}</b>.
                  An email with your feedback will be sent to the contributor.
                </p>

                {/* Quick Preset Reasons */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">Select common reason:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Blurry scan / unreadable text',
                      'Incomplete lecture notes',
                      'Duplicate of existing upload',
                      'Incorrect course or semester syllabus'
                    ].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRejectNoteReason(preset)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                          rejectNoteReason === preset
                            ? 'bg-primary text-primary-foreground border-primary font-semibold'
                            : 'bg-secondary text-muted-foreground hover:text-foreground border-border/60'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="field-label">
                  Feedback for Contributor
                  <textarea
                    value={rejectNoteReason}
                    onChange={e => setRejectNoteReason(e.target.value)}
                    placeholder="Explain why this note cannot be published or what needs improvement..."
                    className="field-input text-xs min-h-24 resize-none py-2"
                  />
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={rejectNoteLoading}
                    onClick={() => setRejectNoteTarget(null)}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={rejectNoteLoading}
                    onClick={handleConfirmNoteRejection}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-destructive text-destructive-foreground hover:opacity-95 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {rejectNoteLoading ? 'Rejecting...' : 'Confirm Rejection & Notify'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Published content */}
      {tab==='content'&&<div className="flex flex-col gap-3">{published.length===0?<p className="text-muted-foreground p-8 text-center border rounded-3xl border-dashed bg-card/40">No published notes yet.</p>:published.map((n,i)=><NoteRow key={n.id} note={n} subjects={subjects} index={i} open={()=>{}} onDelete={()=>handleDeleteNote(n)}/>)}</div>}

      {/* Curriculum & Subjects Management */}
      {tab==='curriculum'&&<div className="flex flex-col gap-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <h2 className="text-2xl font-bold">Curriculum & Subjects</h2>
            <p className="text-sm text-muted-foreground">Manage courses and subjects available for students and contributors per semester.</p>
          </div>
          {subMsg && <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">{subMsg}</span>}
        </div>

        {/* Semester Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 modal-scroll touch-pan-x">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
            <button
              key={sem}
              onClick={() => setCurriculumSem(sem)}
              className={`relative px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
                curriculumSem === sem
                  ? 'text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              {curriculumSem === sem && <motion.div layoutId="curriculum-sem-pill" className="absolute inset-0 bg-primary rounded-full z-0 shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
              <span className="relative z-10">Semester {sem}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Subjects List for Selected Semester */}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold flex items-center justify-between">
              <span>Semester {curriculumSem} Courses</span>
              <span className="text-xs text-muted-foreground font-normal">{semSubjects.length} subject(s)</span>
            </h3>

            <AnimatePresence initial={false}>
              <motion.div key={curriculumSem} initial={{opacity:0, x:-6}} animate={{opacity:1, x:0}} exit={{opacity:0, x:6}} transition={{duration:0.15, ease: "easeOut"}} className="transform-gpu">
                {semSubjects.length === 0 ? (
                  <div className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground bg-card/40">
                    <GraduationCap size={28} className="mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-foreground">No subjects added for Semester {curriculumSem}</p>
                    <p className="text-xs mt-1">Use the form on the right to add a new course.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {semSubjects.map(sub => (
                      <div key={sub.id || sub.code} className="rounded-2xl border bg-card p-4 flex items-start justify-between gap-3 hover:border-primary/30 transition-colors shadow-sm">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-full text-foreground">
                            {sub.code}
                          </span>
                          <h4 className="font-semibold text-base mt-2 text-foreground">{sub.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">Semester {sub.semester}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteSubject(sub.id, sub.code)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete subject"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Add Subject Form */}
          <aside className="rounded-3xl border bg-card p-6 h-fit">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <PlusCircle size={20} className="text-primary" />
              Add Subject
            </h3>
            <p className="text-xs text-muted-foreground mt-1 mb-5">Add a new course to Semester {curriculumSem}.</p>

            <form onSubmit={handleAddSubject} className="flex flex-col gap-4">
              <label className="field-label">
                Course Name
                <input
                  required
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  className="field-input"
                  placeholder="e.g. Operating Systems"
                />
              </label>

              <label className="field-label">
                Course Code
                <input
                  required
                  value={newSubCode}
                  onChange={e => setNewSubCode(e.target.value)}
                  className="field-input uppercase"
                  placeholder="e.g. CE 301"
                />
              </label>

              <button
                type="submit"
                disabled={creatingSub}
                className="rounded-full bg-primary p-3 font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity mt-1"
              >
                {creatingSub ? 'Adding...' : `Add to Semester ${curriculumSem}`}
              </button>
            </form>
          </aside>
        </div>
      </div>}

      {/* Users & Roles Studio */}
      {tab==='users'&&<AdminUsersManager />}

      {/* Academic Calendar Studio */}
      {tab==='calendar'&&<AdminCalendarManager />}

      {/* Announcements Studio */}
      {tab==='notices'&&<Announcement alerts={alerts} setAlerts={setAlerts} onPublish={addAnnouncement}/>}
    </motion.div>
  </AnimatePresence></div>}

function AdminCapSelect({
  value,
  onChange,
  disabled = false
}: {
  value: number
  onChange: (s: number) => void
  disabled?: boolean
}) {
  const isTouch = useIsTouch();
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex h-9 items-center justify-between gap-1.5 rounded-full border bg-background px-3 text-xs font-semibold text-foreground hover:border-primary/50 transition-all cursor-pointer disabled:opacity-50"
      >
        <span>Cap: Sem {value}</span>
        <CaretDown size={12} className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {isTouch ? (
        <MobilePresence
          show={open}
          type="dropdown"
          className="absolute left-0 top-full mt-1.5 z-50 rounded-2xl border bg-popover text-popover-foreground p-1.5 shadow-xl space-y-0.5 w-32 max-h-48 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain"
          data-lenis-prevent="true"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
            <button
              type="button"
              key={s}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                value === s
                  ? 'bg-secondary text-foreground font-bold'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span>Semester {s}</span>
              {value === s && <Check size={14} className="text-foreground shrink-0" />}
            </button>
          ))}
        </MobilePresence>
      ) : (
        <AnimatePresence>
          {open && (
            <motion.div
              data-lenis-prevent="true"
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 top-full mt-1.5 z-50 rounded-2xl border bg-popover text-popover-foreground p-1.5 shadow-xl space-y-0.5 w-32 max-h-48 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain"
              style={{ overscrollBehavior: 'contain' }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    value === s
                      ? 'bg-secondary text-foreground font-bold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <span>Semester {s}</span>
                  {value === s && <Check size={14} className="text-foreground shrink-0" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function AdminUsersManager() {
  const isTouch = useIsTouch();
  const [data, setData] = useState<{ pendingUsers: any[]; activeUsers: any[] }>({ pendingUsers: [], activeUsers: [] });
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'pending' | 'directory'>('pending');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'STUDENT' | 'SENIOR' | 'ADMIN'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Reject Modal State
  const [rejectModalUser, setRejectModalUser] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Senior Semester Cap Overrides for pending approval
  const [seniorCaps, setSeniorCaps] = useState<Record<string, number>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsersData();
      setData(res as any);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (userId: string, role: 'STUDENT' | 'SENIOR' = 'STUDENT') => {
    setActionLoadingId(userId);
    try {
      const semOverride = role === 'SENIOR' ? seniorCaps[userId] : undefined;
      const res = await approveUser(userId, role, semOverride);
      if (res.success) {
        await loadData();
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to approve user');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalUser) return;
    setActionLoadingId(rejectModalUser.id);
    try {
      const res = await rejectUser(rejectModalUser.id, rejectReason.trim());
      if (res.success) {
        setRejectModalUser(null);
        setRejectReason('');
        await loadData();
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to reject user');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSemesterChange = async (userId: string, newSem: number) => {
    setActionLoadingId(userId);
    try {
      await updateUserSemester(userId, newSem);
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Failed to update semester');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleHoldBack = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      await toggleHeldBack(userId);
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Failed to toggle hold-back flag');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'STUDENT' | 'SENIOR' | 'ADMIN') => {
    setActionLoadingId(userId);
    try {
      await changeUserRole(userId, newRole);
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Failed to change role');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredActive = useMemo(() => {
    return data.activeUsers.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return `${u.name || ''} ${u.email || ''} ${u.regNumber || ''} ${u.batchYear || ''}`.toLowerCase().includes(q);
    });
  }, [data.activeUsers, search, roleFilter]);

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-tab switcher */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('pending')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'pending'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock size={15} />
            <span>Pending Applications</span>
            <span className={`size-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
              subTab === 'pending' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-foreground'
            }`}>
              {data.pendingUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('directory')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'directory'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users size={15} />
            <span>Active Directory</span>
            <span className={`size-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
              subTab === 'directory' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-foreground'
            }`}>
              {data.activeUsers.length}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer bg-secondary px-3 py-1.5 rounded-full"
        >
          <Clock size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">
          <div className="size-6 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto mb-3" />
          <p className="text-xs">Loading user data...</p>
        </div>
      ) : subTab === 'pending' ? (
        /* PENDING APPLICATIONS VIEW */
        <div className="flex flex-col gap-4">
          {data.pendingUsers.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground rounded-3xl border border-dashed bg-card/40 p-8">
              <UserCheck size={36} className="mx-auto mb-3 opacity-30" />
              <h3 className="font-semibold text-base text-foreground">No pending applications</h3>
              <p className="text-xs text-muted-foreground mt-1">
                All registered students and contributors have been reviewed.
              </p>
            </div>
          ) : (
            data.pendingUsers.map(user => {
              const isContr = !!user.contributorRequest;
              const currentCap = seniorCaps[user.id] ?? user.semester;
              const isActionRunning = actionLoadingId === user.id;

              return (
                <div 
                  key={user.id} 
                  className="rounded-3xl border bg-card p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-start justify-between gap-6 transition-all hover:border-border/80"
                >
                  <div className="flex flex-col gap-3.5 min-w-0 flex-1">
                    
                    {/* Header Identity Line */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-bold text-foreground">{user.name || 'Unnamed Student'}</span>
                      {user.regNumber && (
                        <span className="bg-secondary text-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
                          {user.regNumber}
                        </span>
                      )}
                      {user.batchYear && (
                        <span className="bg-secondary text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                          Batch {user.batchYear}
                        </span>
                      )}
                      <span className="bg-secondary text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                        Semester {user.semester} • Section {user.section || 'A'}
                      </span>
                      {isContr ? (
                        <span className="bg-primary/10 text-primary border border-primary/25 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                          <UploadSimple size={13} /> Requested Note Contributor
                        </span>
                      ) : (
                        <span className="bg-secondary text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                          Requested Student Access
                        </span>
                      )}
                    </div>

                    {/* Full Submitted Student Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs bg-secondary/30 rounded-2xl p-3.5 border border-border/40">
                      <div>
                        <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">Email Address</span>
                        <span className="font-semibold text-foreground break-all">{user.email}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">Phone Number</span>
                        <span className="font-semibold text-foreground">{user.phone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">Applied Role</span>
                        <span className={`font-semibold ${isContr ? 'text-primary' : 'text-foreground'}`}>
                          {isContr ? 'Note Contributor' : 'Regular Student'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">Application Date</span>
                        <span className="font-semibold text-foreground">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">Department</span>
                        <span className="font-semibold text-foreground">Computer Engineering</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">Current Cohort</span>
                        <span className="font-semibold text-foreground">Semester {user.semester} • Section {user.section || 'A'}</span>
                      </div>
                    </div>

                    {/* Contributor Request Details */}
                    {isContr && (
                      <div className="rounded-2xl bg-sage/30 border border-primary/20 p-3.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-foreground mb-1">
                          <UploadSimple size={15} className="text-primary" />
                          <span>Note Contributor Application</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed italic bg-card/60 p-2.5 rounded-xl border border-primary/10 mt-1.5">
                          "{user.contributorRequest.whyContribute}"
                        </p>
                        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                          <span className="font-semibold text-foreground text-[11px]">Notes available for:</span>
                          {(user.contributorRequest.semestersHaveNotes || []).map((s: number) => (
                            <span key={s} className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs">
                              Sem {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col gap-2 shrink-0 lg:w-60 w-full pt-1">
                    {isContr ? (
                      <div className="flex items-center gap-2 w-full">
                        <AdminCapSelect
                          disabled={isActionRunning}
                          value={currentCap}
                          onChange={val => setSeniorCaps({ ...seniorCaps, [user.id]: val })}
                        />

                        <button
                          type="button"
                          disabled={isActionRunning}
                          onClick={() => handleApprove(user.id, 'SENIOR')}
                          className="flex-1 rounded-full bg-primary hover:opacity-95 text-primary-foreground text-xs font-semibold py-2.5 px-3 transition-opacity text-center cursor-pointer disabled:opacity-50 shadow-xs whitespace-nowrap"
                        >
                          Approve Application
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isActionRunning}
                        onClick={() => handleApprove(user.id, 'STUDENT')}
                        className="w-full rounded-full bg-primary hover:opacity-95 text-primary-foreground text-xs font-semibold py-2.5 px-4 transition-opacity text-center cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        Approve Application
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isActionRunning}
                      onClick={() => { setRejectModalUser(user); setRejectReason(''); }}
                      className="text-xs font-medium text-destructive hover:underline text-center py-1 cursor-pointer disabled:opacity-50 mt-0.5"
                    >
                      Reject Application
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ACTIVE USER DIRECTORY VIEW */
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, reg number, batch..."
                className="field-input pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(['all', 'STUDENT', 'SENIOR', 'ADMIN'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors cursor-pointer ${
                    roleFilter === r
                      ? 'bg-foreground text-background shadow-xs'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r.toLowerCase()}s
                </button>
              ))}
            </div>
          </div>

          {filteredActive.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground rounded-3xl border border-dashed bg-card/40">
              <p className="text-sm font-semibold text-foreground">No matching users found</p>
              <p className="text-xs mt-1">Try refining your search query.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredActive.map(u => {
                const isRunning = actionLoadingId === u.id;
                const isAdmin = u.role === 'ADMIN';

                return (
                  <div 
                    key={u.id}
                    className="rounded-3xl border bg-card p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 text-xs transition-all hover:border-border/80"
                  >
                    <div className="flex flex-col gap-3 min-w-0 flex-1">
                      {/* Header Row */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="size-8 rounded-full bg-secondary font-bold text-foreground flex items-center justify-center shrink-0 text-xs">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <b className="text-sm sm:text-base font-bold text-foreground">{u.name || 'Unnamed User'}</b>
                        
                        {isAdmin ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground flex items-center gap-1 shadow-2xs">
                            <ShieldCheck size={14} /> Administrator
                          </span>
                        ) : (
                          <>
                            {u.regNumber && (
                              <span className="bg-secondary text-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
                                {u.regNumber}
                              </span>
                            )}
                            {u.batchYear && (
                              <span className="bg-secondary text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                                Batch {u.batchYear}
                              </span>
                            )}
                            <span className="bg-secondary text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                              Semester {u.semester} • Section {u.section || 'A'}
                            </span>
                            {u.role === 'SENIOR' ? (
                              <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                <UploadSimple size={13} /> Note Contributor
                              </span>
                            ) : (
                              <span className="bg-secondary text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                                Student
                              </span>
                            )}
                            {u.heldBack && (
                              <span className="text-xs bg-destructive/10 text-destructive font-medium px-2.5 py-1 rounded-full border border-destructive/20 flex items-center gap-1">
                                <Warning size={13} /> Re-take
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Details Grid */}
                      <div className={`grid gap-2 text-xs text-muted-foreground ${isAdmin ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} bg-secondary/30 rounded-2xl p-3 border border-border/40`}>
                        <div>
                          <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">Email</span>
                          <span className="font-semibold text-foreground break-all">{u.email}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">Phone</span>
                          <span className="font-semibold text-foreground">{u.phone || 'N/A'}</span>
                        </div>
                        {!isAdmin && (
                          <>
                            <div>
                              <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">Current Cohort</span>
                              <span className="font-semibold text-foreground">Semester {u.semester}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">Section</span>
                              <span className="font-semibold text-foreground">Section {u.section || 'A'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Controls Column */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {!isAdmin ? (
                        <>
                          {/* Semester Changer */}
                          <label className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold bg-secondary/60 px-3 py-1.5 rounded-xl border border-border/40">
                            <span>Sem:</span>
                            <select
                              disabled={isRunning}
                              value={u.semester}
                              onChange={e => handleSemesterChange(u.id, parseInt(e.target.value, 10))}
                              className="bg-background text-foreground font-bold rounded-lg px-2 py-1 outline-none cursor-pointer text-xs"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                <option key={s} value={s}>Sem {s}</option>
                              ))}
                            </select>
                          </label>

                          {/* Role Changer */}
                          <select
                            disabled={isRunning}
                            value={u.role}
                            onChange={e => handleChangeRole(u.id, e.target.value as any)}
                            className="field-input py-1.5 px-3 text-xs rounded-xl bg-background font-semibold cursor-pointer w-32 h-9"
                          >
                            <option value="STUDENT">Student</option>
                            <option value="SENIOR">Contributor</option>
                            <option value="ADMIN">Admin</option>
                          </select>

                          {/* Hold Back Toggle */}
                          <button
                            type="button"
                            disabled={isRunning}
                            onClick={() => handleToggleHoldBack(u.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                              u.heldBack 
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' 
                                : 'bg-secondary text-muted-foreground hover:text-foreground border-transparent'
                            }`}
                            title="Toggle re-take hold-back state to prevent auto-advancing when terms change"
                          >
                            {u.heldBack ? 'Held Back (Re-take)' : 'Hold Back'}
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-semibold px-3 py-1.5 rounded-full bg-secondary/60">
                            Full System Privileges
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {isTouch ? (
        <MobilePresence show={!!rejectModalUser} type="backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45">
          {rejectModalUser && (
            <div className="w-full max-w-md rounded-3xl bg-card border p-6 shadow-2xl space-y-4 m-panel-enter">
              <h3 className="text-lg font-bold text-foreground">Reject Application</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Rejecting <b className="text-foreground">{rejectModalUser.name}</b> ({rejectModalUser.regNumber || rejectModalUser.email}).
                You may optionally provide a reason for the applicant.
              </p>

              <label className="field-label">
                Reason for Rejection
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Registration number does not match current department roster."
                  className="field-input text-xs min-h-24 resize-none py-2"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalUser(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectConfirm}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-destructive text-destructive-foreground hover:opacity-95 shadow-xs cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </MobilePresence>
      ) : (
        <AnimatePresence>
          {rejectModalUser && (
            <div className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-md rounded-3xl bg-card border p-6 shadow-2xl space-y-4 fm-gpu"
              >
                <h3 className="text-lg font-bold text-foreground">Reject Application</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Rejecting <b className="text-foreground">{rejectModalUser.name}</b> ({rejectModalUser.regNumber || rejectModalUser.email}).
                  You may optionally provide a reason for the applicant.
                </p>

                <label className="field-label">
                  Reason for Rejection
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="e.g. Registration number does not match current department roster."
                    className="field-input text-xs min-h-24 resize-none py-2"
                  />
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectModalUser(null)}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectConfirm}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-destructive text-destructive-foreground hover:opacity-95 shadow-xs cursor-pointer"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function AdminCalendarManager() {
  const isTouch = useIsTouch();
  const [data, setData] = useState<{ periods: any[]; activePeriod: any; summerBreakPeriod: any }>({ periods: [], activePeriod: null, summerBreakPeriod: null });
  const [loading, setLoading] = useState(true);

  // Create Period Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [termName, setTermName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [batchMaps, setBatchMaps] = useState<{ batchYear: number; semester: number }[]>([
    { batchYear: 2026, semester: 1 },
    { batchYear: 2025, semester: 3 },
    { batchYear: 2024, semester: 5 },
    { batchYear: 2023, semester: 7 },
  ]);
  const [creatingLoading, setCreatingLoading] = useState(false);

  // Pre-advancement Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [heldBackIds, setHeldBackIds] = useState<string[]>([]);
  const [advancingLoading, setAdvancingLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAcademicPeriods();
      setData(res as any);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openReviewModal = async () => {
    if (!data.activePeriod) return;
    setReviewModalOpen(true);
    setSummaryLoading(true);
    try {
      const res = await getPreAdvancementSummary(data.activePeriod.id);
      setSummaryData(res);
      // Pre-populate held back IDs
      const initialHeld: string[] = [];
      Object.values(res.batchGroups).forEach((group: any) => {
        group.students.forEach((s: any) => {
          if (s.heldBack) initialHeld.push(s.id);
        });
      });
      setHeldBackIds(initialHeld);
    } catch (e: any) {
      alert(e?.message || 'Failed to load pre-advancement summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const toggleStudentHeldBackInReview = (studentId: string) => {
    setHeldBackIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleConfirmAdvancement = async () => {
    if (!data.activePeriod) return;
    if (!confirm(`Are you sure you want to officially advance semesters for ${data.activePeriod.name}? This will increment student semesters and publish official cohort notices.`)) return;
    setAdvancingLoading(true);
    try {
      const res = await advanceSemestersForPeriod(data.activePeriod.id, heldBackIds);
      if (res.success) {
        setReviewModalOpen(false);
        await loadData();
        alert('Semesters successfully advanced! Welcome and graduation notices have been dispatched to students.');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to advance semesters');
    } finally {
      setAdvancingLoading(false);
    }
  };

  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termName.trim() || !startDate || !endDate) return;
    setCreatingLoading(true);
    try {
      const res = await createAcademicPeriod({
        name: termName.trim(),
        startDate,
        endDate,
        status: 'ACTIVE',
        batchMappings: batchMaps
      });
      if (res.success) {
        setCreateModalOpen(false);
        setTermName('');
        setStartDate('');
        setEndDate('');
        await loadData();
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to create academic term');
    } finally {
      setCreatingLoading(false);
    }
  };

  const handleStatusChange = async (periodId: string, status: any) => {
    try {
      await setPeriodStatus(periodId, status);
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Failed to update status');
    }
  };

  const updateBatchMapSemester = (index: number, sem: number) => {
    const updated = [...batchMaps];
    updated[index].semester = sem;
    setBatchMaps(updated);
  };

  const updateBatchMapYear = (index: number, year: number) => {
    const updated = [...batchMaps];
    updated[index].batchYear = year;
    setBatchMaps(updated);
  };

  const addBatchRow = () => {
    const minYear = Math.min(...batchMaps.map(b => b.batchYear), 2026);
    setBatchMaps([...batchMaps, { batchYear: minYear - 1, semester: 1 }]);
  };

  const removeBatchRow = (index: number) => {
    if (batchMaps.length <= 1) return;
    setBatchMaps(batchMaps.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & New Term Trigger */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/80 pb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calendar size={22} className="text-primary" /> Academic Calendar & Semester Periods
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage official semester start/end dates, cohort advancement checklists, and graduation announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="rounded-full bg-primary hover:opacity-95 text-primary-foreground text-xs font-semibold py-2.5 px-4 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus size={15} /> Create Academic Term
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">
          <div className="size-6 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto mb-3" />
          <p className="text-xs">Loading academic schedule...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Active Period Dashboard Card */}
          {data.activePeriod ? (
            <div className="rounded-3xl border bg-card p-6 md:p-8 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    Currently Active Term
                  </span>
                  <h2 className="text-3xl font-bold text-foreground mt-2 tracking-tight">
                    {data.activePeriod.name}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(data.activePeriod.startDate).toLocaleDateString(undefined, { dateStyle: 'long' })} —{' '}
                    {new Date(data.activePeriod.endDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={openReviewModal}
                    className="rounded-full bg-primary hover:opacity-95 text-primary-foreground text-xs font-semibold py-3 px-5 transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-[0.98]"
                  >
                    <CheckCircle size={16} /> Review & Advance Semesters
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(data.activePeriod.id, 'SUMMER_BREAK')}
                    className="rounded-full bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold py-3 px-4 transition-colors cursor-pointer"
                  >
                    Set to Summer Break
                  </button>
                </div>
              </div>

              {/* Batch Matrix Breakdown */}
              <div>
                <b className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Cohort Semester Mapping During This Term:
                </b>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {data.activePeriod.batchMaps.map((bm: any) => (
                    <div key={bm.id} className="rounded-2xl bg-secondary/60 border p-3.5 text-center">
                      <span className="text-xs font-bold text-foreground block">Batch {bm.batchYear}</span>
                      <span className="text-sm font-semibold text-primary block mt-0.5">Semester {bm.semester}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed bg-card/40 p-8 text-center text-muted-foreground">
              <Calendar size={36} className="mx-auto mb-3 opacity-30" />
              <h3 className="text-base font-bold text-foreground">No active academic term</h3>
              <p className="text-xs mt-1 max-w-md mx-auto">
                Create a term to activate semester cohort tracking and schedule auto-advancement review.
              </p>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="mt-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold py-2.5 px-5 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus size={15} /> Create First Academic Term
              </button>
            </div>
          )}

          {/* Term History List */}
          <div>
            <h4 className="text-sm font-bold text-foreground mb-3 px-1">All Academic Terms</h4>
            <div className="flex flex-col gap-2.5">
              {data.periods.map(period => (
                <div
                  key={period.id}
                  className="rounded-2xl border bg-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-sm font-semibold text-foreground">{period.name}</b>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        period.status === 'ACTIVE' 
                          ? 'bg-primary text-primary-foreground' 
                          : period.status === 'SUMMER_BREAK'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-secondary text-muted-foreground'
                      }`}>
                        {period.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">
                      {new Date(period.startDate).toLocaleDateString()} — {new Date(period.endDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {period.batchMaps.map((bm: any) => (
                      <span key={bm.id} className="bg-secondary px-2 py-1 rounded text-[11px] font-mono">
                        {bm.batchYear}: Sem {bm.semester}
                      </span>
                    ))}

                    {period.status !== 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(period.id, 'ACTIVE')}
                        className="text-[11px] font-semibold text-primary hover:underline ml-2 cursor-pointer"
                      >
                        Set as Active
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pre-Advancement Review Modal */}
      {isTouch ? (
        <MobilePresence show={reviewModalOpen} type="backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-foreground/45">
          <div className="w-full max-w-3xl rounded-3xl bg-card border p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden m-panel-enter">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="section-kicker">Pre-Advancement Checklist</p>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Review Before Advancing Semesters
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="size-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {summaryLoading ? (
              <div className="py-20 text-center text-muted-foreground">
                <div className="size-6 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto mb-3" />
                <p className="text-xs">Compiling batch rosters and candidate checklist...</p>
              </div>
            ) : summaryData ? (
              <div className="flex-1 overflow-y-auto modal-scroll py-4 space-y-6">
                {/* Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-secondary/60 p-3 text-center border">
                    <span className="text-[11px] text-muted-foreground block">Total Enrolled</span>
                    <b className="text-base text-foreground font-bold">{summaryData.stats.total}</b>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-3 text-center border border-primary/20">
                    <span className="text-[11px] text-primary block font-medium">Advancing</span>
                    <b className="text-base text-primary font-bold">{summaryData.stats.advancing}</b>
                  </div>
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-center border border-amber-500/20">
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-medium">Held Back (Re-take)</span>
                    <b className="text-base text-amber-600 dark:text-amber-400 font-bold">{heldBackIds.length}</b>
                  </div>
                  <div className="rounded-2xl bg-secondary/60 p-3 text-center border">
                    <span className="text-[11px] text-muted-foreground block">Graduating 🎓</span>
                    <b className="text-base text-foreground font-bold">{summaryData.stats.graduating}</b>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/40 p-3 rounded-xl border">
                  💡 <b>Review Instructions:</b> Cross-reference each batch with official department examination results. Toggle the <b>Hold Back (Re-take)</b> switch on any student who is repeating courses so their account is preserved at their current semester.
                </p>

                {/* Batch Sections */}
                {Object.values(summaryData.batchGroups).map((group: any) => {
                  const isGradBatch = group.targetSemester > 8;

                  return (
                    <div key={group.batchYear} className="rounded-2xl border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-2">
                        <div className="flex items-center gap-2">
                          <b className="text-sm font-bold text-foreground">Batch {group.batchYear}</b>
                          <span className="text-xs text-muted-foreground">
                            (Currently Sem {group.targetSemester - 1} ➔ {isGradBatch ? '🎓 Graduating' : `Semester ${group.targetSemester}`})
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {group.students.length} {group.students.length === 1 ? 'student' : 'students'}
                        </span>
                      </div>

                      {group.students.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2 italic">No registered students in this batch.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {group.students.map((student: any) => {
                            const isHeld = heldBackIds.includes(student.id);

                            return (
                              <div
                                key={student.id}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 text-xs hover:bg-secondary/70 transition-colors gap-3"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <b className="text-foreground font-semibold truncate">{student.name}</b>
                                    {student.regNumber && (
                                      <span className="font-mono text-[11px] bg-background px-2 py-0.5 rounded text-foreground">
                                        {student.regNumber}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground text-[11px] truncate">{student.email}</p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleStudentHeldBackInReview(student.id)}
                                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                                    isHeld
                                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs font-bold'
                                      : 'bg-background text-muted-foreground hover:text-foreground border-border'
                                  }`}
                                >
                                  {isHeld ? '⚠️ Held Back' : 'Will Advance'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="flex items-center justify-between border-t pt-4 gap-3">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="rounded-full bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold py-2.5 px-5 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={advancingLoading || summaryLoading}
                onClick={handleConfirmAdvancement}
                className="rounded-full bg-primary hover:opacity-95 text-primary-foreground text-xs font-semibold py-2.5 px-6 cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {advancingLoading ? (
                  <>
                    <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                    <span>Advancing cohorts...</span>
                  </>
                ) : (
                  <span>Confirm & Officially Advance Semesters</span>
                )}
              </button>
            </div>
          </div>
        </MobilePresence>
      ) : (
        <AnimatePresence>
          {reviewModalOpen && (
            <div className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-foreground/40 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-3xl rounded-3xl bg-card border p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden fm-gpu"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="section-kicker">Pre-Advancement Checklist</p>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Review Before Advancing Semesters
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="size-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {summaryLoading ? (
                  <div className="py-20 text-center text-muted-foreground">
                    <div className="size-6 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto mb-3" />
                    <p className="text-xs">Compiling batch rosters and candidate checklist...</p>
                  </div>
                ) : summaryData ? (
                  <div className="flex-1 overflow-y-auto modal-scroll py-4 space-y-6">
                    {/* Summary Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-2xl bg-secondary/60 p-3 text-center border">
                        <span className="text-[11px] text-muted-foreground block">Total Enrolled</span>
                        <b className="text-base text-foreground font-bold">{summaryData.stats.total}</b>
                      </div>
                      <div className="rounded-2xl bg-primary/10 p-3 text-center border border-primary/20">
                        <span className="text-[11px] text-primary block font-medium">Advancing</span>
                        <b className="text-base text-primary font-bold">{summaryData.stats.advancing}</b>
                      </div>
                      <div className="rounded-2xl bg-amber-500/10 p-3 text-center border border-amber-500/20">
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-medium">Held Back (Re-take)</span>
                        <b className="text-base text-amber-600 dark:text-amber-400 font-bold">{heldBackIds.length}</b>
                      </div>
                      <div className="rounded-2xl bg-secondary/60 p-3 text-center border">
                        <span className="text-[11px] text-muted-foreground block">Graduating 🎓</span>
                        <b className="text-base text-foreground font-bold">{summaryData.stats.graduating}</b>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/40 p-3 rounded-xl border">
                      💡 <b>Review Instructions:</b> Cross-reference each batch with official department examination results. Toggle the <b>Hold Back (Re-take)</b> switch on any student who is repeating courses so their account is preserved at their current semester.
                    </p>

                    {/* Batch Sections */}
                    {Object.values(summaryData.batchGroups).map((group: any) => {
                      const isGradBatch = group.targetSemester > 8;

                      return (
                        <div key={group.batchYear} className="rounded-2xl border bg-card p-4 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-2">
                            <div className="flex items-center gap-2">
                              <b className="text-sm font-bold text-foreground">Batch {group.batchYear}</b>
                              <span className="text-xs text-muted-foreground">
                                (Currently Sem {group.targetSemester - 1} ➔ {isGradBatch ? '🎓 Graduating' : `Semester ${group.targetSemester}`})
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {group.students.length} {group.students.length === 1 ? 'student' : 'students'}
                            </span>
                          </div>

                          {group.students.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2 italic">No registered students in this batch.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {group.students.map((student: any) => {
                                const isHeld = heldBackIds.includes(student.id);

                                return (
                                  <div
                                    key={student.id}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 text-xs hover:bg-secondary/70 transition-colors gap-3"
                                  >
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <b className="text-foreground font-semibold truncate">{student.name}</b>
                                        {student.regNumber && (
                                          <span className="font-mono text-[11px] bg-background px-2 py-0.5 rounded text-foreground">
                                            {student.regNumber}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-muted-foreground text-[11px] truncate">{student.email}</p>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => toggleStudentHeldBackInReview(student.id)}
                                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                                        isHeld
                                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs font-bold'
                                          : 'bg-background text-muted-foreground hover:text-foreground border-border'
                                      }`}
                                    >
                                      {isHeld ? '⚠️ Held Back' : 'Will Advance'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <div className="flex items-center justify-between border-t pt-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="rounded-full bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold py-2.5 px-5 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={advancingLoading || summaryLoading}
                    onClick={handleConfirmAdvancement}
                    className="rounded-full bg-primary hover:opacity-95 text-primary-foreground text-xs font-semibold py-2.5 px-6 cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {advancingLoading ? (
                      <>
                        <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                        <span>Advancing cohorts...</span>
                      </>
                    ) : (
                      <span>Confirm & Officially Advance Semesters</span>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Create Term Modal */}
      {isTouch ? (
        <MobilePresence show={createModalOpen} type="backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45">
          <form
            onSubmit={handleCreateTerm}
            className="w-full max-w-lg rounded-3xl bg-card border p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto modal-scroll m-panel-enter"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="section-kicker">Academic Schedule</p>
                <h3 className="text-xl font-bold text-foreground">Create Academic Term</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="size-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <label className="field-label">
              Term Name
              <input
                required
                value={termName}
                onChange={e => setTermName(e.target.value)}
                placeholder="e.g. Fall 2026 or Spring 2027"
                className="field-input text-xs"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="field-label">
                Start Date
                <input
                  required
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="field-input text-xs"
                />
              </label>
              <label className="field-label">
                End Date
                <input
                  required
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="field-input text-xs"
                />
              </label>
            </div>

            {/* Batch Semester Matrix */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Batch Cohort Semester Map
                </span>
                <button
                  type="button"
                  onClick={addBatchRow}
                  className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> Add Batch
                </button>
              </div>

              <div className="space-y-2">
                {batchMaps.map((bm, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-1.5 bg-secondary/50 p-2 rounded-xl border">
                      <span className="text-xs text-muted-foreground font-medium pl-1">Batch:</span>
                      <input
                        type="number"
                        value={bm.batchYear}
                        onChange={e => updateBatchMapYear(index, parseInt(e.target.value, 10))}
                        className="field-input py-1 px-2 text-xs rounded-lg bg-background w-20 font-bold"
                      />
                      <span className="text-xs text-muted-foreground font-medium pl-2">➔ Sem:</span>
                      <select
                        value={bm.semester}
                        onChange={e => updateBatchMapSemester(index, parseInt(e.target.value, 10))}
                        className="field-input py-1 px-2 text-xs rounded-lg bg-background flex-1 cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>

                    {batchMaps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBatchRow(index)}
                        className="p-2 text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <Trash size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-full bg-secondary text-foreground text-xs font-semibold py-2.5 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingLoading}
                className="rounded-full bg-primary text-primary-foreground text-xs font-semibold py-2.5 px-5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {creatingLoading ? 'Saving term...' : 'Save & Activate Academic Term'}
              </button>
            </div>
          </form>
        </MobilePresence>
      ) : (
        <AnimatePresence>
          {createModalOpen && (
            <div className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
              <motion.form
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onSubmit={handleCreateTerm}
                className="w-full max-w-lg rounded-3xl bg-card border p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto modal-scroll fm-gpu"
              >
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="section-kicker">Academic Schedule</p>
                    <h3 className="text-xl font-bold text-foreground">Create Academic Term</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="size-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <label className="field-label">
                  Term Name
                  <input
                    required
                    value={termName}
                    onChange={e => setTermName(e.target.value)}
                    placeholder="e.g. Fall 2026 or Spring 2027"
                    className="field-input text-xs"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="field-label">
                    Start Date
                    <input
                      required
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="field-input text-xs"
                    />
                  </label>
                  <label className="field-label">
                    End Date
                    <input
                      required
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="field-input text-xs"
                    />
                  </label>
                </div>

                {/* Batch Semester Matrix */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Batch Cohort Semester Map
                    </span>
                    <button
                      type="button"
                      onClick={addBatchRow}
                      className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Add Batch
                    </button>
                  </div>

                  <div className="space-y-2">
                    {batchMaps.map((bm, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-1.5 bg-secondary/50 p-2 rounded-xl border">
                          <span className="text-xs text-muted-foreground font-medium pl-1">Batch:</span>
                          <input
                            type="number"
                            value={bm.batchYear}
                            onChange={e => updateBatchMapYear(index, parseInt(e.target.value, 10))}
                            className="field-input py-1 px-2 text-xs rounded-lg bg-background w-20 font-bold"
                          />
                          <span className="text-xs text-muted-foreground font-medium pl-2">➔ Sem:</span>
                          <select
                            value={bm.semester}
                            onChange={e => updateBatchMapSemester(index, parseInt(e.target.value, 10))}
                            className="field-input py-1 px-2 text-xs rounded-lg bg-background flex-1 cursor-pointer"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                              <option key={s} value={s}>Semester {s}</option>
                            ))}
                          </select>
                        </div>

                        {batchMaps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBatchRow(index)}
                            className="p-2 text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="rounded-full bg-secondary text-foreground text-xs font-semibold py-2.5 px-4 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingLoading}
                    className="rounded-full bg-primary text-primary-foreground text-xs font-semibold py-2.5 px-5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {creatingLoading ? 'Saving term...' : 'Save & Activate Academic Term'}
                  </button>
                </div>
              </motion.form>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function RequestsManager({ onRefreshCount }: { onRefreshCount?: () => void }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getContentRequests(statusFilter === 'ALL' ? undefined : statusFilter).then(res => {
      if (isMounted && res.success && res.requests) {
        setRequests(res.requests);
      }
      if (isMounted) setLoading(false);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, status: 'PENDING' | 'RESOLVED' | 'DISMISSED') => {
    setActionLoading(id);
    const res = await updateContentRequestStatus(id, status);
    if (res.success && res.request) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: res.request.status } : r));
      onRefreshCount?.();
    }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student request? This cannot be undone.')) return;
    setActionLoading(id);
    const res = await deleteContentRequest(id);
    if (res.success) {
      setRequests(prev => prev.filter(r => r.id !== id));
      onRefreshCount?.();
    }
    setActionLoading(null);
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border bg-card p-5 rounded-3xl shadow-xs">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ChatText size={18} className="text-primary" />
            Student Requests & Reports
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Private inquiries, syllabus requests, and issue reports submitted by verified students.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-secondary p-1">
          {(['ALL', 'PENDING', 'RESOLVED', 'DISMISSED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'PENDING' ? `Pending (${pendingCount})` : st === 'RESOLVED' ? 'Resolved' : 'Dismissed'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center py-16 text-xs text-muted-foreground">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 border rounded-3xl border-dashed bg-card/40 p-8">
          <ChatText size={32} className="mx-auto mb-2 opacity-30 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">No requests found</p>
          <p className="text-xs text-muted-foreground mt-1">Student submissions and issue reports will appear here in real-time.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => {
            const isResolved = req.status === 'RESOLVED';
            const isDismissed = req.status === 'DISMISSED';
            const isPending = req.status === 'PENDING';

            const typeColor = 
              req.type.includes('Missing') ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
              req.type.includes('Lecture') ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
              req.type.includes('Past') ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' :
              req.type.includes('Broken') ? 'bg-destructive/10 text-destructive border-destructive/20' :
              'bg-primary/10 text-primary border-primary/20';

            return (
              <div
                key={req.id}
                className="rounded-3xl border bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${typeColor}`}>
                      {req.type}
                    </span>
                    {req.semester && (
                      <span className="text-[11px] font-semibold bg-secondary px-2.5 py-1 rounded-full text-muted-foreground">
                        Semester {req.semester}
                      </span>
                    )}
                    {req.subject && (
                      <span className="text-[11px] font-semibold bg-secondary px-2.5 py-1 rounded-full text-foreground">
                        {req.subject}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      isResolved ? 'bg-sage/50 text-primary' :
                      isDismissed ? 'bg-secondary text-muted-foreground' :
                      'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    }`}>
                      {req.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="text-sm text-foreground/90 leading-relaxed bg-secondary/30 p-4 rounded-2xl border border-border/40">
                  <p className="whitespace-pre-wrap">{req.message}</p>
                </div>

                {/* Student Details & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <User size={15} className="text-primary" />
                    <b className="text-foreground">{req.user?.name || 'Verified Student'}</b>
                    <span>({req.user?.regNumber || req.user?.email || 'N/A'})</span>
                    {req.user?.semester && <span>· Sem {req.user.semester}</span>}
                    {req.user?.section && <span>· Sec {req.user.section}</span>}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          disabled={actionLoading === req.id}
                          onClick={() => handleUpdateStatus(req.id, 'RESOLVED')}
                          className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={14} weight="bold" /> Mark Resolved
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === req.id}
                          onClick={() => handleUpdateStatus(req.id, 'DISMISSED')}
                          className="rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    {!isPending && (
                      <button
                        type="button"
                        disabled={actionLoading === req.id}
                        onClick={() => handleUpdateStatus(req.id, 'PENDING')}
                        className="rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        Re-open
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actionLoading === req.id}
                      onClick={() => handleDelete(req.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors cursor-pointer rounded-full hover:bg-secondary"
                      title="Delete request"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Announcement({
  alerts,
  setAlerts,
  onPublish
}: {
  alerts: any[]
  setAlerts: (a: any[]) => void
  onPublish?: (a: any) => void
}) {
  const isTouch = useIsTouch()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('All students')
  const [sendEmail, setSendEmail] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [broadcastingId, setBroadcastingId] = useState<string | number | null>(null)
  const [deletingId, setDeletingId] = useState<string | number | null>(null)
  const [actionMsg, setActionMsg] = useState('')
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null)

  const AUDIENCE_CHOICES = [
    'All students',
    'Semester 1',
    'Semester 2',
    'Semester 3',
    'Semester 4',
    'Semester 5',
    'Semester 6',
    'Semester 7',
    'Semester 8',
  ]

  const deptNotices = useMemo(() => {
    return alerts.filter(a => a.kind !== 'New note')
  }, [alerts])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, JPEG, WEBP).')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size must be under 10MB.')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    let uploadedImageUrl: string | undefined = undefined

    if (imageFile) {
      const cleanName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const uniqueKey = `announcements/${Date.now()}-${cleanName}`
      const presignRes = await getPresignedUrl(uniqueKey, imageFile.type)
      if (presignRes.error || !presignRes.url) {
        alert(presignRes.error || 'Failed to prepare image upload')
        setSubmitting(false)
        return
      }

      const uploadRes = await fetch(presignRes.url, {
        method: 'PUT',
        headers: { 'Content-Type': imageFile.type },
        body: imageFile,
      })

      if (!uploadRes.ok) {
        alert('Failed to upload announcement image to cloud storage.')
        setSubmitting(false)
        return
      }

      const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-4c28b39a02ca4952a6c31f0baf9d62e3.r2.dev'
      uploadedImageUrl = `${publicBase}/${uniqueKey}`
    }

    const res = await createAnnouncement({
      title,
      body,
      audience: audience === 'All students' ? 'ALL' : audience,
      imageUrl: uploadedImageUrl,
      sendEmailNotification: sendEmail,
    })

    if (res.error) {
      alert(res.error)
    } else if (res.announcement) {
      if (onPublish) onPublish(res.announcement)
      setSent(true)
      setTitle('')
      setBody('')
      setAudience('All students')
      setImageFile(null)
      setImagePreview(null)
      setActionMsg(sendEmail ? 'Notice published & emailed to students!' : 'Notice published to app feed!')
      setTimeout(() => { setSent(false); setActionMsg(''); }, 3500)
    }
    setSubmitting(false)
  }

  const handleDeleteNotice = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this announcement? It will be removed from the in-app notice feed for all students.')) return
    setDeletingId(id)
    const res = await deleteAnnouncement(String(id))
    if (res.error) {
      alert(res.error)
    } else {
      setAlerts(alerts.filter(a => a.id !== id))
      setActionMsg('Notice deleted from app feed.')
      setTimeout(() => setActionMsg(''), 3000)
    }
    setDeletingId(null)
  }

  const handleBroadcastEmail = async (id: string | number) => {
    setBroadcastingId(id)
    const res = await broadcastAnnouncementEmail(String(id))
    if (res.error) {
      alert(res.error)
    } else {
      setActionMsg(`Email broadcast sent to ${res.count || 'targeted'} active student(s)!`)
      setTimeout(() => setActionMsg(''), 4000)
    }
    setBroadcastingId(null)
  }

  return (
    <div className="flex flex-col gap-10 max-w-3xl">
      {/* Broadcast Form Card */}
      <form onSubmit={handleSubmit} className="rounded-3xl border bg-card p-6 md:p-8 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Megaphone size={20} />
            </span>
          </div>
          {actionMsg && (
            <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
              <CheckCircle size={15} /> {actionMsg}
            </span>
          )}
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight">Broadcast Department Notice</h2>
        <p className="text-sm text-muted-foreground mt-1">Publish official circulars, exam schedules, and alerts with optional email broadcast.</p>

        <div className="mt-7 flex flex-col gap-5">
          <label className="field-label">
            Title
            <input 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="field-input" 
              placeholder="e.g. Midterm exam schedule released" 
            />
          </label>

          {/* Custom Audience Dropdown */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-foreground">Target Audience</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex h-12 w-full items-center justify-between rounded-2xl border bg-background px-4 text-sm font-medium focus:border-foreground transition-colors text-left"
              >
                <span className="truncate">
                  {audience === 'All students' ? 'All students (Department-wide)' : audience}
                </span>
                <CaretDown
                  size={16}
                  weight="bold"
                  className={`text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isTouch ? (
                <>
                  {dropdownOpen && (
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setDropdownOpen(false)} 
                    />
                  )}
                  <MobilePresence
                    show={dropdownOpen}
                    type="dropdown"
                    className="absolute top-[calc(100%+6px)] left-0 right-0 z-30 overflow-hidden rounded-2xl border bg-card p-1.5 shadow-xl"
                  >
                    <div 
                      data-lenis-prevent="true"
                      className="max-h-48 overflow-y-auto overscroll-contain dropdown-scroll flex flex-col gap-1 pr-1"
                      style={{ overscrollBehavior: 'contain' }}
                    >
                      {AUDIENCE_CHOICES.map(item => {
                        const isSelected = audience === item;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setAudience(item);
                              setDropdownOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${
                              isSelected
                                ? 'bg-secondary font-semibold text-foreground'
                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                            }`}
                          >
                            <span className="truncate">{item}</span>
                            {isSelected && <Check size={16} weight="bold" className="text-primary shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  </MobilePresence>
                </>
              ) : (
                <AnimatePresence initial={false}>
                  {dropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-20" 
                        onClick={() => setDropdownOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-[calc(100%+6px)] left-0 right-0 z-30 overflow-hidden rounded-2xl border bg-card p-1.5 shadow-xl"
                      >
                        <div 
                          data-lenis-prevent="true"
                          className="max-h-48 overflow-y-auto overscroll-contain dropdown-scroll flex flex-col gap-1 pr-1"
                          style={{ overscrollBehavior: 'contain' }}
                        >
                          {AUDIENCE_CHOICES.map(item => {
                            const isSelected = audience === item;
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => {
                                  setAudience(item);
                                  setDropdownOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${
                                  isSelected
                                    ? 'bg-secondary font-semibold text-foreground'
                                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                }`}
                              >
                                <span className="truncate">{item}</span>
                                {isSelected && <Check size={16} weight="bold" className="text-primary shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>

          <label className="field-label">
            Message
            <textarea 
              required 
              value={body} 
              onChange={e => setBody(e.target.value)} 
              className="field-input min-h-32 py-3 resize-none" 
              placeholder="Write a clear, concise announcement..." 
            />
          </label>

          {/* Optional Image Attachment */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-foreground">Attach Circular / Schedule Image (Optional)</span>
            {imagePreview ? (
              <div className="relative rounded-2xl border p-3 bg-secondary/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={imagePreview} alt="Preview" className="size-14 rounded-xl object-cover border shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{imageFile?.name}</p>
                    <p className="text-[11px] text-muted-foreground">{((imageFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors cursor-pointer rounded-full hover:bg-secondary"
                  title="Remove image"
                >
                  <Trash size={16} />
                </button>
              </div>
            ) : (
              <label className="border border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-background hover:bg-secondary/40 transition-colors text-center">
                <UploadSimple size={20} className="text-primary" />
                <div>
                  <span className="text-xs font-semibold text-foreground">Upload official notice image</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, or WEBP up to 10MB</p>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
              </label>
            )}
          </div>

          {/* Email Option Toggle */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl border bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={e => setSendEmail(e.target.checked)}
              className="mt-0.5 size-4 rounded accent-primary cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <EnvelopeSimple size={15} className="text-primary" /> Send instant email broadcast to target students
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                If unchecked, the notice will only be posted to the in-app Notices feed. You can broadcast via email later at any time from the list below.
              </span>
            </div>
          </label>

          <button 
            type="submit" 
            disabled={submitting} 
            className="flex items-center justify-center gap-2 rounded-full bg-primary p-3.5 font-semibold text-primary-foreground hover:opacity-95 transition-opacity shadow-sm mt-1 cursor-pointer disabled:opacity-50"
          >
            <Send size={17}/>
            {sent ? 'Notice Published!' : submitting ? 'Publishing...' : sendEmail ? 'Publish Announcement & Email Students' : 'Publish to In-App Feed Only'}
          </button>
        </div>
      </form>

      {/* Published Announcements Management Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Megaphone size={18} className="text-primary" />
              Active Department Notices ({deptNotices.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Manage live department circulars, broadcast follow-up emails, or remove old notices.</p>
          </div>
        </div>

        {deptNotices.length === 0 ? (
          <div className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground bg-card/40">
            <Megaphone size={28} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-foreground text-sm">No department notices published yet</p>
            <p className="text-xs mt-1">Notices created above will appear here with controls to email or delete.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {deptNotices.map((notice) => (
              <div key={notice.id} className="rounded-3xl border bg-card p-5 flex flex-col gap-3.5 shadow-xs hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full">
                        {notice.audience === 'ALL' || notice.audience === 'All students' ? 'All Students' : notice.audience}
                      </span>
                      <span className="text-xs text-muted-foreground">{notice.time}</span>
                    </div>
                    <h4 className="text-base font-semibold text-foreground mt-1">{notice.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed whitespace-pre-wrap">{notice.body}</p>
                  </div>
                  {notice.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewModalImg(notice.imageUrl)}
                      className="shrink-0 group relative cursor-pointer"
                      title="Click to view image"
                    >
                      <img src={notice.imageUrl} alt={notice.title} className="size-16 rounded-xl object-cover border group-hover:opacity-90 transition-opacity" />
                    </button>
                  )}
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center justify-between gap-2 border-t pt-3 flex-wrap">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Info size={14} /> Visible to active students in {notice.audience === 'ALL' || notice.audience === 'All students' ? 'all semesters' : notice.audience}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={broadcastingId === notice.id}
                      onClick={() => handleBroadcastEmail(notice.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 border border-border/60 transition-colors cursor-pointer disabled:opacity-50"
                      title="Send or resend this notice via email"
                    >
                      <EnvelopeSimple size={14} className="text-primary" />
                      {broadcastingId === notice.id ? 'Dispatching...' : 'Broadcast Email'}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === notice.id}
                      onClick={() => handleDeleteNotice(notice.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete notice from in-app feed"
                    >
                      <Trash size={14} />
                      {deletingId === notice.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewModalImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-xs" onClick={() => setPreviewModalImg(null)}>
          <div className="relative max-w-2xl max-h-[90vh] bg-card rounded-3xl p-3 border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewModalImg(null)}
              className="absolute top-4 right-4 z-10 size-8 flex items-center justify-center rounded-full bg-background/80 hover:bg-background border text-foreground transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
            <img src={previewModalImg} alt="Enlarged notice" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}

function PdfReader({note,onBack}:{note:Note,onBack:()=>void}){
  return (
    <div className="min-h-screen bg-background text-foreground">
      {note.fileUrl ? (
        <PDFViewer 
          url={note.fileUrl} 
          title={note.title} 
          author={note.author} 
          code={note.code || note.subject} 
          onBack={onBack} 
        />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen text-muted-foreground p-8">
          <FileText size={48} className="mb-4 opacity-20"/>
          <p className="text-base font-medium">No PDF attached to this note.</p>
          <button onClick={onBack} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Back to Library
          </button>
        </div>
      )}
    </div>
  );
}
