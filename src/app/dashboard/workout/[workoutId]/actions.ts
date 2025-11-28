'use server';

import { z } from 'zod';
import { updateWorkout } from '@/src/data/workouts';
import { revalidatePath } from 'next/cache';

// Define Zod schema for validation
const updateWorkoutSchema = z.object({
  id: z.string().uuid('Invalid workout ID'),
  name: z.string()
    .min(1, 'Workout name is required')
    .max(255, 'Workout name must be less than 255 characters')
    .optional(),
  startedAt: z.date().optional(),
});

export async function updateWorkoutAction(payload: unknown) {
  try {
    // Validate input with Zod
    const validatedInput = updateWorkoutSchema.parse(payload);

    // Call helper function from /data
    const result = await updateWorkout(validatedInput);

    // Revalidate the dashboard to show the updated workout
    revalidatePath('/dashboard');

    return {
      success: true,
      data: result,
    };
  } catch (error) {
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

    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
