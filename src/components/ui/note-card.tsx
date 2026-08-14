/**
 * NoteCard — Noota-style note row (list and grid variants)
 */
'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Download, Link2, Bookmark, MoreHorizontal, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

export interface NoteCardData {
  id: string
  title: string
  subject: string
  semester: string
  description?: string
  uploader: string
  createdAt: string
  lastEdited?: string
  downloads?: number
  bookmarked?: boolean
}

interface NoteCardProps {
  note: NoteCardData
  variant?: 'list' | 'grid'
  index?: number
}

export function NoteCard({ note, variant = 'list', index = 0 }: NoteCardProps) {
  if (variant === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link href={`/dashboard/notes/${note.id}`} className="block group">
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:border-primary/30 hover:shadow-sm transition-all duration-200 h-full">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-accent">{note.subject} › {note.semester}</span>
                <h3 className="text-sm font-semibold text-foreground mt-0.5 line-clamp-2 leading-snug">{note.title}</h3>
              </div>
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            </div>
            {note.description && (
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{note.description}</p>
            )}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">{note.createdAt}</span>
              <div className="flex items-center gap-2 text-muted-foreground">
                <button className="hover:text-foreground transition-colors" onClick={e => e.preventDefault()}>
                  <Link2 className="h-3.5 w-3.5" />
                </button>
                <button className="hover:text-foreground transition-colors" onClick={e => e.preventDefault()}>
                  <Bookmark className={cn("h-3.5 w-3.5", note.bookmarked && "fill-secondary text-secondary")} />
                </button>
                <button className="hover:text-foreground transition-colors" onClick={e => e.preventDefault()}>
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    )
  }

  // List variant (default — matches Noota's dense list rows)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/dashboard/notes/${note.id}`} className="block group">
        <div className="bg-card border border-border rounded-2xl px-5 py-4 flex items-start gap-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-accent shrink-0">{note.subject}</span>
              <span className="text-muted-foreground/40 text-xs">›</span>
              <span className="text-xs text-muted-foreground truncate">{note.semester}</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1">{note.title}</h3>
            {note.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{note.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-muted-foreground">Created {note.createdAt}</span>
              {note.lastEdited && (
                <span className="text-xs text-muted-foreground">Last edited {note.lastEdited}</span>
              )}
              {note.downloads !== undefined && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Download className="h-3 w-3" />{note.downloads}
                </span>
              )}
            </div>
          </div>
          {/* Action icons — Noota style */}
          <div className="flex items-center gap-2 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button className="hover:text-foreground transition-colors p-1" onClick={e => e.preventDefault()}>
              <Link2 className="h-4 w-4" />
            </button>
            <button className="hover:text-foreground transition-colors p-1" onClick={e => e.preventDefault()}>
              <Bookmark className={cn("h-4 w-4", note.bookmarked && "fill-secondary text-secondary")} />
            </button>
            <button className="hover:text-foreground transition-colors p-1" onClick={e => e.preventDefault()}>
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
