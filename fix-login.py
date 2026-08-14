import re

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Login component
old_login = r"function Login\(\{onLogin\}:\{onLogin:\(email:string\)=>void\}\).*?</main>\}"
new_login = """function Login({onLogin}:{onLogin:(email:string, password:string)=>void}){const [identity,setIdentity]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');return <main className="login-shell min-h-screen bg-background p-5 md:p-8"><div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border bg-card shadow-sm md:grid-cols-[1.05fr_.95fr]">
  <section className="relative hidden flex-col justify-between overflow-hidden bg-sage p-12 md:flex"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><BookOpen size={20}/></span><b className="text-xl">Luma</b></div><div className="max-w-md"><span className="eyebrow"><ShieldCheck size={15}/> Made for your department</span><h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.05] tracking-[-.05em]">Every useful note, in one calm place.</h1><p className="mt-5 text-lg leading-relaxed text-muted-foreground">Browse by semester, read beautifully, and never miss what matters.</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-3xl bg-background/60 p-5"><FileText/><b className="mt-8 block">Shared by seniors</b><p className="text-sm text-muted-foreground">Reviewed before publishing.</p></div><div className="rounded-3xl bg-background/60 p-5"><Bell/><b className="mt-8 block">Department updates</b><p className="text-sm text-muted-foreground">Clear, timely announcements.</p></div></div></section>
  <section className="flex flex-col justify-center p-7 md:p-12"><div className="mb-10 flex items-center gap-3 md:hidden"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><BookOpen size={20}/></span><b className="text-xl">Luma</b></div><p className="section-kicker">Welcome back</p><h2 className="text-4xl font-semibold tracking-[-.04em]">Sign in to Luma</h2><p className="mt-2 text-muted-foreground">Your department's notes and notices await.</p><form onSubmit={e=>{e.preventDefault();setError('');onLogin(identity, password)}} className="mt-8 flex flex-col gap-5"><label className="field-label">Email address<input required value={identity} onChange={e=>setIdentity(e.target.value)} type="email" className="field-input" placeholder="student@uet.edu"/></label><label className="field-label">Password<input required value={password} onChange={e=>setPassword(e.target.value)} type="password" className="field-input" placeholder="••••••••"/></label>{error&&<p className="text-sm text-destructive">{error}</p>}<button className="rounded-full bg-primary px-5 py-3.5 font-semibold text-primary-foreground">Continue</button></form><p className="mt-7 text-center text-sm text-muted-foreground">New student? Your department will issue your account.</p></section>
  </div></main>}"""

content = re.sub(old_login, new_login, content, flags=re.DOTALL)

# Update StudyCompanion signIn
content = content.replace(
    'const signIn = async (email: string) => {',
    'const signIn = async (email: string, password?: string) => {'
)
content = content.replace(
    'const res = await login(email)',
    'const res = await login(email, password)'
)

# Remove the switch demo role buttons
content = re.sub(r'\{\(\[\'student\',\'senior\',\'admin\'\] as Role\[\]\)\.map\(r=><button key=\{r\} onClick=\{.*?\}\{r\}</button>\)\}', '', content)
content = content.replace('<p className="px-3 pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Switch demo role</p>', '')

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
