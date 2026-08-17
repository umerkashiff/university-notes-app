'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  FileUp,
  ArrowRight,
  ChevronDown,
  Check,
  Lock,
  Calendar
} from 'lucide-react'
import { SemstackLogo } from '@/components/logo'
import { useIsTouch } from '@/lib/use-touch'
import { MobilePresence } from '@/components/mobile-anim'
import { getSignupAcademicContext } from '@/app/actions/academic'
import { type SignupAcademicContext } from '@/lib/academic'

interface SignUpProps {
  onRegister: (formData: FormData) => Promise<string | void>
  onSwitchToLogin: () => void
}

function formatRegNumber(val: string): string {
  const clean = val.toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (!clean) return ''

  if (clean.length <= 4) {
    return clean
  }

  const year = clean.slice(0, 4)
  const rest = clean.slice(4)

  // Match department letters typed by user (e.g. C, CE)
  const lettersMatch = rest.match(/^([A-Z]+)/)
  if (lettersMatch) {
    const letters = lettersMatch[1].slice(0, 3)
    const remaining = rest.slice(lettersMatch[1].length)
    const rollDigits = remaining.replace(/[^0-9]/g, '').slice(0, 3)

    if (rollDigits) {
      return `${year}-${letters}-${rollDigits}`
    }
    return `${year}-${letters}`
  }

  // If user typed digits directly after year
  const rollDigits = rest.replace(/[^0-9]/g, '').slice(0, 3)
  if (rollDigits) {
    return `${year}-${rollDigits}`
  }

  return year
}

function CustomSelect({
  value,
  onChange,
  options,
  disabled
}: {
  value: string | number
  onChange: (val: any) => void
  options: { value: string | number; label: string }[]
  disabled?: boolean
}) {
  const isTouch = useIsTouch()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const selectedOption = options.find(o => String(o.value) === String(value)) || options[0]

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="field-input flex items-center justify-between text-left text-sm py-2.5 px-3.5 w-full cursor-pointer transition-all bg-card hover:border-primary/50 focus:border-primary"
      >
        <span className="font-medium text-foreground truncate">{selectedOption?.label}</span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-foreground' : ''}`}
        />
      </button>

      {isTouch ? (
        <MobilePresence
          show={open}
          type="dropdown"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-[1.25rem] border bg-card shadow-2xl overflow-hidden p-1.5"
        >
          <div 
            data-lenis-prevent="true"
            className="max-h-44 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-1"
            style={{ overscrollBehavior: 'contain' }}
          >
            {options.map(opt => {
              const isSelected = String(opt.value) === String(value)
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'text-foreground hover:bg-secondary/80 font-medium'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={16} className="shrink-0 text-primary-foreground" />}
                </button>
              )
            })}
          </div>
        </MobilePresence>
      ) : (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-[1.25rem] border bg-card/98 backdrop-blur-xl shadow-2xl overflow-hidden p-1.5 fm-gpu"
            >
              <div 
                data-lenis-prevent="true"
                className="max-h-44 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-1"
                style={{ overscrollBehavior: 'contain' }}
              >
                {options.map(opt => {
                  const isSelected = String(opt.value) === String(value)
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => {
                        onChange(opt.value)
                        setOpen(false)
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                          : 'text-foreground hover:bg-secondary/80 font-medium'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check size={16} className="shrink-0 text-primary-foreground" />}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

export function SignUp({ onRegister, onSwitchToLogin }: SignUpProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [section, setSection] = useState('A')
  const [isRepeating, setIsRepeating] = useState(false)
  const [repeatSemester, setRepeatSemester] = useState<number>(1)
  const [academicContext, setAcademicContext] = useState<SignupAcademicContext | null>(null)
  
  // Contributor details
  const [isContributor, setIsContributor] = useState(false)
  const [whyContribute, setWhyContribute] = useState('')
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([1])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSignupAcademicContext().then(ctx => {
      if (ctx) setAcademicContext(ctx)
    }).catch(() => {})
  }, [])

  // Reg number format regex: YYYY-CE-XX or YYYY-CE-XXX
  const regPattern = /^\d{4}-CE-\d{2,3}$/i

  // Live validation
  const isRegValid = regNumber ? regPattern.test(regNumber.trim()) : null
  const parsedBatchYear = useMemo(() => {
    if (!regNumber || regNumber.length < 4) return null
    const yearMatch = regNumber.match(/^(\d{4})/)
    return yearMatch ? parseInt(yearMatch[1], 10) : null
  }, [regNumber])

  // Batch Year Validity Checks
  const isFutureBatch = parsedBatchYear ? parsedBatchYear > 2026 : false
  const isTooOldBatch = parsedBatchYear ? parsedBatchYear < 2018 : false
  const isInvalidBatchYear = isFutureBatch || isTooOldBatch
  const isAlumni = parsedBatchYear ? (parsedBatchYear <= 2022 && parsedBatchYear >= 2018) : false

  const showRegWarning = regNumber.length > 3 && (!isRegValid || isInvalidBatchYear)

  // Auto-derived semester from active academic calendar batch mappings
  const autoDerivedSemester = useMemo(() => {
    if (!parsedBatchYear || isInvalidBatchYear) return 1
    if (academicContext?.hasActivePeriod && academicContext.batchMaps && academicContext.batchMaps.length > 0) {
      const mapped = academicContext.batchMaps.find(b => b.batchYear === parsedBatchYear)
      if (mapped) return mapped.semester
    }
    return 1
  }, [parsedBatchYear, isInvalidBatchYear, academicContext])

  const effectiveSemester = (isRepeating && isRegValid && !isInvalidBatchYear && autoDerivedSemester > 1) ? repeatSemester : autoDerivedSemester

  const sectionOptions = useMemo(() => [
    { value: 'A', label: 'Section A' },
    { value: 'B', label: 'Section B' },
  ], [])

  const toggleSemester = (sem: number) => {
    if (selectedSemesters.includes(sem)) {
      if (selectedSemesters.length > 1) {
        setSelectedSemesters(selectedSemesters.filter(s => s !== sem))
      }
    } else {
      setSelectedSemesters([...selectedSemesters, sem].sort((a, b) => a - b))
    }
  }

  const handleRegNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value
    if (nextVal.length < regNumber.length) {
      if (regNumber.endsWith('-')) {
        setRegNumber(nextVal.replace(/-$/i, ''))
        return
      }
      setRegNumber(nextVal.toUpperCase())
      return
    }
    setRegNumber(formatRegNumber(nextVal))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // Validate registration number format
    if (!regPattern.test(regNumber.trim())) {
      setError('Registration number must follow format YYYY-CE-XX (e.g. 2024-CE-15) or YYYY-CE-XXX.')
      return
    }

    if (parsedBatchYear && parsedBatchYear > 2026) {
      setError(`Batch ${parsedBatchYear} has not commenced yet. Current freshman session is Batch 2026.`)
      return
    }

    if (parsedBatchYear && parsedBatchYear < 2018) {
      setError('Registration number batch year must be between 2018 and 2026.')
      return
    }

    if (isContributor && !whyContribute.trim()) {
      setError('Please briefly describe why you want to contribute study materials.')
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    // Explicitly set validated uppercase regNumber
    formData.set('regNumber', regNumber.trim().toUpperCase())
    formData.set('semester', String(effectiveSemester))
    formData.set('isRepeating', isRepeating ? 'true' : 'false')
    formData.set('repeatSemester', String(repeatSemester))
    formData.set('section', section)
    formData.set('isContributor', isContributor ? 'true' : 'false')
    
    // Append selected semesters for contributor
    selectedSemesters.forEach(s => {
      formData.append('semestersHaveNotes', String(s))
    })

    try {
      const err = await onRegister(formData)
      if (err) setError(err)
    } catch (err: any) {
      setError(err?.message || 'Failed to submit registration. Please check your information.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell min-h-screen bg-background py-6 sm:py-10 md:py-14 px-3 sm:px-6 md:px-8 flex flex-col justify-center items-center">
      <div className="mx-auto w-full max-w-5xl rounded-3xl sm:rounded-[2.2rem] border bg-card shadow-sm grid md:grid-cols-[0.92fr_1.08fr] overflow-hidden my-auto">
        
        {/* Left Side: Brand Story & Criteria */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-sage p-8 lg:p-12 md:flex min-h-full">
          <div className="flex items-center gap-3">
            <SemstackLogo size={42} className="size-[42px]" />
            <b className="text-xl tracking-tight">Semstack</b>
          </div>

          <div className="max-w-md my-8">
            <h1 className="text-balance text-4xl lg:text-5xl font-semibold leading-[1.08] tracking-[-.04em]">
              Join your department's study collective.
            </h1>
            <p className="mt-4 text-base lg:text-lg leading-relaxed text-muted-foreground">
              Every applicant is verified by department administrators. Once approved, you unlock curated notes tailored to your semester.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl bg-background/70 backdrop-blur-sm p-4 border border-white/40 shadow-xs">
              <div className="flex items-center gap-2.5 font-semibold text-sm text-foreground">
                <CheckCircle2 size={16} className="text-primary shrink-0" />
                <span>Standardized Academic Identity</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 pl-6">
                Registration numbers are matched to your semester cohort and academic batch.
              </p>
            </div>

            <div className="rounded-2xl bg-background/70 backdrop-blur-sm p-4 border border-white/40 shadow-xs">
              <div className="flex items-center gap-2.5 font-semibold text-sm text-foreground">
                <Sparkles size={16} className="text-primary shrink-0" />
                <span>Senior Contributor Pathway</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 pl-6">
                Experienced students can upload notes for semesters they've passed to support juniors.
              </p>
            </div>
          </div>
        </section>

        {/* Right Side: Sign-Up Form */}
        <section className="flex flex-col justify-center p-5 sm:p-8 lg:p-10 w-full">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 md:hidden">
              <SemstackLogo size={34} className="size-[34px]" />
              <b className="text-base tracking-tight">Semstack</b>
            </div>
            <button 
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs font-semibold text-primary hover:underline ml-auto flex items-center gap-1 cursor-pointer py-1"
            >
              <span>Already have an account? Sign in</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <p className="section-kicker">New Student Application</p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-.03em] text-foreground">Create your account</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Fill in your official university details for administrative approval.
          </p>

          {academicContext !== null && !academicContext.hasActivePeriod && (
            <div className="mt-4 rounded-2xl border bg-secondary/50 p-4 text-xs text-foreground flex items-start gap-3">
              <Calendar size={18} className="shrink-0 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Academic Schedule Not Active</p>
                <p className="text-muted-foreground leading-relaxed">
                  The department administrator has not published an active academic schedule yet. Account registration will open once the administrator sets the current academic period in the Calendar Studio.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5 sm:gap-4">
            
            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              <label className="field-label">
                Full Name
                <input 
                  required 
                  name="name"
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  type="text" 
                  className="field-input text-sm" 
                  placeholder="e.g. Umer Kashif"
                  disabled={loading}
                />
              </label>

              <label className="field-label">
                Phone Number
                <input 
                  required 
                  name="phone"
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  type="tel" 
                  className="field-input text-sm" 
                  placeholder="e.g. 03001234567"
                  disabled={loading}
                />
              </label>
            </div>

            {/* Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              <label className="field-label">
                Email Address
                <input 
                  required 
                  name="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  type="email" 
                  className="field-input text-sm" 
                  placeholder="name@gmail.com"
                  disabled={loading}
                />
              </label>

              <label className="field-label">
                Password
                <input 
                  required 
                  name="password"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  type="password" 
                  className="field-input text-sm" 
                  placeholder="Min. 6 characters"
                  disabled={loading}
                />
              </label>
            </div>

            {/* Registration Number */}
            <label className="field-label">
              Registration Number
              <div className="relative">
                <input 
                  required 
                  name="regNumber"
                  value={regNumber} 
                  onChange={handleRegNumberChange} 
                  type="text" 
                  className="field-input text-sm uppercase font-medium tracking-wide" 
                  placeholder="2024-CE-15"
                  disabled={loading}
                  maxLength={12}
                />
                
                {/* Clean inline Batch Pill with Checkmark */}
                {isRegValid && parsedBatchYear && !isInvalidBatchYear && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full text-xs font-bold pointer-events-none"
                  >
                    <CheckCircle2 size={13} className="text-primary" />
                    <span>{isAlumni ? `Alumni (Batch ${parsedBatchYear})` : `Batch ${parsedBatchYear}`}</span>
                  </motion.div>
                )}
              </div>

              {/* Warning when typing improperly or entering invalid year */}
              <AnimatePresence>
                {showRegWarning && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 mt-1.5"
                  >
                    <AlertCircle size={13} className="shrink-0 text-muted-foreground" />
                    <span>
                      {isFutureBatch
                        ? `Batch ${parsedBatchYear} has not commenced yet. Current freshman session is Batch 2026.`
                        : isTooOldBatch
                        ? 'Please enter a valid batch year between 2018 and 2026.'
                        : <>Please write format as <b>YEAR-CE-XX</b> (e.g. 2024-CE-15 or 2024-CE-102)</>}
                    </span>
                  </motion.p>
                )}
              </AnimatePresence>
            </label>

            {/* Current Semester (Auto-Assigned) & Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              <div className="field-label">
                <span>Current Semester</span>
                <div className="flex h-11 w-full items-center justify-between rounded-2xl border bg-secondary/40 px-3.5 text-sm select-none border-border/70">
                  {academicContext !== null && !academicContext.hasActivePeriod ? (
                    <span className="text-muted-foreground text-xs">Awaiting Academic Schedule</span>
                  ) : isRegValid && parsedBatchYear && !isInvalidBatchYear ? (
                    <span className="font-semibold text-foreground truncate">
                      {isAlumni && !isRepeating ? 'Graduated Alumni (Semester 8)' : `Semester ${effectiveSemester}`}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Enter registration number</span>
                  )}
                  <Lock size={14} className="text-muted-foreground/60 shrink-0 ml-2" />
                </div>
              </div>

              <label className="field-label">
                <span>Section</span>
                <CustomSelect
                  value={section}
                  onChange={val => setSection(val)}
                  options={sectionOptions}
                  disabled={loading}
                />
              </label>
            </div>

            {/* Optional Re-take / Held Back Toggle for Senior Batches */}
            {isRegValid && parsedBatchYear && autoDerivedSemester > 1 && (
              <div className="rounded-2xl border bg-card/60 p-3.5 transition-all text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={isRepeating}
                      onChange={e => {
                        setIsRepeating(e.target.checked)
                        if (e.target.checked) setRepeatSemester(Math.max(1, autoDerivedSemester - 1))
                      }}
                      className="size-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                      disabled={loading}
                    />
                    <span className="font-medium text-foreground">
                      I am repeating coursework / held back in a previous semester
                    </span>
                  </div>
                </label>

                <AnimatePresence>
                  {isRepeating && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 pt-3 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <span className="text-muted-foreground text-[11px]">
                        Select repeating semester (verified by administration):
                      </span>
                      <div className="w-full sm:w-44">
                        <CustomSelect
                          value={repeatSemester}
                          onChange={val => setRepeatSemester(parseInt(val, 10))}
                          options={Array.from({ length: autoDerivedSemester - 1 }, (_, i) => ({
                            value: i + 1,
                            label: `Semester ${i + 1}`
                          }))}
                          disabled={loading}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Contributor Opt-In */}
            <div className="rounded-2xl border bg-card/60 p-4 transition-all text-xs">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  name="isContributor"
                  checked={isContributor}
                  onChange={e => setIsContributor(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                  disabled={loading}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">Apply as Note Contributor</span>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">Recommended</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-[11px]">
                    I want permission to upload verified study material, past papers, and lecture notes for junior semesters.
                  </p>
                </div>
              </label>

              <AnimatePresence>
                {isContributor && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-4 pt-4 border-t border-border space-y-3"
                  >
                    <label className="field-label">
                      Which semesters do you have notes for?
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {Array.from({ length: effectiveSemester }, (_, i) => i + 1).map(sem => {
                          const active = selectedSemesters.includes(sem)
                          return (
                            <button
                              type="button"
                              key={sem}
                              onClick={() => toggleSemester(sem)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                active 
                                  ? 'bg-primary text-primary-foreground shadow-2xs' 
                                  : 'bg-secondary text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              Sem {sem}
                            </button>
                          )
                        })}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Note: You can only upload notes for semesters up to your current semester ({effectiveSemester}).
                      </span>
                    </label>

                    <label className="field-label">
                      Why do you want to contribute?
                      <textarea 
                        name="whyContribute"
                        value={whyContribute}
                        onChange={e => setWhyContribute(e.target.value)}
                        placeholder="e.g. I maintain handwritten notes and past exam solutions for CE subjects..."
                        className="field-input text-xs min-h-16 py-2 resize-none"
                        disabled={loading}
                      />
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading || (academicContext !== null && !academicContext.hasActivePeriod)}
              className="rounded-full bg-primary px-6 py-3.5 sm:py-4 font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer mt-2 w-full"
            >
              {loading ? (
                <>
                  <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                  <span>Submitting application...</span>
                </>
              ) : academicContext !== null && !academicContext.hasActivePeriod ? (
                <span>Registration Closed — Awaiting Academic Schedule</span>
              ) : (
                <span>Submit for Department Approval</span>
              )}
            </button>
          </form>
        </section>

      </div>
    </main>
  )
}
