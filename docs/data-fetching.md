# Data Fetching Guidelines

## Core Principle

**ALL data fetching within this application MUST be done via Server Components ONLY.**

Data fetching is strictly prohibited in:
- ❌ Route handlers
- ❌ Client components
- ❌ API routes
- ❌ Any other location

Violating this rule will result in security issues, data leaks, and architectural problems.

## Data Fetching Architecture

### 1. Server Components Only

All data fetching must occur in Server Components. Server Components have direct access to:
- Database connections
- Environment variables
- Secrets and API keys
- Sensitive authentication tokens

**Example:**

```tsx
// app/dashboard/page.tsx - Server Component
import { getUserWorkouts } from '@/data/workouts';

export default async function DashboardPage() {
  // Data fetching directly in server component
  const workouts = await getUserWorkouts();

  return (
    <div>
      {/* Render workouts */}
    </div>
  );
}
```

### 2. Database Queries via Helper Functions

All database queries **MUST** be performed through helper functions located in the `/data` directory.

**Location:** `/data/*.ts`

**Requirements:**
- Use **Drizzle ORM** for all database queries
- **DO NOT use raw SQL queries** under any circumstances
- Helper functions must be pure, reusable, and testable
- Export these functions for use in Server Components

**Example Structure:**

```
/data
  ├── users.ts        (user-related queries)
  ├── workouts.ts     (workout-related queries)
  ├── exercises.ts    (exercise-related queries)
  └── db.ts           (database connection setup)
```

**Example Helper Function:**

```ts
// data/workouts.ts
import { db } from '@/data/db';
import { workouts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function getUserWorkouts() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, user.id));
}

export async function getWorkoutById(workoutId: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // CRITICAL: Always filter by userId to ensure user can only access their own data
  const workout = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, user.id)
      )
    )
    .limit(1);

  return workout[0] || null;
}
```

## Security: User Data Isolation

### CRITICAL REQUIREMENT: Users Can Only Access Their Own Data

Every single database query in the `/data` directory helper functions **MUST** include a user isolation check.

**This is not optional. This is mandatory for security.**

### Implementation Pattern

1. **Always get the current user:**
   ```ts
   const user = await getCurrentUser();
   if (!user) throw new Error('Unauthorized');
   ```

2. **Always filter by userId:**
   ```ts
   where(eq(table.userId, user.id))
   ```

3. **Never trust client-side user IDs:**
   - Client cannot be trusted to provide their user ID
   - Server must always determine the current user
   - Use authentication middleware to verify identity

**Example of WRONG approach:**
```ts
// ❌ INSECURE - Accepts userId from query parameter
export async function getWorkout(userId: string, workoutId: string) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId));
}
```

**Example of CORRECT approach:**
```ts
// ✅ SECURE - Uses authenticated user session
export async function getWorkout(workoutId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  return db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, user.id) // User isolation
      )
    )
    .limit(1);
}
```

## Flow Diagram

```
User Browser
    ↓
Server Component (app/page.tsx)
    ↓
Helper Function (/data/workouts.ts)
    ├─ Authenticate user
    ├─ Query database with Drizzle ORM
    └─ Filter by userId (CRITICAL)
    ↓
Database Response
    ↓
Render HTML & Send to Browser
```

## Anti-Patterns (DO NOT DO)

### ❌ Route Handlers for Data Fetching

```ts
// app/api/workouts/route.ts - DO NOT DO THIS
export async function GET(request: Request) {
  const data = await db.select().from(workouts);
  return Response.json(data);
}
```

### ❌ Client-Side Data Fetching

```tsx
// app/dashboard/page.tsx - DO NOT DO THIS
'use client';

export default function Dashboard() {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    fetch('/api/workouts').then(r => r.json()).then(setWorkouts);
  }, []);
}
```

### ❌ Raw SQL Queries

```ts
// DO NOT DO THIS
const result = await db.query(`
  SELECT * FROM workouts WHERE user_id = $1
`, [userId]);
```

## Best Practices

1. **Keep helper functions focused** - One responsibility per function
2. **Use TypeScript types** - Add return types to all helper functions
3. **Handle errors gracefully** - Throw descriptive errors for unauthorized access
4. **Cache when appropriate** - Use Next.js `cache()` for frequently accessed data
5. **Validate inputs** - Even though client input is not trusted, validate what you receive
6. **Never expose sensitive data** - Filter out passwords, tokens, etc. before returning

**Example with types and caching:**

```ts
import { cache } from 'react';
import { Workout } from '@/lib/types';

export const getCachedUserWorkouts = cache(
  async (): Promise<Workout[]> => {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    return db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, user.id));
  }
);
```

## Summary

| Aspect | Requirement |
|--------|-------------|
| **Where to fetch data** | Server Components only |
| **Database queries** | Via `/data/*.ts` helper functions |
| **ORM** | Drizzle ORM (no raw SQL) |
| **Authentication** | Always check current user |
| **User isolation** | Always filter by userId |
| **Client-side data** | Never use Route Handlers |
| **Data leaks** | Verify no user can access others' data |
