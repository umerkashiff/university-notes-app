'use client'

import dynamic from 'next/dynamic'
import { useLenis } from 'lenis/react'

import { useMemo, useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Bell, BookOpen, Check, CaretLeft as ChevronLeft, CaretRight as ChevronRight, CaretDown, DownloadSimple as Download, FileText, FolderOpen, House as Home, Tray as Inbox, SquaresFour as LayoutDashboard, SignOut as LogOut, Megaphone, Minus, Plus, MagnifyingGlass as Search, PaperPlaneRight as Send, Gear as Settings, ShieldCheck, UploadSimple as Upload, User, Users, X, GridFour as LayoutGrid, List, BookmarkSimple as Bookmark, Sparkle, ChatText, GraduationCap, Trash, PlusCircle, Info } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { login, logout } from '@/app/actions/auth'
import type { User as PrismaUser } from '@prisma/client'
import { createClient } from '@/utils/supabase/client'
import { createNote, publishNote, createSubject, deleteSubject, getTotalStorage, createAnnouncement } from '@/app/actions/notes'
import { getPresignedUrl } from '@/app/actions/upload'
import React from 'react'

const PDFViewer = dynamic(() => import('@/components/pdf-viewer').then(mod => mod.PDFViewer), {
  ssr: false,
  loading: () => <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Loading PDF reader...</div>
})

type Role = 'student' | 'senior' | 'admin'
type Screen = 'semesters' | 'subject' | 'notifications' | 'submissions' | 'cms' | 'saved'
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

export function StudyCompanion({ initialUser, initialNotes = [], initialAnnouncements = [], initialSubjects = [] }: { initialUser: PrismaUser | null, initialNotes?: any[], initialAnnouncements?: any[], initialSubjects?: any[] }){
  const [user, setUser] = useState<PrismaUser | null>(initialUser)
  const role = (user?.role?.toLowerCase() as Role) || null
  const [screen,setScreen]=useState<Screen>(role === 'admin' ? 'cms' : role === 'senior' ? 'submissions' : 'semesters')
  const [reader,setReader]=useState<Note|null>(null)
  const [selectedSubjectName, setSelectedSubjectName] = useState<string | null>(null)

  // Real Bookmark / Saved Notes State with Local Storage persistence
  const [savedNoteIds, setSavedNoteIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('luma_saved_notes')
      if (stored) setSavedNoteIds(JSON.parse(stored))
    } catch {}
  }, [])

  const toggleSave = (noteId: string | number) => {
    const idStr = String(noteId)
    setSavedNoteIds(prev => {
      const next = prev.includes(idStr) ? prev.filter(x => x !== idStr) : [...prev, idStr]
      try {
        localStorage.setItem('luma_saved_notes', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const mapNote = (n: any): Note => ({
    id: n.id,
    authorId: n.authorId || n.author?.id || undefined,
    title: n.title,
    subject: n.subject?.name || n.subject || '',
    code: n.subject?.code || n.code || '',
    author: n.author?.name || n.author?.email || 'Senior Contributor',
    date: n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently',
    pages: n.pages || 1,
    size: n.size || '1.0 MB',
    tone: n.tone || 'bg-sage',
    status: n.status || 'PUBLISHED',
    fileUrl: n.fileUrl,
    description: n.description || undefined
  })
  
  const mapAlert = (a: any) => ({
    id: a.id,
    audience: a.audience || 'ALL',
    kind: a.audience === 'ALL' || !a.audience ? 'Department' : a.audience,
    title: a.title,
    body: a.body,
    time: a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB') : 'Just now',
    unread: true
  })

  const [notes, setNotes] = useState<Note[]>(() => (initialNotes && initialNotes.length > 0) ? initialNotes.map(mapNote) : [])
  const [alerts, setAlerts] = useState<any[]>(() => (initialAnnouncements && initialAnnouncements.length > 0) ? initialAnnouncements.map(mapAlert) : [])
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>(() => (initialSubjects && initialSubjects.length > 0) ? initialSubjects : [])

  const [selectedSemester,setSelectedSemester]=useState(1)
  const [query,setQuery]=useState('')
  const [showRole,setShowRole]=useState(false)
  const unread = alerts.filter(a=>a.unread).length

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    const timeStr = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    const firstName = user?.name ? user.name.split(' ')[0] : 'there'
    return `${timeStr}, ${firstName}`
  }, [user])

  const signIn = async (email: string, password?: string) => {
    const res = await login(email, password)
    if (res.error) {
      alert(res.error)
    } else if (res.user) {
      setUser(res.user)
      const next = res.user.role.toLowerCase() as Role
      setScreen(next === 'admin' ? 'cms' : next === 'senior' ? 'submissions' : 'semesters')
    }
  }

  const handleLogout = async () => {
    await logout()
    setUser(null)
  }

  if(!role) return <Login onLogin={signIn}/>
  if(reader) return <PdfReader note={reader} onBack={()=>setReader(null)}/>

  const title = screen==='cms'
    ? 'Content studio'
    : screen==='submissions'
    ? 'Contributor desk'
    : screen==='notifications'
    ? 'Notifications'
    : screen==='semesters'
    ? 'Semesters'
    : screen==='subject'
    ? (selectedSubjectName || `Semester ${selectedSemester}`)
    : screen==='saved'
    ? 'Saved notes'
    : greeting

  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/40 backdrop-blur-xl shadow-sm supports-[backdrop-filter]:bg-white/30 transform-gpu will-change-transform">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <button onClick={()=>setScreen(role==='admin'?'cms':role==='senior'?'submissions':'semesters')} className="flex items-center gap-3" aria-label="Luma home">
          <span className="flex size-9 -rotate-3 items-center justify-center rounded-xl bg-primary text-primary-foreground"><BookOpen size={18}/></span>
          <span className="text-xl font-bold tracking-tight">Luma</span>
          <span className="hidden rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground sm:inline">Computer Engineering</span>
        </button>
        <nav className="hidden items-center gap-1 rounded-full bg-secondary p-1 md:flex" aria-label="Primary">
          {role==='student'&&<><Nav active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')}>Home</Nav><Nav active={screen==='saved'} onClick={()=>setScreen('saved')}>Saved ({savedNoteIds.length})</Nav></>}
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
            <button onClick={()=>setShowRole(!showRole)} className="flex size-10 items-center justify-center rounded-full bg-mist text-sm font-bold">
              {user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : "ST")}
            </button>
            <AnimatePresence>
              {showRole&&<motion.div initial={{opacity:0, scale:0.95, y:5}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:5}} transition={{duration:0.15}} className="popover right-0 w-64 p-2 origin-top-right">
                <div className="border-b p-3">
                  <b>{user?.name || user?.email}</b>
                  <p className="text-xs capitalize text-muted-foreground">{role} preview</p>
                </div>
                {(['student','senior','admin'] as Role[]).map(r=><button key={r} onClick={()=>{signIn(r + '@uet.edu');setShowRole(false)}} className="flex w-full items-center gap-2 rounded-xl p-3 text-sm capitalize hover:bg-secondary">{r===role&&<Check size={15}/>} {r}</button>)}
                <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl p-3 text-sm text-muted-foreground hover:bg-secondary"><LogOut size={16}/> Sign out</button>
              </motion.div>}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>

    <div className="mx-auto max-w-7xl px-5 py-8 pb-28 md:px-8 md:py-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="section-kicker">{role==='admin'?'Department CMS':role==='senior'?'Senior contributor':'Your study library'}</p>
          <h1 className="text-balance text-4xl font-semibold tracking-[-.04em] md:text-5xl">{title}</h1>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={screen} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}}>
          {screen==='saved'&&<SavedNotes notes={notes} subjects={subjectsList} savedNoteIds={savedNoteIds} toggleSave={toggleSave} open={setReader}/>} 
          {screen==='semesters'&&<SemesterLibrary subjects={subjectsList} notes={notes} select={(n)=>{setSelectedSemester(n);setScreen('subject')}}/>}
          {screen==='subject'&&<SubjectLibrary semester={selectedSemester} subjects={subjectsList} notes={notes} query={query} setQuery={setQuery} savedNoteIds={savedNoteIds} toggleSave={toggleSave} open={setReader} onBack={()=>setScreen('semesters')} onSelectSubjectName={setSelectedSubjectName}/>} 
          {screen==='notifications'&&<Notifications alerts={alerts} setAlerts={setAlerts}/>} 
          {screen==='submissions'&&<ContributorDesk user={user} notes={notes} subjects={subjectsList} add={(note)=>setNotes([note,...notes])}/>} 
          {screen==='cms'&&<AdminCms notes={notes} subjects={subjectsList} setSubjects={setSubjectsList} publish={(note)=>{setNotes(notes.map(n => n.id === note.id ? {...n, status: 'PUBLISHED'} : n));setAlerts([{id:Date.now(),audience: note.subject || 'ALL',kind:'New note',title:`${note.subject} notes published`,body:`${note.title} is now available.`,time:'Just now',unread:true},...alerts])}} addAnnouncement={(a)=>setAlerts([mapAlert(a), ...alerts])}/>}
        </motion.div>
      </AnimatePresence>
    </div>
    <nav className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-full border bg-card p-1.5 shadow-lg md:hidden">
      <Mobile active={role==='admin'?screen==='cms':role==='senior'?screen==='submissions':(screen==='semesters'||screen==='subject')} onClick={()=>setScreen(role==='admin'?'cms':role==='senior'?'submissions':'semesters')} icon={<Home/>}>Home</Mobile>
      {role==='student'?<Mobile active={screen==='saved'} onClick={()=>setScreen('saved')} icon={<Bookmark/>}>Saved ({savedNoteIds.length})</Mobile>:<Mobile active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')} icon={<BookOpen/>}>Library</Mobile>}
      <Mobile active={screen==='notifications'} onClick={()=>setScreen('notifications')} icon={<Bell/>}>Notices</Mobile>
    </nav>
  </main>
}

function Nav({active,onClick,children,layoutId="nav-pill"}:{active:boolean,onClick:()=>void,children:React.ReactNode,layoutId?:string}){return <button onClick={onClick} className={`relative px-5 py-2 text-sm transition-colors rounded-full ${active?'text-foreground font-semibold':'text-muted-foreground hover:text-foreground'}`}>
  {active && <motion.div layoutId={layoutId} className="absolute inset-0 bg-background shadow-sm rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
  <span className="relative z-10">{children}</span>
</button>}

function Mobile({active,onClick,icon,children}:{active:boolean,onClick:()=>void,icon:React.ReactNode,children:React.ReactNode}){return <button onClick={onClick} className={`relative flex min-w-16 flex-col items-center gap-1 rounded-full px-3 py-2 text-[10px] transition-colors ${active?'text-foreground':'text-muted-foreground hover:text-foreground'}`}>
  {active && <motion.div layoutId="mobile-nav-pill" className="absolute inset-0 bg-secondary rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
  <span className="relative z-10 flex flex-col items-center gap-1">{icon}<span>{children}</span></span>
</button>}

function Header({kicker,title}:{kicker:string,title:string}){return <div className="mb-6"><p className="section-kicker">{kicker}</p><h2 className="text-3xl font-semibold">{title}</h2></div>}

function Login({onLogin}:{onLogin:(email:string, password:string)=>void}){const [identity,setIdentity]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');return <main className="login-shell min-h-screen bg-background p-5 md:p-8"><div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border bg-card shadow-sm md:grid-cols-[1.05fr_.95fr]">
  <section className="relative hidden flex-col justify-between overflow-hidden bg-sage p-12 md:flex"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><BookOpen size={20}/></span><b className="text-xl">Luma</b></div><div className="max-w-md"><span className="eyebrow"><ShieldCheck size={15}/> Made for your department</span><h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.05] tracking-[-.05em]">Every useful note, in one calm place.</h1><p className="mt-5 text-lg leading-relaxed text-muted-foreground">Browse by semester, read beautifully, and never miss what matters.</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-3xl bg-background/60 p-5"><FileText/><b className="mt-8 block">Shared by seniors</b><p className="text-sm text-muted-foreground">Reviewed before publishing.</p></div><div className="rounded-3xl bg-background/60 p-5"><Bell/><b className="mt-8 block">Department updates</b><p className="text-sm text-muted-foreground">Clear, timely announcements.</p></div></div></section>
  <section className="flex flex-col justify-center p-7 md:p-12"><div className="mb-10 flex items-center gap-3 md:hidden"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><BookOpen size={20}/></span><b className="text-xl">Luma</b></div><p className="section-kicker">Welcome back</p><h2 className="text-4xl font-semibold tracking-[-.04em]">Sign in to Luma</h2><p className="mt-2 text-muted-foreground">Your department's notes and notices await.</p><form onSubmit={e=>{e.preventDefault();setError('');onLogin(identity, password)}} className="mt-8 flex flex-col gap-5"><label className="field-label">Email address<input required value={identity} onChange={e=>setIdentity(e.target.value)} type="email" className="field-input" placeholder="student@uet.edu"/></label><label className="field-label">Password<input required value={password} onChange={e=>setPassword(e.target.value)} type="password" className="field-input" placeholder="••••••••"/></label>{error&&<p className="text-sm text-destructive">{error}</p>}<button className="rounded-full bg-primary px-5 py-3.5 font-semibold text-primary-foreground">Continue</button></form><p className="mt-7 text-center text-sm text-muted-foreground">New student? Your department will issue your account.</p></section>
  </div></main>}

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

function SemesterLibrary({ subjects, notes, select }: { subjects: SubjectItem[], notes: Note[], select: (n: number) => void }) {
  // Dynamically derive all available semesters from DB subjects (at least 1 to 8)
  const semesterNumbers = useMemo(() => {
    const set = new Set<number>()
    subjects.forEach(s => set.add(s.semester))
    const max = Math.max(8, ...Array.from(set))
    const list: number[] = []
    for (let i = 1; i <= max; i++) list.push(i)
    return list
  }, [subjects])

  return (
    <div>
      <Header kicker="Computer Engineering" title="Choose a semester" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {semesterNumbers.map(num => {
          const semSubjects = subjects.filter(s => s.semester === num)
          const tone = SEMESTER_COLORS[(num - 1) % SEMESTER_COLORS.length]
          const label = SEMESTER_LABELS[num] || `Semester ${num}`
          const previewItems = semSubjects.map(s => s.name).slice(0, 4)

          return (
            <button
              key={num}
              onClick={() => select(num)}
              className={`${tone} flex min-h-64 flex-col justify-between rounded-3xl p-7 text-left transition hover:-translate-y-1 shadow-xs border border-black/5`}
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
  onBack,
  onSelectSubjectName
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
  onSelectSubjectName?: (name: string | null) => void
}) {
  const semSubjects = useMemo(() => subjects.filter(s => s.semester === semester), [subjects, semester])
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null)

  const activeSubject = selectedSubject || semSubjects[0] || null

  useEffect(() => {
    if (onSelectSubjectName) {
      onSelectSubjectName(activeSubject ? activeSubject.name : `Semester ${semester}`)
    }
  }, [activeSubject, semester, onSelectSubjectName])

  const list = useMemo(() => {
    return notes.filter(n => {
      if (n.status && n.status !== 'PUBLISHED') return false
      if (activeSubject) {
        const matches = n.code === activeSubject.code || n.subject === activeSubject.name
        if (!matches) return false
      } else {
        const isThisSem = semSubjects.some(s => s.code === n.code || s.name === n.subject)
        if (!isThisSem && semSubjects.length > 0) return false
      }
      const q = query.toLowerCase()
      return !q || `${n.title} ${n.author} ${n.subject} ${n.code}`.toLowerCase().includes(q)
    })
  }, [notes, activeSubject, semSubjects, query])

  const tone = SEMESTER_COLORS[(semester - 1) % SEMESTER_COLORS.length]

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside>
        <button 
          className="mb-5 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" 
          onClick={onBack}
        >
          <ArrowLeft size={16}/> Semester {semester}
        </button>
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

      <section>
        {activeSubject ? (
          <div className={`rounded-3xl ${tone} p-7 border border-black/5 shadow-xs`}>
            <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-bold text-foreground">
              {activeSubject.code}
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-foreground tracking-tight">{activeSubject.name}</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Foundations, worked examples and past questions shared by your seniors.
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

        <div className="mt-4 flex flex-col gap-3">
          {list.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground border rounded-3xl border-dashed bg-card/40">
              <FileText size={32} className="mx-auto mb-2 opacity-30"/>
              <p className="font-semibold text-foreground text-sm">No notes available</p>
              <p className="text-xs mt-1">Be the first senior to contribute notes for {activeSubject?.name || 'this subject'}!</p>
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
  )
}

function NoteRow({
  note,
  subjects = [],
  isSaved = false,
  toggleSave,
  open,
  index = 0
}: {
  note: Note
  subjects?: SubjectItem[]
  isSaved?: boolean
  toggleSave?: (id: string | number) => void
  open: () => void
  index?: number
}){
  const [expanded, setExpanded] = useState(false);
  const semNumber = subjects.find(s => s.code === note.code || s.name === note.subject)?.semester

  return (
    <motion.article initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:index*0.05, duration:0.4}} className="flex flex-col rounded-2xl border bg-card p-4 hover:border-primary/30 transition-colors shadow-sm">
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
                <span>{expanded ? 'Hide advice' : 'Senior advice'}</span>
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
              aria-label={isSaved ? "Remove from saved" : "Save note"}
            >
              <Bookmark size={18} weight={isSaved ? "fill" : "regular"} />
            </button>
          )}
          <button onClick={open} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95">Read</button>
          <button onClick={()=>downloadNote(note)} className="icon-button border transition-transform hover:scale-105 active:scale-95" aria-label={`Download ${note.title}`}><Download size={18}/></button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && note.description && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <div className="rounded-xl bg-sage/40 border border-primary/20 p-3.5 text-sm">
                <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
                  <GraduationCap size={16} className="text-primary shrink-0" />
                  <span>Senior Contributor Advice & Tips</span>
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

function downloadNote(note:Note){const blob=new Blob([`${note.title}\n${note.subject}\nShared on Luma by ${note.author}`],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${note.title}.txt`;a.click();URL.revokeObjectURL(url)}

function getAudienceBadge(audience: string, kind: string) {
  if (kind === 'New note') {
    return { label: 'New note', color: 'bg-primary text-primary-foreground' }
  }
  if (!audience || audience === 'ALL' || audience === 'Department' || audience === 'All students') {
    return { label: 'All students', color: 'bg-secondary text-foreground' }
  }
  const match = audience.match(/Semester\s*(\d)/i)
  if (match) {
    const sem = parseInt(match[1], 10)
    const tone = SEMESTER_COLORS[(sem - 1) % SEMESTER_COLORS.length] || 'bg-secondary'
    return { label: `Semester ${sem}`, color: `${tone} text-foreground border border-black/5` }
  }
  return { label: audience, color: 'bg-secondary text-foreground' }
}

function Notifications({alerts,setAlerts}:{alerts:any[],setAlerts:(a:any[])=>void}){
  const [readFilter, setReadFilter] = useState<'all'|'unread'>('all')
  const [targetFilter, setTargetFilter] = useState<string>('All')

  const audienceOptions = useMemo(() => {
    const set = new Set<string>()
    alerts.forEach(a => {
      if (a.audience && a.audience !== 'ALL' && a.audience !== 'All students') {
        set.add(a.audience)
      }
    })
    return ['All', 'General', ...Array.from(set)]
  }, [alerts])

  const shown = useMemo(() => {
    return alerts.filter(a => {
      if (readFilter === 'unread' && !a.unread) return false
      if (targetFilter === 'General') {
        return !a.audience || a.audience === 'ALL' || a.audience === 'All students' || a.audience === 'Department'
      }
      if (targetFilter !== 'All') {
        return a.audience === targetFilter
      }
      return true
    })
  }, [alerts, readFilter, targetFilter])

  return (
    <section className="max-w-3xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex rounded-full bg-secondary p-1 w-fit">
          <Nav layoutId="notify-nav" active={readFilter==='all'} onClick={()=>setReadFilter('all')}>All ({alerts.length})</Nav>
          <Nav layoutId="notify-nav" active={readFilter==='unread'} onClick={()=>setReadFilter('unread')}>Unread ({alerts.filter(a=>a.unread).length})</Nav>
        </div>
        {alerts.some(a => a.unread) && (
          <button onClick={()=>setAlerts(alerts.map(a=>({...a,unread:false})))} className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground">
            Mark all read
          </button>
        )}
      </div>

      {audienceOptions.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 modal-scroll touch-pan-x">
          {audienceOptions.map(opt => (
            <button
              key={opt}
              onClick={() => setTargetFilter(opt)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                targetFilter === opt
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <AnimatePresence mode="wait">
          <motion.div key={`${readFilter}-${targetFilter}`} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}} className="flex flex-col gap-3">
            {shown.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground border rounded-3xl border-dashed bg-card/40">
                <Bell size={32} className="mx-auto mb-2 opacity-30"/>
                <p className="font-semibold text-foreground text-sm">No announcements found</p>
                <p className="text-xs mt-1">Official department updates will appear here.</p>
              </div>
            ) : (
              shown.map(a => {
                const badge = getAudienceBadge(a.audience, a.kind)
                return (
                  <button 
                    key={a.id} 
                    onClick={()=>setAlerts(alerts.map(x=>x.id===a.id?{...x,unread:false}:x))} 
                    className="flex gap-4 rounded-3xl border bg-card p-5 text-left transition hover:shadow-sm hover:border-primary/30"
                  >
                    <span className={`mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl ${badge.color}`}>
                      {a.kind==='New note' ? <FileText size={18}/> : <Megaphone size={18}/>}
                    </span>
                    <span className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{a.time}</span>
                      </div>
                      <span className="flex items-center gap-2">
                        <b className="text-base font-semibold text-foreground">{a.title}</b>
                        {a.unread && <i className="size-2 rounded-full bg-primary shrink-0"/>}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground leading-relaxed">{a.body}</span>
                    </span>
                  </button>
                )
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

function ContributorDesk({user,add,notes,subjects}:{user:PrismaUser|null,add:(n:Note)=>void,notes:Note[],subjects:SubjectItem[]}){
  const [open,setOpen]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const lenis = useLenis();
  
  useEffect(() => {
    if (open) {
      lenis?.stop();
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      lenis?.start();
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }
    return () => {
      lenis?.start();
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
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
    const form = new FormData(e.currentTarget);
    const file = form.get('file') as File;
    const title = String(form.get('title'));
    
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

      <AnimatePresence>
        {open&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}} className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-foreground/40 backdrop-blur-sm overscroll-none touch-none" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="submit-title" onClick={() => setSubjectDropdownOpen(false)}>
          <motion.form initial={{scale:0.95, y:15, opacity: 0}} animate={{scale:1, y:0, opacity: 1}} exit={{scale:0.95, y:15, opacity: 0}} transition={{type:"spring", bounce:0.15, duration:0.35}} onSubmit={handleUpload} onClick={(e) => e.stopPropagation()} className="relative flex flex-col w-full max-w-lg rounded-[2rem] bg-card border border-border/80 shadow-2xl max-h-[88vh] overflow-hidden" data-lenis-prevent>
            
            {/* Frosted Sticky Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-5 bg-card/90 backdrop-blur-xl border-b border-border/40">
              <div>
                <p className="section-kicker mb-0.5">New submission</p>
                <h2 id="submit-title" className="text-xl sm:text-2xl font-bold tracking-tight">Upload your note</h2>
              </div>
              <button 
                type="button" 
                onClick={()=>setOpen(false)} 
                className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto modal-scroll px-6 py-5 mr-2 pr-4 space-y-5">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                    <Check size={28} weight="bold" />
                  </div>
                  <h3 className="text-xl font-bold">Uploaded for review!</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">Your note has been submitted to the department.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <label className="field-label">
                    Note title
                    <input required name="title" className="field-input" placeholder="e.g. Week 1–6 Midterm Summary" />
                  </label>

                  {/* Target Semester Selector with visible scrollbar */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-foreground">Target semester</span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 modal-scroll touch-pan-x">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
                        const isActive = selectedSemester === sem
                        return (
                          <button
                            key={sem}
                            type="button"
                            onClick={() => handleSemesterChange(sem)}
                            className={`relative px-4 py-2 text-xs sm:text-sm font-semibold rounded-full whitespace-nowrap transition-colors select-none shrink-0 ${
                              isActive
                                ? 'text-primary-foreground'
                                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="upload-sem-pill"
                                className="absolute inset-0 bg-primary rounded-full z-0 shadow-sm"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                            <span className="relative z-10">Semester {sem}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Course / Subject Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-foreground">Course / Subject</span>
                    {semesterSubjects.length === 0 ? (
                      <div className="rounded-2xl border border-dashed p-4 text-center text-xs text-muted-foreground bg-secondary/30">
                        No courses registered for Semester {selectedSemester} yet.
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                          className="flex h-12 w-full items-center justify-between rounded-2xl border bg-background px-4 text-sm font-medium focus:border-foreground transition-colors text-left"
                        >
                          <span className="truncate">
                            {subjects.find(s => s.code === subjectCode)
                              ? `${subjects.find(s => s.code === subjectCode)?.name} (${subjectCode})`
                              : 'Select a course'}
                          </span>
                          <CaretDown
                            size={16}
                            weight="bold"
                            className={`text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${
                              subjectDropdownOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {subjectDropdownOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-20" 
                                onClick={() => setSubjectDropdownOpen(false)} 
                              />
                              <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-[calc(100%+6px)] left-0 right-0 z-30 max-h-56 overflow-y-auto flex flex-col gap-1 rounded-2xl border bg-card p-2 shadow-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                              >
                                {semesterSubjects.map(s => {
                                  const isSelected = subjectCode === s.code;
                                  return (
                                    <button
                                      key={s.code}
                                      type="button"
                                      onClick={() => {
                                        setSubjectCode(s.code);
                                        setSubjectDropdownOpen(false);
                                      }}
                                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${
                                        isSelected
                                          ? 'bg-secondary font-semibold text-foreground'
                                          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                      }`}
                                    >
                                      <span className="truncate">{s.name} ({s.code})</span>
                                      {isSelected && <Check size={16} weight="bold" className="text-primary shrink-0 ml-2" />}
                                    </button>
                                  );
                                })}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Senior Advice / Study Tips */}
                  <label className="field-label flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <GraduationCap size={16} className="text-primary" />
                      Senior Advice & Study Tips (Optional)
                    </span>
                    <div className="flex h-28 rounded-2xl border bg-background overflow-hidden focus-within:border-foreground transition-colors">
                      <textarea
                        value={seniorAdvice}
                        onChange={e => setSeniorAdvice(e.target.value)}
                        className="h-full w-full bg-transparent px-4 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground"
                        placeholder="e.g. Focus on Chapter 3 formulas and past midterm questions."
                      />
                    </div>
                  </label>

                  {/* PDF File Upload Dropzone */}
                  <label className={`relative flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border transition-all p-4 ${
                    selectedFile
                      ? 'border-primary/40 bg-secondary/80 hover:bg-secondary'
                      : 'border-dashed border-border/80 bg-secondary/40 hover:border-primary/40 hover:bg-secondary/70'
                  }`}>
                    {selectedFile ? (
                      <div className="flex w-full items-center gap-3.5">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                          <FileText size={22} weight="fill" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block font-semibold text-sm text-foreground truncate">{selectedFile.name}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for Cloudflare upload
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-primary px-3 py-1.5 rounded-full bg-background border border-border/60 shadow-xs shrink-0">
                          Change
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload size={22} className="text-muted-foreground mb-1.5" />
                        <span className="font-semibold text-foreground">Choose PDF document</span>
                        <span className="text-xs text-muted-foreground mt-0.5">PDF files up to 100 MB</span>
                      </>
                    )}
                    <input
                      type="file"
                      name="file"
                      accept="application/pdf"
                      className="sr-only"
                      required
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const f = e.target.files[0];
                          if (f.type !== 'application/pdf') {
                            alert('Please select a valid PDF file.');
                            return;
                          }
                          if (f.size > 100 * 1024 * 1024) {
                            alert('File size exceeds 100 MB limit.');
                            return;
                          }
                          setSelectedFile(f);
                        }
                      }}
                    />
                  </label>

                  {uploading ? (
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex justify-between text-xs font-semibold text-muted-foreground px-1">
                        <span>Uploading to Cloudflare...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary rounded-full" 
                          initial={{ width: 0 }} 
                          animate={{ width: `${uploadProgress}%` }} 
                          transition={{ ease: "linear", duration: 0.2 }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button className="rounded-full bg-primary p-3.5 font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity mt-1">
                      Submit note for review
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bottom cushion spacer */}
            <div className="h-4 w-full bg-card shrink-0 pointer-events-none" />
          </motion.form>
        </motion.div>}
      </AnimatePresence>
    </div>
  )
}

function AdminCms({notes,subjects,setSubjects,publish,addAnnouncement}:{notes:Note[],subjects:SubjectItem[],setSubjects:(s:SubjectItem[])=>void,publish:(n:Note)=>void,addAnnouncement:(a:any)=>void}){
  const [tab,setTab]=useState<'queue'|'content'|'curriculum'|'notices'>('queue');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [doneId,setDoneId]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [curriculumSem, setCurriculumSem] = useState(1);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [creatingSub, setCreatingSub] = useState(false);
  const [subMsg, setSubMsg] = useState('');
  const [storageBytes, setStorageBytes] = useState<number | null>(null);

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
    if(!confirm(`Delete subject ${code}? This cannot be undone.`)) return;
    const res = await deleteSubject(id);
    if (res.error) {
      setSubMsg(res.error);
      setTimeout(() => setSubMsg(''), 4000);
    } else {
      setSubjects(subjects.filter(s => s.id !== id));
      setSubMsg(`Deleted subject ${code}.`);
      setTimeout(() => setSubMsg(''), 2000);
    }
  };

  const semSubjects = subjects.filter(s => s.semester === curriculumSem);

  const tabs = [
    { id: 'queue', label: `Review queue (${pending.length})` },
    { id: 'content', label: `Published (${published.length})` },
    { id: 'curriculum', label: 'Curriculum & Subjects' },
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
  </div>

  {/* Desktop Pill Navigation */}
  <div className="hidden md:flex mb-7 overflow-x-auto scrollbar-none">
    <div className="flex w-max rounded-full bg-secondary p-1">
      <Nav layoutId="admin-nav" active={tab==='queue'} onClick={()=>setTab('queue')}>Review queue ({pending.length})</Nav>
      <Nav layoutId="admin-nav" active={tab==='content'} onClick={()=>setTab('content')}>Published ({published.length})</Nav>
      <Nav layoutId="admin-nav" active={tab==='curriculum'} onClick={()=>setTab('curriculum')}>Curriculum & Subjects</Nav>
      <Nav layoutId="admin-nav" active={tab==='notices'} onClick={()=>setTab('notices')}>Announcements</Nav>
    </div>
  </div>

  <AnimatePresence mode="wait">
    <motion.div key={tab} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}}>
      
      {/* Review queue */}
      {tab==='queue'&&<div className="flex flex-col gap-5">
        {pending.length === 0 && <p className="text-muted-foreground p-8 text-center border rounded-3xl border-dashed bg-card/50">No notes currently pending review. Submissions from seniors will appear here.</p>}
        {pending.map(candidate => <div key={candidate.id} className="grid gap-5 lg:grid-cols-[1fr_340px]"><section className="rounded-3xl border bg-card p-6"><div className="flex flex-col sm:flex-row sm:items-start gap-4"><span className="flex size-12 items-center justify-center rounded-2xl bg-blush shrink-0"><Inbox/></span><div className="flex-1 min-w-0"><span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-foreground">Awaiting review</span><h2 className="mt-3 text-2xl font-semibold">{candidate.title}</h2><p className="mt-1 text-sm text-muted-foreground">{candidate.subject} ({candidate.code}) · {candidate.pages} pages · {candidate.size}</p>
        
        {candidate.description && (
          <div className="mt-4 rounded-2xl bg-sage/30 border border-primary/20 p-3.5 text-sm">
            <b className="flex items-center gap-1.5 text-foreground"><GraduationCap size={16} className="text-primary"/> Contributor Advice:</b>
            <p className="mt-1 text-muted-foreground leading-relaxed">{candidate.description}</p>
          </div>
        )}

        <p className="mt-5 leading-relaxed text-muted-foreground"><a href={candidate.fileUrl} target="_blank" className="inline-flex items-center gap-1 text-primary underline underline-offset-2 font-medium">Open uploaded PDF ↗</a></p></div></div><div className="mt-6 rounded-2xl bg-secondary p-4"><b>Submitted by {candidate.author}</b><p className="mt-0.5 text-xs text-muted-foreground">Senior contributor · {candidate.date}</p></div></section><aside className="rounded-3xl bg-sage p-6"><h3 className="text-xl font-semibold">Ready to publish?</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Check the title, subject and document quality before making it visible to all students.</p>{doneId === candidate.id?<div className="mt-8 rounded-2xl bg-background/60 p-5 text-center"><Check className="mx-auto"/><b className="mt-3 block">Published</b></div>:<div className="mt-8 flex flex-col gap-2"><button disabled={loading} onClick={()=>handlePublish(candidate)} className="rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity">Approve & publish</button><button className="rounded-full border border-foreground/20 px-5 py-3 text-sm font-semibold hover:bg-background/40">Request changes</button><button className="px-5 py-2 text-sm text-destructive hover:underline">Reject submission</button></div>}</aside></div>)}
      </div>}

      {/* Published content */}
      {tab==='content'&&<div className="flex flex-col gap-3">{published.length===0?<p className="text-muted-foreground p-8 text-center border rounded-3xl border-dashed bg-card/40">No published notes yet.</p>:published.map((n,i)=><NoteRow key={n.id} note={n} subjects={subjects} index={i} open={()=>{}}/>)}</div>}

      {/* Curriculum & Subjects Management */}
      {tab==='curriculum'&&<div className="flex flex-col gap-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <h2 className="text-2xl font-bold">Curriculum & Subjects</h2>
            <p className="text-sm text-muted-foreground">Manage courses and subjects available for students and seniors per semester.</p>
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

            <AnimatePresence mode="wait">
              <motion.div key={curriculumSem} initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} exit={{opacity:0, x:10}} transition={{duration:0.2, ease: "easeInOut"}}>
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

      {/* Announcements Studio */}
      {tab==='notices'&&<Announcement onPublish={addAnnouncement}/>}
    </motion.div>
  </AnimatePresence></div>}

function Announcement({ onPublish }: { onPublish?: (a: any) => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('All students')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await createAnnouncement({
      title,
      body,
      audience: audience === 'All students' ? 'ALL' : audience
    })
    if (res.error) {
      alert(res.error)
    } else if (res.announcement) {
      if (onPublish) onPublish(res.announcement)
      setSent(true)
      setTitle('')
      setBody('')
      setAudience('All students')
      setTimeout(() => setSent(false), 3000)
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl rounded-3xl border bg-card p-6 md:p-8 shadow-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Megaphone size={20} />
        </span>
      </div>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">Create an announcement</h2>
      <p className="text-sm text-muted-foreground mt-1">Broadcast official updates to all students or target a specific semester.</p>

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

            <AnimatePresence>
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
                    className="absolute top-[calc(100%+6px)] left-0 right-0 z-30 max-h-56 overflow-y-auto flex flex-col gap-1 rounded-2xl border bg-card p-2 shadow-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  </motion.div>
                </>
              )}
            </AnimatePresence>
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

        <button 
          type="submit" 
          disabled={submitting} 
          className="flex items-center justify-center gap-2 rounded-full bg-primary p-3.5 font-semibold text-primary-foreground hover:opacity-95 transition-opacity shadow-sm mt-1"
        >
          <Send size={17}/>
          {sent ? 'Published announcement!' : submitting ? 'Publishing...' : 'Publish announcement'}
        </button>
      </div>
    </form>
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
