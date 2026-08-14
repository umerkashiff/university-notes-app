import re

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
old_import_icons = "import { ArrowLeft, ArrowRight, Bell, BookOpen, Check, CaretLeft as ChevronLeft, CaretRight as ChevronRight, DownloadSimple as Download, FileText, FolderOpen, House as Home, Tray as Inbox, SquaresFour as LayoutDashboard, SignOut as LogOut, Megaphone, Minus, Plus, MagnifyingGlass as Search, PaperPlaneRight as Send, Gear as Settings, ShieldCheck, UploadSimple as Upload, User, Users, X, GridFour as LayoutGrid, List, BookmarkSimple as Bookmark, DotsThree as MoreHorizontal, Link } from '@phosphor-icons/react'"
new_import_icons = "import { ArrowLeft, ArrowRight, Bell, BookOpen, Check, CaretLeft as ChevronLeft, CaretRight as ChevronRight, DownloadSimple as Download, FileText, FolderOpen, House as Home, Tray as Inbox, SquaresFour as LayoutDashboard, SignOut as LogOut, Megaphone, Minus, Plus, MagnifyingGlass as Search, PaperPlaneRight as Send, Gear as Settings, ShieldCheck, UploadSimple as Upload, User, Users, X, GridFour as LayoutGrid, List, BookmarkSimple as Bookmark, DotsThree as MoreHorizontal, Link, Sparkle, ChatText, GraduationCap, Trash, PlusCircle } from '@phosphor-icons/react'"
content = content.replace(old_import_icons, new_import_icons)

old_actions_import = "import { createNote, publishNote } from '@/app/actions/notes'"
new_actions_import = "import { createNote, publishNote, createSubject, deleteSubject } from '@/app/actions/notes'"
content = content.replace(old_actions_import, new_actions_import)

# 2. Update types and default subjects
old_type_note = "type Note = { id:string|number; fileUrl?:string; status?:string;  title:string; subject:string; code:string; author:string; date:string; pages:number; size:string; tone:string }"
new_type_note = """type SubjectItem = { id:string; name:string; code:string; semester:number }
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
]"""
content = content.replace(old_type_note, new_type_note)

# 3. Update seedNotes with helpful descriptions
old_seed_notes = """const seedNotes: Note[] = [
  { id:1,title:'Limits, continuity & differentiation',subject:'Calculus I',code:'MTH 101',author:'Chidinma Okafor',date:'10 Aug 2026',pages:24,size:'2.4 MB',tone:'bg-sage' },
  { id:2,title:'Complete lecture summary — weeks 1–6',subject:'Calculus I',code:'MTH 101',author:'David Mensah',date:'8 Aug 2026',pages:38,size:'4.1 MB',tone:'bg-mist' },
  { id:3,title:'Practice questions with solutions',subject:'Calculus I',code:'MTH 101',author:'Zainab Bello',date:'3 Aug 2026',pages:16,size:'1.8 MB',tone:'bg-blush' },
  { id:4,title:'Effective reading strategies',subject:'Reading & Communication',code:'GST 101',author:'Amara Kalu',date:'1 Aug 2026',pages:19,size:'1.2 MB',tone:'bg-butter' },
]"""
new_seed_notes = """const seedNotes: Note[] = [
  { id:1,title:'Limits, continuity & differentiation',subject:'Calculus I',code:'MTH 101',author:'Chidinma Okafor',date:'10 Aug 2026',pages:24,size:'2.4 MB',tone:'bg-sage',description:"💡 Exam Focus: Pay special attention to Chapter 2 on Epsilon-Delta proofs and L'Hôpital's Rule. Past midterm questions are included at the end!" },
  { id:2,title:'Complete lecture summary — weeks 1–6',subject:'Calculus I',code:'MTH 101',author:'David Mensah',date:'8 Aug 2026',pages:38,size:'4.1 MB',tone:'bg-mist',description:"📌 Lecture Summary: Comprehensive notes covering Weeks 1 to 6. Great for quick revision before quiz 2." },
  { id:3,title:'Practice questions with solutions',subject:'Calculus I',code:'MTH 101',author:'Zainab Bello',date:'3 Aug 2026',pages:16,size:'1.8 MB',tone:'bg-blush',description:"📝 Practice Set: Complete step-by-step solutions for Problem Sets 1–4 with margin notes on common pitfalls." },
  { id:4,title:'Effective reading strategies',subject:'Reading & Communication',code:'GST 101',author:'Amara Kalu',date:'1 Aug 2026',pages:19,size:'1.2 MB',tone:'bg-butter',description:"📖 Study Strategy: Critical techniques for speed reading technical documentation and writing structured engineering briefs." },
]"""
content = content.replace(old_seed_notes, new_seed_notes)

# 4. Update mapNote in StudyCompanion to include description
old_map_note = """  const mapNote = (n: any) => ({
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
  })"""

new_map_note = """  const mapNote = (n: any) => ({
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
  })"""
content = content.replace(old_map_note, new_map_note)

# 5. Add subjects state in StudyCompanion
old_alerts_state = "  const [alerts, setAlerts] = useState<any[]>(() => (initialAnnouncements && initialAnnouncements.length > 0) ? initialAnnouncements.map(mapAlert) : initialAlerts)"
new_subjects_state = """  const [alerts, setAlerts] = useState<any[]>(() => (initialAnnouncements && initialAnnouncements.length > 0) ? initialAnnouncements.map(mapAlert) : initialAlerts)
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>(() => (initialSubjects && initialSubjects.length > 0) ? initialSubjects : defaultSubjects)"""
content = content.replace(old_alerts_state, new_subjects_state)

# 6. Pass subjectsList to ContributorDesk and AdminCms
old_render_components = """          {screen==='submissions'&&<ContributorDesk notes={notes} add={(note)=>setNotes([note,...notes])}/>} 
          {screen==='cms'&&<AdminCms notes={notes} publish={(note)=>{setNotes(notes.map(n => n.id === note.id ? {...n, status: 'PUBLISHED'} : n));setAlerts([{id:Date.now(),kind:'New note',title:`${note.subject} notes published`,body:`${note.title} is now available.`,time:'Just now',unread:true},...alerts])}}/>}"""

new_render_components = """          {screen==='submissions'&&<ContributorDesk notes={notes} subjects={subjectsList} add={(note)=>setNotes([note,...notes])}/>} 
          {screen==='cms'&&<AdminCms notes={notes} subjects={subjectsList} setSubjects={setSubjectsList} publish={(note)=>{setNotes(notes.map(n => n.id === note.id ? {...n, status: 'PUBLISHED'} : n));setAlerts([{id:Date.now(),kind:'New note',title:`${note.subject} notes published`,body:`${note.title} is now available.`,time:'Just now',unread:true},...alerts])}}/>}"""
content = content.replace(old_render_components, new_render_components)

# 7. Update NoteRow to support expandable Senior Advice
old_note_row = r'''function NoteRow\(\{note,open,index=0\}:\{note:Note,open:\(\)=>void,index\?:number\}\)\{return <motion\.article .*?</motion\.article>\}'''
new_note_row = '''function NoteRow({note,open,index=0}:{note:Note,open:()=>void,index?:number}){
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
}'''
content = re.sub(old_note_row, new_note_row, content, flags=re.DOTALL)

# 8. Update ContributorDesk to have Semester + Dynamic Subject picker + Senior Advice
new_contributor_desk = '''function ContributorDesk({add, notes, subjects}:{add:(n:Note)=>void, notes:Note[], subjects:SubjectItem[]}){
  const [open,setOpen]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [selectedSemester, setSelectedSemester] = useState(1);
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
    if (!finalCode) { alert('Please choose or enter a subject code'); setUploading(false); return; }

    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage.from('notes').upload(fileName, file);
    if (uploadError) { alert(uploadError.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('notes').getPublicUrl(fileName);
    const fileUrl = urlData.publicUrl;

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
      setTimeout(()=>{setOpen(false);setSubmitted(false)},1500);
    }
    setUploading(false);
  };

  const myNotes = notes.filter(n => n.author === 'You' || n.status === 'PENDING' || n.status === 'PUBLISHED');

  return <div className="grid gap-7 lg:grid-cols-[1fr_340px]"><section><div className="rounded-3xl bg-mist p-7"><Upload size={25}/><h2 className="mt-10 text-3xl font-semibold">Share what helped you learn.</h2><p className="mt-2 max-w-xl text-muted-foreground">Every note is reviewed by the department before students can see it.</p><button onClick={()=>setOpen(true)} className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Submit a note</button></div><div className="mt-8"><Header kicker="Your contributions" title="Submission history"/>
  {myNotes.map(x=><div key={x.id} className="mb-3 flex items-center gap-4 rounded-2xl border bg-card p-4"><FileText/><div className="flex-1"><b>{x.title}</b><p className="text-sm text-muted-foreground">Submitted {x.date} · {x.subject || x.code}</p></div><span className={`bg-secondary rounded-full px-3 py-1 text-xs font-semibold`}>{x.status}</span></div>)}
  </div></section><aside className="rounded-3xl bg-butter p-6 lg:self-start"><h3 className="font-semibold">Before you submit</h3><ul className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground"><li>Select your target semester & subject.</li><li>Add helpful exam tips or study advice.</li><li>Only upload material you can share.</li><li>PDF files, up to 100 MB.</li></ul></aside><AnimatePresence>
      {open&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}} className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="submit-title"><motion.form initial={{scale:0.95, y:20}} animate={{scale:1, y:0}} exit={{scale:0.95, y:20}} transition={{type:"spring", bounce:0.2, duration:0.4}} onSubmit={handleUpload} className="dialog-panel max-w-lg p-7 max-h-[90vh] overflow-y-auto"><div className="flex justify-between"><div><p className="section-kicker">New submission</p><h2 id="submit-title" className="text-2xl sm:text-3xl font-semibold">Upload your note</h2></div><button type="button" onClick={()=>setOpen(false)} className="icon-button"><X/></button></div>{submitted?<div className="py-20 text-center"><Check className="mx-auto"/><h3 className="mt-4 text-xl font-semibold">Sent for review</h3></div>:<div className="mt-6 flex flex-col gap-4">
        
        <label className="field-label">Note Title<input name="title" required className="field-input" placeholder="e.g. Complete Lecture Summary & Past Papers"/></label>
        
        {/* Semester selector */}
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Target Semester</label>
          <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-secondary p-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <button
                key={sem}
                type="button"
                onClick={() => handleSemesterChange(sem)}
                className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  selectedSemester === sem
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sem {sem}
              </button>
            ))}
          </div>
        </div>

        {/* Subject selector */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="field-label">Subject</label>
            <button
              type="button"
              onClick={() => setIsCustomSubject(!isCustomSubject)}
              className="text-xs text-primary underline underline-offset-2"
            >
              {isCustomSubject ? 'Choose from list' : '+ Custom subject'}
            </button>
          </div>
          {isCustomSubject ? (
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="field-input"
                placeholder="Subject Name (e.g. Signal Processing)"
              />
              <input
                required
                value={customCode}
                onChange={e => setCustomCode(e.target.value)}
                className="field-input uppercase"
                placeholder="Code (e.g. EE 301)"
              />
            </div>
          ) : (
            <select
              value={subjectCode}
              onChange={e => setSubjectCode(e.target.value)}
              className="field-input"
            >
              {semesterSubjects.length === 0 && <option value="">No subjects in Sem {selectedSemester} (use Custom)</option>}
              {semesterSubjects.map(s => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Senior Advice / Study Tips */}
        <label className="field-label flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <Sparkle size={14} className="text-primary" />
            Senior Advice & Study Tips (Optional)
          </span>
          <textarea
            value={seniorAdvice}
            onChange={e => setSeniorAdvice(e.target.value)}
            rows={3}
            className="field-input py-2.5 text-sm resize-none"
            placeholder="e.g. Focus heavily on Chapter 4 formulas for midterms. Past exam solutions included on page 14!"
          />
        </label>

        {/* PDF File Upload */}
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-secondary text-sm hover:border-primary/40 transition-colors">
          <Upload size={20} className="text-muted-foreground mb-1" />
          <span className="font-semibold text-foreground">Choose PDF document</span>
          <span className="text-xs text-muted-foreground mt-0.5">Maximum size 20 MB</span>
          <input type="file" name="file" accept="application/pdf" className="sr-only" required />
        </label>

        <button disabled={uploading} className="rounded-full bg-primary p-3.5 font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity mt-2">
          {uploading ? 'Uploading PDF...' : 'Submit note for review'}
        </button>
      </div>}</motion.form></motion.div>}
    </AnimatePresence></div>}'''

content = re.sub(r'function ContributorDesk\(.*?\n(?=function AdminCms)', new_contributor_desk + '\n\n', content, flags=re.DOTALL)

# 9. Update AdminCms to add Curriculum Management
new_admin_cms = '''function AdminCms({notes,subjects,setSubjects,publish}:{notes:Note[],subjects:SubjectItem[],setSubjects:(s:SubjectItem[])=>void,publish:(n:Note)=>void}){
  const [tab,setTab]=useState<'queue'|'content'|'curriculum'|'notices'>('queue');
  const [doneId,setDoneId]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [curriculumSem, setCurriculumSem] = useState(1);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [creatingSub, setCreatingSub] = useState(false);
  const [subMsg, setSubMsg] = useState('');

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
    if (!confirm(`Delete subject ${code}?`)) return;
    const res = await deleteSubject(id);
    if (res.error) {
      alert(res.error);
    } else {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const semSubjects = subjects.filter(s => s.semester === curriculumSem);

  return <div><div className="mb-7 flex gap-1 overflow-x-auto rounded-full bg-secondary p-1 w-fit">
    <Nav layoutId="admin-nav" active={tab==='queue'} onClick={()=>setTab('queue')}>Review queue ({pending.length})</Nav>
    <Nav layoutId="admin-nav" active={tab==='content'} onClick={()=>setTab('content')}>Published ({published.length})</Nav>
    <Nav layoutId="admin-nav" active={tab==='curriculum'} onClick={()=>setTab('curriculum')}>Curriculum & Subjects</Nav>
    <Nav layoutId="admin-nav" active={tab==='notices'} onClick={()=>setTab('notices')}>Announcements</Nav>
  </div>
  <AnimatePresence mode="wait">
    <motion.div key={tab} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}}>
      
      {/* Review queue */}
      {tab==='queue'&&<div className="flex flex-col gap-5">
        {pending.length === 0 && <p className="text-muted-foreground p-8 text-center border rounded-3xl border-dashed bg-card/50">No notes currently pending review. Submissions from seniors will appear here.</p>}
        {pending.map(candidate => <div key={candidate.id} className="grid gap-5 lg:grid-cols-[1fr_340px]"><section className="rounded-3xl border bg-card p-6"><div className="flex items-start gap-4"><span className="flex size-12 items-center justify-center rounded-2xl bg-blush shrink-0"><Inbox/></span><div className="flex-1"><span className="rounded-full bg-butter px-3 py-1 text-xs font-semibold">Awaiting review</span><h2 className="mt-3 text-2xl font-semibold">{candidate.title}</h2><p className="mt-1 text-sm text-muted-foreground">{candidate.subject} ({candidate.code}) · {candidate.pages} pages · {candidate.size}</p>
        
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
            <button
              key={sem}
              onClick={() => setCurriculumSem(sem)}
              className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
                curriculumSem === sem
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              Semester {sem}
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
  </AnimatePresence></div>}'''

content = re.sub(r'function AdminCms\(.*?\n(?=function Announcement)', new_admin_cms + '\n\n', content, flags=re.DOTALL)

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied full curriculum & senior advice feature successfully")
