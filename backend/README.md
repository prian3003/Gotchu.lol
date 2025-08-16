# Gotchu Backend (Go)

High-performance Go backend for gotchu.lol with Redis session management, PostgreSQL database, and comprehensive authentication.

## 🚀 Features

- **Fast & Scalable**: Go with Gin framework for high performance
- **Redis Sessions**: Efficient session management with Redis
- **JWT Authentication**: Secure token-based authentication
- **PostgreSQL**: Robust database with GORM ORM
- **Rate Limiting**: Advanced rate limiting with Redis
- **Real-time Analytics**: Profile views, link clicks tracking
- **Middleware Stack**: Auth, CORS, logging, rate limiting
- **Auto Migrations**: Database schema management
- **Graceful Shutdown**: Proper resource cleanup
- **Docker Ready**: Container support for deployment

## 📋 Prerequisites

- Go 1.21 or higher
- PostgreSQL database (Supabase)
- Redis instance (Redis Cloud)
- Environment variables configured

## 🛠 Quick Start

1. **Clone and setup**:
```bash
cd backend
make setup
```

2. **Configure environment**:
```bash
# Update .env with your credentials
cp .env.example .env
```

3. **Install dependencies**:
```bash
make deps
```

4. **Run migrations**:
```bash
make migrate
```

5. **Start development server**:
```bash
make dev  # With hot reload
# or
make run  # Standard run
```

## 🔧 Available Commands

```bash
make help          # Show all commands
make build         # Build application
make dev           # Development with hot reload
make test          # Run tests
make lint          # Code linting
make fmt           # Format code
make security      # Security scan
make docker-build  # Build Docker image
make clean         # Clean build artifacts
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Dashboard
- `GET /api/dashboard` - Get dashboard data (protected)

### Users
- `GET /api/users/:username` - Get user profile

### Health
- `GET /health` - Health check

## 🏗 Architecture

```
backend/
├── cmd/
│   └── main.go              # Application entry point
├── internal/
│   ├── config/              # Configuration management
│   ├── handlers/            # HTTP handlers
│   ├── middleware/          # Middleware (auth, CORS, rate limiting)
│   └── models/              # Database models
├── pkg/
│   ├── auth/                # Authentication service
│   ├── database/            # Database connection & migrations
│   ├── redis/               # Redis client
│   └── utils/               # Utility functions
├── .env                     # Environment variables
├── go.mod                   # Go modules
├── Makefile                 # Build commands
└── README.md
```

## 🔐 Authentication Flow

1. **Registration/Login**: User provides credentials
2. **Password Hashing**: bcrypt with salt (cost 12)
3. **Session Creation**: Generate UUID session ID
4. **Redis Storage**: Store session data with TTL
5. **JWT Token**: Generate signed JWT with session ID
6. **Response**: Return token + session ID to client

## 📊 Session Management

- **Redis Storage**: Sessions stored with TTL
- **Automatic Refresh**: Session extended on each request
- **User Caching**: User data cached for performance
- **Rate Limiting**: Authentication attempts limited per IP/user

## 🗄 Database Models

### Core Models
- **User**: User profiles and settings
- **UserAuth**: Authentication data (passwords, salts)
- **UserSession**: Session tracking
- **Link**: User links
- **File**: File uploads

### Analytics
- **ProfileView**: Profile view tracking
- **LinkClick**: Link click analytics
- **AnalyticsEvent**: Custom events

### Templates & Badges
- **Template**: Profile templates
- **Badge**: Achievement system
- **UserBadge**: User badge progress

## 🚦 Rate Limiting

- **Global**: 100 requests/15 minutes per IP
- **Auth**: 5 attempts/5 minutes per identifier
- **API**: 200 requests/5 minutes for authenticated users
- **Redis-based**: Distributed rate limiting

## 🐳 Docker Support

```bash
# Build image
make docker-build

# Run container
docker run -p 8080:8080 --env-file .env gotchu-backend
```

## 📈 Performance Features

- **Connection Pooling**: Optimized database connections
- **Redis Caching**: User data and session caching
- **Graceful Shutdown**: Proper resource cleanup
- **Concurrent Safe**: Thread-safe operations
- **Memory Efficient**: Optimized memory usage

## 🔒 Security Features

- **bcrypt Hashing**: Secure password hashing
- **JWT Tokens**: Signed tokens with expiration
- **Rate Limiting**: Prevent brute force attacks
- **CORS Protection**: Cross-origin request handling
- **Input Validation**: Request data validation
- **SQL Injection Prevention**: GORM ORM protection

## 🌍 Environment Variables

See `.env` file for all configuration options:

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Redis
REDIS_HOST="your-redis-host"
REDIS_PORT="6379"
REDIS_PASSWORD="your-password"

# JWT
JWT_SECRET="your-secret-key"

# Server
PORT="8080"
CORS_ORIGINS="http://localhost:3000"
```

## 🧪 Testing

```bash
# Run all tests
make test

# Run with coverage
go test -cover ./...

# Run specific package
go test ./pkg/auth
```

## 🚀 Deployment

The backend is designed to be deployed on any platform that supports Go applications:

- **Heroku**: Use Dockerfile
- **Railway**: Direct Git deployment
- **DigitalOcean**: App Platform
- **AWS**: ECS or Lambda
- **Vercel**: Serverless functions

## 📝 Development

1. **Hot Reload**: Use `make dev` for automatic restart
2. **Code Quality**: Run `make lint` and `make fmt`
3. **Security**: Run `make security` for vulnerability scan
4. **Documentation**: Use godoc for inline documentation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run quality checks
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.