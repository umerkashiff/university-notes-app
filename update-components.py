import re

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update signature
content = content.replace(
    'export function StudyCompanion({ initialUser }: { initialUser: User | null }){',
    'export function StudyCompanion({ initialUser, initialNotes = [], initialAnnouncements = [], initialSubjects = [] }: { initialUser: User | null, initialNotes?: any[], initialAnnouncements?: any[], initialSubjects?: any[] }){'
)

# 2. Add mapping logic and update state
mapping_logic = """  const mapNote = (n: any) => ({
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
    fileUrl: n.fileUrl
  })
  
  const mapAlert = (a: any) => ({
    id: a.id,
    kind: 'Department',
    title: a.title,
    body: a.body,
    time: new Date(a.createdAt).toLocaleDateString('en-GB'),
    unread: true
  })

  const [notes, setNotes] = useState(() => initialNotes.map(mapNote))
  const [alerts, setAlerts] = useState(() => initialAnnouncements.map(mapAlert))
"""
content = content.replace(
    "const [notes,setNotes]=useState(seedNotes)\n  const [alerts,setAlerts]=useState(initialAlerts); const [selectedSemester,setSelectedSemester]=useState(1)",
    mapping_logic + "\n  const [selectedSemester,setSelectedSemester]=useState(1)"
)

# 3. Add client for storage
content = content.replace(
    "import type { User } from '@prisma/client'",
    "import type { User } from '@prisma/client'\nimport { createClient } from '@/utils/supabase/client'\nimport { createNote, publishNote } from '@/app/actions/notes'"
)

# 4. Refactor ContributorDesk to handle real file uploads
contributor_old = r"function ContributorDesk\(\{add\}:\{add:\(n:Note\)=>void\}\).*?\}</div>\}"
contributor_new = """function ContributorDesk({add, notes}:{add:(n:Note)=>void, notes:Note[]}){
  const [open,setOpen]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [uploading,setUploading]=useState(false);
  const supabase = createClient();

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    const form = new FormData(e.currentTarget);
    const file = form.get('file') as File;
    const title = String(form.get('title'));
    const code = String(form.get('code'));
    
    if (!file || file.size === 0) { alert('Please select a PDF'); setUploading(false); return; }

    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage.from('notes').upload(fileName, file);
    if (uploadError) { alert(uploadError.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('notes').getPublicUrl(fileName);
    const fileUrl = urlData.publicUrl;

    const res = await createNote({
      title,
      subjectCode: code,
      fileUrl,
      pages: 10,
      size: (file.size / (1024*1024)).toFixed(1) + ' MB'
    });

    if (res.error) {
      alert(res.error);
    } else if (res.note) {
      add({
        id: res.note.id, title: res.note.title, subject: code, code,
        author: 'You', date: 'Just now', pages: res.note.pages, size: res.note.size, tone: res.note.tone, status: res.note.status, fileUrl
      });
      setSubmitted(true);
      setTimeout(()=>{setOpen(false);setSubmitted(false)},1500);
    }
    setUploading(false);
  };

  const myNotes = notes.filter(n => n.author === 'You' || n.status === 'PENDING' || n.status === 'PUBLISHED');

  return <div className="grid gap-7 lg:grid-cols-[1fr_340px]"><section><div className="rounded-3xl bg-mist p-7"><Upload size={25}/><h2 className="mt-10 text-3xl font-semibold">Share what helped you learn.</h2><p className="mt-2 max-w-xl text-muted-foreground">Every note is reviewed by the department before students can see it.</p><button onClick={()=>setOpen(true)} className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Submit a note</button></div><div className="mt-8"><Header kicker="Your contributions" title="Submission history"/>
  {myNotes.map(x=><div key={x.id} className="mb-3 flex items-center gap-4 rounded-2xl border bg-card p-4"><FileText/><div className="flex-1"><b>{x.title}</b><p className="text-sm text-muted-foreground">Submitted {x.date}</p></div><span className={`bg-secondary rounded-full px-3 py-1 text-xs font-semibold`}>{x.status}</span></div>)}
  </div></section><aside className="rounded-3xl bg-butter p-6 lg:self-start"><h3 className="font-semibold">Before you submit</h3><ul className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground"><li>Use a clear, searchable title.</li><li>Remove personal phone numbers.</li><li>Only upload material you can share.</li><li>PDF files, up to 100 MB.</li></ul></aside>{open&&<div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="submit-title"><form onSubmit={handleUpload} className="dialog-panel max-w-lg p-7"><div className="flex justify-between"><div><p className="section-kicker">New submission</p><h2 id="submit-title" className="text-3xl font-semibold">Upload your note</h2></div><button type="button" onClick={()=>setOpen(false)} className="icon-button"><X/></button></div>{submitted?<div className="py-20 text-center"><Check className="mx-auto"/><h3 className="mt-4 text-xl font-semibold">Sent for review</h3></div>:<div className="mt-7 flex flex-col gap-4"><label className="field-label">Title<input name="title" required className="field-input" placeholder="e.g. Limits and continuity"/></label><label className="field-label">Subject Code<select name="code" className="field-input"><option value="MTH 101">Calculus I (MTH 101)</option><option value="GST 101">Reading & Communication (GST 101)</option></select></label><label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-secondary text-sm"><Upload/><span className="mt-2">Choose PDF file</span><input type="file" name="file" accept="application/pdf" className="sr-only"/></label><button disabled={uploading} className="rounded-full bg-primary p-3 font-semibold text-primary-foreground">{uploading ? 'Uploading...' : 'Submit for review'}</button></div>}</form></div>}</div>}
"""
content = re.sub(contributor_old, contributor_new, content, flags=re.DOTALL)

# 5. Update AdminCms to use real notes
admin_old = r"function AdminCms\(\{notes,publish\}:\{notes:Note\[\],publish:\(n:Note\)=>void\}\).*?\}</div>\}"
admin_new = """function AdminCms({notes,publish}:{notes:Note[],publish:(n:Note)=>void}){const [tab,setTab]=useState<'queue'|'content'|'notices'>('queue');const [doneId,setDoneId]=useState<any>(null);const [loading,setLoading]=useState(false);
  const pending = notes.filter(n => n.status === 'PENDING');
  const published = notes.filter(n => n.status === 'PUBLISHED');

  const handlePublish = async (n: Note) => {
    setLoading(true);
    const res = await publishNote(n.id as string);
    if(res.error) alert(res.error);
    else { publish(n); setDoneId(n.id); setTimeout(() => setDoneId(null), 2000); }
    setLoading(false);
  }

  return <div><div className="mb-7 flex gap-2 overflow-x-auto"><Nav active={tab==='queue'} onClick={()=>setTab('queue')}>Review queue</Nav><Nav active={tab==='content'} onClick={()=>setTab('content')}>Published notes</Nav><Nav active={tab==='notices'} onClick={()=>setTab('notices')}>Announcements</Nav></div>
  {tab==='queue'&&<div className="flex flex-col gap-5">
    {pending.length === 0 && <p className="text-muted-foreground p-5 text-center border rounded-3xl border-dashed">No notes pending review.</p>}
    {pending.map(candidate => <div key={candidate.id} className="grid gap-5 lg:grid-cols-[1fr_340px]"><section className="rounded-3xl border bg-card p-6"><div className="flex items-start gap-4"><span className="flex size-12 items-center justify-center rounded-2xl bg-blush"><Inbox/></span><div><span className="rounded-full bg-butter px-3 py-1 text-xs font-semibold">Awaiting review</span><h2 className="mt-4 text-2xl font-semibold">{candidate.title}</h2><p className="mt-2 text-sm text-muted-foreground">{candidate.subject} · {candidate.pages} pages</p><p className="mt-5 leading-relaxed text-muted-foreground"><a href={candidate.fileUrl} target="_blank" className="text-primary underline">View PDF</a></p></div></div><div className="mt-7 rounded-2xl bg-secondary p-5"><b>Submitted by {candidate.author}</b><p className="mt-1 text-sm text-muted-foreground">Senior contributor</p></div></section><aside className="rounded-3xl bg-sage p-6"><h3 className="text-xl font-semibold">Ready to publish?</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Check the title, subject and document quality before making it visible.</p>{doneId === candidate.id?<div className="mt-8 rounded-2xl bg-background/60 p-5 text-center"><Check className="mx-auto"/><b className="mt-3 block">Published</b></div>:<div className="mt-8 flex flex-col gap-2"><button disabled={loading} onClick={()=>handlePublish(candidate)} className="rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Approve & publish</button><button className="rounded-full border border-foreground/20 px-5 py-3 text-sm font-semibold">Request changes</button><button className="px-5 py-2 text-sm text-destructive">Reject submission</button></div>}</aside></div>)}
  </div>}
  {tab==='content'&&<div className="flex flex-col gap-3">{published.map(n=><NoteRow key={n.id} note={n} open={()=>{}}/>)}</div>}{tab==='notices'&&<Announcement/>}</div>}
"""
content = re.sub(admin_old, admin_new, content, flags=re.DOTALL)

# 6. Update the references in StudyCompanion return statement
content = content.replace("{screen==='submissions'&&<ContributorDesk add={(note)=>setNotes([note,...notes])}/>}", "{screen==='submissions'&&<ContributorDesk notes={notes} add={(note)=>setNotes([note,...notes])}/>}")
content = content.replace("publish={(note)=>{setNotes([note,...notes]);", "publish={(note)=>{setNotes(notes.map(n => n.id === note.id ? {...n, status: 'PUBLISHED'} : n));")

# 7. Update StudentHome and SubjectLibrary to only show published notes
content = content.replace("const filtered = seedNotes.filter(n => !search", "const filtered = notes.filter(n => n.status === 'PUBLISHED' && (!search")
content = content.replace("{seedNotes.slice(0, 2).map(", "{notes.filter(n => n.status === 'PUBLISHED').slice(0, 2).map(")
content = content.replace("function StudentHome({setScreen,open}:{setScreen:(s:Screen)=>void,open:(n:Note)=>void}) {", "function StudentHome({notes,setScreen,open}:{notes:Note[],setScreen:(s:Screen)=>void,open:(n:Note)=>void}) {")
content = content.replace("{screen==='home'&&<StudentHome setScreen={setScreen} open={setReader}/>}", "{screen==='home'&&<StudentHome notes={notes} setScreen={setScreen} open={setReader}/>}")
content = content.replace("const list=useMemo(()=>notes.filter(n=>`${n.title} ${n.author}`.toLowerCase().includes(query.toLowerCase())),[notes,query])", "const list=useMemo(()=>notes.filter(n=>n.status === 'PUBLISHED' && `${n.title} ${n.author}`.toLowerCase().includes(query.toLowerCase())),[notes,query])")

# 8. Note Type modification
content = content.replace("type Note = { id:number;", "type Note = { id:string|number; fileUrl?:string; status?:string; ")


with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
