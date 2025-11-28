import { CreateWorkoutForm } from '@/src/components/create-workout-form';

export const metadata = {
  title: 'Create New Workout',
  description: 'Start a new workout session',
};

export default function CreateWorkoutPage() {
  return <CreateWorkoutForm />;
}
