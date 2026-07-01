// Simple script to ensure an admin user exists with a phone number.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'


const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@assttar.com'
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (existing) {
    console.log('Admin already exists:', existing.email)
    return
  }

  const hashedPassword = await bcrypt.hash('Mohammed@admin.assttar', 10)
  const user = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin User',
      phone: '0000000000',
      role: 'admin',
      emailVerified: true,
    }
  })
  console.log('Admin created:', user.email)
}

main()
  .catch((e) => {
    console.error('Error creating admin:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
