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
  Lock
} from 'lucide-react'

interface SignUpProps {
  onRegister: (formData: FormData) => Promise<string | void>
  onSwitchToLogin: () => void
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-[1.25rem] border bg-card/98 backdrop-blur-xl shadow-2xl overflow-hidden p-1.5"
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
  
  // Contributor details
  const [isContributor, setIsContributor] = useState(false)
  const [whyContribute, setWhyContribute] = useState('')
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([1])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reg number format regex: YYYY-CE-XX or YYYY-CE-XXX
  const regPattern = /^\d{4}-CE-\d{2,3}$/i

  // Live validation
  const isRegValid = regNumber ? regPattern.test(regNumber.trim()) : null
  const parsedBatchYear = useMemo(() => {
    if (!regNumber || regNumber.length < 4) return null
    const yearMatch = regNumber.match(/^(\d{4})/)
    return yearMatch ? parseInt(yearMatch[1], 10) : null
  }, [regNumber])

  const showRegWarning = regNumber.length > 3 && !isRegValid

  // Auto-derived semester from academic calendar and batch year
  const autoDerivedSemester = useMemo(() => {
    if (!parsedBatchYear) return 1
    if (parsedBatchYear >= 2026) return 1
    if (parsedBatchYear === 2025) return 3
    if (parsedBatchYear === 2024) return 5
    if (parsedBatchYear === 2023) return 7
    if (parsedBatchYear <= 2022) return 8
    return Math.max(1, Math.min(8, (2026 - parsedBatchYear) * 2 + 1))
  }, [parsedBatchYear])

  const effectiveSemester = (isRepeating && isRegValid && autoDerivedSemester > 1) ? repeatSemester : autoDerivedSemester

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // Validate registration number format
    if (!regPattern.test(regNumber.trim())) {
      setError('Registration number must follow format YYYY-CE-XX (e.g. 2024-CE-15) or YYYY-CE-XXX.')
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
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <BookOpen size={20}/>
            </span>
            <b className="text-xl tracking-tight">Luma</b>
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
            <div className="flex items-center gap-2 md:hidden">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <BookOpen size={16}/>
              </span>
              <b className="text-base tracking-tight">Luma</b>
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
                  placeholder="student@uet.edu.pk"
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
                  placeholder="Min 6 characters"
                  disabled={loading}
                />
              </label>
            </div>

            {/* Registration Number */}
            <label className="field-label">
              <span>Registration Number</span>
              <div className="relative w-full">
                <input 
                  required 
                  name="regNumber"
                  value={regNumber} 
                  onChange={e => setRegNumber(e.target.value.toUpperCase())} 
                  type="text" 
                  className={`field-input uppercase placeholder:normal-case text-sm ${isRegValid && parsedBatchYear ? 'pr-28' : 'pr-4'} ${
                    showRegWarning ? 'border-amber-500/60 focus:border-amber-500' : isRegValid ? 'border-primary/60' : ''
                  }`}
                  placeholder="YYYY-CE-XX (e.g. 2024-CE-15)"
                  disabled={loading}
                />
                
                {/* Clean inline Batch Pill with Checkmark */}
                {isRegValid && parsedBatchYear && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full text-xs font-bold pointer-events-none"
                  >
                    <CheckCircle2 size={13} className="text-primary" />
                    <span>Batch {parsedBatchYear}</span>
                  </motion.div>
                )}
              </div>

              {/* Temporary warning when typing improperly */}
              <AnimatePresence>
                {showRegWarning && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5 mt-1"
                  >
                    <AlertCircle size={13} className="shrink-0" />
                    <span>Please write format as <b>YEAR-CE-XX</b> (e.g. 2024-CE-15 or 2024-CE-102)</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </label>

            {/* Current Semester (Auto-Assigned) & Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              <div className="field-label">
                <span>Current Semester</span>
                <div className="flex h-11 w-full items-center justify-between rounded-2xl border bg-secondary/40 px-3.5 text-sm select-none border-border/70">
                  {isRegValid && parsedBatchYear ? (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">Semester {effectiveSemester}</span>
                      <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        {isRepeating ? 'Repeating' : `Batch ${parsedBatchYear}`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">Enter registration number</span>
                  )}
                  <Lock size={14} className="text-muted-foreground/60 shrink-0" />
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

            {/* Optional Senior Contributor Application Toggle */}
            <div className="rounded-2xl border bg-card/60 p-4 mt-1 transition-all">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={isContributor}
                  onChange={e => setIsContributor(e.target.checked)}
                  className="mt-1 size-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                  disabled={loading}
                />
                <div>
                  <b className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileUp size={15} className="text-primary" /> Apply as Note Contributor
                  </b>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
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
                    transition={{ duration: 0.2 }}
                    className="mt-3.5 pt-3.5 border-t border-border flex flex-col gap-3"
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
              disabled={loading}
              className="rounded-full bg-primary px-6 py-3.5 sm:py-4 font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-70 shadow-sm cursor-pointer mt-2 w-full"
            >
              {loading ? (
                <>
                  <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                  <span>Submitting application...</span>
                </>
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
