# Server Components Coding Standards

This document outlines the coding standards and guidelines for server components throughout the Lifting Diary Course application.

## Critical: Params Must Be Awaited

**This is a Next.js 15 project where `params` are async and MUST be awaited.**

In Next.js 15+, route parameters are passed as Promises. You **MUST** await them before accessing their values. This is a breaking change from earlier Next.js versions.

### ✅ CORRECT: Await params

```typescript
interface PageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

export default async function WorkoutPage({ params }: PageProps) {
  // CRITICAL: Await params before accessing
  const { workoutId } = await params;

  // Now you can use workoutId
  const workout = await getWorkoutById(workoutId);

  return <div>{workout.name}</div>;
}
```

### ❌ INCORRECT: Accessing params without awaiting

```typescript
// WRONG - Will cause TypeScript errors and runtime issues
export default async function WorkoutPage({ params }: PageProps) {
  // This will fail - params is a Promise
  const { workoutId } = params; // ❌ params.workoutId is a Promise

  const workout = await getWorkoutById(workoutId); // ❌ Passes Promise instead of string
  return <div>{workout.name}</div>;
}
```

## Server Component Patterns

### Basic Server Component Structure

```typescript
// app/feature/page.tsx
import { Button } from '@/components/ui/button';
import { fetchData } from '@/data/feature';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    sort?: string;
    filter?: string;
  }>;
}

export const metadata = {
  title: 'Feature Page',
  description: 'Description of the feature page',
};

export default async function FeaturePage({ params, searchParams }: PageProps) {
  // Always await params and searchParams
  const { id } = await params;
  const { sort, filter } = await searchParams;

  // Fetch server-side data
  const data = await fetchData(id);

  if (!data) {
    return <div>Not found</div>;
  }

  return (
    <div>
      <h1>{data.title}</h1>
      {/* Rest of component */}
    </div>
  );
}
```

### Accessing Dynamic Route Params

```typescript
// app/dashboard/workout/[workoutId]/page.tsx
import { getWorkoutById } from '@/data/workouts';

interface WorkoutPageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  // ✅ ALWAYS await params
  const { workoutId } = await params;

  // Now safely use workoutId
  const workout = await getWorkoutById(workoutId);

  if (!workout) {
    redirect('/dashboard');
  }

  return <div>{workout.name}</div>;
}
```

### Accessing Multiple Dynamic Segments

```typescript
// app/exercises/[workoutId]/[exerciseId]/page.tsx
interface ExercisePageProps {
  params: Promise<{
    workoutId: string;
    exerciseId: string;
  }>;
}

export default async function ExercisePage({ params }: ExercisePageProps) {
  // ✅ Await and destructure multiple params
  const { workoutId, exerciseId } = await params;

  const exercise = await getExerciseById(exerciseId);

  // Verify user owns both the workout and exercise
  if (!exercise || exercise.workoutId !== workoutId) {
    redirect('/dashboard');
  }

  return <div>{exercise.name}</div>;
}
```

### Accessing Search Parameters

```typescript
// app/workouts/page.tsx
interface WorkoutsPageProps {
  searchParams: Promise<{
    sort?: string;
    page?: string;
    filter?: string;
  }>;
}

export default async function WorkoutsPage({ searchParams }: WorkoutsPageProps) {
  // ✅ ALWAYS await searchParams
  const { sort = 'date', page = '1', filter } = await searchParams;

  const pageNum = parseInt(page);
  const workouts = await getWorkouts({
    sort,
    page: pageNum,
    filter,
  });

  return (
    <div>
      {workouts.map((workout) => (
        <div key={workout.id}>{workout.name}</div>
      ))}
    </div>
  );
}
```

## Data Fetching in Server Components

### Requirements

- ✅ All async operations must use `await`
- ✅ Import data functions from `/data` directory
- ✅ Never fetch data in client components using `useEffect`
- ✅ Use Suspense for streaming UI when appropriate
- ✅ Handle errors gracefully (redirects, error boundaries, etc.)

### Example: Fetch and Display

```typescript
// app/dashboard/page.tsx
import { getUserWorkouts } from '@/data/workouts';
import { WorkoutList } from '@/components/workout-list';

export default async function DashboardPage() {
  const workouts = await getUserWorkouts();

  return (
    <div>
      <h1>Your Workouts</h1>
      <WorkoutList workouts={workouts} />
    </div>
  );
}
```

### Error Handling

```typescript
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ItemPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const item = await getItemById(id);

    if (!item) {
      redirect('/not-found');
    }

    return <div>{item.name}</div>;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        redirect('/login');
      }
    }

    throw error; // Re-throw unexpected errors
  }
}
```

## Client Components in Server Components

### Using Client Components in Server Components

```typescript
// app/dashboard/page.tsx (Server Component)
import { DashboardClient } from '@/components/dashboard-client'; // 'use client'
import { getUserWorkouts } from '@/data/workouts';

export default async function DashboardPage() {
  // Fetch data on the server
  const workouts = await getUserWorkouts();

  // Pass data to client component as props
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
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  return (
    <div>
      {/* Interactive UI that uses state, effects, etc. */}
    </div>
  );
}
```

### Requirements

- ✅ Server components fetch data and pass as props
- ✅ Client components receive data and handle interactivity
- ✅ Never use `useEffect` to fetch data from server components
- ✅ Pass only serializable data to client components

## Metadata in Server Components

```typescript
import type { Metadata } from 'next';
import { getWorkoutById } from '@/data/workouts';

interface PageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

// Dynamic metadata based on params
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { workoutId } = await params;
  const workout = await getWorkoutById(workoutId);

  return {
    title: workout?.name ?? 'Workout',
    description: `Details for ${workout?.name ?? 'your workout'}`,
  };
}

export default async function WorkoutPage({ params }: PageProps) {
  const { workoutId } = await params;
  const workout = await getWorkoutById(workoutId);

  return <div>{workout?.name}</div>;
}
```

## Type Safety

### Define Props Interfaces

Always define typed interfaces for page props:

```typescript
interface PageProps {
  params: Promise<{
    userId: string;
    postId: string;
  }>;
  searchParams: Promise<{
    tab?: string;
    sort?: 'asc' | 'desc';
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { userId, postId } = await params;
  const { tab, sort } = await searchParams;

  // TypeScript knows the types of these variables
  return <div>{userId} - {postId}</div>;
}
```

### Use Generics for Reusable Patterns

```typescript
// utils/page-params.ts
export interface DynamicPageProps<T extends Record<string, string>> {
  params: Promise<T>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Usage
import type { DynamicPageProps } from '@/utils/page-params';

interface WorkoutParams {
  workoutId: string;
}

export default async function Page(props: DynamicPageProps<WorkoutParams>) {
  const { workoutId } = await props.params;
  // ...
}
```

## Common Patterns

### Verify User Ownership

```typescript
interface PageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

export default async function WorkoutPage({ params }: PageProps) {
  const { workoutId } = await params;

  // getWorkoutById already verifies user ownership
  const workout = await getWorkoutById(workoutId);

  if (!workout) {
    // User doesn't own this workout or it doesn't exist
    redirect('/dashboard');
  }

  return <div>{workout.name}</div>;
}
```

### Conditional Rendering Based on Data

```typescript
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const data = await getData(id);

  if (!data) {
    return <NotFoundMessage />;
  }

  if (data.status === 'draft') {
    return <DraftPreview data={data} />;
  }

  return <PublishedView data={data} />;
}
```

## Anti-Patterns (DO NOT DO)

### ❌ Accessing params without await

```typescript
// WRONG
export default async function Page({ params }: PageProps) {
  const { id } = params; // ❌ params is a Promise, not an object
  return <div>{id}</div>;
}
```

### ❌ Using useEffect in server components

```typescript
// WRONG - useEffect is a client-side hook
export default async function Page() {
  useEffect(() => { // ❌ Can't use hooks in server components
    fetchData();
  }, []);
}
```

### ❌ Mixing async/await with improper error handling

```typescript
// WRONG - No error handling
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchData(id); // ❌ What if this throws?
  return <div>{data.name}</div>;
}
```

### ✅ CORRECT - Proper error handling

```typescript
export default async function Page({ params }: PageProps) {
  const { id } = await params;

  try {
    const data = await fetchData(id);
    return <div>{data.name}</div>;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return <NotFound />;
    }
    throw error;
  }
}
```

### ❌ Passing non-serializable data to client components

```typescript
// WRONG
const data = {
  date: new Date(), // ❌ Not serializable
  callback: () => {}, // ❌ Functions can't be passed to client
};

return <ClientComponent data={data} />;
```

### ✅ CORRECT - Serialize data properly

```typescript
const data = {
  date: dateObj.toISOString(), // ✅ String representation
  // ❌ Don't pass callbacks to client components
};

return <ClientComponent data={data} />;
```

## Summary

| Aspect | Requirement |
|--------|-------------|
| **params** | MUST be awaited (they are Promises in Next.js 15) |
| **searchParams** | MUST be awaited |
| **Data Fetching** | Always use await with async functions |
| **Error Handling** | Use try/catch or let errors propagate |
| **Type Safety** | Always define PageProps interfaces |
| **Client Components** | Fetch data in server component, pass as props |
| **Metadata** | Use generateMetadata for dynamic metadata |
| **Redirects** | Use `redirect()` from next/navigation for navigation |

## Quick Reference

```typescript
// Template for dynamic route page
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getData } from '@/data/feature';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getData(id);
  return {
    title: data?.title ?? 'Page',
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  // ✅ Always await
  const { id } = await params;
  const { tab } = await searchParams;

  // ✅ Fetch data
  const data = await getData(id);

  // ✅ Handle errors
  if (!data) {
    redirect('/');
  }

  return <div>{data.title}</div>;
}
```

This ensures consistent, type-safe, and maintainable server components throughout the project.
