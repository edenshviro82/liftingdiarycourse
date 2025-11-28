# Authentication Coding Standards

This document outlines the coding standards and guidelines for authentication throughout the Lifting Diary Course project.

## Core Principle

**This application uses Clerk for authentication.** All authentication-related functionality must be implemented using Clerk's official SDKs and APIs. No custom authentication solutions or alternative authentication providers should be used.

## Authentication Setup

### Clerk Integration

Clerk is a modern authentication platform that handles user identity, session management, and security best practices out of the box.

**Official Documentation:** https://clerk.com/docs

### Environment Variables

Required Clerk environment variables must be set in `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## Core Components & Hooks

### What to Use

- ✅ `<ClerkProvider>` - Root provider wrapping the entire application
- ✅ `<SignedIn>` - Render content only for authenticated users
- ✅ `<SignedOut>` - Render content only for unauthenticated users
- ✅ `useAuth()` - Hook to access authentication state and methods
- ✅ `useUser()` - Hook to access current user information
- ✅ `useClerk()` - Hook to access Clerk instance methods
- ✅ `<UserButton>` - Pre-built user profile menu component
- ✅ `<SignInButton>` & `<SignUpButton>` - Pre-built authentication buttons
- ✅ Clerk's middleware for route protection

### What NOT to Use

- ❌ Custom authentication logic
- ❌ Alternative auth providers (Auth0, Firebase Auth, etc.)
- ❌ Manual session management
- ❌ Custom JWT implementation
- ❌ Direct database-stored passwords
- ❌ Third-party auth libraries

## Implementation Patterns

### Protecting Routes

Use Clerk's middleware to protect routes:

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/workouts(.*)',
  '/profile(.*)',
]);

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

### Using useAuth Hook

```typescript
'use client';

import { useAuth } from '@clerk/nextjs';

export function MyComponent() {
  const { userId, isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {userId}</div>;
}
```

### Using useUser Hook

```typescript
'use client';

import { useUser } from '@clerk/nextjs';

export function UserProfile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Not signed in</div>;
  }

  return (
    <div>
      <h1>{user.firstName} {user.lastName}</h1>
      <p>{user.primaryEmailAddress?.emailAddress}</p>
    </div>
  );
}
```

### Conditional Rendering with SignedIn/SignedOut

```typescript
'use client';

import { SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export function AuthStatus() {
  return (
    <>
      <SignedIn>
        <p>You are signed in!</p>
      </SignedIn>
      <SignedOut>
        <Button asChild>
          <a href="/sign-in">Sign In</a>
        </Button>
      </SignedOut>
    </>
  );
}
```

### Adding UserButton to Navigation

```typescript
'use client';

import { UserButton } from '@clerk/nextjs';
import { SignedIn } from '@clerk/nextjs';

export function Navigation() {
  return (
    <nav>
      {/* Navigation items */}
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </nav>
  );
}
```

## API Routes with Authentication

### Protecting API Routes

For API endpoints, use the Clerk server SDK:

```typescript
// app/api/user/profile/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Your protected API logic here
    return NextResponse.json({ userId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

## User Data & Custom Claims

### Storing Custom User Data

Clerk allows storing custom metadata on user objects:

```typescript
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function updateUserMetadata(customData: Record<string, unknown>) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Not authenticated');
  }

  const client = await clerkClient();

  return await client.users.updateUser(userId, {
    unsafeMetadata: customData,
  });
}
```

### Accessing Custom Metadata

```typescript
'use client';

import { useUser } from '@clerk/nextjs';

export function UserSettings() {
  const { user } = useUser();

  const customData = user?.unsafeMetadata as Record<string, unknown>;
  const userPreference = customData?.theme;

  return <div>Your theme: {userPreference}</div>;
}
```

## Authentication UI

### Sign-In Page

Clerk provides pre-built sign-in pages. Create a page at `/sign-in`:

```typescript
// app/sign-in/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn />
    </div>
  );
}
```

### Sign-Up Page

Create a page at `/sign-up`:

```typescript
// app/sign-up/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp />
    </div>
  );
}
```

## Security Best Practices

1. **Always validate user identity** on the server using `auth()`
2. **Never expose secret keys** - keep them in environment variables
3. **Use HTTPS** in production (Clerk enforces this)
4. **Protect sensitive routes** with middleware
5. **Validate API requests** - verify `userId` before processing
6. **Log security events** for monitoring and debugging
7. **Never store passwords** - Clerk handles password security
8. **Use SecureSession** for sensitive operations when needed

## TypeScript & Type Safety

All authentication-related code must use TypeScript:

```typescript
import { useAuth } from '@clerk/nextjs';
import type { User } from '@clerk/nextjs/server';

interface AuthenticatedUser {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export async function getAuthenticatedUser(userId: string): Promise<AuthenticatedUser | null> {
  // Type-safe implementation
  return null;
}
```

## Error Handling

Always handle authentication errors gracefully:

```typescript
'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ProtectedComponent() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return null;
  }

  return <div>Protected content</div>;
}
```

## Code Quality

- Run ESLint before committing: `npm run lint`
- Build the project to catch errors: `npm run build`
- Refer to Clerk's official documentation for advanced features
- Use the `@/*` path alias for imports
- Keep authentication logic in dedicated files/modules

## Summary

1. **Provider:** Clerk is the only authentication solution
2. **Hooks:** Use `useAuth()` and `useUser()` for client-side authentication
3. **Middleware:** Protect routes with Clerk middleware
4. **API Routes:** Use `auth()` to verify server-side requests
5. **UI:** Use pre-built Clerk components (`SignedIn`, `SignedOut`, `UserButton`)
6. **Security:** Always validate on the server, never expose secrets
7. **Type Safety:** Use full TypeScript for authentication code

This ensures a secure, maintainable, and consistent authentication experience throughout the project.
