import re

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Nav component
nav_old = r"function Nav\(\{active,onClick,children\}:\{active:boolean,onClick:\(\)=>void,children:React\.ReactNode\}\)\{return <button onClick=\{onClick\} className=\{`rounded-full px-5 py-2 text-sm \$\{active\?'bg-background font-semibold shadow-sm':'text-muted-foreground'}`\}\>\{children\}</button>\}"
nav_new = """function Nav({active,onClick,children}:{active:boolean,onClick:()=>void,children:React.ReactNode}){return <button onClick={onClick} className={`relative px-5 py-2 text-sm transition-colors rounded-full ${active?'text-foreground font-semibold':'text-muted-foreground hover:text-foreground'}`}>
  {active && <motion.div layoutId="nav-pill" className="absolute inset-0 bg-background shadow-sm rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
  <span className="relative z-10">{children}</span>
</button>}"""
content = re.sub(nav_old, nav_new, content)

# 2. Update FilterChip component
filter_old = r"function FilterChip\(\{ label, count, active, onClick \}: \{ label:string, count\?:number, active\?:boolean, onClick\?:\(\)=>void \}\) \{\s*return \(\s*<button\s*onClick=\{onClick\}\s*className=\{`inline-flex items-center gap-1\.5 px-4 py-1\.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring \$\{active \? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'\}`\}\s*>\s*\{label\}\s*\{count !== undefined && \(\s*<span className=\{`text-\[10px\] rounded-full px-1\.5 py-0\.5 font-bold leading-none \$\{active \? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground'\}`\}>\s*\{count\}\s*</span>\s*\)\}\s*</button>\s*\)\s*\}"
filter_new = """function FilterChip({ label, count, active, onClick }: { label:string, count?:number, active?:boolean, onClick?:()=>void }) {
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
}"""
content = re.sub(filter_old, filter_new, content, flags=re.DOTALL)

# 3. Add staggered animations to list items
# NoteRow already exists, let's wrap it in motion.div
noterow_old = r"function NoteRow\(\{note,open\}:\{note:Note,open:\(\)=>void\}\)\{return <button onClick=\{open\} className=\"group flex items-center justify-between rounded-2xl border bg-card p-5 text-left transition hover:shadow-sm\"\><div className=\"flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6\"\><span className=\{`flex size-12 shrink-0 items-center justify-center rounded-2xl \$\{note\.tone\}`\}\><FileText size=\{20\}/></span\><div\><span className=\"text-xs font-semibold uppercase tracking-wider text-muted-foreground\"\>\{note\.code\} · Semester 1</span\><h3 className=\"mt-1 text-lg font-semibold\"\>\{note\.title\}</h3\><p className=\"mt-1 text-sm text-muted-foreground\"\>\{note\.pages\} pages · \{note\.size\} · By \{note\.author\}</p\></div\></div\><span className=\"flex size-10 items-center justify-center rounded-full bg-secondary opacity-0 transition group-hover:opacity-100\"\><ArrowRight size=\{16\}/></span\></button>\}"
noterow_new = """function NoteRow({note,open,index=0}:{note:Note,open:()=>void,index?:number}){return <motion.button initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:index*0.05, duration:0.4}} onClick={open} className="group flex items-center justify-between rounded-2xl border bg-card p-5 text-left transition hover:shadow-sm hover:border-primary/30"><div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6"><span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${note.tone}`}><FileText size={20}/></span><div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{note.code} · Semester 1</span><h3 className="mt-1 text-lg font-semibold">{note.title}</h3><p className="mt-1 text-sm text-muted-foreground">{note.pages} pages · {note.size} · By {note.author}</p></div></div><span className="flex size-10 items-center justify-center rounded-full bg-secondary opacity-0 transition group-hover:opacity-100 group-hover:bg-primary group-hover:text-primary-foreground"><ArrowRight size={16}/></span></motion.button>}"""
content = re.sub(noterow_old, noterow_new, content)

# Update calls to NoteRow to include index
content = re.sub(r'<NoteRow key=\{n.id\} note=\{n\} open=\{\(\)=>open\(n\)\}/>', r'<NoteRow key={n.id} note={n} index={i} open={()=>open(n)}/>', content)
content = re.sub(r'<NoteRow key=\{n.id\} note=\{n\} open=\{\(\)=>\{\}\}/>', r'<NoteRow key={n.id} note={n} index={i} open={()=>{}}/>', content)
content = re.sub(r'list.map\(n=><NoteRow', r'list.map((n,i)=><NoteRow', content)
content = re.sub(r'filtered.slice\(0, 2\).map\(n=><NoteRow', r'filtered.slice(0, 2).map((n,i)=><NoteRow', content)
content = re.sub(r'published.map\(n=><NoteRow', r'published.map((n,i)=><NoteRow', content)

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
