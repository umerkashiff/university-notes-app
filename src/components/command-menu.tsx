'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { FileText, Folder, Search } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface CommandMenuProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function CommandMenu({ open, setOpen }: CommandMenuProps) {
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [setOpen])

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl bg-card border-border sm:rounded-xl">
        <Command
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          loop
        >
          <div className="flex items-center border-b border-border px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
              placeholder="Search notes, subjects, or semesters..."
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm text-foreground">No results found.</Command.Empty>
            <Command.Group heading="Semesters" className="text-sm font-medium text-muted-foreground py-2">
              <Command.Item
                onSelect={() => runCommand(() => router.push('/dashboard/semesters/1'))}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-foreground"
              >
                <Folder className="mr-2 h-4 w-4" />
                <span>Semester 1 - Fall</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/dashboard/semesters/2'))}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-foreground"
              >
                <Folder className="mr-2 h-4 w-4" />
                <span>Semester 2 - Spring</span>
              </Command.Item>
            </Command.Group>
            <Command.Group heading="Recent Notes" className="text-sm font-medium text-muted-foreground py-2">
              <Command.Item
                onSelect={() => runCommand(() => router.push('/dashboard/notes/1'))}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-foreground"
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>Operating Systems - Chapter 4 (Deadlocks)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/dashboard/notes/2'))}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-foreground"
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>Data Structures - Trees & Graphs</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
