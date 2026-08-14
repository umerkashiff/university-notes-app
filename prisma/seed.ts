import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // 1. Create mock users for auth
  const student = await prisma.user.upsert({
    where: { email: 'student@uet.edu' },
    update: {},
    create: {
      id: '6cfa35a7-2b30-466f-bc93-f5f0a45cbe7d',
      email: 'student@uet.edu',
      name: 'Amara Kalu',
      role: 'STUDENT',
      avatar: 'AK',
    },
  })

  const senior = await prisma.user.upsert({
    where: { email: 'senior@uet.edu' },
    update: {},
    create: {
      id: '6196219b-ed0c-4608-a6da-dd34f8e41364',
      email: 'senior@uet.edu',
      name: 'David Mensah',
      role: 'SENIOR',
      avatar: 'DM',
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@uet.edu' },
    update: {},
    create: {
      id: 'bf1a74bd-ed6f-4644-a872-4310bb0b107d',
      email: 'admin@uet.edu',
      name: 'Admin',
      role: 'ADMIN',
      avatar: 'AD',
    },
  })

  // 2. Create Subjects
  const calc1 = await prisma.subject.upsert({
    where: { code: 'MTH 101' },
    update: {},
    create: {
      name: 'Calculus I',
      code: 'MTH 101',
      semester: 1,
    },
  })

  const reading = await prisma.subject.upsert({
    where: { code: 'GST 101' },
    update: {},
    create: {
      name: 'Reading & Communication',
      code: 'GST 101',
      semester: 1,
    },
  })

  // 3. Create Notes
  await prisma.note.create({
    data: {
      title: 'Limits, continuity & differentiation',
      description: 'A structured summary of vectors, projectile motion and worked examples.',
      fileUrl: '/dummy.pdf',
      pages: 24,
      size: '2.4 MB',
      tone: 'bg-sage',
      status: 'PUBLISHED',
      downloads: 142,
      authorId: senior.id,
      subjectId: calc1.id,
    }
  })

  await prisma.note.create({
    data: {
      title: 'Complete lecture summary — weeks 1–6',
      description: 'Comprehensive notes covering all topics taught before midterms.',
      fileUrl: '/dummy.pdf',
      pages: 38,
      size: '4.1 MB',
      tone: 'bg-mist',
      status: 'PUBLISHED',
      downloads: 89,
      authorId: senior.id,
      subjectId: calc1.id,
    }
  })

  await prisma.note.create({
    data: {
      title: 'Practice questions with solutions',
      description: 'Past papers and solutions for the last 5 years.',
      fileUrl: '/dummy.pdf',
      pages: 16,
      size: '1.8 MB',
      tone: 'bg-blush',
      status: 'PUBLISHED',
      downloads: 50,
      authorId: student.id,
      subjectId: calc1.id,
    }
  })

  await prisma.note.create({
    data: {
      title: 'Effective reading strategies',
      description: 'How to tackle long engineering reading assignments.',
      fileUrl: '/dummy.pdf',
      pages: 19,
      size: '1.2 MB',
      tone: 'bg-butter',
      status: 'PUBLISHED',
      downloads: 200,
      authorId: senior.id,
      subjectId: reading.id,
    }
  })

  // 4. Create announcements
  await prisma.announcement.create({
    data: {
      title: 'First semester course registration',
      body: 'Course registration closes Friday at 4:00 pm.',
      audience: 'ALL',
    }
  })
  
  await prisma.announcement.create({
    data: {
      title: 'Lab orientation moved',
      body: 'The orientation will now hold in Engineering Hall B.',
      audience: 'SEM_1',
    }
  })

  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
