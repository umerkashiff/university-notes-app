import re

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove import
content = content.replace("import LiquidGlass from 'liquid-glass-react'\n", "")

# Fix main header closing tag
content = content.replace("</LiquidGlass>", "</header>", 1) # Only first one

# Fix PdfReader header opening
pdf_old = r'<LiquidGlass className="sticky top-0 z-40 border-b border-white/30 bg-white/40 shadow-sm" cornerRadius=\{0\} blurAmount=\{0\.05\} saturation=\{150\}\>'
pdf_new = r'<header className="sticky top-0 z-40 border-b border-white/30 bg-white/40 backdrop-blur-xl shadow-sm supports-[backdrop-filter]:bg-white/30 transform-gpu will-change-transform">'
content = re.sub(pdf_old, pdf_new, content)

# Fix PdfReader header closing tag
content = content.replace("</LiquidGlass>", "</header>")

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Reverted LiquidGlass")
