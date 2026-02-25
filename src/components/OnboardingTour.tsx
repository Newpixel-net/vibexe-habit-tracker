/**
 * OnboardingTour — first-time user walkthrough (4 steps).
 * Uses localStorage to track whether the tour has been shown.
 */

import React, { useState, useEffect } from 'react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
}

const STEPS: OnboardingStep[] = [
  {
    title: 'Create Your Habits',
    description: 'Add habits you want to build. Choose a color and category to stay organized.',
    icon: 'M12 4v16m8-8H4',
  },
  {
    title: 'Track Daily Progress',
    description: 'Tap the circle next to each habit to mark it complete. You can toggle past days too!',
    icon: 'M5 13l4 4L19 7',
  },
  {
    title: 'Build Streaks',
    description: 'Complete habits consistently to build streaks. Hit milestones for celebrations!',
    icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  },
  {
    title: 'Explore Features',
    description: 'Check out the heatmap, insights, focus mode, and weekly reports from the navigation bar.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
];

const TOUR_KEY = 'habit-tracker-onboarding-done';

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_KEY)) {
        setVisible(true);
      }
    } catch {}
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(TOUR_KEY, '1'); } catch {}
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="glass-card rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center animate-scale-in">
        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-indigo-500' : 'w-1.5 bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={current.icon} />
          </svg>
        </div>

        {/* Content */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{current.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">{current.description}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={dismiss}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={next}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {step === STEPS.length - 1 ? "Let's Go!" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
