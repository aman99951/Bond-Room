import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Shield, GraduationCap, Users, Circle, RefreshCcw, ArrowLeft } from 'lucide-react';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';

const TrainingModules = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-20 py-8 sm:py-10">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-primary">Training Modules</h2>
              <p className="mt-1 text-sm text-muted">
                Complete all modules to unlock the final quiz and activate your account.
              </p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-xl border border-default bg-surface px-4 py-3 shadow-sm">
              <div className="relative h-10 w-10 rounded-full border border-default flex items-center justify-center">
                <span className="text-xs text-secondary">50%</span>
                <Circle className="absolute inset-0 h-10 w-10 text-muted" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">2 of 4 Completed</p>
                <p className="text-xs text-muted">Keep going!</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-default bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-secondary" aria-hidden="true" />
                </div>
                <span className="inline-flex rounded-md bg-muted text-xs text-muted px-2 py-0.5">Completed</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-primary">Active Listening Basics</h3>
              <p className="mt-2 text-xs text-muted">
                Learn the core techniques of listening without judgment and validating feelings.
              </p>
              <button type="button" className="mt-4 w-full rounded-md border border-default py-2 text-xs text-secondary">
                <RefreshCcw className="inline h-3 w-3 mr-2" aria-hidden="true" />
                Review
              </button>
            </div>

            <div className="rounded-xl border border-default bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                  <Shield className="h-4 w-4 text-secondary" aria-hidden="true" />
                </div>
                <span className="inline-flex rounded-md bg-muted text-xs text-muted px-2 py-0.5">Completed</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-primary">Emotional Safety Protocols</h3>
              <p className="mt-2 text-xs text-muted">
                Guidelines on creating a safe space and handling sensitive disclosures.
              </p>
              <button type="button" className="mt-4 w-full rounded-md border border-default py-2 text-xs text-secondary">
                <RefreshCcw className="inline h-3 w-3 mr-2" aria-hidden="true" />
                Review
              </button>
            </div>

            <div className="rounded-xl border border-default bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-secondary" aria-hidden="true" />
                </div>
                <span className="inline-flex rounded-md bg-[#5D3699] text-white text-xs px-2 py-0.5">In Progress</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-primary">Boundaries & Ethics</h3>
              <p className="mt-2 text-xs text-muted">
                Understanding the professional boundaries between mentor and mentee.
              </p>
              <div className="mt-4 h-1.5 w-full rounded-full bg-muted">
                <div className="h-1.5 w-2/3 rounded-full bg-[#5D3699]" />
              </div>
              <button
                type="button"
                className="mt-4 w-full rounded-md bg-[#5D3699] text-white py-2 text-xs"
                onClick={() => navigate('/mentor-training-boundaries')}
              >
                Continue →
              </button>
            </div>

            <div className="rounded-xl border border-default bg-surface p-5 shadow-sm opacity-60">
              <div className="flex items-start justify-between">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                  <Users className="h-4 w-4 text-secondary" aria-hidden="true" />
                </div>
                <span className="inline-flex rounded-md bg-muted text-xs text-muted px-2 py-0.5">Locked</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-primary">Working with Teens</h3>
              <p className="mt-2 text-xs text-muted">
                Developmental psychology basics relevant to teenage mentorship.
              </p>
              <button type="button" className="mt-4 w-full rounded-md border border-default py-2 text-xs text-muted" disabled>
                Start
              </button>
            </div>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default TrainingModules;
