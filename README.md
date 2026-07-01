# Astar - استآر E-Commerce Platform

A complete, production-ready e-commerce platform built with Next.js 16, TypeScript, Prisma, and Tailwind CSS.

## 🚀 Features

### Customer Features
- 🛍️ Product browsing with filters (category, price, size, color)
- 🔍 Search functionality
- 🛒 Shopping cart with persistent storage
- ❤️ Wishlist functionality
- 👤 User authentication (register, login, logout)
- 📦 Order tracking
- ⭐ Product reviews and ratings
- 📧 Newsletter subscription
- 📱 Responsive design (mobile-first)
- 🌐 Bilingual support (Arabic/English)

### Admin Features
- 📊 Dashboard with statistics
- 📦 Product management (CRUD)
- 📁 Category management
- 🛒 Order management
- 👥 Customer management
- 💰 Discount code management
- 🎨 Banner management
- ⭐ Review moderation
- 📧 Contact message management
- 📬 Newsletter subscriber management
- ⚙️ Site settings

## 📋 Requirements

- Node.js 18+ or Bun
- SQLite (included)
- npm or bun

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd astar-ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL=file:./db/custom.db
   JWT_SECRET=your-super-secret-key
   NODE_ENV=development
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   # or
   bun run db:push
   ```

5. **Seed the database (optional)**
   ```bash
   npm run db:seed
   # or
   bun x prisma db seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

7. **Open in browser**
   Navigate to `http://localhost:3000`

## 🔐 Default Admin Credentials

After seeding, use these credentials to access the admin panel:

- **Email:** admin@astar.com
- **Password:** admin123

⚠️ **IMPORTANT:** Change these credentials immediately in production!

## 📁 Project Structure

```
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Main page
│   ├── components/
│   │   ├── estar/         # E-commerce components
│   │   └── ui/            # UI components (shadcn)
│   ├── hooks/             # Custom hooks
│   ├── lib/
│   │   ├── auth.ts        # Authentication utilities
│   │   ├── db.ts          # Database client
│   │   ├── security.ts    # Security utilities
│   │   └── i18n/          # Internationalization
│   └── store/             # Zustand stores
├── public/                # Static assets
└── .env                   # Environment variables
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run migrations |

## 🔒 Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT-based authentication
- ✅ HTTP-only cookies
- ✅ Admin route protection
- ✅ Input validation and sanitization
- ✅ Rate limiting
- ✅ Security headers

## 🌐 API Endpoints

### Public APIs
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `GET /api/categories` - List categories
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/contact` - Submit contact form
- `POST /api/newsletter/subscribe` - Subscribe to newsletter

### Admin APIs (Require Authentication)
- `GET /api/admin/stats` - Dashboard statistics
- `GET/POST /api/admin/products` - Product management
- `GET/PUT/DELETE /api/admin/products/:id` - Single product operations
- `GET/PUT /api/admin/orders` - Order management
- `GET/PUT/DELETE /api/admin/users` - User management
- And more...

## 📦 Dependencies

### Core
- Next.js 16
- React 19
- TypeScript 5
- Prisma 6
- Tailwind CSS 4

### UI
- shadcn/ui
- Lucide Icons
- Framer Motion

### State Management
- Zustand

### Authentication
- bcryptjs
- jsonwebtoken

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Environment Variables for Production
```env
DATABASE_URL=file:./db/production.db
JWT_SECRET=your-production-secret-key
NODE_ENV=production
```

## 📝 License

MIT License

## 👥 Support

For support, email support@astar.com or open an issue in the repository.
