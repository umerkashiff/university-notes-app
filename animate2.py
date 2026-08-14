import re

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Main Screens Animation
screens_old = r"\{screen==='home'&&<StudentHome notes=\{notes\} setScreen=\{setScreen\} open=\{setReader\}/\>\}\s*\{screen==='semesters'&&<SemesterLibrary select=\{\(n\)=>\{setSelectedSemester\(n\);setScreen\('subject'\)\}\}/\>\}\s*\{screen==='subject'&&<SubjectLibrary semester=\{selectedSemester\} notes=\{notes\} query=\{query\} setQuery=\{setQuery\} open=\{setReader\} onBack=\{\(\)=>setScreen\('semesters'\)\}/\>\}\s*\{screen==='notifications'&&<Notifications alerts=\{alerts\} setAlerts=\{setAlerts\}/\>\}\s*\{screen==='submissions'&&<ContributorDesk notes=\{notes\} add=\{\(note\)=>setNotes\(\[note,\.\.\.notes\]\)\}/\>\}\s*\{screen==='cms'&&<AdminCms notes=\{notes\} publish=\{\(note\)=>\{setNotes\(notes\.map\(n => n\.id === note\.id \? \{\.\.\.n, status: 'PUBLISHED'\} : n\)\);setAlerts\(\[\{id:Date\.now\(\),kind:'New note',title:`\$\{note\.subject\} notes published`,body:`\$\{note\.title\} is now available\.`,time:'Just now',unread:true\},\.\.\.alerts\]\)\}\}/\>\}"

screens_new = """<AnimatePresence mode="wait">
        <motion.div key={screen} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}}>
          {screen==='home'&&<StudentHome notes={notes} setScreen={setScreen} open={setReader}/>} 
          {screen==='semesters'&&<SemesterLibrary select={(n)=>{setSelectedSemester(n);setScreen('subject')}}/>}
          {screen==='subject'&&<SubjectLibrary semester={selectedSemester} notes={notes} query={query} setQuery={setQuery} open={setReader} onBack={()=>setScreen('semesters')}/>} 
          {screen==='notifications'&&<Notifications alerts={alerts} setAlerts={setAlerts}/>} 
          {screen==='submissions'&&<ContributorDesk notes={notes} add={(note)=>setNotes([note,...notes])}/>} 
          {screen==='cms'&&<AdminCms notes={notes} publish={(note)=>{setNotes(notes.map(n => n.id === note.id ? {...n, status: 'PUBLISHED'} : n));setAlerts([{id:Date.now(),kind:'New note',title:`${note.subject} notes published`,body:`${note.title} is now available.`,time:'Just now',unread:true},...alerts])}}/>}
        </motion.div>
      </AnimatePresence>"""

content = re.sub(screens_old, screens_new, content, flags=re.DOTALL)

# 2. AdminCms Tabs Animation
admin_tabs_old = r"\{tab==='queue'&&<div className=\"flex flex-col gap-5\"\>\s*\{pending\.length === 0 && <p className=\"text-muted-foreground p-5 text-center border rounded-3xl border-dashed\"\>No notes pending review\.</p\>\}\s*\{pending\.map\(candidate => <div key=\{candidate\.id\} className=\"grid gap-5 lg:grid-cols-\[1fr_340px\]\"\><section className=\"rounded-3xl border bg-card p-6\"\><div className=\"flex items-start gap-4\"\><span className=\"flex size-12 items-center justify-center rounded-2xl bg-blush\"\><Inbox/></span\><div\><span className=\"rounded-full bg-butter px-3 py-1 text-xs font-semibold\"\>Awaiting review</span\><h2 className=\"mt-4 text-2xl font-semibold\"\>\{candidate\.title\}</h2\><p className=\"mt-2 text-sm text-muted-foreground\"\>\{candidate\.subject\} · \{candidate\.pages\} pages</p\><p className=\"mt-5 leading-relaxed text-muted-foreground\"\><a href=\{candidate\.fileUrl\} target=\"_blank\" className=\"text-primary underline\"\>View PDF</a\></p\></div\></div\><div className=\"mt-7 rounded-2xl bg-secondary p-5\"\><b\>Submitted by \{candidate\.author\}</b\><p className=\"mt-1 text-sm text-muted-foreground\"\>Senior contributor</p\></div\></section\><aside className=\"rounded-3xl bg-sage p-6\"\><h3 className=\"text-xl font-semibold\"\>Ready to publish\?</h3\><p className=\"mt-2 text-sm leading-relaxed text-muted-foreground\"\>Check the title, subject and document quality before making it visible\.</p\>\{doneId === candidate\.id\?<div className=\"mt-8 rounded-2xl bg-background/60 p-5 text-center\"\><Check className=\"mx-auto\"/><b className=\"mt-3 block\"\>Published</b\></div\>:<div className=\"mt-8 flex flex-col gap-2\"\><button disabled=\{loading\} onClick=\{\(\)=>handlePublish\(candidate\)\} className=\"rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground\"\>Approve & publish</button\><button className=\"rounded-full border border-foreground/20 px-5 py-3 text-sm font-semibold\"\>Request changes</button\><button className=\"px-5 py-2 text-sm text-destructive\"\>Reject submission</button\></div\>\}</aside\></div\>\)\}\s*</div\>\}\s*\{tab==='content'&&<div className=\"flex flex-col gap-3\"\>\{published\.map\(\(n,i\)=><NoteRow key=\{n\.id\} note=\{n\} index=\{i\} open=\{\(\)=>\{\}\}/\>\)\}</div\>\}\{tab==='notices'&&<Announcement/\>\}"

admin_tabs_new = """<AnimatePresence mode="wait">
    <motion.div key={tab} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}}>
      {tab==='queue'&&<div className="flex flex-col gap-5">
        {pending.length === 0 && <p className="text-muted-foreground p-5 text-center border rounded-3xl border-dashed">No notes pending review.</p>}
        {pending.map(candidate => <div key={candidate.id} className="grid gap-5 lg:grid-cols-[1fr_340px]"><section className="rounded-3xl border bg-card p-6"><div className="flex items-start gap-4"><span className="flex size-12 items-center justify-center rounded-2xl bg-blush"><Inbox/></span><div><span className="rounded-full bg-butter px-3 py-1 text-xs font-semibold">Awaiting review</span><h2 className="mt-4 text-2xl font-semibold">{candidate.title}</h2><p className="mt-2 text-sm text-muted-foreground">{candidate.subject} · {candidate.pages} pages</p><p className="mt-5 leading-relaxed text-muted-foreground"><a href={candidate.fileUrl} target="_blank" className="text-primary underline">View PDF</a></p></div></div><div className="mt-7 rounded-2xl bg-secondary p-5"><b>Submitted by {candidate.author}</b><p className="mt-1 text-sm text-muted-foreground">Senior contributor</p></div></section><aside className="rounded-3xl bg-sage p-6"><h3 className="text-xl font-semibold">Ready to publish?</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Check the title, subject and document quality before making it visible.</p>{doneId === candidate.id?<div className="mt-8 rounded-2xl bg-background/60 p-5 text-center"><Check className="mx-auto"/><b className="mt-3 block">Published</b></div>:<div className="mt-8 flex flex-col gap-2"><button disabled={loading} onClick={()=>handlePublish(candidate)} className="rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Approve & publish</button><button className="rounded-full border border-foreground/20 px-5 py-3 text-sm font-semibold">Request changes</button><button className="px-5 py-2 text-sm text-destructive">Reject submission</button></div>}</aside></div>)}
      </div>}
      {tab==='content'&&<div className="flex flex-col gap-3">{published.map((n,i)=><NoteRow key={n.id} note={n} index={i} open={()=>{}}/>)}</div>}
      {tab==='notices'&&<Announcement/>}
    </motion.div>
  </AnimatePresence>"""

content = re.sub(admin_tabs_old, admin_tabs_new, content, flags=re.DOTALL)

# 3. Notifications Tab Animation
notifications_old = r"<div className=\"flex flex-col gap-3\"\>\{shown\.map\(a=><button key=\{a\.id\} onClick=\{\(\)=>setAlerts\(alerts\.map\(x=>x\.id===a\.id\?\{\.\.\.x,unread:false\}:x\)\)\} className=\"flex gap-4 rounded-3xl border bg-card p-5 text-left\"\><span className=\{`mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl \$\{a\.kind==='Department'\?'bg-butter':'bg-sage'\}`\}\>\{a\.kind==='Department'\?<Megaphone size=\{18\}/\>:<FileText size=\{18\}/\>}</span\><span className=\"flex-1\"\><span className=\"flex items-center gap-2\"\><b\>\{a\.title\}</b\>\{a\.unread&&<i className=\"size-2 rounded-full bg-primary\"/\>}</span\><span className=\"mt-1 block text-sm text-muted-foreground\"\>\{a\.body\}</span\><span className=\"mt-3 block text-xs text-muted-foreground\"\>\{a\.kind\} · \{a\.time\}</span\></span\></button\>\)\}</div\>"
notifications_new = """<div className="flex flex-col gap-3">
    <AnimatePresence mode="wait">
      <motion.div key={filter} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}} className="flex flex-col gap-3">
        {shown.map(a=><button key={a.id} onClick={()=>setAlerts(alerts.map(x=>x.id===a.id?{...x,unread:false}:x))} className="flex gap-4 rounded-3xl border bg-card p-5 text-left transition hover:shadow-sm hover:border-primary/30"><span className={`mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl ${a.kind==='Department'?'bg-butter':'bg-sage'}`}>{a.kind==='Department'?<Megaphone size={18}/>:<FileText size={18}/>}</span><span className="flex-1"><span className="flex items-center gap-2"><b>{a.title}</b>{a.unread&&<i className="size-2 rounded-full bg-primary"/>}</span><span className="mt-1 block text-sm text-muted-foreground">{a.body}</span><span className="mt-3 block text-xs text-muted-foreground">{a.kind} · {a.time}</span></span></button>)}
      </motion.div>
    </AnimatePresence>
  </div>"""

content = re.sub(notifications_old, notifications_new, content, flags=re.DOTALL)

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
