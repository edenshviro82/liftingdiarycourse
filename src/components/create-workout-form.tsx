'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createWorkoutAction } from '@/src/app/dashboard/workout/new/actions';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card } from '@/src/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface CreateWorkoutFormProps {
  onSuccess?: () => void;
}

interface ValidationIssue {
  path: string;
  message: string;
}

export function CreateWorkoutForm({ onSuccess }: CreateWorkoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setValidationIssues([]);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // Extract typed values from form
    const workoutName = formData.get('name') as string;
    const startedAtStr = formData.get('startedAt') as string;

    // Parse the datetime-local input
    const startedAt = new Date(startedAtStr);

    const payload = {
      name: workoutName,
      startedAt,
    };

    try {
      const result = await createWorkoutAction(payload);

      if (!result.success) {
        if ('issues' in result && result.issues) {
          setValidationIssues(result.issues);
        } else if ('error' in result && result.error) {
          setError(result.error);
        } else {
          setError('An unexpected error occurred');
        }
        return;
      }

      // Handle success
      if (onSuccess) {
        onSuccess();
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getFieldError = (fieldPath: string): string | undefined => {
    return validationIssues.find(issue => issue.path === fieldPath)?.message;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Workout</h1>
          <p className="text-slate-600">Start a new workout session</p>
        </div>

        {/* Form Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Workout Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Workout Name *
              </label>
              <Input
                id="name"
                type="text"
                name="name"
                placeholder="e.g., Upper Body Day, Cardio Session"
                required
                disabled={loading}
                className={getFieldError('name') ? 'border-red-500' : ''}
              />
              {getFieldError('name') && (
                <p className="text-sm text-red-600">{getFieldError('name')}</p>
              )}
            </div>

            {/* Start Time Field */}
            <div className="space-y-2">
              <label htmlFor="startedAt" className="block text-sm font-medium text-slate-700">
                Start Time *
              </label>
              <Input
                id="startedAt"
                type="datetime-local"
                name="startedAt"
                required
                disabled={loading}
                className={getFieldError('startedAt') ? 'border-red-500' : ''}
              />
              {getFieldError('startedAt') && (
                <p className="text-sm text-red-600">{getFieldError('startedAt')}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Workout'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> You can add exercises and sets to this workout after creating it.
          </p>
        </div>
      </div>
    </div>
  );
}
