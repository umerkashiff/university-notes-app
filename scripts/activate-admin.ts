import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  const res = await prisma.user.updateMany({
    where: {
      OR: [
        { role: 'ADMIN' },
        { email: 'admin@uet.edu' }
      ]
    },
    data: {
      status: 'ACTIVE',
      role: 'ADMIN'
    }
  })
  console.log('Updated admin status:', res)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
