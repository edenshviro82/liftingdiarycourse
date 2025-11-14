"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Calendar as CalendarComponent } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";

interface Workout {
  id: string;
  name: string;
  exercises: number;
  duration: number;
}

const mockWorkouts: Record<string, Workout[]> = {
  "2025-11-14": [
    {
      id: "1",
      name: "Upper Body Strength",
      exercises: 6,
      duration: 75,
    },
    {
      id: "2",
      name: "Chest & Triceps",
      exercises: 5,
      duration: 60,
    },
  ],
  "2025-11-13": [
    {
      id: "3",
      name: "Leg Day",
      exercises: 8,
      duration: 90,
    },
  ],
};

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const workouts = mockWorkouts[dateKey] || [];

  const formatDateDisplay = (date: Date): string => {
    return format(date, "do MMM yyyy");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">View and manage your workouts</p>
        </div>

        {/* Date Picker Card */}
        <Card className="p-6 mb-6 shadow-sm border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Date
              </label>
              <p className="text-2xl font-semibold text-slate-900">
                {formatDateDisplay(selectedDate)}
              </p>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 h-12 px-4"
                  size="lg"
                >
                  <Calendar className="w-5 h-5" />
                  Change Date
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) =>
                    date > new Date() ||
                    date < new Date(new Date().setFullYear(new Date().getFullYear() - 1))
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        </Card>

        {/* Workouts List */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Workouts ({workouts.length})
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {workouts.length === 0
                ? "No workouts logged for this date"
                : `Showing all workouts for ${formatDateDisplay(selectedDate)}`}
            </p>
          </div>

          {workouts.length > 0 ? (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <Card
                  key={workout.id}
                  className="p-4 border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {workout.name}
                      </h3>
                      <div className="flex gap-4 text-sm text-slate-600">
                        <span>{workout.exercises} exercises</span>
                        <span>{workout.duration} min</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 border-slate-200 bg-slate-50">
              <div className="text-center">
                <div className="inline-block p-3 bg-slate-200 rounded-full mb-3">
                  <Calendar className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-slate-600">
                  No workouts logged for {formatDateDisplay(selectedDate)}
                </p>
                <Button className="mt-4">Log a Workout</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
