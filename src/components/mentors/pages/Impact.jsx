import React from 'react';
import { Award, HeartHandshake, Sparkles, Users, TrendingUp } from 'lucide-react';

const Impact = () => {
  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg sm:text-xl font-semibold text-primary">Mentor Impact</h1>
        <p className="text-sm text-muted">
          A snapshot of your contribution, growth, and community reach.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-default bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <Users className="h-4 w-4 text-secondary" aria-hidden="true" />
            </div>
            <span className="text-xs text-muted">Last 30 days</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-primary">18</p>
          <p className="mt-1 text-xs text-muted">Students supported</p>
        </div>

        <div className="rounded-xl border border-default bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <HeartHandshake className="h-4 w-4 text-secondary" aria-hidden="true" />
            </div>
            <span className="text-xs text-muted">This month</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-primary">26.5</p>
          <p className="mt-1 text-xs text-muted">Hours volunteered</p>
        </div>

        <div className="rounded-xl border border-default bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <Award className="h-4 w-4 text-secondary" aria-hidden="true" />
            </div>
            <span className="text-xs text-muted">Overall</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-primary">4.8</p>
          <p className="mt-1 text-xs text-muted">Avg. mentor rating</p>
        </div>

        <div className="rounded-xl border border-default bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-secondary" aria-hidden="true" />
            </div>
            <span className="text-xs text-muted">Growth</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-primary">+14%</p>
          <p className="mt-1 text-xs text-muted">Impact increase</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-default bg-surface p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-primary">Weekly Momentum</h2>
          <div className="mt-5 grid grid-cols-7 gap-3 items-end h-32">
            {[40, 55, 30, 60, 70, 50, 65].map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="w-full rounded-md bg-muted" style={{ height: `${val}px` }} />
                <span className="text-[10px] text-muted">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">
            Your engagement peaked on Friday. Consistent follow-ups improve outcomes.
          </p>
        </div>

        <div className="rounded-xl border border-default bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-primary">Top Outcomes</h2>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Confidence Boost', value: 62 },
              { label: 'Study Planning', value: 48 },
              { label: 'Stress Relief', value: 35 },
              { label: 'Career Clarity', value: 28 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-[#5D3699]" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-default bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-primary">Student Highlights</h2>
            <span className="inline-flex items-center gap-2 text-xs text-muted">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              3 new notes
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {[
              '“Thank you for helping me structure my study routine.”',
              '“I felt heard and supported in our last session.”',
              '“The breathing techniques you taught really helped.”',
            ].map((quote, idx) => (
              <div key={idx} className="rounded-lg border border-default bg-muted/30 p-3 text-xs text-secondary">
                {quote}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-default bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-primary">Next Best Actions</h2>
          <ul className="mt-4 space-y-3 text-xs text-muted">
            <li className="rounded-lg border border-default bg-muted/30 p-3">Follow up with 3 students from last week.</li>
            <li className="rounded-lg border border-default bg-muted/30 p-3">Complete the “Working with Teens” training module.</li>
            <li className="rounded-lg border border-default bg-muted/30 p-3">Share your availability for the next 2 weeks.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Impact;
