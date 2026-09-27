import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

interface StepItem {
  id: number;
  label: string;
}

const STEPS: StepItem[] = [
  { id: 1, label: 'Understanding your trip' },
  { id: 2, label: 'Planning destinations' },
  { id: 3, label: 'Organizing your days' },
  { id: 4, label: 'Optimizing your schedule' },
];

export const LoadingState: React.FC<LoadingStateProps> = () => {
  // Current active step index (0 to 3)
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(20);

  useEffect(() => {
    // Progressively advance through the 4 steps
    const stepInterval = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          const next = prev + 1;
          setProgressPercent(Math.min(92, 25 * (next + 1)));
          return next;
        }
        return prev;
      });
    }, 1200);

    return () => clearInterval(stepInterval);
  }, []);

  return (
    <div className="loading-view-container" role="status" aria-live="polite">
      <div className="loading-card">
        <h3 className="loading-card-title">Building your itinerary</h3>

        <div className="loading-steps-list">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeStepIndex;
            const isActive = idx === activeStepIndex;

            return (
              <div
                key={step.id}
                className={`loading-step-item ${
                  isCompleted ? 'completed' : isActive ? 'active' : 'pending'
                }`}
              >
                <div className="loading-step-icon">
                  {isCompleted ? (
                    <span className="loading-step-icon check">
                      <Check size={16} strokeWidth={2.5} />
                    </span>
                  ) : isActive ? (
                    <span className="loading-step-icon active-dot" />
                  ) : (
                    <span className="loading-step-icon pending-circle" />
                  )}
                </div>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar (Slide 03) */}
        <div className="loading-progress-track">
          <div
            className="loading-progress-bar"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
