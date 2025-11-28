# Routing Coding Standards

This document outlines the coding standards and guidelines for routing throughout the Lifting Diary Course application.

## Core Principle

**All application routes must be accessed via `/dashboard` and protected with authentication middleware.** The entire `/dashboard` section and all sub-pages are restricted to authenticated users only. Route protection is implemented using Next.js middleware.

## Route Structure

### Protected Routes

All protected routes must be nested under `/dashboard`:

- `/dashboard` - Main dashboard page (requires authentication)
- `/dashboard/workout/[workoutId]` - Individual workout details
- `/dashboard/workout/[workoutId]/edit` - Edit workout
- `/dashboard/workouts` - List of user's workouts
- Any future feature pages should follow this pattern

### Public Routes

Only authentication-related routes are public:

- `/` - Home page (landing page)
- `/sign-in` - Clerk sign-in page
- `/sign-up` - Clerk sign-up page

## Middleware Configuration

### Route Protection Implementation

Route protection **MUST** be implemented using Next.js middleware with Clerk. Place the middleware configuration in the root `middleware.ts` file:

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define all protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',  // Protects /dashboard and all sub-routes
  '/workouts(.*)',   // If using separate workouts routes
  '/profile(.*)',    // If using separate profile routes
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect specified routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest))(?:.*)|api|trpc)(.*)',
  ],
};
```

### Requirements

- ✅ **All dashboard routes** must be protected with middleware
- ✅ **Middleware must use Clerk** for authentication
- ✅ **Route matchers should be specific** to avoid protecting unintended routes
- ✅ **Public routes** (home, sign-in, sign-up) should NOT be in the protected routes list
- ✅ **API routes** should verify authentication using `auth()` in route handlers

## Page Structure and Organization

### Dashboard Pages

Dashboard pages are server components that must be organized in the `/dashboard` directory:

```
app/
├── dashboard/
│   ├── layout.tsx          # Dashboard layout (shared UI)
│   ├── page.tsx            # Main dashboard page
│   ├── workout/
│   │   ├── [workoutId]/
│   │   │   ├── page.tsx    # Workout detail page
│   │   │   └── edit/
│   │   │       └── page.tsx # Edit workout page
│   │   └── create/
│   │       └── page.tsx    # Create workout page
│   └── profile/
│       └── page.tsx        # User profile page
```

### Dashboard Layout

The dashboard layout should include shared UI elements like navigation, sidebar, etc.:

```typescript
// app/dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { DashboardNav } from '@/components/dashboard-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Double-check authentication at layout level
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-100">
        <DashboardNav />
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

## Page Implementation Patterns

### Basic Dashboard Page

```typescript
// app/dashboard/page.tsx
import { getUserWorkouts } from '@/data/workouts';
import { WorkoutList } from '@/components/workout-list';

export const metadata = {
  title: 'Dashboard',
  description: 'Your lifting workouts and progress',
};

export default async function DashboardPage() {
  // Data is fetched on the server
  const workouts = await getUserWorkouts();

  return (
    <div>
      <h1 className="text-3xl font-bold">Your Workouts</h1>
      <WorkoutList workouts={workouts} />
    </div>
  );
}
```

### Dynamic Route Pages

Always await `params` and verify user ownership:

```typescript
// app/dashboard/workout/[workoutId]/page.tsx
import { getWorkoutById } from '@/data/workouts';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

interface WorkoutPageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

// Generate dynamic metadata
export async function generateMetadata({ params }: WorkoutPageProps): Promise<Metadata> {
  const { workoutId } = await params;
  const workout = await getWorkoutById(workoutId);

  return {
    title: workout?.name ?? 'Workout',
    description: `Details for ${workout?.name ?? 'your workout'}`,
  };
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  // ✅ ALWAYS await params (they are Promises in Next.js 15)
  const { workoutId } = await params;

  // Fetch the workout - this already verifies user ownership
  const workout = await getWorkoutById(workoutId);

  // If workout doesn't exist or user doesn't own it, redirect
  if (!workout) {
    redirect('/dashboard');
  }

  return (
    <div>
      <h1>{workout.name}</h1>
      <p>{workout.description}</p>
      {/* Workout details */}
    </div>
  );
}
```

### Pages with Modals or Client Components

If you need interactive features on a dashboard page, use a client component:

```typescript
// app/dashboard/page.tsx (Server Component)
import { getUserWorkouts } from '@/data/workouts';
import { DashboardClient } from '@/components/dashboard-client'; // Client component

export default async function DashboardPage() {
  const workouts = await getUserWorkouts();

  // Pass data to client component
  return <DashboardClient workouts={workouts} />;
}
```

```typescript
// components/dashboard-client.tsx (Client Component)
'use client';

import { useState } from 'react';
import type { Workout } from '@/types';

interface DashboardClientProps {
  workouts: Workout[];
}

export function DashboardClient({ workouts }: DashboardClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>Create Workout</button>
      {isModalOpen && <CreateWorkoutModal onClose={() => setIsModalOpen(false)} />}
      {/* Other UI */}
    </div>
  );
}
```

## API Routes

API routes that serve dashboard features should also be protected:

```typescript
// app/api/workouts/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getUserWorkouts } from '@/data/workouts';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const workouts = await getUserWorkouts();
    return NextResponse.json(workouts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

## Navigation

### Link to Protected Routes

Use Next.js `Link` component for navigation:

```typescript
'use client';

import Link from 'next/link';

export function DashboardNav() {
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/dashboard/workouts">Workouts</Link>
      <Link href="/dashboard/profile">Profile</Link>
    </nav>
  );
}
```

### Redirect After Authentication

After a user signs in, redirect them to the dashboard:

```typescript
// .env.local or Clerk settings
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## Error Handling and Redirects

### Not Found Handling

If a resource doesn't exist or user doesn't have access, redirect to dashboard:

```typescript
import { redirect } from 'next/navigation';

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { workoutId } = await params;
  const workout = await getWorkoutById(workoutId);

  if (!workout) {
    redirect('/dashboard'); // User doesn't own this or it doesn't exist
  }

  return <div>{workout.name}</div>;
}
```

### Unauthorized Access

Never expose that a resource exists if the user doesn't have access. Always redirect:

```typescript
// ❌ WRONG - Exposes that the resource exists
if (!workout) {
  return <div>404 - Workout not found</div>;
}

// ✅ CORRECT - Silently redirect
if (!workout) {
  redirect('/dashboard');
}
```

## Type Safety

### Define Page Props

Always define typed interfaces for dashboard pages:

```typescript
interface WorkoutPageProps {
  params: Promise<{
    workoutId: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
    sort?: string;
  }>;
}

export default async function WorkoutPage({ params, searchParams }: WorkoutPageProps) {
  const { workoutId } = await params;
  const { tab = 'overview', sort = 'date' } = await searchParams ?? {};

  // TypeScript ensures type safety
  return <div>{workoutId}</div>;
}
```

## URL Structure Best Practices

### Prefer Semantic URLs

- ✅ `/dashboard/workout/123` - Clear hierarchy
- ✅ `/dashboard/workout/123/edit` - Clear action
- ❌ `/app/w/123` - Unclear abbreviations
- ❌ `/dashboard?id=123` - Less semantic

### URL Patterns

- **Resource listing:** `/dashboard/workouts`
- **Resource detail:** `/dashboard/workout/[id]`
- **Resource edit:** `/dashboard/workout/[id]/edit`
- **Resource create:** `/dashboard/workout/create`

## Security Considerations

1. **Always use middleware** to protect routes - never rely on page-level checks alone
2. **Verify user ownership** in data layer functions (`getWorkoutById` should check user)
3. **Never expose resource existence** if user doesn't have access
4. **Use `redirect()`** from `next/navigation` for client-side navigation security
5. **Validate on the server** - don't trust client-side route checks
6. **API routes** must verify authentication with `auth()`

## Common Patterns

### Protecting a Resource

```typescript
// ✅ CORRECT: Check ownership in data layer
const workout = await getWorkoutById(workoutId);
// getWorkoutById already verifies the user owns this workout

if (!workout) {
  redirect('/dashboard');
}
```

### Search Parameters

```typescript
interface PageProps {
  searchParams: Promise<{
    sort?: 'date' | 'name';
    page?: string;
    filter?: string;
  }>;
}

export default async function WorkoutsPage({ searchParams }: PageProps) {
  const { sort = 'date', page = '1', filter } = await searchParams;

  const workouts = await getUserWorkouts({ sort, page: parseInt(page), filter });
  return <div>{/* ... */}</div>;
}
```

### Breadcrumb Navigation

```typescript
interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav>
      {items.map((item, index) => (
        <span key={item.href}>
          <Link href={item.href}>{item.label}</Link>
          {index < items.length - 1 && <span> / </span>}
        </span>
      ))}
    </nav>
  );
}
```

## Anti-Patterns (DO NOT DO)

### ❌ Skipping Middleware Protection

```typescript
// WRONG - Relying only on page-level checks
export default async function WorkoutPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>; // ❌ Should use middleware
  }
}
```

### ❌ Exposing Resource Existence

```typescript
// WRONG
if (!workout) {
  return <div>This workout doesn't exist</div>; // ❌ Reveals existence
}

// ✅ CORRECT
if (!workout) {
  redirect('/dashboard'); // Silently redirect
}
```

### ❌ Hardcoding Routes

```typescript
// WRONG
const url = `/dashboard/workout/${id}`; // ❌ Magic strings

// ✅ CORRECT - Consider using route helpers
function getWorkoutRoute(workoutId: string) {
  return `/dashboard/workout/${workoutId}`;
}
```

### ❌ Client-Side Only Route Protection

```typescript
// WRONG - Route protection in useEffect
export function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in'); // ❌ Too late, page already loaded
    }
  }, []);
}

// ✅ CORRECT - Use middleware for route protection
```

## Testing Routes

### Manual Testing

1. Try accessing `/dashboard` without signing in - should redirect to `/sign-in`
2. Sign in and verify access to `/dashboard`
3. Try accessing `/dashboard/workout/invalid-id` - should redirect to `/dashboard`
4. Verify you can only see your own workouts

### Unit Testing

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

describe('Middleware', () => {
  it('should protect /dashboard routes', () => {
    // Test that middleware protects dashboard routes
    // This requires testing framework setup
  });
});
```

## Summary

| Aspect | Requirement |
|--------|-------------|
| **Protected Routes** | Use middleware with Clerk to protect `/dashboard/*` |
| **Route Structure** | All app routes nested under `/dashboard` |
| **Page Implementation** | Use server components with async data fetching |
| **Dynamic Routes** | Always await `params` in page components |
| **Error Handling** | Redirect silently on 404 or unauthorized access |
| **Type Safety** | Always define PageProps interfaces with `Promise` types |
| **Security** | Verify user ownership in data layer, not page layer |
| **Navigation** | Use `Link` for client-side navigation, `redirect()` for server redirects |
| **API Routes** | Verify authentication with `auth()` before processing |

## Quick Reference

```typescript
// middleware.ts - Protect routes
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest))(?:.*)|api|trpc)(.*)',
  ],
};
```

```typescript
// app/dashboard/page.tsx - Basic dashboard page
import { getUserWorkouts } from '@/data/workouts';

export default async function DashboardPage() {
  const workouts = await getUserWorkouts();
  return <div>Your workouts: {workouts.length}</div>;
}
```

```typescript
// app/dashboard/workout/[workoutId]/page.tsx - Dynamic route
interface PageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

export default async function WorkoutPage({ params }: PageProps) {
  const { workoutId } = await params; // ✅ Always await
  const workout = await getWorkoutById(workoutId);

  if (!workout) {
    redirect('/dashboard'); // ✅ Redirect silently
  }

  return <div>{workout.name}</div>;
}
```

This ensures secure, type-safe, and maintainable routing throughout the project.
