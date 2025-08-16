# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React 19 + Vite project featuring a sophisticated portfolio/agency website with advanced animations, theme switching, and modern UI patterns. The codebase emphasizes performance-optimized animations and a comprehensive theming system.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

## Architecture

### Stack
- **React 19** - Latest React with concurrent features
- **Vite** - Build tool and dev server with Tailwind plugin
- **Tailwind CSS 4** - Primary utility-first CSS framework
- **Framer Motion** - Advanced animations (used sparingly)
- **React Router DOM** - Client-side routing
- **Styled Components** - CSS-in-JS for specific styling needs

### Component Architecture

The application follows a layered component architecture:

**Layout & Navigation**: `Home.jsx` serves as the main layout container with `Navbar.jsx` for navigation
**Interactive Elements**: `CustomCursor.jsx` (60fps performance), `ThemeToggle.jsx`, `StartButton.jsx`
**Visual Effects**: `ParticleBackground.jsx`, `AuroraTextEffect.jsx`, `ShinyText.jsx` with hardware acceleration
**Content Sections**: `Hero.jsx`, `Work.jsx`, `Timeline.jsx`, `ContactUs.jsx`
**Advanced UI**: `ScrollStack.jsx`, `ProjectModal.jsx`, `StartMenuOverlay.jsx`
**Animation System**: `ScrollRevealSection.jsx` and `ScrollRevealWrapper.jsx` using Intersection Observer

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

### Performance Optimizations

- **Custom Cursor**: Direct DOM manipulation with `requestAnimationFrame`
- **Particle Systems**: `useMemo` for particle generation, CSS transforms for movement
- **Scroll Animations**: Passive event listeners and RAF-based smooth scrolling
- **Bundle Optimization**: ES modules with tree-shaking enabled

### Configuration Notes

- **ESLint**: Flat config format with custom rule `varsIgnorePattern: '^[A-Z_]'` for unused variables
- **Deployment**: Netlify configuration with SPA routing support in `netlify.toml`
- **Fonts**: Google Fonts integration ("DM Serif Text", "Press Start 2P")
- **External Assets**: CDN-hosted images (Unsplash, Pexels)

### Data Management

Static data centralized in `src/data/scrollStackData.js` with external image URLs and content configuration.

### Development Patterns

- Functional components with hooks pattern
- Theme integration via `useTheme()` hook
- Props destructuring with defaults
- Consistent export/import structure
- Theme-aware styling through context colors rather than hardcoded values