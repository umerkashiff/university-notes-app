import re

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Screen type
content = content.replace("type Screen = 'semesters' | 'subject' | 'notifications' | 'submissions' | 'cms' | 'saved'", 
                          "type Screen = 'semesters' | 'subject' | 'notifications' | 'submissions' | 'cms' | 'saved' | 'explore'")

# 2. Title
content = content.replace("screen==='saved'?'Saved notes':'Good morning, Amara'",
                          "screen==='saved'?'Saved notes':screen==='explore'?'Explore':'Good morning, Amara'")

# 3. Desktop nav for student
old_student_nav = "{role==='student'&&<><Nav active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')}>Home</Nav><Nav active={screen==='saved'} onClick={()=>setScreen('saved')}>Saved</Nav></>}"
new_student_nav = "{role==='student'&&<><Nav active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')}>Home</Nav><Nav active={screen==='explore'} onClick={()=>setScreen('explore')}>Explore</Nav><Nav active={screen==='saved'} onClick={()=>setScreen('saved')}>Saved</Nav></>}"
content = content.replace(old_student_nav, new_student_nav)

# 4. Mobile nav for student
old_mobile_nav = r"{role==='student'\?<Mobile active=\{screen==='saved'\} onClick=\{\(\)=>setScreen\('saved'\)\} icon=\{<Bookmark/>\}\>Saved</Mobile\>:<Mobile active=\{screen==='semesters'\|\|screen==='subject'\} onClick=\{\(\)=>setScreen\('semesters'\)\} icon=\{<BookOpen/>\}\>Library</Mobile\>}"
new_mobile_nav = r"{role==='student'?<><Mobile active={screen==='explore'} onClick={()=>setScreen('explore')} icon={<FolderOpen/>}>Explore</Mobile><Mobile active={screen==='saved'} onClick={()=>setScreen('saved')} icon={<Bookmark/>}>Saved</Mobile></>:<Mobile active={screen==='semesters'||screen==='subject'} onClick={()=>setScreen('semesters')} icon={<BookOpen/>}>Library</Mobile>}"
content = re.sub(old_mobile_nav, new_mobile_nav, content)

# 5. Replace screen conditional component
content = content.replace("{screen==='saved'&&<SavedNotes notes={notes} open={setReader}/>}",
                          "{screen==='explore'&&<ExploreTab notes={notes} setScreen={setScreen} open={setReader}/>}\n          {screen==='saved'&&<SavedNotes notes={notes} open={setReader}/>}")

# 6. Add ExploreTab component
explore_tab_code = r'''function ExploreTab({notes,setScreen,open}:{notes:Note[],setScreen:(s:Screen)=>void,open:(n:Note)=>void}){return <div className="flex flex-col gap-10"><section className="grid gap-4 md:grid-cols-[1.4fr_.6fr]"><div className="rounded-3xl bg-primary p-7 text-primary-foreground md:p-9"><p className="text-sm opacity-70">Department notice</p><h2 className="mt-3 max-w-lg text-3xl font-semibold">Course registration closes this Friday.</h2><p className="mt-3 max-w-xl leading-relaxed opacity-75">Please confirm your first semester courses before 4:00 pm.</p><button onClick={()=>setScreen('notifications')} className="mt-7 rounded-full bg-background px-5 py-2.5 text-sm font-semibold text-foreground">View announcement</button></div><button onClick={()=>setScreen('semesters')} className="flex min-h-64 flex-col justify-between rounded-3xl bg-butter p-7 text-left transition hover:-translate-y-1"><FolderOpen size={28}/><div><p className="text-sm text-muted-foreground">Notes library</p><h3 className="mt-1 text-2xl font-semibold">Browse by semester</h3></div></button></section><section><Header kicker="Recently published" title="Fresh notes for you"/><div className="grid gap-4 md:grid-cols-3">{notes.filter(n=>n.status==='PUBLISHED').slice(0,3).map(n=><NoteCard key={n.id} note={n} open={()=>open(n)}/>)}</div></section></div>}
'''

content = content.replace("function SavedNotes", explore_tab_code + "function SavedNotes")

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done adding explore tab")
