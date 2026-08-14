import sys

file_path = r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
old_import = "from 'lucide-react'"
new_import = ", LayoutGrid, List, Bookmark, MoreHorizontal, Link2 } from 'lucide-react'\nimport { motion, AnimatePresence } from 'framer-motion'"
content = content.replace(old_import, new_import)

# 2. Add FilterChip inline
filter_chip = '''
function FilterChip({ label, count, active, onClick }: { label:string, count?:number, active?:boolean, onClick?:()=>void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}`}
    >
      {label}
      {count !== undefined && (
        <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold leading-none ${active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground'}`}>
          {count}
        </span>
      )}
    </button>
  )
}
'''
content = content.replace('const initialAlerts = [', filter_chip + '\nconst initialAlerts = [')

# 3. Replace NoteCard with Noota NoteCard
old_notecard = 'function NoteCard({note,open}:{note:Note,open:()=>void}){return <button onClick={open} className={`${note.tone} flex min-h-56 flex-col justify-between rounded-3xl p-6 text-left transition hover:-translate-y-1`}><span className="flex size-11 items-center justify-center rounded-2xl bg-background/60"><FileText size={20}/></span><div><p className="text-xs text-muted-foreground">{note.code} · {note.pages} pages</p><h3 className="mt-2 text-xl font-semibold">{note.title}</h3><p className="mt-3 text-sm text-muted-foreground">By {note.author}</p></div></button>}'

new_notecard = '''
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
              <span className="hover:text-foreground transition-colors"><Link2 className="h-3.5 w-3.5" /></span>
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
          <span className="hover:text-foreground transition-colors p-1"><Link2 className="h-4 w-4" /></span>
          <span className="hover:text-foreground transition-colors p-1"><Bookmark className="h-4 w-4" /></span>
          <span className="hover:text-foreground transition-colors p-1"><MoreHorizontal className="h-4 w-4" /></span>
        </div>
      </button>
    </motion.div>
  )
}
'''
content = content.replace(old_notecard, new_notecard)

# 4. Replace StudentHome
old_studenthome = 'function StudentHome({setScreen,open}:{setScreen:(s:Screen)=>void,open:(n:Note)=>void}){return <div className="flex flex-col gap-10"><section className="grid gap-4 md:grid-cols-[1.4fr_.6fr]"><div className="rounded-3xl bg-primary p-7 text-primary-foreground md:p-9"><p className="text-sm opacity-70">Department notice</p><h2 className="mt-3 max-w-lg text-3xl font-semibold">Course registration closes this Friday.</h2><p className="mt-3 max-w-xl leading-relaxed opacity-75">Please confirm your first semester courses before 4:00 pm.</p><button onClick={()=>setScreen(\'notifications\')} className="mt-7 rounded-full bg-background px-5 py-2.5 text-sm font-semibold text-foreground">View announcement</button></div><button onClick={()=>setScreen(\'semesters\')} className="flex min-h-64 flex-col justify-between rounded-3xl bg-butter p-7 text-left transition hover:-translate-y-1"><FolderOpen size={28}/><div><p className="text-sm text-muted-foreground">Notes library</p><h3 className="mt-1 text-2xl font-semibold">Browse by semester</h3></div></button></section><section><Header kicker="Recently published" title="Fresh notes for you"/><div className="grid gap-4 md:grid-cols-3">{seedNotes.slice(0,3).map(n=><NoteCard key={n.id} note={n} open={()=>open(n)}/>)}</div></section></div>}'

new_studenthome = '''
function StudentHome({setScreen,open}:{setScreen:(s:Screen)=>void,open:(n:Note)=>void}) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [viewMode, setViewMode] = useState<'list'|'grid'>('list')
  const [search, setSearch] = useState('')

  const FILTERS = [
    { label: 'All', count: 44 },
    { label: 'Saved', count: 3 },
    { label: 'Sem 1', count: 12 },
    { label: 'Sem 2', count: 8 },
    { label: 'Calculus I', count: 10 },
  ]
  const filtered = seedNotes.filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.subject.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      {/* Search & Layout Toggle */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="search for your notes..."
          className="w-full bg-card border border-border rounded-full py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground/30 transition-colors"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'text-primary bg-secondary' : 'text-muted-foreground hover:text-foreground'}`}>
            <List className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'text-primary bg-secondary' : 'text-muted-foreground hover:text-foreground'}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5 pb-1 md:mx-0 md:px-0">
        {FILTERS.map(f => (
          <FilterChip key={f.label} label={f.label} count={f.count} active={activeFilter === f.label} onClick={() => setActiveFilter(f.label)} />
        ))}
      </div>

      {/* Pinned Notes */}
      {viewMode === 'list' && !search && activeFilter === 'All' && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Pinned Notes <span className="text-base">📌</span>
          </h2>
          <div className="flex flex-col gap-2">
            {seedNotes.slice(0, 2).map((note, i) => (
              <NoteCard key={note.id} note={note} variant="list" index={i} open={() => open(note)} />
            ))}
          </div>
        </div>
      )}

      {/* All Notes */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          {search ? `Results for "${search}"` : 'All Notes'}
        </h2>
        <AnimatePresence mode="wait">
          <motion.div key={viewMode} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-2'}>
            {filtered.map((note, i) => (
              <NoteCard key={note.id} note={note} variant={viewMode} index={i} open={() => open(note)} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
'''
content = content.replace(old_studenthome, new_studenthome)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated study-companion.tsx successfully.")
