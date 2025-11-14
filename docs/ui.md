# UI Coding Standards

This document outlines the coding standards and guidelines for UI development throughout the Lifting Diary Course project.

## Core Principle

**ONLY shadcn/ui components should be used for the UI in this project. ABSOLUTELY NO custom components should be created.**

All UI elements must be built exclusively using shadcn/ui components. This ensures consistency, maintainability, and leverages the well-tested component library.

## Component Usage

### What to Use
- ✅ shadcn/ui components (Button, Card, Input, Dialog, etc.)
- ✅ Composition of shadcn/ui components
- ✅ Tailwind CSS utilities for styling and layout
- ✅ TypeScript for type safety

### What NOT to Use
- ❌ Custom React components for UI
- ❌ Custom CSS components
- ❌ Unstyled HTML elements (use shadcn/ui alternatives)
- ❌ Third-party component libraries (except shadcn/ui)

### Adding New shadcn/ui Components

When you need a component that isn't already in the project:

```bash
npx shadcn-ui@latest add [component-name]
```

Available components can be found at https://ui.shadcn.com/docs/components/

## Date Formatting

All dates must be formatted using **date-fns** library.

### Required Date Format

Dates should be formatted using ordinal day with abbreviated month name:

- `1st Sep 2025`
- `2nd Aug 2025`
- `3rd Jan 2026`
- `4th Jun 2024`

### Implementation Example

```typescript
import { format } from 'date-fns';

const date = new Date(2025, 8, 1); // September 1, 2025

// Format with ordinal day
const formatted = format(date, "do MMM yyyy");
// Output: "1st Sep 2025"
```

### Helper Function (Recommended)

Create a reusable helper function in your utilities:

```typescript
// utils/dateFormat.ts
import { format } from 'date-fns';

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "do MMM yyyy");
};
```

Usage:
```typescript
import { formatDate } from '@/utils/dateFormat';

const displayDate = formatDate(new Date());
// Output: "14th Nov 2025"
```

## Styling Guidelines

### Tailwind CSS
- Use Tailwind's utility classes for all styling
- Follow the existing style patterns in the codebase
- Avoid inline styles or custom CSS
- Reference the global configuration in `tailwind.config.ts`

### Theme & Colors
- Use shadcn/ui's theme variables for consistency
- All colors should come from the design system (defined in `app/globals.css`)
- Maintain accessibility standards with proper contrast ratios

## Project Structure

- **`app/`** - Next.js App Router pages and layouts
- **`components/`** - Only shadcn/ui components and their combinations
- **`lib/`** - Utility functions and helpers
- **`utils/`** - Helper functions like `dateFormat.ts`
- **`public/`** - Static assets

## TypeScript & Type Safety

- All components must use TypeScript
- Define proper types for props
- Use strict type checking
- Avoid `any` types

Example component structure:

```typescript
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <Button onClick={onClick}>
      {title}
    </Button>
  );
}
```

## Code Quality

- Run ESLint before committing: `npm run lint`
- Build the project to catch errors: `npm run build`
- Follow Next.js 16 App Router conventions
- Use the `@/*` path alias for imports

## Summary

1. **Components:** Only shadcn/ui
2. **Styling:** Tailwind CSS utilities
3. **Dates:** date-fns with `"do MMM yyyy"` format
4. **Type Safety:** Full TypeScript usage
5. **Quality:** ESLint and build validation

This ensures a consistent, maintainable, and professional UI throughout the project.
