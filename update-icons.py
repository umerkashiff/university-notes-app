import sys

file_path = r'c:\Users\umerk\Downloads\uet ce notes app\src\components\study-companion.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace import
content = content.replace(
    "import { ArrowLeft, Bell, BookOpen, Check, ChevronLeft, ChevronRight, Download, FileText, FolderOpen, Home, Inbox, LayoutDashboard, LogOut, Megaphone, Minus, Plus, Search, Send, Settings, ShieldCheck, Upload, User, Users, X, LayoutGrid, List, Bookmark, MoreHorizontal, Link2 } from 'lucide-react'",
    "import { ArrowLeft, Bell, BookOpen, Check, CaretLeft as ChevronLeft, CaretRight as ChevronRight, DownloadSimple as Download, FileText, FolderOpen, House as Home, Inbox, SquaresFour as LayoutDashboard, SignOut as LogOut, Megaphone, Minus, Plus, MagnifyingGlass as Search, PaperPlaneRight as Send, Gear as Settings, ShieldCheck, UploadSimple as Upload, User, Users, X, GridFour as LayoutGrid, List, BookmarkSimple as Bookmark, DotsThree as MoreHorizontal, Link } from '@phosphor-icons/react'"
)

# Wait, `Link2` in Phosphor is just `Link`. So I should replace `Link2` usage with `Link`.
content = content.replace("<Link2", "<Link")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated icons to phosphor")
