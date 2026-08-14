import re

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if "import LiquidGlass" not in content:
    content = content.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';\nimport LiquidGlass from 'liquid-glass-react';")

# 2. Main Header
header1_old = r'<header className="sticky top-0 z-40 border-b border-white/30 bg-white/40 backdrop-blur-xl shadow-sm supports-\[backdrop-filter\]:bg-white/30"\>(.*?)</header\>'
header1_new = r'<LiquidGlass className="sticky top-0 z-40 border-b border-white/30 bg-white/40 shadow-sm" cornerRadius={0} blurAmount={0.05} saturation={150}>\1</LiquidGlass>'
content = re.sub(header1_old, header1_new, content, flags=re.DOTALL)

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
