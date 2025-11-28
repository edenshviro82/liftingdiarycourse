# Data Mutations Coding Standards

This document outlines the coding standards and guidelines for data mutations (create, update, delete operations) throughout the Lifting Diary Course application.

## Core Principles

**Data mutations MUST follow this strict architecture:**

1. **Helper functions** in `/data` directory wrap database calls via **Drizzle ORM**
2. **Server Actions** in colocated `actions.ts` files handle mutation requests
3. **ALL server action parameters** MUST be properly typed (NO `FormData`)
4. **ALL server actions** MUST validate arguments via **Zod**
5. **User isolation** MUST be enforced on every mutation (users can only mutate their own data)

## Architecture Overview

```
User Browser (Client Component)
    ↓
Server Action (app/feature/actions.ts)
    ├─ Validate input with Zod
    ├─ Authenticate user
    └─ Call helper function
    ↓
Helper Function (/data/feature.ts)
    ├─ Verify user ownership
    ├─ Execute Drizzle ORM mutation
    └─ Return typed result
    ↓
Database (Drizzle ORM)
    ↓
Response back to Client
```

## Directory Structure

```
/data
  ├── db.ts                    (database connection)
  ├── users.ts                 (user mutations)
  ├── workouts.ts              (workout mutations)
  ├── exercises.ts             (exercise mutations)
  └── ...

/app
  ├── /dashboard
  │   ├── page.tsx
  │   └── actions.ts           (dashboard mutations)
  ├── /workouts
  │   ├── page.tsx
  │   ├── [id]
  │   │   ├── page.tsx
  │   │   └── actions.ts       (workout-specific mutations)
  │   └── actions.ts           (workouts list mutations)
  └── ...
```

## Step 1: Define Helper Functions in `/data`

Helper functions in the `/data` directory wrap all database mutations using Drizzle ORM.

### Requirements

- ✅ Located in `/data/*.ts` files
- ✅ Use **Drizzle ORM** exclusively (no raw SQL)
- ✅ Accept typed parameters (NOT FormData)
- ✅ Always verify user ownership before mutating
- ✅ Return typed results
- ✅ Throw descriptive errors on failure

### Example: Create Mutation

```typescript
// data/workouts.ts
import { db } from '@/data/db';
import { workouts } from '@/lib/schema';
import { getCurrentUser } from '@/lib/auth';

export interface CreateWorkoutInput {
  name: string;
  date: Date;
  duration: number; // minutes
}

export interface WorkoutResult {
  id: string;
  name: string;
  date: Date;
  duration: number;
  userId: string;
  createdAt: Date;
}

export async function createWorkout(
  input: CreateWorkoutInput
): Promise<WorkoutResult> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const result = await db
    .insert(workouts)
    .values({
      name: input.name,
      date: input.date,
      duration: input.duration,
      userId: user.id,
    })
    .returning();

  return result[0] as WorkoutResult;
}
```

### Example: Update Mutation

```typescript
// data/workouts.ts
export interface UpdateWorkoutInput {
  id: string;
  name?: string;
  date?: Date;
  duration?: number;
}

export async function updateWorkout(
  input: UpdateWorkoutInput
): Promise<WorkoutResult> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // CRITICAL: Verify user owns this workout
  const existingWorkout = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, input.id),
        eq(workouts.userId, user.id)
      )
    )
    .limit(1);

  if (!existingWorkout[0]) {
    throw new Error('Workout not found or unauthorized');
  }

  const updateData: Partial<typeof workouts.$inferInsert> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.date !== undefined) updateData.date = input.date;
  if (input.duration !== undefined) updateData.duration = input.duration;

  const result = await db
    .update(workouts)
    .set(updateData)
    .where(eq(workouts.id, input.id))
    .returning();

  return result[0] as WorkoutResult;
}
```

### Example: Delete Mutation

```typescript
// data/workouts.ts
export async function deleteWorkout(workoutId: string): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // CRITICAL: Verify user owns this workout before deleting
  const existingWorkout = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, user.id)
      )
    )
    .limit(1);

  if (!existingWorkout[0]) {
    throw new Error('Workout not found or unauthorized');
  }

  await db
    .delete(workouts)
    .where(eq(workouts.id, workoutId));
}
```

## Step 2: Create Server Actions with Zod Validation

Server Actions in colocated `actions.ts` files handle mutation requests and validate all inputs with Zod.

### Requirements

- ✅ Located in `actions.ts` files colocated with features
- ✅ Always marked with `'use server'` directive
- ✅ Accept typed parameters (NO FormData)
- ✅ Use Zod for input validation
- ✅ Return typed results
- ✅ Handle errors gracefully

### Example: Create Server Action

```typescript
// app/workouts/actions.ts
'use server';

import { z } from 'zod';
import { createWorkout, type CreateWorkoutInput } from '@/data/workouts';

// Define Zod schema for validation
const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(255),
  date: z.date(),
  duration: z.number().int().positive('Duration must be a positive number'),
});

// Type inference from Zod schema
type CreateWorkoutPayload = z.infer<typeof createWorkoutSchema>;

export async function createWorkoutAction(
  payload: CreateWorkoutPayload
) {
  try {
    // Validate input with Zod
    const validatedInput = createWorkoutSchema.parse(payload);

    // Call helper function from /data
    const result = await createWorkout(validatedInput);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        issues: error.issues,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
```

### Example: Update Server Action

```typescript
// app/workouts/[id]/actions.ts
'use server';

import { z } from 'zod';
import { updateWorkout } from '@/data/workouts';

const updateWorkoutSchema = z.object({
  id: z.string().uuid('Invalid workout ID'),
  name: z.string().min(1).max(255).optional(),
  date: z.date().optional(),
  duration: z.number().int().positive().optional(),
});

type UpdateWorkoutPayload = z.infer<typeof updateWorkoutSchema>;

export async function updateWorkoutAction(
  payload: UpdateWorkoutPayload
) {
  try {
    const validatedInput = updateWorkoutSchema.parse(payload);

    const result = await updateWorkout(validatedInput);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        issues: error.issues,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
```

### Example: Delete Server Action

```typescript
// app/workouts/[id]/actions.ts
'use server';

import { z } from 'zod';
import { deleteWorkout } from '@/data/workouts';

const deleteWorkoutSchema = z.object({
  id: z.string().uuid('Invalid workout ID'),
});

type DeleteWorkoutPayload = z.infer<typeof deleteWorkoutSchema>;

export async function deleteWorkoutAction(
  payload: DeleteWorkoutPayload
) {
  try {
    const validatedInput = deleteWorkoutSchema.parse(payload);

    await deleteWorkout(validatedInput.id);

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        issues: error.issues,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
```

## Step 3: Use Server Actions in Client Components

Client components call server actions to perform mutations.

### Example: Client Component with Mutation

```typescript
// app/workouts/create-form.tsx
'use client';

import { useState } from 'react';
import { createWorkoutAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CreateWorkoutForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // Extract typed values from form
    const payload = {
      name: formData.get('name') as string,
      date: new Date(formData.get('date') as string),
      duration: parseInt(formData.get('duration') as string),
    };

    try {
      const result = await createWorkoutAction(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Handle success
      console.log('Workout created:', result.data);
      // Revalidate data, redirect, etc.
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="text"
        name="name"
        placeholder="Workout name"
        required
      />
      <Input
        type="date"
        name="date"
        required
      />
      <Input
        type="number"
        name="duration"
        placeholder="Duration (minutes)"
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Workout'}
      </Button>
      {error && <div className="text-red-500">{error}</div>}
    </form>
  );
}
```

## TypeScript Best Practices

### Define Types for All Mutations

```typescript
// data/types.ts
export interface CreateWorkoutInput {
  name: string;
  date: Date;
  duration: number;
}

export interface UpdateWorkoutInput {
  id: string;
  name?: string;
  date?: Date;
  duration?: number;
}

export interface WorkoutResult {
  id: string;
  name: string;
  date: Date;
  duration: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// data/workouts.ts
import type { CreateWorkoutInput, UpdateWorkoutInput, WorkoutResult } from './types';

export async function createWorkout(input: CreateWorkoutInput): Promise<WorkoutResult> {
  // Implementation
}
```

### Use `as const` for Zod Error Handling

```typescript
const errors = {
  nameRequired: 'Workout name is required',
  durationInvalid: 'Duration must be a positive number',
  unauthorized: 'You do not have permission to modify this workout',
} as const;

const schema = z.object({
  name: z.string().min(1, errors.nameRequired),
  duration: z.number().positive(errors.durationInvalid),
});
```

## Security: User Isolation is Mandatory

**Every single mutation MUST verify the user owns the data being mutated.**

### ✅ CORRECT: User Ownership Verified

```typescript
// data/workouts.ts
export async function updateWorkout(input: UpdateWorkoutInput): Promise<WorkoutResult> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  // CRITICAL: Check ownership BEFORE updating
  const existingWorkout = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, input.id),
        eq(workouts.userId, user.id)  // User isolation check
      )
    )
    .limit(1);

  if (!existingWorkout[0]) {
    throw new Error('Workout not found or unauthorized');
  }

  // Now safe to update
  const result = await db
    .update(workouts)
    .set(input)
    .where(eq(workouts.id, input.id))
    .returning();

  return result[0] as WorkoutResult;
}
```

### ❌ INSECURE: User Ownership NOT Verified

```typescript
// NEVER DO THIS
export async function updateWorkout(input: UpdateWorkoutInput): Promise<WorkoutResult> {
  // No user verification - ANYONE could update ANY workout
  const result = await db
    .update(workouts)
    .set(input)
    .where(eq(workouts.id, input.id))
    .returning();

  return result[0] as WorkoutResult;
}
```

## Error Handling

### Structured Error Responses

```typescript
export async function createWorkoutAction(payload: CreateWorkoutPayload) {
  try {
    const validatedInput = createWorkoutSchema.parse(payload);
    const result = await createWorkout(validatedInput);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    // Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        issues: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      };
    }

    // Business logic errors
    if (error instanceof Error) {
      // Don't expose internal error details to client
      const isSecurityError = error.message.includes('Unauthorized') ||
                             error.message.includes('unauthorized');

      return {
        success: false,
        error: isSecurityError
          ? 'You do not have permission to perform this action'
          : error.message,
      };
    }

    // Unexpected errors
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
```

## Validation Rules

### Input Validation with Zod

Always validate:
- ✅ String lengths (min/max)
- ✅ Number ranges
- ✅ Data types
- ✅ UUID/ID formats
- ✅ Enums for fixed values
- ✅ Email formats (if applicable)
- ✅ Required vs optional fields

```typescript
const workoutSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),

  date: z.date()
    .refine(date => date > new Date(), 'Date must be in the future'),

  duration: z.number()
    .int('Duration must be a whole number')
    .positive('Duration must be greater than 0')
    .max(1440, 'Duration cannot exceed 24 hours'),

  type: z.enum(['strength', 'cardio', 'flexibility'], {
    errorMap: () => ({ message: 'Invalid workout type' }),
  }),
});
```

## Code Quality

- Run ESLint before committing: `npm run lint`
- Build the project to catch errors: `npm run build`
- Use TypeScript strict mode for all files
- Keep helper functions focused and reusable
- Document complex business logic

## Anti-Patterns (DO NOT DO)

### ❌ FormData in Server Actions

```typescript
// WRONG - Using FormData directly
export async function createWorkout(formData: FormData) {
  const name = formData.get('name');
  // ...
}
```

### ✅ CORRECT - Use Typed Parameters

```typescript
// CORRECT - Typed parameter with validation
export async function createWorkout(
  payload: CreateWorkoutPayload
) {
  // payload is fully typed
}
```

### ❌ No Validation

```typescript
// WRONG - No Zod validation
export async function updateWorkout(payload: any) {
  await updateWorkoutHelper(payload);
}
```

### ✅ CORRECT - Zod Validation

```typescript
// CORRECT - Full Zod validation
export async function updateWorkout(payload: unknown) {
  const validatedInput = updateWorkoutSchema.parse(payload);
  await updateWorkoutHelper(validatedInput);
}
```

### ❌ Raw SQL Mutations

```typescript
// WRONG - Raw SQL
await db.query('UPDATE workouts SET name = $1 WHERE id = $2', [name, id]);
```

### ✅ CORRECT - Drizzle ORM

```typescript
// CORRECT - Drizzle ORM
await db.update(workouts).set({ name }).where(eq(workouts.id, id));
```

### ❌ Redirect Within Server Actions

```typescript
// WRONG - Using redirect() inside server action
'use server';

import { redirect } from 'next/navigation';

export async function createWorkoutAction(payload: CreateWorkoutPayload) {
  const result = await createWorkout(payload);
  redirect('/workouts'); // ❌ Don't do this
}
```

### ✅ CORRECT - Client-Side Redirect After Server Action

```typescript
// app/workouts/create-form.tsx
'use client';

import { useRouter } from 'next/navigation';
import { createWorkoutAction } from './actions';

export function CreateWorkoutForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name: formData.get('name') as string,
      date: new Date(formData.get('date') as string),
      duration: parseInt(formData.get('duration') as string),
    };

    try {
      const result = await createWorkoutAction(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      // ✅ Redirect happens AFTER server action resolves
      router.push('/workouts');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    // Form JSX
  );
}
```

**Why?** The `redirect()` function in Next.js immediately throws an error that interrupts server action execution. It cannot catch validation errors or return structured responses. Client-side redirects via `useRouter().push()` allow proper error handling and give users feedback before navigating away.

## Summary

| Aspect | Requirement |
|--------|-------------|
| **Helper Location** | `/data/*.ts` files |
| **Database Access** | Drizzle ORM only (no raw SQL) |
| **Server Actions** | Colocated `actions.ts` files |
| **Server Action Directive** | `'use server'` at top of file |
| **Parameter Types** | Fully typed (NO FormData) |
| **Input Validation** | Zod schemas required |
| **User Isolation** | Check ownership on every mutation |
| **Error Handling** | Structured error responses |
| **Return Types** | Always typed results |
| **Security** | Verify authentication & authorization always |

This ensures a secure, maintainable, and consistent data mutation architecture throughout the project.
