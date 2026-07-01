import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function updatePassword() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const user = await prisma.user.update({
    where: { email: 'admin@assttar.com' },
    data: { password: hashedPassword }
  })
  console.log('Password updated for:', user.email)
  await prisma.$disconnect()
}

updatePassword()
