import re

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove import
content = content.replace("import LiquidGlass from 'liquid-glass-react'\n", "")

# Fix main header
main_old = r'''<header className="sticky top-0 z-40 border-b border-white/30 shadow-sm"\><LiquidGlass cornerRadius=\{0\} blurAmount=\{0\.06\} saturation=\{150\} style=\{\{ width: '100%', height: '100%', margin: 0 \}\} className="w-full"\>(.*?)</LiquidGlass\></header\>'''
main_new = r'''<header className="sticky top-0 z-40 border-b border-white/30 bg-white/40 backdrop-blur-xl shadow-sm supports-[backdrop-filter]:bg-white/30 transform-gpu will-change-transform">\1</header>'''
content = re.sub(main_old, main_new, content, flags=re.DOTALL)

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Reverted completely")
