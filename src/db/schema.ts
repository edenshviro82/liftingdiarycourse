import {
  integer,
  pgTable,
  text,
  timestamp,
  decimal,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Workouts Table
export const workoutsTable = pgTable(
  'workouts',
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text('userId').notNull(),
    name: text("name").notNull(),
    startedAt: timestamp("startedAt").notNull().defaultNow(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdate(()=> new Date()),
  }
);

// Exercises Table
export const exercisesTable = pgTable('exercises', {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdate(()=> new Date()),
});

// Workout Exercises Table (Junction table)
export const workoutExercisesTable = pgTable(
  'workout_exercises',
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workoutId: uuid("workoutId").notNull().references(() => workoutsTable.id, {onDelete: "cascade"}),
    exerciseId: uuid("exerciseId").notNull().references(() => exercisesTable.id) ,
    order: integer("order").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  }
);

// Sets Table
export const setsTable = pgTable(
  'sets',
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workoutExerciseId: uuid("workoutExerciseId").references(() => workoutExercisesTable.id, {onDelete: "cascade"}),
    setNumber: integer("setNumber").notNull(),
    reps: integer("reps"),
    weight: decimal("weight", { precision: 10, scale: 2 }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  }
);

// Relations
export const workoutsRelations = relations(workoutsTable, ({ many }) => ({
  workoutExercises: many(workoutExercisesTable),
}));

export const exercisesRelations = relations(exercisesTable, ({ many }) => ({
  workoutExercises: many(workoutExercisesTable),
}));