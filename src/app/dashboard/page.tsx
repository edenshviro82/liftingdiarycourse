import { format } from "date-fns";
import { getUserWorkoutsByDate } from "@/src/data/workouts";
import { DashboardClient } from "@/src/components/dashboard-client";

interface Workout {
  id: string;
  userId: string;
  name: string;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const dateString = params.date;

  // Parse the date from query params or use today
  let selectedDate = new Date();
  if (dateString) {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      selectedDate = parsed;
    }
  }

  // Fetch workouts for the selected date
  let workouts: Workout[] = [];
  let error: string | null = null;

  try {
    workouts = await getUserWorkoutsByDate(selectedDate);
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      error = 'Please sign in to view your workouts';
    } else {
      error = 'Failed to load workouts';
    }
  }

  return (
    <DashboardClient
      initialDate={selectedDate}
      initialWorkouts={workouts}
      error={error}
    />
  );
}
