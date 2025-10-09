# Gotchu.lol 🔗

> Your personal link-in-bio platform with superpowers

[![Live Preview](https://img.shields.io/badge/Live%20Preview-gotchu.lol-58A4B0?style=for-the-badge&logo=vercel)](https://gotchu.lol)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

**Gotchu.lol** is a modern, feature-rich link-in-bio platform that lets you create a stunning personal page to showcase all your links, social profiles, and content in one place. Think Linktree, but way cooler.

## ✨ Features

### 🎨 Customization
- **Themes & Colors**: Choose from pre-made themes or create your own with custom accent colors
- **Visual Effects**: Particles, rain, snow, and other background effects
- **Username Effects**: Glowing text, rainbow animations, and more
- **Audio**: Add background music to your profile (because why not?)
- **Custom Cursor**: Upload your own cursor image
- **Templates**: Browse and apply professionally designed templates
- **Video Backgrounds**: Support for video backgrounds alongside images

### 🔗 Link Management
- **Unlimited Links**: Add as many links as you want
- **Custom Icons**: 200+ icons from Simple Icons library
- **Link Styling**: Individual link customization with colors and effects
- **Drag & Drop**: Reorder links with drag-and-drop
- **Link Analytics**: Track clicks and views on your links

### 📊 Analytics
- **Real-time Stats**: Views, clicks, and visitor metrics
- **Geographic Data**: See where your visitors are from
- **Time-based Analytics**: Track performance over time (Today, Week, Month, Year)
- **Top Links**: Identify your best-performing content
- **Device & Browser Stats**: Know your audience

### 🔐 Authentication
- **Email/Password**: Traditional sign-up with email verification
- **OAuth**: Sign in with Discord or Google
- **2FA**: Two-factor authentication for enhanced security
- **Session Management**: Secure session handling with Redis

### 💎 Premium Features
- **Crypto Payments**: Pay with cryptocurrency via OxaPay
- **Premium Badge**: Show off your premium status
- **Early Access**: Get new features first
- **Priority Support**: Faster response times

### 🎮 Discord Integration
- **Rich Presence**: Show your Discord status on your profile
- **Avatar Sync**: Use your Discord avatar and decoration
- **Server Badges**: Display your Discord server roles

## 🚀 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **Styled Components** - CSS-in-JS styling
- **React Router** - Client-side routing
- **Framer Motion** - Animations
- **React Beautiful DnD** - Drag and drop functionality

### Backend
- **Go (Golang)** - High-performance API server
- **Gin** - Web framework
- **GORM** - ORM for database operations
- **PostgreSQL** - Primary database (via Supabase)
- **Redis** - Session storage & caching (Upstash)
- **Supabase** - File storage for avatars, backgrounds, and audio

### Infrastructure
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **Supabase** - Database & storage
- **Upstash Redis** - Managed Redis
- **OxaPay** - Crypto payment processing
- **Resend** - Transactional emails

## 📦 Project Structure

```
gotchuv2/
├── src/                          # Frontend source
│   ├── components/              # React components
│   │   ├── auth/               # Authentication flows
│   │   ├── dashboard/          # Dashboard sections
│   │   ├── customization/      # Profile customization
│   │   ├── effects/            # Visual effects
│   │   └── profile/            # Public profile components
│   ├── contexts/               # React contexts
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Utility functions
│   └── config/                 # Configuration files
├── backend/                     # Backend source
│   ├── cmd/                    # Application entry point
│   ├── internal/               # Internal packages
│   │   ├── handlers/          # HTTP request handlers
│   │   ├── models/            # Database models
│   │   ├── middleware/        # HTTP middleware
│   │   └── config/            # Configuration
│   └── pkg/                    # Public packages
│       ├── auth/              # Authentication logic
│       ├── database/          # Database connection
│       ├── discord/           # Discord integration
│       ├── email/             # Email service
│       ├── payments/          # Payment processing
│       ├── redis/             # Redis client
│       └── storage/           # File storage
└── public/                      # Static assets
```

## 🛠️ Setup & Installation

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Go** 1.21+
- **PostgreSQL** 14+ (or Supabase account)
- **Redis** (or Upstash account)

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/gotchu.lol.git
cd gotchuv2

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables (see below)
nano .env

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Go dependencies
go mod download

# Create .env file
cp .env.example .env

# Configure environment variables (see below)
nano .env

# Run database migrations
go run cmd/main.go

# Start backend server
go run cmd/main.go
```

## 🔑 Environment Variables

### Frontend (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:8080/api

# Supabase (optional for client-side storage)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Cloudflare Turnstile (security)
VITE_CLOUDFLARE_SITE_KEY=your-site-key
```

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# JWT
JWT_SECRET=your-secret-key

# URLs
BASE_URL=http://localhost:8080
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Discord OAuth
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
DISCORD_REDIRECT_URI=http://localhost:8080/api/auth/oauth/discord/callback

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/oauth/google/callback

# Email (Resend)
RESEND_API_KEY=your-api-key
EMAIL_FROM=noreply@yourdomain.com

# Payments (OxaPay)
OXAPAY_MERCHANT_KEY=your-merchant-key
OXAPAY_API_KEY=your-api-key

# Cloudflare Turnstile
CLOUDFLARE_SECRET_KEY=your-secret-key
```

## 🚢 Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Backend (Render)

1. Create a new Web Service in Render
2. Connect your GitHub repository
3. Set build command: `go build -o main cmd/main.go`
4. Set start command: `./main`
5. Add environment variables
6. Deploy!

### Database (Supabase)

1. Create a new project in Supabase
2. Copy database URL and storage keys
3. Run migrations using the Supabase SQL editor or GORM auto-migrate

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/oauth/:provider` - OAuth initiation
- `GET /api/auth/oauth/:provider/callback` - OAuth callback

### Dashboard Endpoints
- `GET /api/dashboard` - Get user dashboard data
- `POST /api/links` - Create new link
- `PUT /api/links/:id` - Update link
- `DELETE /api/links/:id` - Delete link
- `POST /api/links/reorder` - Reorder links

### Customization Endpoints
- `GET /api/customization/settings` - Get customization settings
- `POST /api/customization/settings` - Update customization settings
- `POST /api/upload/asset` - Upload asset (avatar, background, audio)
- `DELETE /api/assets/delete` - Delete asset

### Analytics Endpoints
- `GET /api/analytics` - Get analytics data
- `POST /api/analytics/view` - Track profile view
- `POST /api/analytics/click/:linkId` - Track link click

### Templates Endpoints
- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get template details
- `POST /api/templates/:id/apply` - Apply template
- `POST /api/templates/:id/like` - Like/unlike template

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Simple Icons](https://simpleicons.org/) - Icon library
- [flag-icons](https://github.com/lipis/flag-icons) - Country flags
- [Supabase](https://supabase.com/) - Database & storage
- [Vercel](https://vercel.com/) - Frontend hosting
- [Render](https://render.com/) - Backend hosting

## 💬 Support

Need help? Have questions?

- 📧 Email: support@gotchu.lol
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/gotchu.lol/issues)
- 💬 Discord: [Join our server](https://discord.gg/yourinvite)

---

**Made with ❤️ by the Gotchu team**

[Visit Gotchu.lol](https://gotchu.lol) • [Documentation](https://docs.gotchu.lol) • [Discord](https://discord.gg/yourinvite)
