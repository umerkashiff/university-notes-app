import sys

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { motion, AnimatePresence } from 'framer-motion'\n",
    "import { motion, AnimatePresence } from 'framer-motion'\nimport { login, logout } from '@/app/actions/auth'\nimport type { User } from '@prisma/client'\n"
)

# 2. Update StudyCompanion signature
content = content.replace(
    'export function StudyCompanion(){',
    'export function StudyCompanion({ initialUser }: { initialUser: User | null }){'
)

# 3. Update state
content = content.replace(
    "const [role,setRole]=useState<Role|null>(null); const [screen,setScreen]=useState<Screen>('home')",
    "const [user, setUser] = useState<User | null>(initialUser)\n  const role = (user?.role?.toLowerCase() as Role) || null\n  const [screen,setScreen]=useState<Screen>(role === 'admin' ? 'cms' : role === 'senior' ? 'submissions' : 'home')"
)

# 4. Update signIn
content = content.replace(
    "const signIn=(next:Role)=>{setRole(next);setScreen(next==='admin'?'cms':next==='senior'?'submissions':'home')}",
    """const signIn = async (email: string) => {
    const res = await login(email)
    if (res.error) {
      alert(res.error)
    } else if (res.user) {
      setUser(res.user)
      const next = res.user.role.toLowerCase() as Role
      setScreen(next === 'admin' ? 'cms' : next === 'senior' ? 'submissions' : 'home')
    }
  }
  const handleLogout = async () => {
    await logout()
    setUser(null)
  }"""
)

# 5. Fix LogOut
content = content.replace(
    '<button onClick={()=>setRole(null)} className="flex w-full items-center gap-2 rounded-xl p-3 text-sm text-muted-foreground hover:bg-secondary">',
    '<button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl p-3 text-sm text-muted-foreground hover:bg-secondary">'
)

content = content.replace(
    '<b>Amara Kalu</b>',
    '<b>{user?.name}</b>'
)

content = content.replace(
    '<button onClick={()=>setShowRole(!showRole)} className="flex size-10 items-center justify-center rounded-full bg-mist text-sm font-bold">AK</button>',
    '<button onClick={()=>setShowRole(!showRole)} className="flex size-10 items-center justify-center rounded-full bg-mist text-sm font-bold">{user?.avatar || "AK"}</button>'
)

content = content.replace(
    "{(['student','senior','admin'] as Role[]).map(r=><button key={r} onClick={()=>{signIn(r);setShowRole(false)}}",
    "{(['student','senior','admin'] as Role[]).map(r=><button key={r} onClick={()=>{signIn(r + '@uet.edu');setShowRole(false)}}"
)

# 6. Update Login component
content = content.replace(
    "function Login({onLogin}:{onLogin:(r:Role)=>void})",
    "function Login({onLogin}:{onLogin:(email:string)=>void})"
)

content = content.replace(
    "const demoAccounts:{role:Role,label:string,identity:string}[]=[{role:'student',label:'Student demo',identity:'CPE/2025/041'},{role:'senior',label:'Senior demo',identity:'CPE/2023/018'},{role:'admin',label:'Admin demo',identity:'admin@luma.test'}];",
    "const demoAccounts:{role:Role,label:string,identity:string}[]=[{role:'student',label:'Student demo',identity:'student@uet.edu'},{role:'senior',label:'Senior demo',identity:'senior@uet.edu'},{role:'admin',label:'Admin demo',identity:'admin@uet.edu'}];"
)

content = content.replace(
    "<form onSubmit={e=>{e.preventDefault();setError('');onLogin(role)}}",
    "<form onSubmit={e=>{e.preventDefault();setError('');onLogin(identity)}}"
)

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
