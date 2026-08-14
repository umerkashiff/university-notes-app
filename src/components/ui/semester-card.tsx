/**
 * SemesterCard — Mirello-style pill-shaped category cards
 */
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface SemesterCardProps {
  id: string
  name: string
  noteCount: number
  subjectCount: number
  index?: number
  colorClass?: string
}

const semesterColors = [
  { bg: 'bg-[#DDE8E3]', text: 'text-[#2D5C4A]' },   // soft green
  { bg: 'bg-[#E0D9ED]', text: 'text-[#4A3B6B]' },   // soft purple
  { bg: 'bg-[#DDEAF5]', text: 'text-[#2B4C6B]' },   // soft blue
  { bg: 'bg-[#F5E8DD]', text: 'text-[#6B3F1C]' },   // soft orange
  { bg: 'bg-[#F5DDE0]', text: 'text-[#6B2B2E]' },   // soft red/pink
  { bg: 'bg-[#E8F0DD]', text: 'text-[#3B5C2B]' },   // soft lime
  { bg: 'bg-[#EDE8D9]', text: 'text-[#5C4E2B]' },   // warm tan
  { bg: 'bg-[#D9E8ED]', text: 'text-[#2B4C5C]' },   // muted teal
]

export function SemesterCard({ id, name, noteCount, subjectCount, index = 0 }: SemesterCardProps) {
  const color = semesterColors[index % semesterColors.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/dashboard/semesters/${id}`} className="block group">
        <div className={cn(
          'flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200',
          'hover:shadow-sm hover:scale-[1.01]',
          color.bg
        )}>
          <span className={cn('text-sm font-semibold', color.text)}>{name}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">{subjectCount} subjects</span>
            <span className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-full',
              color.bg === 'bg-[#DDE8E3]' ? 'bg-[#2D5C4A]/10 text-[#2D5C4A]' : '',
              `bg-black/10 ${color.text}`
            )}>
              {noteCount} notes
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
