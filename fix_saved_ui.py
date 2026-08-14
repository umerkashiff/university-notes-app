import re

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Screen type
content = re.sub(r"type Screen = .*?\n", "type Screen = 'semesters' | 'subject' | 'notifications' | 'submissions' | 'cms' | 'saved'\n", content)

# 2. Update title
content = content.replace("screen==='saved'?'Saved notes':screen==='explore'?'Explore':'Good morning, Amara'",
                          "screen==='saved'?'Your notes':'Good morning, Amara'")
content = content.replace("screen==='saved'?'Saved notes':'Good morning, Amara'",
                          "screen==='saved'?'Your notes':'Good morning, Amara'")

# 3. Desktop nav for student
old_student_nav = "{role==='student'&&<><Nav active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')}>Home</Nav><Nav active={screen==='explore'} onClick={()=>setScreen('explore')}>Explore</Nav><Nav active={screen==='saved'} onClick={()=>setScreen('saved')}>Saved</Nav></>}"
new_student_nav = "{role==='student'&&<><Nav active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')}>Home</Nav><Nav active={screen==='saved'} onClick={()=>setScreen('saved')}>Saved</Nav></>}"
content = content.replace(old_student_nav, new_student_nav)

# Also handle case if explore wasn't there
content = re.sub(r"\{role==='student'&&<><Nav active=\{screen==='semesters'\|\|screen==='subject'\} onClick=\{\(\)=>setScreen\('semesters'\)\}>Home</Nav>.*?<Nav active=\{screen==='saved'\} onClick=\{\(\)=>setScreen\('saved'\)\}>Saved</Nav></>\}",
                 new_student_nav, content)

# 4. Mobile nav for student
new_mobile_nav = r'''<nav className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-full border bg-card p-1.5 shadow-lg md:hidden"><Mobile active={role==='admin'?screen==='cms':role==='senior'?screen==='submissions':(screen==='semesters'||screen==='subject')} onClick={()=>setScreen(role==='admin'?'cms':role==='senior'?'submissions':'semesters')} icon={<Home/>}>Home</Mobile>{role==='student'?<Mobile active={screen==='saved'} onClick={()=>setScreen('saved')} icon={<Bookmark/>}>Saved</Mobile>:<Mobile active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')} icon={<BookOpen/>}>Library</Mobile>}<Mobile active={screen==='notifications'} onClick={()=>setScreen('notifications')} icon={<Bell/>}>Notices</Mobile></nav>'''
content = re.sub(r'<nav className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-full border bg-card p-1\.5 shadow-lg md:hidden"\>.*?</nav\>', new_mobile_nav, content, flags=re.DOTALL)

# 5. Remove ExploreTab in AnimatePresence
content = content.replace("{screen==='explore'&&<ExploreTab notes={notes} setScreen={setScreen} open={setReader}/>}\n          ", "")
content = content.replace("{screen==='explore'&&<ExploreTab notes={notes} setScreen={setScreen} open={setReader}/>}", "")

# 6. Replace ExploreTab and SavedNotes definitions with the comprehensive SavedNotes component
saved_component = r'''function SavedNotes({notes,open}:{notes:Note[],open:(n:Note)=>void}){
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
}'''

# Replace from function ExploreTab / function SavedNotes to function SemesterLibrary
content = re.sub(r'(function ExploreTab.*?)?function SavedNotes.*?(?=function SemesterLibrary)', saved_component + '\n', content, flags=re.DOTALL)

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Saved UI fixed successfully")
