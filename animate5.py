import re

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if "import LiquidGlass" not in content:
    content = content.replace("import { motion, AnimatePresence } from 'framer-motion'", "import { motion, AnimatePresence } from 'framer-motion'\nimport LiquidGlass from 'liquid-glass-react'")

# Main Header
main_header_old = r'<header className="sticky top-0 z-40 border-b border-white/30 bg-white/40 backdrop-blur-xl shadow-sm supports-\[backdrop-filter\]:bg-white/30 transform-gpu will-change-transform"\>(.*?)</header\>'
main_header_new = r'''<header className="sticky top-0 z-40 border-b border-white/30 shadow-sm"><LiquidGlass cornerRadius={0} blurAmount={0.06} saturation={150} style={{ width: '100%', height: '100%', margin: 0 }} className="w-full">\1</LiquidGlass></header>'''
content = re.sub(main_header_old, main_header_new, content, flags=re.DOTALL)

# PdfReader Header
pdf_header_old = r'<header className="sticky top-0 z-40 border-b border-white/30 bg-white/40 backdrop-blur-xl shadow-sm supports-\[backdrop-filter\]:bg-white/30 transform-gpu will-change-transform"\>(.*?)</header\>'
pdf_header_new = r'''<header className="sticky top-0 z-40 border-b border-white/30 shadow-sm"><LiquidGlass cornerRadius={0} blurAmount={0.06} saturation={150} style={{ width: '100%', height: '100%', margin: 0 }} className="w-full">\1</LiquidGlass></header>'''
content = re.sub(pdf_header_old, pdf_header_new, content, flags=re.DOTALL)

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Re-applied LiquidGlass with wrapper")
