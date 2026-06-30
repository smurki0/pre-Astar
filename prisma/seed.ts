import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.productImage.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.review.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.discountCode.deleteMany()
  await prisma.banner.deleteMany()
  await prisma.address.deleteMany()
  await prisma.user.deleteMany()

  // Create Admin User
  console.log('Creating admin user...')
  const hashedPassword = await bcrypt.hash('Mohammed@admin.assttar', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@assttar.com',
      password: hashedPassword,
      name: 'Admin User',
      phone: '0000000000',
      role: 'admin',
      emailVerified: true,
    },
  })
  console.log('Admin user created:', admin.email)

  // Create Categories
  console.log('Creating categories...')
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        nameEn: 'Abayas',
        nameAr: 'عبايات',
        slug: 'abayas',
        descriptionEn: 'Elegant and modest abayas for every occasion',
        descriptionAr: 'عبايات أنيقة ومحتشمة لكل مناسبة',
      },
    }),
    prisma.category.create({
      data: {
        nameEn: 'Hijabs',
        nameAr: 'حجاب',
        slug: 'hijabs',
        descriptionEn: 'Beautiful hijabs in various styles and fabrics',
        descriptionAr: 'حجاب جميل بأساليب وأقمشة متنوعة',
      },
    }),
    prisma.category.create({
      data: {
        nameEn: 'Dresses',
        nameAr: 'فساتين',
        slug: 'dresses',
        descriptionEn: 'Modest dresses for everyday elegance',
        descriptionAr: 'فساتين محتشمة لأناقة يومية',
      },
    }),
    prisma.category.create({
      data: {
        nameEn: 'Tunics',
        nameAr: 'تونيك',
        slug: 'tunics',
        descriptionEn: 'Comfortable and stylish tunics',
        descriptionAr: 'تونيك مريح وأنيق',
      },
    }),
    prisma.category.create({
      data: {
        nameEn: 'Skirts',
        nameAr: 'تنورات',
        slug: 'skirts',
        descriptionEn: 'Flowing skirts for a graceful look',
        descriptionAr: 'تنورات انسيابية لمظهر رشيق',
      },
    }),
    prisma.category.create({
      data: {
        nameEn: 'Accessories',
        nameAr: 'إكسسوارات',
        slug: 'accessories',
        descriptionEn: 'Complete your look with our accessories',
        descriptionAr: 'أكمل إطلالتك بإكسسواراتنا',
      },
    }),
    prisma.category.create({
      data: {
        nameEn: 'Sportswear',
        nameAr: 'ملابس رياضية',
        slug: 'sportswear',
        descriptionEn: 'Modest sportswear for active women',
        descriptionAr: 'ملابس رياضية محتشمة للنساء النشيطات',
      },
    }),
    prisma.category.create({
      data: {
        nameEn: 'New Arrivals',
        nameAr: 'وصل حديثاً',
        slug: 'new-arrivals',
        descriptionEn: 'Latest additions to our collection',
        descriptionAr: 'أحدث الإضافات لمجموعتنا',
      },
    }),
  ])
  console.log(`Created ${categories.length} categories`)

  // Create Products
  console.log('Creating products...')
  const createdProducts: { id: string; nameEn: string; slug: string }[] = []
  
  const productsData = [
    // Abayas
    {
      nameEn: 'Classic Black Abaya',
      nameAr: 'عباية سوداء كلاسيكية',
      slug: 'classic-black-abaya',
      descriptionEn: 'A timeless black abaya crafted from premium crepe fabric. Features a relaxed fit and elegant drape, perfect for everyday wear or special occasions.',
      descriptionAr: 'عباية سوداء خالدة مصنوعة من قماش كريب فاخر. تتميز بقصة مريحة وانسياب أنيق، مثالية للارتداء اليومي أو المناسبات الخاصة.',
      price: 299,
      comparePrice: 399,
      sku: 'ABY-001',
      quantity: 50,
      categoryId: categories[0].id,
      featured: true,
      active: true,
      images: [{ url: '/placeholder-product.png', alt: 'Classic Black Abaya', position: 0 }],
      variants: [
        { name: 'Small', sku: 'ABY-001-S', size: 'S', quantity: 15, color: 'Black' },
        { name: 'Medium', sku: 'ABY-001-M', size: 'M', quantity: 20, color: 'Black' },
        { name: 'Large', sku: 'ABY-001-L', size: 'L', quantity: 15, color: 'Black' },
      ],
    },
    {
      nameEn: 'Embroidered Abaya',
      nameAr: 'عباية مطرزة',
      slug: 'embroidered-abaya',
      descriptionEn: 'Stunning abaya with intricate embroidery details on the sleeves and front. Made from high-quality nida fabric for a luxurious feel.',
      descriptionAr: 'عباية مذهلة بتفاصيل تطريز معقدة على الأكمام والأمام. مصنوعة من قماش نيدة عالي الجودة لإحساس فاخر.',
      price: 449,
      comparePrice: 550,
      sku: 'ABY-002',
      quantity: 30,
      categoryId: categories[0].id,
      featured: true,
      active: true,
      images: [{ url: '/placeholder-product.png', alt: 'Embroidered Abaya', position: 0 }],
      variants: [
        { name: 'Small', sku: 'ABY-002-S', size: 'S', quantity: 10, color: 'Navy' },
        { name: 'Medium', sku: 'ABY-002-M', size: 'M', quantity: 10, color: 'Navy' },
        { name: 'Large', sku: 'ABY-002-L', size: 'L', quantity: 10, color: 'Navy' },
      ],
    },
    {
      nameEn: 'Open Front Abaya',
      nameAr: 'عباية مفتوحة من الأمام',
      slug: 'open-front-abaya',
      descriptionEn: 'Modern open-front abaya with a belt closure. Perfect for layering over your favorite outfits.',
      descriptionAr: 'عباية عصرية مفتوحة من الأمام مع إغلاق بحزام. مثالية للطبقات فوق ملابسك المفضلة.',
      price: 349,
      sku: 'ABY-003',
      quantity: 25,
      categoryId: categories[0].id,
      featured: false,
      active: true,
      images: [{ url: '/placeholder-product.png', alt: 'Open Front Abaya', position: 0 }],
      variants: [
        { name: 'Small', sku: 'ABY-003-S', size: 'S', quantity: 8, color: 'Beige' },
        { name: 'Medium', sku: 'ABY-003-M', size: 'M', quantity: 9, color: 'Beige' },
        { name: 'Large', sku: 'ABY-003-L', size: 'L', quantity: 8, color: 'Beige' },
      ],
    },
    // Hijabs
    {
      nameEn: 'Premium Silk Hijab',
      nameAr: 'حجاب حرير فاخر',
      slug: 'premium-silk-hijab',
      descriptionEn: 'Luxurious silk hijab with a soft, smooth texture. Available in multiple colors for every occasion.',
      descriptionAr: 'حجاب حرير فاخر بقوام ناعم وأملس. متوفر بألوان متعددة لكل مناسبة.',
      price: 89,
      sku: 'HJB-001',
      quantity: 100,
      categoryId: categories[1].id,
      featured: true,
      active: true,
      images: [{ url: '/placeholder-product.png', alt: 'Premium Silk Hijab', position: 0 }],
      variants: [
        { name: 'Black', sku: 'HJB-001-BLK', color: 'Black', quantity: 25 },
        { name: 'Navy', sku: 'HJB-001-NVY', color: 'Navy', quantity: 25 },
        { name: 'Burgundy', sku: 'HJB-001-BRD', color: 'Burgundy', quantity: 25 },
        { name: 'Cream', sku: 'HJB-001-CRM', color: 'Cream', quantity: 25 },
      ],
    },
    {
      nameEn: 'Chiffon Hijab Set',
      nameAr: 'طقم حجاب شيفون',
      slug: 'chiffon-hijab-set',
      descriptionEn: 'Set of 3 lightweight chiffon hijabs in complementary colors. Perfect for everyday wear.',
      descriptionAr: 'طقم من 3 حجاب شيفون خفيف الوزن بألوان متكاملة. مثالي للارتداء اليومي.',
      price: 129,
      comparePrice: 159,
      sku: 'HJB-002',
      quantity: 60,
      categoryId: categories[1].id,
      featured: false,
      active: true,
      images: [{ url: '/placeholder-product.png', alt: 'Chiffon Hijab Set', position: 0 }],
      variants: [],
    },
    // Dresses
    {
      nameEn: 'Floral Maxi Dress',
      nameAr: 'فستان طويل زهري',
      slug: 'floral-maxi-dress',
      descriptionEn: 'Beautiful floral print maxi dress with a flattering A-line silhouette. Perfect for spring and summer.',
      descriptionAr: 'فستان طويل جميل بطبعة زهرية وقصة خط A مميزة. مثالي لفصلي الربيع والصيف.',
      price: 249,
      sku: 'DRS-001',
      quantity: 35,
      categoryId: categories[2].id,
      featured: true,
      active: true,
      images: [{ url: '/placeholder-product.png', alt: 'Floral Maxi Dress', position: 0 }],
      variants: [
        { name: 'Small', sku: 'DRS-001-S', size: 'S', quantity: 12, color: 'Multi' },
        { name: 'Medium', sku: 'DRS-001-M', size: 'M', quantity: 12, color: 'Multi' },
        { name: 'Large', sku: 'DRS-001-L', size: 'L', quantity: 11, color: 'Multi' },
      ],
    },
    {
      nameEn: 'Lace Detail Dress',
      nameAr: 'فستان بتفاصيل دانتيل',
      slug: 'lace-detail-dress',
      descriptionEn: 'Romantic dress featuring delicate lace details on the sleeves and hem. Perfect for special occasions.',
      descriptionAr: 'فستان رومانسي يتميز بتفاصيل دانتيل دقيقة على الأكمام والحاشية. مثالي للمناسبات الخاصة.',
      price: 329,
      comparePrice: 399,
      sku: 'DRS-003',
      quantity: 20,
      categoryId: categories[2].id,
      featured: true,
      active: true,
      images: [{ url: '/placeholder-product.png', alt: 'Lace Detail Dress', position: 0 }],
      variants: [
        { name: 'Small', sku: 'DRS-003-S', size: 'S', quantity: 7, color: 'Dusty Blue' },
        { name: 'Medium', sku: 'DRS-003-M', size: 'M', quantity: 7, color: 'Dusty Blue' },
        { name: 'Large', sku: 'DRS-003-L', size: 'L', quantity: 6, color: 'Dusty Blue' },
      ],
    },
    // Tunics
    {
      nameEn: 'Embroidered Tunic',
      nameAr: 'تونيك مطرز',
      slug: 'embroidered-tunic',
      descriptionEn: 'Beautiful embroidered tunic with traditional motifs. A perfect blend of heritage and style.',
      descriptionAr: 'تونيك مطرز جميل بنقوش تقليدية. مزيج مثالي من التراث والأناقة.',
      price: 199,
      sku: 'TNK-002',
      quantity: 25,
      categoryId: categories[3].id,
      featured: true,
      active: true,
      images: [{ url: '/placeholder-product.png', alt: 'Embroidered Tunic', position: 0 }],
      variants: [
        { name: 'Small', sku: 'TNK-002-S', size: 'S', quantity: 8, color: 'Cream' },
        { name: 'Medium', sku: 'TNK-002-M', size: 'M', quantity: 9, color: 'Cream' },
        { name: 'Large', sku: 'TNK-002-L', size: 'L', quantity: 8, color: 'Cream' },
      ],
    },
    // Skirts
    {
      nameEn: 'A-Line Maxi Skirt',
      nameAr: 'تنورة طويلة خط A',
      slug: 'aline-maxi-skirt',
      descriptionEn: 'Flowing A-line maxi skirt with a comfortable fit. Perfect for creating elegant silhouettes.',
      descriptionAr: 'تنورة طويلة انسيابية بقصة خط A مريحة. مثالية لخلق قوام أنيق.',
      price: 199,
      sku: 'SKT-002',
      quantity: 30,
      categoryId: categories[4].id,
      featured: true,
      active: true,
      images: [{ url: '/placeholder-product.png', alt: 'A-Line Maxi Skirt', position: 0 }],
      variants: [
        { name: 'Small', sku: 'SKT-002-S', size: 'S', quantity: 10, color: 'Navy' },
        { name: 'Medium', sku: 'SKT-002-M', size: 'M', quantity: 10, color: 'Navy' },
        { name: 'Large', sku: 'SKT-002-L', size: 'L', quantity: 10, color: 'Navy' },
      ],
    },
    // Sportswear
    {
      nameEn: 'Sports Hijab',
      nameAr: 'حجاب رياضي',
      slug: 'sports-hijab',
      descriptionEn: 'Lightweight, breathable sports hijab designed for active lifestyle. Stay comfortable during workouts.',
      descriptionAr: 'حجاب رياضي خفيف الوزن وقابل للتهوية مصمم لنمط حياة نشط. ابقِ مرتاحة أثناء التمارين.',
      price: 79,
      sku: 'SPT-001',
      quantity: 60,
      categoryId: categories[6].id,
      featured: true,
      active: true,
      images: [{ url: '/placeholder-product.png', alt: 'Sports Hijab', position: 0 }],
      variants: [
        { name: 'Black', sku: 'SPT-001-BLK', color: 'Black', quantity: 30 },
        { name: 'Navy', sku: 'SPT-001-NVY', color: 'Navy', quantity: 30 },
      ],
    },
    // New Arrivals
    {
      nameEn: 'Limited Edition Abaya',
      nameAr: 'عباية إصدار محدود',
      slug: 'limited-edition-abaya',
      descriptionEn: 'Exclusive limited edition abaya with unique hand-stitched details. Only 50 pieces available.',
      descriptionAr: 'عباية إصدار محدود حصرية بتفاصيل يدوية فريدة. 50 قطعة فقط متاحة.',
      price: 599,
      sku: 'NEW-001',
      quantity: 50,
      categoryId: categories[7].id,
      featured: true,
      active: true,
      images: [{ url: '/placeholder-product.png', alt: 'Limited Edition Abaya', position: 0 }],
      variants: [
        { name: 'Small', sku: 'NEW-001-S', size: 'S', quantity: 17, color: 'Black' },
        { name: 'Medium', sku: 'NEW-001-M', size: 'M', quantity: 16, color: 'Black' },
        { name: 'Large', sku: 'NEW-001-L', size: 'L', quantity: 17, color: 'Black' },
      ],
    },
    {
      nameEn: 'Pearl Collection Dress',
      nameAr: 'فستان مجموعة اللؤلؤ',
      slug: 'pearl-collection-dress',
      descriptionEn: 'Elegant dress from our new Pearl Collection. Features delicate pearl embellishments.',
      descriptionAr: 'فستان أنيق من مجموعة اللؤلؤ الجديدة. يتميز بزخارف لؤلؤية دقيقة.',
      price: 449,
      sku: 'NEW-002',
      quantity: 30,
      categoryId: categories[7].id,
      featured: true,
      active: true,
      images: [{ url: '/placeholder-product.png', alt: 'Pearl Collection Dress', position: 0 }],
      variants: [
        { name: 'Small', sku: 'NEW-002-S', size: 'S', quantity: 10, color: 'Ivory' },
        { name: 'Medium', sku: 'NEW-002-M', size: 'M', quantity: 10, color: 'Ivory' },
        { name: 'Large', sku: 'NEW-002-L', size: 'L', quantity: 10, color: 'Ivory' },
      ],
    },
  ]

  for (const productData of productsData) {
    const { images, variants, ...productFields } = productData

    const product = await prisma.product.create({
      data: {
        ...productFields,
        images: {
          create: images.map((img: { url: string; alt: string; position: number }) => ({
            url: img.url,
            alt: img.alt,
            position: img.position,
          })),
        },
        variants: {
          create: variants.map((v: { name: string; sku: string; size?: string; color?: string; quantity: number }) => ({
            name: v.name,
            sku: v.sku,
            size: v.size || null,
            color: v.color || null,
            quantity: v.quantity,
          })),
        },
      },
    })
    createdProducts.push({ id: product.id, nameEn: product.nameEn, slug: product.slug })
  }
  console.log(`Created ${createdProducts.length} products`)

  // Create Discount Codes
  console.log('Creating discount codes...')
  await Promise.all([
    prisma.discountCode.create({
      data: {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        minOrder: 0,
        usageLimit: 1000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        active: true,
      },
    }),
    prisma.discountCode.create({
      data: {
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        minOrder: 200,
        maxDiscount: 100,
        usageLimit: 500,
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        active: true,
      },
    }),
  ])
  console.log('Created discount codes: WELCOME10, SAVE20')

  // Create Banners
  console.log('Creating banners...')
  await Promise.all([
    prisma.banner.create({
      data: {
        titleEn: 'Ramadan Collection',
        titleAr: 'مجموعة رمضان',
        subtitleEn: 'Discover our elegant Ramadan collection',
        subtitleAr: 'اكتشفي مجموعتنا الرمضانية الأنيقة',
        image: '/hero-1.jpg',
        link: 'shop',
        position: 'hero',
        active: true,
        order: 1,
      },
    }),
    prisma.banner.create({
      data: {
        titleEn: 'Spring Sale',
        titleAr: 'تخفيضات الربيع',
        subtitleEn: 'Up to 40% off on selected items',
        subtitleAr: 'خصم يصل إلى 40% على منتجات مختارة',
        image: '/hero-2.jpg',
        link: 'shop',
        position: 'hero',
        active: true,
        order: 2,
      },
    }),
    prisma.banner.create({
      data: {
        titleEn: 'New Arrivals',
        titleAr: 'وصل حديثاً',
        subtitleEn: 'Check out our latest additions',
        subtitleAr: 'تصفحي أحدث الإضافات',
        image: '/hero-3.jpg',
        link: 'shop',
        position: 'hero',
        active: true,
        order: 3,
      },
    }),
  ])
  console.log('Created 3 promotional banners')

  console.log('\n✅ Database seed completed successfully!')
  console.log('\nSummary:')
  console.log('- Admin user: admin@assttar.com (password: Mohammed@admin.assttar)')
  console.log(`- Categories: ${categories.length}`)
  console.log(`- Products: ${createdProducts.length}`)
  console.log('- Discount codes: 2 (WELCOME10, SAVE20)')
  console.log('- Banners: 3')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
