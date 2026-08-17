'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Clock, 
  ShieldAlert, 
  BookOpen, 
  LogOut, 
  CheckCircle2, 
  Mail, 
  Hash, 
  GraduationCap,
  RefreshCw
} from 'lucide-react'
import { SemstackLogo } from '@/components/logo'
import { useIsTouch } from '@/lib/use-touch'

interface PendingScreenProps {
  user: {
    name?: string | null
    email: string
    regNumber?: string | null
    semester?: number
    status?: string
    rejectionReason?: string | null
    role?: string
  }
  onLogout: () => void
}

export function PendingScreen({ user, onLogout }: PendingScreenProps) {
  const isTouch = useIsTouch()
  const isRejected = user.status === 'REJECTED'

  const content = (
    <>
      {/* Semstack Brand Header */}
      <div className="flex items-center gap-2.5 mb-8">
        <SemstackLogo size={36} className="size-9" />
        <b className="text-xl tracking-tight">Semstack</b>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground font-medium">
          Computer Engineering
        </span>
      </div>

      {/* Status Icon */}
      <div className={`relative mb-6 flex size-20 items-center justify-center rounded-3xl ${
        isRejected ? 'bg-destructive/10 text-destructive' : 'bg-sage text-primary'
      }`}>
        {isRejected ? (
          <ShieldAlert size={38} />
        ) : (
          <Clock size={38} className="animate-pulse" />
        )}
      </div>

      {/* Title & Description */}
      <p className="section-kicker">
        {isRejected ? 'Application Status' : 'Administrative Review'}
      </p>
      <h2 className="text-3xl font-semibold tracking-[-.03em] text-foreground mt-1">
        {isRejected ? 'Application Not Approved' : 'Account Under Review'}
      </h2>
      
      <p className="text-muted-foreground text-sm leading-relaxed mt-3 max-w-md">
        {isRejected ? (
          user.rejectionReason || 'Your application could not be verified by department administrators. Please contact the department coordinator.'
        ) : (
          `Hello ${user.name ? user.name.split(' ')[0] : 'there'}, your registration details have been submitted. An administrator will review your credentials shortly to activate your semester library.`
        )}
      </p>

      {/* User Application Summary Card */}
      <div className="w-full rounded-2xl bg-secondary/50 border p-4 my-6 text-left text-xs space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5"><Mail size={13} /> Email:</span>
          <b className="text-foreground font-medium">{user.email}</b>
        </div>
        {user.regNumber && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5"><Hash size={13} /> Registration No:</span>
            <b className="text-foreground font-medium font-mono">{user.regNumber}</b>
          </div>
        )}
        {user.semester && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5"><GraduationCap size={13} /> Cohort:</span>
            <b className="text-foreground font-medium">Semester {user.semester}</b>
          </div>
        )}
        <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/60">
          <span>Status:</span>
          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
            isRejected ? 'bg-destructive/15 text-destructive' : 'bg-primary/15 text-primary'
          }`}>
            {user.status || 'PENDING'}
          </span>
        </div>

        {!isRejected && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-2.5 text-[11px] text-muted-foreground flex items-start gap-2 mt-2">
            <Mail size={14} className="text-primary shrink-0 mt-0.5" />
            <span>
              A confirmation email was sent to <b className="text-foreground">{user.email}</b>. You will receive an email once your account is verified.
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        <button
          onClick={() => window.location.reload()}
          className="w-full rounded-full bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold py-3 px-5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw size={15} /> Check Status
        </button>
        
        <button
          onClick={onLogout}
          className="w-full rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10 text-sm font-semibold py-3 px-5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </>
  )

  return (
    <main className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6 md:px-8 flex flex-col justify-center items-center">
      {isTouch ? (
        <div className="w-full max-w-xl rounded-3xl sm:rounded-[2.5rem] border bg-card p-6 sm:p-8 md:p-10 shadow-sm text-center flex flex-col items-center my-auto m-panel-enter">
          {content}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-xl rounded-3xl sm:rounded-[2.5rem] border bg-card p-6 sm:p-8 md:p-10 shadow-sm text-center flex flex-col items-center my-auto fm-gpu"
        >
          {content}
        </motion.div>
      )}
    </main>
  )
}

