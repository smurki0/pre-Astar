import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    const users = await prisma.user.findMany({ take: 1 })
    console.log('Database connection works! Found', users.length, 'users')
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

test()
