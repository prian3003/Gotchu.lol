# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack application with a React 19 + Vite frontend and Go backend, featuring user authentication, profile management, and a portfolio/agency website with advanced animations and theming. The project includes comprehensive session management, database operations, and modern UI patterns.

## Development Commands

### Frontend (React + Vite)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

### Backend (Go)
- `cd backend && make dev` - Start Go backend with hot reload
- `cd backend && make build` - Build Go backend
- `cd backend && make test` - Run Go tests
- `cd backend && make migrate` - Run database migrations
- `cd backend && make setup` - Full backend setup for new development environment

## Architecture

### Frontend Stack
- **React 19** - Latest React with concurrent features
- **Vite** - Build tool and dev server with Tailwind plugin
- **Tailwind CSS 4** - Primary utility-first CSS framework
- **Framer Motion** - Advanced animations (used sparingly)
- **React Router DOM** - Client-side routing
- **Styled Components** - CSS-in-JS for specific styling needs

### Backend Stack
- **Go** - High-performance backend with Gin framework
- **PostgreSQL** - Primary database with Prisma ORM
- **Redis** - Session management and caching
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing with salt

### Frontend Component Architecture

**Authentication Components**: `SignIn.jsx`, `SignUp.jsx`, `EmailVerification.jsx`, `VerifyEmail.jsx`
**Layout & Navigation**: `Home.jsx` serves as the main layout container with `Navbar.jsx` for navigation
**User Pages**: `Dashboard.jsx`, `UserProfile.jsx` for authenticated user areas
**Interactive Elements**: `ThemeToggle.jsx`, `StartButton.jsx`, `Loader.jsx`
**Visual Effects**: `ParticleBackground.jsx`, `AuroraTextEffect.jsx`, `ShinyText.jsx` with hardware acceleration
**Content Sections**: `Hero.jsx`, `Work.jsx`, `Timeline.jsx`, `ContactUs.jsx`
**Advanced UI**: `ScrollStack.jsx`, `ProjectModal.jsx`, `StartMenuOverlay.jsx`
**Animation System**: `ScrollRevealSection.jsx` and `ScrollRevealWrapper.jsx` using Intersection Observer

### Backend Architecture

**API Structure**: RESTful endpoints in `internal/handlers/` (auth.go, dashboard.go)
**Middleware Stack**: Authentication, CORS, rate limiting, logging in `internal/middleware/`
**Database Models**: User, authentication, sessions, and analytics models in `internal/models/`
**Services**: Authentication service, database connection, Redis client, email service in `pkg/`
**Configuration**: Centralized config management in `internal/config/`

### Theme System

**ThemeContext** (`src/contexts/ThemeContext.jsx`) provides comprehensive theme management:
- Dark/light mode switching with localStorage persistence
- Dynamic CSS custom properties injection
- Automatic DOM class management (`.dark-mode`/`.light-mode`)
- Color scheme: background, text, accent, surface, border, muted colors

### Animation Patterns

**Multi-layered Animation Strategy**:
- CSS keyframe animations for performance-critical effects
- Intersection Observer API via `useScrollReveal` hook for scroll-triggered animations
- Framer Motion for complex interactive animations
- Custom typewriter effects with theme awareness
- Hardware acceleration using `transform3d` and `will-change`

### Styling Approach

**Hybrid Styling Strategy**:
- Tailwind CSS for utility-first base styling
- CSS-in-JS via inline styles for dynamic theme-dependent properties
- Custom CSS in `index.css` for complex animations and scroll effects
- Modern CSS features: `animation-timeline: view()`, custom scrollbars

### Authentication System

**Frontend Authentication**: JWT token management in `src/lib/auth.js`, protected routes, auth context
**Backend Authentication**: Session-based auth with Redis storage, JWT tokens, bcrypt password hashing
**API Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/dashboard` - Protected dashboard data

### Performance Optimizations

- **Particle Systems**: `useMemo` for particle generation, CSS transforms for movement
- **Scroll Animations**: Passive event listeners and RAF-based smooth scrolling
- **Bundle Optimization**: ES modules with tree-shaking enabled
- **Backend Performance**: Redis caching, connection pooling, graceful shutdown
- **Rate Limiting**: Redis-based distributed rate limiting

### Database & Data Management

**Database**: PostgreSQL with Prisma ORM schema in `prisma/schema.prisma`
**Frontend Data**: Static data centralized in `src/data/scrollStackData.js` with external image URLs and content configuration
**Backend Data**: User profiles, authentication data, sessions, analytics models in `internal/models/`
**Session Storage**: Redis-based sessions with TTL and automatic refresh

### Configuration Notes

- **ESLint**: Flat config format with custom rule `varsIgnorePattern: '^[A-Z_]'` for unused variables
- **Deployment**: Netlify configuration with SPA routing support in `netlify.toml`
- **Fonts**: Google Fonts integration ("DM Serif Text", "Press Start 2P")
- **External Assets**: CDN-hosted images (Unsplash, Pexels)
- **Environment**: Backend requires `.env` file with database URLs, Redis config, JWT secrets

### Development Patterns

- Functional components with hooks pattern
- Theme integration via `useTheme()` hook
- Props destructuring with defaults
- Consistent export/import structure
- Theme-aware styling through context colors rather than hardcoded values
- memorize