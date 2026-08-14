import re

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Apple Glass Effect
content = content.replace('bg-background/80 backdrop-blur-lg', 'bg-background/60 backdrop-blur-[20px] backdrop-saturate-150')

# 2. Update ContributorDesk Modal Animation
modal_old = r"\{open&&<div className=\"dialog-backdrop\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"submit-title\"\><form onSubmit=\{handleUpload\} className=\"dialog-panel max-w-lg p-7\"\>(.*?)</form\></div\>\}"
modal_new = r"""<AnimatePresence>
      {open&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}} className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="submit-title"><motion.form initial={{scale:0.95, y:20}} animate={{scale:1, y:0}} exit={{scale:0.95, y:20}} transition={{type:"spring", bounce:0.2, duration:0.4}} onSubmit={handleUpload} className="dialog-panel max-w-lg p-7">\1</motion.form></motion.div>}
    </AnimatePresence>"""
content = re.sub(modal_old, modal_new, content, flags=re.DOTALL)

# 3. Update showRole Popover Animation
popover_old = r"\{showRole&&<div className=\"popover right-0 w-64 p-2\"\>(.*?)</div\>\}"
popover_new = r"""<AnimatePresence>
          {showRole&&<motion.div initial={{opacity:0, scale:0.95, y:5}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:5}} transition={{duration:0.15}} className="popover right-0 w-64 p-2 origin-top-right">\1</motion.div>}
        </AnimatePresence>"""
content = re.sub(popover_old, popover_new, content, flags=re.DOTALL)

with open(r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Animations added")
