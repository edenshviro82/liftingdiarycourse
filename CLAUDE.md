# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a lifting diary course application built with **Next.js 16** using the App Router. It's a modern React-based web application with TypeScript, Tailwind CSS for styling, and ESLint for code quality.

## Development Commands

- **`npm run dev`** - Start the development server (runs on http://localhost:3000)
- **`npm run build`** - Build the application for production
- **`npm start`** - Start the production server
- **`npm run lint`** - Run ESLint to check code quality

## Architecture

### Directory Structure
- **`app/`** - Next.js App Router application directory containing pages and layout
  - **`page.tsx`** - The main home page component
  - **`layout.tsx`** - Root layout wrapping all pages
  - **`globals.css`** - Global styles (includes Tailwind directives)
- **`public/`** - Static assets (images, icons)

### Styling
- **Tailwind CSS v4** with PostCSS integration
- All CSS is configured through `postcss.config.mjs`
- Global styles imported in `app/globals.css`

### TypeScript Configuration
- **Target:** ES2017
- **Module resolution:** bundler
- **Path alias:** `@/*` maps to root directory
- Strict type checking enabled

### Linting & Code Quality
- **ESLint v9** with Next.js configuration
- Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Configuration in `eslint.config.mjs` (modern flat config format)
- Ignores: `.next/`, `out/`, `build/`, and `next-env.d.ts`

## Tech Stack
- **React 19.2.0** - UI library
- **Next.js 16.0.1** - Full-stack framework
- **TypeScript 5** - Static typing
- **Tailwind CSS 4** - Utility-first CSS
- **ESLint 9** - Code linting

## Code Generation Guidelines

**IMPORTANT:** Before generating any code, Claude Code MUST:
1. **Check the `/docs` directory** for relevant documentation files
2. **Read and refer to the appropriate docs** that relate to the feature or component being implemented
3. **Follow patterns and standards** outlined in the documentation
4. **Only generate code after understanding** the documented approach and conventions for that feature area

This ensures consistency, maintainability, and adherence to project-specific patterns and best practices:

- /docs/ui.md
- /docs/data-fetching.md
- /docs/auth.md
- /docs/data-mutations.md
- /docs/server-component.md
- /docs/routing.md
## Key Notes
- This is an early-stage project (v0.1.0) with basic Next.js boilerplate setup
- Focus on extending the app in the `app/` directory following Next.js App Router conventions
- Use Tailwind's utility classes for styling (no custom CSS files needed unless for specific needs)
