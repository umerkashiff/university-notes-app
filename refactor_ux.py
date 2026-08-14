import re

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Screen type
content = content.replace("type Screen = 'home' | 'semesters' | 'subject' | 'notifications' | 'submissions' | 'cms'", 
                          "type Screen = 'semesters' | 'subject' | 'notifications' | 'submissions' | 'cms' | 'saved'")

# 2. default useState
content = content.replace("useState<Screen>('home')", "useState<Screen>('semesters')")

# 3. signIn
content = content.replace("setScreen(next === 'admin' ? 'cms' : next === 'senior' ? 'submissions' : 'home')",
                          "setScreen(next === 'admin' ? 'cms' : next === 'senior' ? 'submissions' : 'semesters')")

# 4. Luma logo click
content = content.replace("onClick={()=>setScreen(role==='admin'?'cms':role==='senior'?'submissions':'home')}",
                          "onClick={()=>setScreen(role==='admin'?'cms':role==='senior'?'submissions':'semesters')}")

# 5. Desktop nav for student
old_student_nav = "{role==='student'&&<><Nav active={screen==='home'} onClick={()=>setScreen('home')}>Home</Nav><Nav active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')}>Library</Nav></>}"
new_student_nav = "{role==='student'&&<><Nav active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')}>Home</Nav><Nav active={screen==='saved'} onClick={()=>setScreen('saved')}>Saved</Nav></>}"
content = content.replace(old_student_nav, new_student_nav)

# 6. Title
old_title = "const title=screen==='cms'?'Content studio':screen==='submissions'?'Contributor desk':screen==='notifications'?'Notifications':screen==='semesters'?'Semesters':screen==='subject'?'Calculus I':'Good morning, Amara'"
new_title = "const title=screen==='cms'?'Content studio':screen==='submissions'?'Contributor desk':screen==='notifications'?'Notifications':screen==='semesters'?'Semesters':screen==='subject'?'Calculus I':screen==='saved'?'Saved notes':'Good morning, Amara'"
content = content.replace(old_title, new_title)

# 7. Mobile nav
old_mobile_nav = r'<nav className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-full border bg-card p-1\.5 shadow-lg md:hidden"\>.*?</nav\>'
new_mobile_nav = r'''<nav className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-full border bg-card p-1.5 shadow-lg md:hidden"><Mobile active={role==='admin'?screen==='cms':role==='senior'?screen==='submissions':(screen==='semesters'||screen==='subject')} onClick={()=>setScreen(role==='admin'?'cms':role==='senior'?'submissions':'semesters')} icon={<Home/>}>Home</Mobile>{role==='student'?<Mobile active={screen==='saved'} onClick={()=>setScreen('saved')} icon={<Bookmark/>}>Saved</Mobile>:<Mobile active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')} icon={<BookOpen/>}>Library</Mobile>}<Mobile active={screen==='notifications'} onClick={()=>setScreen('notifications')} icon={<Bell/>}>Notices</Mobile></nav>'''
content = re.sub(old_mobile_nav, new_mobile_nav, content, flags=re.DOTALL)

# 8. Replace screen conditional component
content = content.replace("{screen==='home'&&<StudentHome notes={notes} setScreen={setScreen} open={setReader}/>}",
                          "{screen==='saved'&&<SavedNotes notes={notes} open={setReader}/>}")

# 9. Remove StudentHome and add SavedNotes
# We will use regex to find StudentHome component up to SemesterLibrary
student_home_pattern = r'function StudentHome.*?function SemesterLibrary'
saved_notes_code = r'''function SavedNotes({notes,open}:{notes:Note[],open:(n:Note)=>void}){const saved=notes.filter(n=>n.status==='PUBLISHED').slice(0,3);return <div className="flex flex-col gap-3">{saved.map((n,i)=><NoteRow key={n.id} note={n} index={i} open={()=>open(n)}/>)}{saved.length===0&&<p className="py-20 text-center text-muted-foreground">No saved notes yet.</p>}</div>}
function SemesterLibrary'''

content = re.sub(student_home_pattern, saved_notes_code, content, flags=re.DOTALL)

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done refactoring UX")
