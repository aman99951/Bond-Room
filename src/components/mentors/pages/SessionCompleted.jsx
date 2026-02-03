import React from 'react';
import { Check, Wallet, Heart, Ban, Info } from 'lucide-react';

const SessionCompleted = () => {
  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="flex flex-col items-center text-center">
        <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5E5E5' }}>
          <Check className="h-6 w-6 text-secondary" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-primary">Session Completed</h1>
      </div>

      <div className="mt-6 rounded-xl border border-default bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-default pb-3 text-sm text-secondary">
          <span className="font-medium text-primary">Session Summary</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 mt-4 text-sm">
          <div>
            <p className="text-xs text-muted">Mentee</p>
            <p className="mt-1 text-primary">Thameena Nasir</p>
          </div>
          <div>
            <p className="text-xs text-muted">Duration</p>
            <p className="mt-1 text-primary">45 Minutes</p>
          </div>
          <div>
            <p className="text-xs text-muted">Date &amp; Time</p>
            <p className="mt-1 text-primary">Oct 24, 2025 · 4:00 PM</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted">
          <Info className="h-4 w-4 text-secondary" aria-hidden="true" />
          <span>This information will be logged in your records automatically once you select an action below.</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-default bg-surface p-6 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Wallet className="h-5 w-5 text-secondary" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-primary">Claim Hours</h3>
          <p className="mt-2 text-xs text-muted">
            Add this session to your payout ledger for monthly reimbursement.
          </p>
        </div>

        <div className="rounded-xl border border-default bg-surface p-6 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Heart className="h-5 w-5 text-secondary" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-primary">Donate Hours</h3>
          <p className="mt-2 text-xs text-muted">
            Contribute the session hours to the Bond Room community fund.
          </p>
        </div>

        <div className="rounded-xl border border-default bg-surface p-6 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Ban className="h-5 w-5 text-secondary" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-primary">Reject Hours</h3>
          <p className="mt-2 text-xs text-muted">
            Record the session without claiming or donating the time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionCompleted;
