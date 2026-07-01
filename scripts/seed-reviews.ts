import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding test reviews...')

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'customer1@test.com',
        password: await bcrypt.hash('password123', 10),
        name: 'فاطمة أحمد',
        phone: '+966501234567',
      }
    }),
    prisma.user.create({
      data: {
        email: 'customer2@test.com',
        password: await bcrypt.hash('password123', 10),
        name: 'نورة العتيبي',
        phone: '+966501234568',
      }
    }),
    prisma.user.upsert({
      where: { email: 'admin@assttar.com' },
      update: {},
      create: {
        email: 'admin@assttar.com',
        password: await bcrypt.hash('Mohammed@admin.assttar', 10),
        name: 'Admin',
        phone: '+966500000000',
        role: 'admin',
      }
    })
  ])

  // Get first product
  const product = await prisma.product.findFirstOrThrow({
    select: { id: true }
  })

  // Create 5 test reviews
  const reviewsData = [
    {
      userId: users[0].id,
      productId: product.id,
      rating: 5,
      title: 'ممتاز جداً!',
      comment: 'المنتج عالي الجودة والخياطة ممتازة. الشحن سريع والتعبئة جيدة.',
      verified: true,
    },
    {
      userId: users[1].id,
      productId: product.id,
      rating: 4,
      title: 'جيد جداً',
      comment: 'المنتج جميل لكن المقاس كبير شوي. الجودة ممتازة عموماً.',
    },
    {
      userId: users[0].id,
      productId: product.id,
      rating: 5,
      comment: 'أفضل عباية اشتريتها! راح أطلب ألوان ثانية.',
      verified: true,
    },
    {
      userId: users[1].id,
      productId: product.id,
      rating: 3,
      title: 'متوسط',
      comment: 'اللون مختلف شوي عن الصورة لكن جودة القماش جيدة.',
    },
    {
      userId: users[0].id,
      productId: product.id,
      rating: 5,
      title: 'موصى به بشدة',
      comment: 'تصميم أنيق ومقاس مثالي. الخدمة ممتازة!',
      verified: true,
    }
  ]

  for (const data of reviewsData) {
    await prisma.review.upsert({
      where: {
        userId_productId: { userId: data.userId, productId: data.productId }
      },
      update: data,
      create: data,
    })
  }

  console.log('✅ Created 5 test reviews!')
  console.log('Admin login: admin@assttar.com / Mohammed@admin.assttar')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())

