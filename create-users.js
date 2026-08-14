import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const users = [
  { email: 'student@uet.edu', password: 'Tecreation123!!', role: 'STUDENT', name: 'Student Demo' },
  { email: 'senior@uet.edu', password: 'Tecreation123!!', role: 'SENIOR', name: 'Senior Demo' },
  { email: 'admin@uet.edu', password: 'Tecreation123!!', role: 'ADMIN', name: 'Admin Demo' },
]

async function createUsers() {
  for (const u of users) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
    })
    
    if (error) {
      console.error(`Failed to create ${u.email}:`, error.message)
    } else {
      console.log(`Created ${u.email} with ID: ${data.user.id}`)
    }
  }
}

createUsers()
