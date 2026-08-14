'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function login(email: string, password?: string) {
  if (!password) return { error: 'Password is required' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Fetch the user from our Prisma DB to get their role
  const user = await prisma.user.findUnique({ where: { id: data.user.id } })
  if (!user) {
    // Fallback if DB sync failed
    return { success: true, user: { id: data.user.id, email: data.user.email || '', name: 'Student', role: 'STUDENT', avatar: null, createdAt: new Date() } as any }
  }

  return { success: true, user }
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
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) {
      return { id: user.id, email: user.email || '', name: 'Student', role: 'STUDENT', avatar: null, createdAt: new Date() } as any
    }
    return dbUser
  } catch (err) {
    console.error('getCurrentUser failed:', (err as Error).message)
    return null
  }
}
