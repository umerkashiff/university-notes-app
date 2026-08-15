'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function login(
  credentials: FormData | { email: string; password?: string } | string,
  maybePassword?: string
) {
  let email = ''
  let password = ''

  if (credentials instanceof FormData) {
    email = String(credentials.get('email') || '').trim().toLowerCase()
    password = String(credentials.get('password') || '')
  } else if (typeof credentials === 'object' && credentials !== null) {
    email = String(credentials.email || '').trim().toLowerCase()
    password = String(credentials.password || '')
  } else {
    email = String(credentials || '').trim().toLowerCase()
    password = String(maybePassword || '')
  }

  if (!email) return { error: 'Please enter your email address.' }
  
  if (!email.includes('@') || !email.includes('.')) {
    return { error: 'Please enter a valid email address (e.g. student@uet.edu).' }
  }

  if (!password) return { error: 'Please enter your password.' }

  // 1. Check if the user exists in our Prisma database
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (!existingUser) {
    return { error: 'No account found with this email address. Please check your spelling or sign up below.' }
  }

  // 2. Authenticate with Supabase Auth
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Since existingUser exists in DB, auth failure means incorrect password
    return { error: 'Incorrect password. Please verify your password and try again.' }
  }

  // Fetch the user from our Prisma DB
  let user = await prisma.user.findUnique({ where: { id: data.user.id } }) || existingUser
  if (!user) {
    return { success: true, user: { id: data.user.id, email: data.user.email || email, name: 'Student', role: 'STUDENT', status: 'PENDING', avatar: null, createdAt: new Date() } as any }
  }

  // Administrators always have ACTIVE status
  if (user.role === 'ADMIN' && user.status !== 'ACTIVE') {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { status: 'ACTIVE' }
    })
  }

  return { success: true, user }
}

export async function register(formData: FormData) {
  try {
    const name = String(formData.get('name') || '').trim()
    const email = String(formData.get('email') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')
    const regNumber = String(formData.get('regNumber') || '').trim().toUpperCase()
    const phone = String(formData.get('phone') || '').trim()
    const section = String(formData.get('section') || 'A').trim().toUpperCase()
    const isRepeating = formData.get('isRepeating') === 'true' || formData.get('isRepeating') === 'on'
    const repeatSemester = parseInt(String(formData.get('repeatSemester') || '1'), 10) || 1
    const isContributor = formData.get('isContributor') === 'true' || formData.get('isContributor') === 'on'
    const whyContribute = String(formData.get('whyContribute') || '').trim()
    const rawSemesters = formData.getAll('semestersHaveNotes').map(s => parseInt(String(s), 10)).filter(Boolean)

    if (!name) return { error: 'Full name is required' }
    if (!email) return { error: 'Email address is required' }
    if (!password || password.length < 6) return { error: 'Password must be at least 6 characters' }
    
    // Strict Reg Number Validation: YYYY-CE-XX or YYYY-CE-XXX
    const regRegex = /^\d{4}-CE-\d{2,3}$/
    if (!regRegex.test(regNumber)) {
      return { error: 'Registration number must be formatted as YYYY-CE-XX or YYYY-CE-XXX (e.g. 2024-CE-15 or 2023-CE-102)' }
    }

    if (!phone) return { error: 'Phone number is required' }

    // Parse batch year from registration number
    const batchYear = parseInt(regNumber.split('-')[0], 10)

    // Calculate expected batch semester from active academic calendar
    const activePeriod = await prisma.academicPeriod.findFirst({
      where: { status: 'ACTIVE' },
      include: { batchMaps: true }
    })
    
    let expectedSemester = 1
    if (activePeriod) {
      const mapped = activePeriod.batchMaps.find(b => b.batchYear === batchYear)
      if (mapped) {
        expectedSemester = mapped.semester
      } else {
        expectedSemester = batchYear >= 2026 ? 1 : batchYear === 2025 ? 3 : batchYear === 2024 ? 5 : batchYear === 2023 ? 7 : 8
      }
    } else {
      expectedSemester = batchYear >= 2026 ? 1 : batchYear === 2025 ? 3 : batchYear === 2024 ? 5 : batchYear === 2023 ? 7 : 8
    }

    let finalSemester = expectedSemester
    let isHeldBack = false

    if (isRepeating && repeatSemester < expectedSemester && repeatSemester >= 1) {
      finalSemester = repeatSemester
      isHeldBack = true
    }

    // Check for existing records in PostgreSQL
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { regNumber }
        ]
      }
    })

    if (existing) {
      if (existing.email === email) {
        return { error: 'An account with this email already exists' }
      }
      if (existing.regNumber === regNumber) {
        return { error: 'An account with this registration number already exists' }
      }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          regNumber,
          semester: finalSemester
        }
      }
    })

    if (error) {
      return { error: error.message }
    }

    if (!data.user?.id) {
      return { error: 'Failed to create authentication user. Please try again.' }
    }

    // Create user in Prisma DB with PENDING status
    const newUser = await prisma.user.create({
      data: {
        id: data.user.id,
        email,
        name,
        role: 'STUDENT',
        status: 'PENDING',
        regNumber,
        phone,
        section,
        semester: finalSemester,
        batchYear,
        heldBack: isHeldBack,
      }
    })

    // If requested contributor status, create application
    if (isContributor) {
      const validSemesters = rawSemesters.length > 0 ? rawSemesters : [finalSemester]
      await prisma.contributorRequest.create({
        data: {
          userId: newUser.id,
          whyContribute: whyContribute || 'Interested in sharing academic notes with peers.',
          semestersHaveNotes: validSemesters,
          status: 'PENDING'
        }
      })
    }

    // Create admin notification
    await prisma.announcement.create({
      data: {
        title: 'New Account Application',
        body: `${name} (${regNumber}, Semester ${finalSemester}) registered for ${isContributor ? 'Note Contributor' : 'Student'} access.`,
        audience: 'ADMIN'
      }
    })

    return { success: true, user: newUser }
  } catch (err: any) {
    console.error('Registration error:', err)
    return { error: err.message || 'An unexpected error occurred during sign up.' }
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    
    let dbUser = await prisma.user.findUnique({ 
      where: { id: user.id },
      include: { contributorRequest: true }
    })
    if (!dbUser) {
      return { id: user.id, email: user.email || '', name: 'Student', role: 'STUDENT', status: 'PENDING', avatar: null, createdAt: new Date() } as any
    }
    if (dbUser.role === 'ADMIN' && dbUser.status !== 'ACTIVE') {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { status: 'ACTIVE' },
        include: { contributorRequest: true }
      })
    }
    return dbUser
  } catch (err) {
    console.error('getCurrentUser failed:', (err as Error).message)
    return null
  }
}

