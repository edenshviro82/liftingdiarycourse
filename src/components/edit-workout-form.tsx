'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateWorkoutAction } from '@/src/app/dashboard/workout/[workoutId]/actions';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card } from '@/src/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface EditWorkoutFormProps {
  workoutId: string;
  initialName: string;
  initialStartedAt: Date;
  onSuccess?: () => void;
}

interface ValidationIssue {
  path: string;
  message: string;
}

export function EditWorkoutForm({
  workoutId,
  initialName,
  initialStartedAt,
  onSuccess,
}: EditWorkoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Format the initial datetime for the input field
  const [startedAtValue, setStartedAtValue] = useState(() => {
    const date = new Date(initialStartedAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });

  const [name, setName] = useState(initialName);

  const handleNameChange = (value: string) => {
    setName(value);
    setIsDirty(true);
  };

  const handleDateChange = (value: string) => {
    setStartedAtValue(value);
    setIsDirty(true);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setValidationIssues([]);
    setLoading(true);

    // Parse the datetime-local input
    const startedAt = new Date(startedAtValue);

    const payload = {
      id: workoutId,
      name: name || undefined,
      startedAt: startedAt || undefined,
    };

    try {
      const result = await updateWorkoutAction(payload);

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Edit Workout</h1>
          <p className="text-slate-600">Update your workout details</p>
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
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Upper Body Day, Cardio Session"
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
                value={startedAtValue}
                onChange={(e) => handleDateChange(e.target.value)}
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
                disabled={loading || !isDirty}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Workout'
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
      </div>
    </div>
  );
}
