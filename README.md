# Gotchu.lol

A modern link-in-bio platform for creators and professionals.

**Live site:** https://gotchu.lol

Gotchu is a customizable personal page builder where you can showcase all your links, social profiles, and content in one place. Built with React and Go for performance and scalability.

## Features

### Customization
- Custom themes and color schemes
- Visual effects (particles, rain, snow)
- Background music support
- Video and image backgrounds
- Custom cursors
- Template marketplace
- Username text effects

### Link Management
- Unlimited links with custom icons
- Drag and drop reordering
- Individual link styling
- 200+ icon options from Simple Icons
- Click tracking per link

### Analytics
- Real-time views and clicks
- Geographic visitor data
- Time-based metrics (daily, weekly, monthly, yearly)
- Top performing links
- Device and browser stats

### Authentication
- Email/password signup with verification
- OAuth (Discord and Google)
- Two-factor authentication
- Secure session management

### Premium
- Cryptocurrency payments via OxaPay
- Premium badge
- Early access to new features

### Discord Integration
- Live Discord presence status
- Avatar and decoration sync
- Server role badges

## Tech Stack

### Frontend
- React 18
- Vite
- Styled Components
- React Router
- Framer Motion
- React Beautiful DnD

### Backend
- Go (Golang)
- Gin web framework
- GORM
- PostgreSQL (Supabase)
- Redis (Upstash)

### Infrastructure
- Vercel (frontend hosting)
- Render (backend hosting)
- Supabase (database and file storage)
- OxaPay (payments)
- Resend (emails)

## Project Structure

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

## Setup & Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Go 1.21+
- PostgreSQL 14+ (or Supabase account)
- Redis (or Upstash account)

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

## Environment Variables

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

## Deployment

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

## API Documentation

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

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Credits

- [Simple Icons](https://simpleicons.org/) for the icon library
- [flag-icons](https://github.com/lipis/flag-icons) for country flags
- [Supabase](https://supabase.com/) for database and storage
- [Vercel](https://vercel.com/) and [Render](https://render.com/) for hosting

## Support

- GitHub Issues: Report bugs or request features
- Email: support@gotchu.lol

---

Made by the Gotchu team

[Visit gotchu.lol](https://gotchu.lol)
