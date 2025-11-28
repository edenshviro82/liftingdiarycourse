import { getWorkoutById } from '@/src/data/workouts';
import { EditWorkoutForm } from '@/src/components/edit-workout-form';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Edit Workout',
  description: 'Update your workout details',
};

interface WorkoutEditPageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

export default async function WorkoutEditPage({ params }: WorkoutEditPageProps) {
  const { workoutId } = await params;

  // Fetch the workout to ensure it exists and user owns it
  const workout = await getWorkoutById(workoutId);

  if (!workout) {
    redirect('/dashboard');
  }

  return (
    <EditWorkoutForm
      workoutId={workoutId}
      initialName={workout.name}
      initialStartedAt={workout.startedAt}
    />
  );
}
