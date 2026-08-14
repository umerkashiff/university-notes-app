'use client'

import dynamic from 'next/dynamic'
import { useLenis } from 'lenis/react'

import { useMemo, useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Bell, BookOpen, Check, CaretLeft as ChevronLeft, CaretRight as ChevronRight, CaretDown, DownloadSimple as Download, FileText, FolderOpen, House as Home, Tray as Inbox, SquaresFour as LayoutDashboard, SignOut as LogOut, Megaphone, Minus, Plus, MagnifyingGlass as Search, PaperPlaneRight as Send, Gear as Settings, ShieldCheck, UploadSimple as Upload, User, Users, X, GridFour as LayoutGrid, List, BookmarkSimple as Bookmark, DotsThree as MoreHorizontal, Link, Sparkle, ChatText, GraduationCap, Trash, PlusCircle, Info } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { login, logout } from '@/app/actions/auth'
import type { User as PrismaUser } from '@prisma/client'
import { createClient } from '@/utils/supabase/client'
import { createNote, publishNote, createSubject, deleteSubject, getTotalStorage } from '@/app/actions/notes'
import { getPresignedUrl } from '@/app/actions/upload'
import React from 'react'

const PDFViewer = dynamic(() => import('@/components/pdf-viewer').then(mod => mod.PDFViewer), {
  ssr: false,
  loading: () => <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Loading PDF reader...</div>
})

type Role = 'student' | 'senior' | 'admin'
type Screen = 'semesters' | 'subject' | 'notifications' | 'submissions' | 'cms' | 'saved'
type SubjectItem = { id:string; name:string; code:string; semester:number }
type Note = { id:string|number; fileUrl?:string; status?:string; title:string; subject:string; code:string; author:string; date:string; pages:number; size:string; tone:string; description?:string }

const defaultSubjects: SubjectItem[] = [
  { id: 'sub-1', name: 'Calculus I', code: 'MTH 101', semester: 1 },
  { id: 'sub-2', name: 'Reading & Communication', code: 'GST 101', semester: 1 },
  { id: 'sub-3', name: 'Programming Fundamentals', code: 'CP 101', semester: 1 },
  { id: 'sub-4', name: 'Applied Physics', code: 'PHY 101', semester: 1 },
  { id: 'sub-5', name: 'Calculus II', code: 'MTH 102', semester: 2 },
  { id: 'sub-6', name: 'Technical Writing', code: 'GST 102', semester: 2 },
  { id: 'sub-7', name: 'Circuit Theory', code: 'EE 101', semester: 2 },
  { id: 'sub-8', name: 'Engineering Drawing', code: 'ME 101', semester: 2 },
  { id: 'sub-9', name: 'Digital Logic', code: 'CE 201', semester: 3 },
  { id: 'sub-10', name: 'Data Structures', code: 'CS 201', semester: 3 },
  { id: 'sub-11', name: 'Electrical Machines', code: 'EE 201', semester: 3 },
  { id: 'sub-12', name: 'Statistics', code: 'MTH 201', semester: 3 },
  { id: 'sub-13', name: 'Microprocessors', code: 'CE 202', semester: 4 },
  { id: 'sub-14', name: 'Control Systems', code: 'EE 202', semester: 4 },
  { id: 'sub-15', name: 'Data Communications', code: 'CE 203', semester: 4 },
  { id: 'sub-16', name: 'Numerical Methods', code: 'MTH 202', semester: 4 },
]

const semesters = [
  { number:1, label:'First semester', subjects:6, tone:'bg-sage', items:['Calculus I','Reading & Communication','Programming Fundamentals','Applied Physics'] },
  { number:2, label:'Second semester', subjects:6, tone:'bg-mist', items:['Calculus II','Technical Writing','Circuit Theory','Engineering Drawing'] },
  { number:3, label:'Third semester', subjects:7, tone:'bg-blush', items:['Digital Logic','Data Structures','Electrical Machines','Statistics'] },
  { number:4, label:'Fourth semester', subjects:7, tone:'bg-butter', items:['Microprocessors','Control Systems','Data Communications','Numerical Methods'] },
]
const seedNotes: Note[] = [
  { id:1,title:'Limits, continuity & differentiation',subject:'Calculus I',code:'MTH 101',author:'Chidinma Okafor',date:'10 Aug 2026',pages:24,size:'2.4 MB',tone:'bg-sage',description:"💡 Exam Focus: Pay special attention to Chapter 2 on Epsilon-Delta proofs and L'Hôpital's Rule. Past midterm questions are included at the end!" },
  { id:2,title:'Complete lecture summary — weeks 1–6',subject:'Calculus I',code:'MTH 101',author:'David Mensah',date:'8 Aug 2026',pages:38,size:'4.1 MB',tone:'bg-mist',description:"📌 Lecture Summary: Comprehensive notes covering Weeks 1 to 6. Great for quick revision before quiz 2." },
  { id:3,title:'Practice questions with solutions',subject:'Calculus I',code:'MTH 101',author:'Zainab Bello',date:'3 Aug 2026',pages:16,size:'1.8 MB',tone:'bg-blush',description:"📝 Practice Set: Complete step-by-step solutions for Problem Sets 1–4 with margin notes on common pitfalls." },
  { id:4,title:'Effective reading strategies',subject:'Reading & Communication',code:'GST 101',author:'Amara Kalu',date:'1 Aug 2026',pages:19,size:'1.2 MB',tone:'bg-butter',description:"📖 Study Strategy: Critical techniques for speed reading technical documentation and writing structured engineering briefs." },
]

function FilterChip({ label, count, active, onClick }: { label:string, count?:number, active?:boolean, onClick?:()=>void }) {
  return (
    <button onClick={onClick} className={`relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors duration-200 select-none ${active ? 'text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'}`}>
      {active && <motion.div layoutId="filter-pill" className="absolute inset-0 bg-primary rounded-full z-0 shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
      <span className="relative z-10 flex items-center gap-1.5">
        {label}
        {count !== undefined && (
          <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold leading-none ${active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground'}`}>
            {count}
          </span>
        )}
      </span>
    </button>
  )
}

const initialAlerts = [
  { id:1,kind:'Department',title:'First semester course registration',body:'Course registration closes Friday at 4:00 pm.',time:'12 min ago',unread:true },
  { id:2,kind:'New note',title:'Calculus I notes published',body:'Limits, continuity & differentiation is now available.',time:'2 hours ago',unread:true },
  { id:3,kind:'Department',title:'Lab orientation moved',body:'The orientation will now hold in Engineering Hall B.',time:'Yesterday',unread:false },
]

export function StudyCompanion({ initialUser, initialNotes = [], initialAnnouncements = [], initialSubjects = [] }: { initialUser: PrismaUser | null, initialNotes?: any[], initialAnnouncements?: any[], initialSubjects?: any[] }){
  const [user, setUser] = useState<PrismaUser | null>(initialUser)
  const role = (user?.role?.toLowerCase() as Role) || null
  const [screen,setScreen]=useState<Screen>(role === 'admin' ? 'cms' : role === 'senior' ? 'submissions' : 'semesters')
  const [reader,setReader]=useState<Note|null>(null);   const mapNote = (n: any) => ({
    id: n.id,
    title: n.title,
    subject: n.subject?.name || '',
    code: n.subject?.code || '',
    author: n.author?.name || n.author?.email || 'Unknown',
    date: new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    pages: n.pages,
    size: n.size,
    tone: n.tone,
    status: n.status,
    fileUrl: n.fileUrl,
    description: n.description || undefined
  })
  
  const mapAlert = (a: any) => ({
    id: a.id,
    kind: 'Department',
    title: a.title,
    body: a.body,
    time: new Date(a.createdAt).toLocaleDateString('en-GB'),
    unread: true
  })

  const [notes, setNotes] = useState<Note[]>(() => (initialNotes && initialNotes.length > 0) ? initialNotes.map(mapNote) : seedNotes)
  const [alerts, setAlerts] = useState<any[]>(() => (initialAnnouncements && initialAnnouncements.length > 0) ? initialAnnouncements.map(mapAlert) : initialAlerts)
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>(() => (initialSubjects && initialSubjects.length > 0) ? initialSubjects : defaultSubjects)

  const [selectedSemester,setSelectedSemester]=useState(1)
  const [query,setQuery]=useState(''); const [showRole,setShowRole]=useState(false)
  const unread=alerts.filter(a=>a.unread).length
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
  const title=screen==='cms'?'Content studio':screen==='submissions'?'Contributor desk':screen==='notifications'?'Notifications':screen==='semesters'?'Semesters':screen==='subject'?'Calculus I':screen==='saved'?'Your notes':'Good morning, Amara'
  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/40 backdrop-blur-xl shadow-sm supports-[backdrop-filter]:bg-white/30 transform-gpu will-change-transform"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
      <button onClick={()=>setScreen(role==='admin'?'cms':role==='senior'?'submissions':'semesters')} className="flex items-center gap-3" aria-label="Luma home"><span className="flex size-9 -rotate-3 items-center justify-center rounded-xl bg-primary text-primary-foreground"><BookOpen size={18}/></span><span className="text-xl font-bold tracking-tight">Luma</span><span className="hidden rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground sm:inline">Computer Engineering</span></button>
      <nav className="hidden items-center gap-1 rounded-full bg-secondary p-1 md:flex" aria-label="Primary">{role==='student'&&<><Nav active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')}>Home</Nav><Nav active={screen==='saved'} onClick={()=>setScreen('saved')}>Saved</Nav></>}{role==='senior'&&<><Nav active={screen==='submissions'} onClick={()=>setScreen('submissions')}>My notes</Nav><Nav active={screen==='semesters'} onClick={()=>setScreen('semesters')}>Library</Nav></>}{role==='admin'&&<><Nav active={screen==='cms'} onClick={()=>setScreen('cms')}>Studio</Nav><Nav active={screen==='semesters'} onClick={()=>setScreen('semesters')}>Library</Nav></>}<Nav active={screen==='notifications'} onClick={()=>setScreen('notifications')}>Notices</Nav></nav>
      <div className="flex items-center gap-2"><button onClick={()=>setScreen('notifications')} className="icon-button relative" aria-label={`${unread} unread notifications`}><Bell size={19}/>{unread>0&&<span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">{unread}</span>}</button><div className="relative"><button onClick={()=>setShowRole(!showRole)} className="flex size-10 items-center justify-center rounded-full bg-mist text-sm font-bold">{user?.avatar || "AK"}</button><AnimatePresence>
          {showRole&&<motion.div initial={{opacity:0, scale:0.95, y:5}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:5}} transition={{duration:0.15}} className="popover right-0 w-64 p-2 origin-top-right"><div className="border-b p-3"><b>{user?.name}</b><p className="text-xs capitalize text-muted-foreground">{role} preview</p></div>{(['student','senior','admin'] as Role[]).map(r=><button key={r} onClick={()=>{signIn(r + '@uet.edu');setShowRole(false)}} className="flex w-full items-center gap-2 rounded-xl p-3 text-sm capitalize hover:bg-secondary">{r===role&&<Check size={15}/>} {r}</button>)}<button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl p-3 text-sm text-muted-foreground hover:bg-secondary"><LogOut size={16}/> Sign out</button></motion.div>}
        </AnimatePresence></div></div>
    </div></header>
    <div className="mx-auto max-w-7xl px-5 py-8 pb-28 md:px-8 md:py-12"><div className="mb-8 flex items-end justify-between"><div><p className="section-kicker">{role==='admin'?'Department CMS':role==='senior'?'Senior contributor':'Your study library'}</p><h1 className="text-balance text-4xl font-semibold tracking-[-.04em] md:text-5xl">{title}</h1></div></div>
      <AnimatePresence mode="wait">
        <motion.div key={screen} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}}>
          {screen==='saved'&&<SavedNotes notes={notes} open={setReader}/>} 
          {screen==='semesters'&&<SemesterLibrary select={(n)=>{setSelectedSemester(n);setScreen('subject')}}/>}
          {screen==='subject'&&<SubjectLibrary semester={selectedSemester} notes={notes} query={query} setQuery={setQuery} open={setReader} onBack={()=>setScreen('semesters')}/>} 
          {screen==='notifications'&&<Notifications alerts={alerts} setAlerts={setAlerts}/>} 
          {screen==='submissions'&&<ContributorDesk notes={notes} subjects={subjectsList} add={(note)=>setNotes([note,...notes])}/>} 
          {screen==='cms'&&<AdminCms notes={notes} subjects={subjectsList} setSubjects={setSubjectsList} publish={(note)=>{setNotes(notes.map(n => n.id === note.id ? {...n, status: 'PUBLISHED'} : n));setAlerts([{id:Date.now(),kind:'New note',title:`${note.subject} notes published`,body:`${note.title} is now available.`,time:'Just now',unread:true},...alerts])}}/>}
        </motion.div>
      </AnimatePresence>
    </div>
    <nav className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-full border bg-card p-1.5 shadow-lg md:hidden"><Mobile active={role==='admin'?screen==='cms':role==='senior'?screen==='submissions':(screen==='semesters'||screen==='subject')} onClick={()=>setScreen(role==='admin'?'cms':role==='senior'?'submissions':'semesters')} icon={<Home/>}>Home</Mobile>{role==='student'?<Mobile active={screen==='saved'} onClick={()=>setScreen('saved')} icon={<Bookmark/>}>Saved</Mobile>:<Mobile active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')} icon={<BookOpen/>}>Library</Mobile>}<Mobile active={screen==='notifications'} onClick={()=>setScreen('notifications')} icon={<Bell/>}>Notices</Mobile></nav>
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


function SavedNotes({notes,open}:{notes:Note[],open:(n:Note)=>void}){
  const [activeFilter, setActiveFilter] = useState('All')
  const [viewMode, setViewMode] = useState<'list'|'grid'>('list')
  const [search, setSearch] = useState('')

  const published = useMemo(() => notes.filter(n => !n.status || n.status === 'PUBLISHED'), [notes])

  const FILTERS = [
    { label: 'All', count: published.length },
    { label: 'Saved', count: Math.min(3, published.length) },
    { label: 'Sem 1', count: published.filter(n => n.subject === 'Calculus I' || n.code?.includes('101') || n.code?.includes('MTH')).length },
    { label: 'Sem 2', count: published.filter(n => n.subject?.includes('II') || n.code?.includes('102')).length },
    { label: 'Calculus I', count: published.filter(n => n.subject === 'Calculus I').length },
  ]

  const filtered = useMemo(() => {
    return published.filter(n => {
      const matchSearch = `${n.title} ${n.subject} ${n.author} ${n.code}`.toLowerCase().includes(search.toLowerCase())
      if (!matchSearch) return false
      if (activeFilter === 'Saved') {
        const idx = published.indexOf(n)
        return idx < 3
      }
      if (activeFilter === 'Sem 1') return n.subject === 'Calculus I' || n.code?.includes('101') || n.code?.includes('MTH')
      if (activeFilter === 'Sem 2') return n.subject?.includes('II') || n.code?.includes('102')
      if (activeFilter === 'Calculus I') return n.subject === 'Calculus I'
      return true
    })
  }, [published, search, activeFilter])

  return (
    <div className="flex flex-col gap-6">
      {/* Search & View Mode row */}
      <div className="flex items-center gap-3">
        <label className="flex-1 flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 text-muted-foreground focus-within:border-primary/40 focus-within:text-foreground transition-colors">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes, subjects, authors..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </label>
        <div className="flex items-center bg-secondary rounded-2xl p-1 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition-colors ${viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter chips scrollable row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map(f => (
          <FilterChip
            key={f.label}
            label={f.label}
            count={f.count}
            active={activeFilter === f.label}
            onClick={() => setActiveFilter(f.label)}
          />
        ))}
      </div>

      {/* Notes listing */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeFilter}-${viewMode}-${search}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <Bookmark className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-foreground">No notes found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((n, i) => (
                <NoteCard key={n.id} note={n} open={() => open(n)} variant="grid" index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((n, i) => (
                <NoteCard key={n.id} note={n} open={() => open(n)} variant="list" index={i} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
function SemesterLibrary({select}:{select:(n:number)=>void}){return <div><Header kicker="Computer Engineering" title="Choose a semester"/><div className="grid gap-4 sm:grid-cols-2">{semesters.map(s=><button key={s.number} onClick={()=>select(s.number)} className={`${s.tone} flex min-h-64 flex-col justify-between rounded-3xl p-7 text-left transition hover:-translate-y-1`}><div className="flex items-start justify-between"><span className="text-sm font-semibold">Semester {s.number}</span><span className="rounded-full bg-background/60 px-3 py-1 text-xs">{s.subjects} subjects</span></div><div><h3 className="text-2xl font-semibold">{s.label}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.items.join(' · ')}</p></div></button>)}</div></div>}
function SubjectLibrary({semester,notes,query,setQuery,open,onBack}:{semester:number,notes:Note[],query:string,setQuery:(s:string)=>void,open:(n:Note)=>void,onBack:()=>void}){const list=useMemo(()=>notes.filter(n=>n.status === 'PUBLISHED' && `${n.title} ${n.author}`.toLowerCase().includes(query.toLowerCase())),[notes,query]);return <div className="grid gap-8 lg:grid-cols-[250px_1fr]"><aside><button className="mb-5 flex items-center gap-2 text-sm" onClick={onBack}><ArrowLeft size={16}/> Semester {semester}</button><div className="flex flex-col gap-2">{['Calculus I','Reading & Communication','Programming Fundamentals','Applied Physics'].map((s,i)=><button key={s} className={`rounded-2xl p-4 text-left text-sm ${i===0?'bg-primary text-primary-foreground':'hover:bg-secondary'}`}>{s}</button>)}</div></aside><section><div className="rounded-3xl bg-sage p-7"><span className="rounded-full bg-background/60 px-3 py-1 text-xs font-bold">MTH 101</span><h2 className="mt-5 text-3xl font-semibold">Calculus I</h2><p className="mt-2 text-muted-foreground">Foundations, worked examples and past questions shared by your seniors.</p></div><label className="mt-6 flex items-center gap-3 rounded-2xl border bg-card px-4"><Search size={18}/><span className="sr-only">Search notes</span><input value={query} onChange={e=>setQuery(e.target.value)} className="h-14 flex-1 bg-transparent outline-none" placeholder="Search these notes..."/></label><div className="mt-4 flex flex-col gap-3">{list.map((n,i)=><NoteRow key={n.id} note={n} index={i} open={()=>open(n)}/>)}</div></section></div>}

function NoteCard({note,open,variant='list',index=0}:{note:Note,open:()=>void,variant?:'list'|'grid',index?:number}){
  if (variant === 'grid') {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06, duration: 0.4 }}>
        <button onClick={open} className="w-full text-left bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:border-primary/30 hover:shadow-sm transition-all duration-200 h-full group">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">{note.subject} › Sem 1</span>
              <h3 className="text-sm font-semibold text-foreground mt-1 line-clamp-2 leading-snug">{note.title}</h3>
            </div>
            <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          </div>
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">{note.date}</span>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="hover:text-foreground transition-colors"><Link className="h-3.5 w-3.5" /></span>
              <span className="hover:text-foreground transition-colors"><Bookmark className="h-3.5 w-3.5" /></span>
              <span className="hover:text-foreground transition-colors"><MoreHorizontal className="h-3.5 w-3.5" /></span>
            </div>
          </div>
        </button>
      </motion.div>
    )
  }
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.4 }}>
      <button onClick={open} className="w-full text-left bg-card border border-border rounded-2xl px-5 py-4 flex items-start gap-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200 group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground shrink-0">{note.subject}</span>
            <span className="text-muted-foreground/40 text-[10px]">›</span>
            <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground truncate">Semester 1</span>
          </div>
          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1">{note.title}</h3>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-muted-foreground">Created {note.date}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Download className="h-3 w-3" /> 142</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <span className="hover:text-foreground transition-colors p-1"><Link className="h-4 w-4" /></span>
          <span className="hover:text-foreground transition-colors p-1"><Bookmark className="h-4 w-4" /></span>
          <span className="hover:text-foreground transition-colors p-1"><MoreHorizontal className="h-4 w-4" /></span>
        </div>
      </button>
    </motion.div>
  )
}

function NoteRow({note,open,index=0}:{note:Note,open:()=>void,index?:number}){
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.article initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:index*0.05, duration:0.4}} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 hover:border-primary/30 transition-all shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${note.tone}`}><FileText size={20}/></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">{note.title}</h3>
            {note.description && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all ${
                  expanded
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                <Sparkle size={12} className="text-primary" />
                <span>{expanded ? 'Hide advice' : 'Senior advice'}</span>
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{note.author} · {note.date} · {note.pages} pages · {note.size}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={open} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95">Read</button>
          <button onClick={()=>downloadNote(note)} className="icon-button border transition-transform hover:scale-105 active:scale-95" aria-label={`Download ${note.title}`}><Download size={18}/></button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && note.description && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-1 rounded-xl bg-sage/40 border border-primary/20 p-3.5 text-sm">
              <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
                <Sparkle size={14} className="text-primary shrink-0" />
                <span>Senior Contributor Advice & Tips</span>
                <span className="text-xs text-muted-foreground font-normal ml-auto">by {note.author}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-5 whitespace-pre-wrap">{note.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
function downloadNote(note:Note){const blob=new Blob([`${note.title}\n${note.subject}\nShared on Luma by ${note.author}`],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${note.title}.txt`;a.click();URL.revokeObjectURL(url)}

function Notifications({alerts,setAlerts}:{alerts:typeof initialAlerts,setAlerts:(a:typeof initialAlerts)=>void}){const [filter,setFilter]=useState<'all'|'unread'>('all');const shown=filter==='all'?alerts:alerts.filter(a=>a.unread);return <section className="max-w-3xl"><div className="mb-6 flex items-center justify-between"><div className="flex rounded-full bg-secondary p-1"><Nav layoutId="notify-nav" active={filter==='all'} onClick={()=>setFilter('all')}>All</Nav><Nav layoutId="notify-nav" active={filter==='unread'} onClick={()=>setFilter('unread')}>Unread</Nav></div><button onClick={()=>setAlerts(alerts.map(a=>({...a,unread:false})))} className="text-sm underline underline-offset-4">Mark all read</button></div><div className="flex flex-col gap-3">
    <AnimatePresence mode="wait">
      <motion.div key={filter} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}} className="flex flex-col gap-3">
        {shown.map(a=><button key={a.id} onClick={()=>setAlerts(alerts.map(x=>x.id===a.id?{...x,unread:false}:x))} className="flex gap-4 rounded-3xl border bg-card p-5 text-left transition hover:shadow-sm hover:border-primary/30"><span className={`mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl ${a.kind==='Department'?'bg-butter':'bg-sage'}`}>{a.kind==='Department'?<Megaphone size={18}/>:<FileText size={18}/>}</span><span className="flex-1"><span className="flex items-center gap-2"><b>{a.title}</b>{a.unread&&<i className="size-2 rounded-full bg-primary"/>}</span><span className="mt-1 block text-sm text-muted-foreground">{a.body}</span><span className="mt-3 block text-xs text-muted-foreground">{a.kind} · {a.time}</span></span></button>)}
      </motion.div>
    </AnimatePresence>
  </div></section>}

function ContributorDesk({add, notes, subjects}:{add:(n:Note)=>void, notes:Note[], subjects:SubjectItem[]}){
  const [open,setOpen]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const lenis = useLenis();
  
  // Bulletproof body & Lenis scroll lock when dialog is open
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
  const [subjectCode, setSubjectCode] = useState('MTH 101');
  const [customName, setCustomName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [seniorAdvice, setSeniorAdvice] = useState('');
  const supabase = createClient();

  const semesterSubjects = useMemo(() => subjects.filter(s => s.semester === selectedSemester), [subjects, selectedSemester]);

  // When semester changes, default to first subject in that semester
  const handleSemesterChange = (sem: number) => {
    setSelectedSemester(sem);
    const subList = subjects.filter(s => s.semester === sem);
    if (subList.length > 0) {
      setSubjectCode(subList[0].code);
      setIsCustomSubject(false);
    } else {
      setIsCustomSubject(true);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    const form = new FormData(e.currentTarget);
    const file = form.get('file') as File;
    const title = String(form.get('title'));
    
    const finalCode = isCustomSubject ? customCode.trim() : subjectCode;
    const matchedSubject = subjects.find(s => s.code === finalCode);
    const finalSubjectName = matchedSubject ? matchedSubject.name : (customName.trim() || finalCode);

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
        title: res.note.title,
        subject: finalSubjectName,
        code: finalCode,
        author: 'You',
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

  const myNotes = notes.filter(n => n.author === 'You' || n.status === 'PENDING' || n.status === 'PUBLISHED');

  return <div className="grid gap-7 lg:grid-cols-[1fr_340px]"><section><div className="rounded-3xl bg-mist p-7"><Upload size={25}/><h2 className="mt-10 text-3xl font-semibold">Share what helped you learn.</h2><p className="mt-2 max-w-xl text-muted-foreground">Every note is reviewed by the department before students can see it.</p><button onClick={()=>setOpen(true)} className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Submit a note</button></div><div className="mt-8"><Header kicker="Your contributions" title="Submission history"/>
  {myNotes.map(x=><div key={x.id} className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border bg-card p-4"><div className="flex items-center gap-4 flex-1 min-w-0"><FileText className="shrink-0 text-muted-foreground"/><div className="flex-1 min-w-0"><b className="block truncate">{x.title}</b><p className="text-sm text-muted-foreground truncate">Submitted {x.date} · {x.subject || x.code}</p></div></div><span className={`bg-secondary rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap w-fit`}>{x.status}</span></div>)}
  </div></section><aside className="rounded-3xl bg-butter p-6 lg:self-start"><h3 className="font-semibold">Before you submit</h3><ul className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground"><li>Select your target semester & subject.</li><li>Add helpful exam tips or study advice.</li><li>Only upload material you can share.</li><li>PDF files, up to 100 MB.</li></ul></aside><AnimatePresence>
      {open&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}} className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-foreground/40 backdrop-blur-sm overscroll-none touch-none" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="submit-title" onClick={() => setSubjectDropdownOpen(false)}>
        <motion.form initial={{scale:0.95, y:15, opacity: 0}} animate={{scale:1, y:0, opacity: 1}} exit={{scale:0.95, y:15, opacity: 0}} transition={{type:"spring", bounce:0.15, duration:0.35}} onSubmit={handleUpload} onClick={(e) => e.stopPropagation()} className="relative flex flex-col w-full max-w-lg rounded-[2rem] bg-card border border-border/80 shadow-2xl max-h-[88vh] overflow-hidden" data-lenis-prevent>
          
          {/* Frosted Sticky Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-5 bg-card/90 backdrop-blur-xl border-b border-border/40">
            <div>
              <p className="section-kicker mb-0.5">New submission</p>
              <h2 id="submit-title" className="text-xl sm:text-2xl font-bold tracking-tight">Upload your note</h2>
            </div>
            <button type="button" onClick={()=>setOpen(false)} className="flex size-9 items-center justify-center rounded-full bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <X size={18}/>
            </button>
          </div>
          
          {/* Body - Inset scroll container so scrollbar never collides with rounded corners */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-5 pb-6 pr-4 mr-2 modal-scroll overscroll-contain" data-lenis-prevent>
            {submitted?<div className="py-16 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-sage text-foreground mb-4">
                <Check size={26} weight="bold"/>
              </div>
              <h3 className="text-xl font-bold">Sent for review</h3>
              <p className="mt-1 text-sm text-muted-foreground">Thank you! Your note will appear in the library once reviewed.</p>
            </div>:<div className="flex flex-col gap-5">
        
        {/* Note Title */}
        <label className="field-label">
          <span>Note Title</span>
          <input name="title" required className="field-input" placeholder="e.g. Complete Lecture Summary & Past Papers"/>
        </label>
        
        {/* Semester selector */}
        <div className="flex flex-col gap-2">
          <label className="field-label mb-0">Target Semester</label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
              const isActive = selectedSemester === sem;
              return (
                <button
                  key={sem}
                  type="button"
                  onClick={() => {
                    handleSemesterChange(sem);
                    setSubjectDropdownOpen(false);
                  }}
                  className={`flex items-center justify-center py-2.5 px-3 text-xs font-semibold rounded-2xl border transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/40'
                  }`}
                >
                  Sem {sem}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject selector (Custom Built-in Dropdown) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="field-label mb-0">Subject</label>
            {semesterSubjects.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsCustomSubject(!isCustomSubject);
                  setSubjectDropdownOpen(false);
                }}
                className="text-xs font-semibold text-primary hover:underline underline-offset-2 transition-colors"
              >
                {isCustomSubject ? 'Choose from list' : '+ Custom subject'}
              </button>
            )}
          </div>

          {isCustomSubject ? (
            <div className="flex flex-col gap-2">
              {semesterSubjects.length === 0 && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/70 p-3.5 border border-border/40">
                  <Info size={18} weight="fill" className="text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-xs leading-relaxed text-foreground">No standard subjects found for Semester {selectedSemester}. Please enter custom details below.</span>
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  required
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="field-input min-w-0"
                  placeholder="Subject Name (e.g. Signal Processing)"
                />
                <input
                  required
                  value={customCode}
                  onChange={e => setCustomCode(e.target.value)}
                  className="field-input uppercase min-w-0"
                  placeholder="Code (e.g. EE 301)"
                />
              </div>
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                className="flex h-12 w-full items-center justify-between rounded-2xl border bg-background px-4 text-sm font-medium outline-none transition-colors hover:border-foreground/40 focus:border-foreground"
              >
                <span className="truncate">
                  {semesterSubjects.find(s => s.code === subjectCode)?.name || 'Choose a subject'} ({subjectCode})
                </span>
                <CaretDown
                  size={16}
                  className={`text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${
                    subjectDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {subjectDropdownOpen && (
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
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Senior Advice / Study Tips */}
        <label className="field-label flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <Sparkle size={14} className="text-primary" />
            Senior Advice & Study Tips (Optional)
          </span>
          <div className="flex h-28 rounded-2xl border bg-background overflow-hidden focus-within:border-foreground transition-colors">
            <textarea
              value={seniorAdvice}
              onChange={e => setSeniorAdvice(e.target.value)}
              className="w-full h-full bg-transparent px-4 py-3 text-sm outline-none resize-none modal-scroll"
              placeholder="e.g. Focus heavily on Chapter 4 formulas for midterms. Past exam solutions included on page 14!"
            />
          </div>
        </label>

        {/* PDF File Upload */}
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
      </div>}
            </div>
          {/* Bottom cushion to lift scrollbar well above the bottom rounded corner */}
          <div className="h-4 w-full bg-card shrink-0 pointer-events-none" />
        </motion.form>
      </motion.div>}
    </AnimatePresence></div>}

function AdminCms({notes,subjects,setSubjects,publish}:{notes:Note[],subjects:SubjectItem[],setSubjects:(s:SubjectItem[])=>void,publish:(n:Note)=>void}){
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
        {pending.map(candidate => <div key={candidate.id} className="grid gap-5 lg:grid-cols-[1fr_340px]"><section className="rounded-3xl border bg-card p-6"><div className="flex flex-col sm:flex-row sm:items-start gap-4"><span className="flex size-12 items-center justify-center rounded-2xl bg-blush shrink-0"><Inbox/></span><div className="flex-1 min-w-0"><span className="rounded-full bg-butter px-3 py-1 text-xs font-semibold">Awaiting review</span><h2 className="mt-3 text-2xl font-semibold">{candidate.title}</h2><p className="mt-1 text-sm text-muted-foreground">{candidate.subject} ({candidate.code}) · {candidate.pages} pages · {candidate.size}</p>
        
        {candidate.description && (
          <div className="mt-4 rounded-2xl bg-sage/30 border border-primary/20 p-3.5 text-sm">
            <b className="flex items-center gap-1.5 text-foreground"><Sparkle size={14} className="text-primary"/> Contributor Advice:</b>
            <p className="mt-1 text-muted-foreground leading-relaxed">{candidate.description}</p>
          </div>
        )}

        <p className="mt-5 leading-relaxed text-muted-foreground"><a href={candidate.fileUrl} target="_blank" className="inline-flex items-center gap-1 text-primary underline underline-offset-2 font-medium">Open uploaded PDF ↗</a></p></div></div><div className="mt-6 rounded-2xl bg-secondary p-4"><b>Submitted by {candidate.author}</b><p className="mt-0.5 text-xs text-muted-foreground">Senior contributor · {candidate.date}</p></div></section><aside className="rounded-3xl bg-sage p-6"><h3 className="text-xl font-semibold">Ready to publish?</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Check the title, subject and document quality before making it visible to all students.</p>{doneId === candidate.id?<div className="mt-8 rounded-2xl bg-background/60 p-5 text-center"><Check className="mx-auto"/><b className="mt-3 block">Published</b></div>:<div className="mt-8 flex flex-col gap-2"><button disabled={loading} onClick={()=>handlePublish(candidate)} className="rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity">Approve & publish</button><button className="rounded-full border border-foreground/20 px-5 py-3 text-sm font-semibold hover:bg-background/40">Request changes</button><button className="px-5 py-2 text-sm text-destructive hover:underline">Reject submission</button></div>}</aside></div>)}
      </div>}

      {/* Published content */}
      {tab==='content'&&<div className="flex flex-col gap-3">{published.length===0?<p className="text-muted-foreground p-8 text-center border rounded-3xl border-dashed">No published notes yet.</p>:published.map((n,i)=><NoteRow key={n.id} note={n} index={i} open={()=>{}}/>)}</div>}

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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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

      {/* Announcements */}
      {tab==='notices'&&<Announcement/>}
    </motion.div>
  </AnimatePresence></div>}

function Announcement(){const [sent,setSent]=useState(false);return <form onSubmit={e=>{e.preventDefault();setSent(true)}} className="max-w-2xl rounded-3xl border bg-card p-6 md:p-8"><Megaphone/><h2 className="mt-5 text-2xl font-semibold">Create an announcement</h2><div className="mt-7 flex flex-col gap-4"><label className="field-label">Title<input required className="field-input" placeholder="What should students know?"/></label><label className="field-label">Audience<select className="field-input"><option>All students</option><option>Semester 1</option><option>Calculus I</option></select></label><label className="field-label">Message<textarea required className="field-input min-h-32 py-3" placeholder="Write a clear, friendly update..."/></label><button className="flex items-center justify-center gap-2 rounded-full bg-primary p-3 font-semibold text-primary-foreground"><Send size={17}/>{sent?'Published':'Publish announcement'}</button></div></form>}

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
