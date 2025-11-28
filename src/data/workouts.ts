import db from '@/src/db';
import { workoutsTable } from '@/src/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * Get all workouts for the currently logged in user for a specific date
 */
export async function getUserWorkoutsByDate(date: Date) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Create start and end timestamps for the day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await db
    .select()
    .from(workoutsTable)
    .where(
      and(
        eq(workoutsTable.userId, user.id),
        gte(workoutsTable.startedAt, startOfDay),
        lt(workoutsTable.startedAt, endOfDay)
      )
    )
    .orderBy(workoutsTable.startedAt);
}

/**
 * Get all workouts for the currently logged in user
 */
export async function getUserWorkouts() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return await db
    .select()
    .from(workoutsTable)
    .where(eq(workoutsTable.userId, user.id))
    .orderBy(workoutsTable.startedAt);
}

/**
 * Get a specific workout by ID (with user isolation check)
 */
export async function getWorkoutById(workoutId: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const workout = await db
    .select()
    .from(workoutsTable)
    .where(
      and(
        eq(workoutsTable.id, workoutId),
        eq(workoutsTable.userId, user.id)
      )
    )
    .limit(1);

  return workout[0] || null;
}

/**
 * Create a new workout for the currently logged in user
 */
export interface CreateWorkoutInput {
  name: string;
  startedAt: Date;
}

export async function createWorkout(input: CreateWorkoutInput) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const result = await db
    .insert(workoutsTable)
    .values({
      name: input.name,
      startedAt: input.startedAt,
      userId: user.id,
    })
    .returning();

  return result[0];
}
