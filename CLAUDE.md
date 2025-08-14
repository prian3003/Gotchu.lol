# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + Vite project with Tailwind CSS for styling. It's a minimal setup with ESLint for code quality.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

## Architecture

### Stack
- **React 19** - UI library with JSX
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **ESLint** - Code linting with React-specific rules

### Project Structure
- `src/main.jsx` - Application entry point that renders App component
- `src/App.jsx` - Main application component
- `index.html` - HTML template with root div for React mounting
- `vite.config.js` - Vite configuration with React and Tailwind plugins
- `eslint.config.js` - ESLint configuration with React hooks and refresh rules

### Key Configuration Notes
- Uses ES modules (`"type": "module"` in package.json)
- ESLint configured for React hooks and React refresh patterns
- Tailwind CSS integrated via Vite plugin
- Custom ESLint rule: unused variables starting with capital letters or underscores are ignored

### Development Notes
- Hot module replacement (HMR) enabled via Vite
- React components should use JSX syntax
- Tailwind classes available for styling (e.g., `text-3xl font-bold underline`)
- ESLint will enforce React hooks rules and catch common React issues