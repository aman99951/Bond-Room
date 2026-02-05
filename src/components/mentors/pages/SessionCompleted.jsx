import React, { useState } from 'react';
import { Check, Wallet, Heart, Flag, Clock, Calendar } from 'lucide-react';

const SessionCompleted = () => {
  const [selected, setSelected] = useState(null);

  const cards = [
    {
      id: 'claim',
      title: 'Claim Payment',
      desc: 'Add ₹500 to your payout balance.',
      icon: Wallet,
      tone: 'purple',
    },
    {
      id: 'donate',
      title: 'Donate Session',
      desc: 'Contribute funds to support underprivileged students.',
      icon: Heart,
      tone: 'yellow',
    },
    {
      id: 'report',
      title: 'Report Issue',
      desc: 'Technical issues or student no-show.',
      icon: Flag,
      tone: 'gray',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent p-6 sm:p-10">
      <div className="max-w-[896px] w-full mx-auto rounded-[16px] bg-white shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-[#ece7f6] p-10">
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-[#dcfce7] flex items-center justify-center">
            <Check className="h-6 w-6 text-[#22c55e]" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-[#1f2937]">Session Completed!</h1>
        </div>

        <div className="mt-6 rounded-2xl bg-[#f7fafc] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#374151]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#ec4899] text-white flex items-center justify-center text-xs font-semibold">
              RS
            </div>
            <div className="font-medium">Rahul S.</div>
          </div>
          <div className="hidden sm:block h-6 w-px bg-[#e5e7eb]" />
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-[#6b7280]" />
            45 Minutes
          </div>
          <div className="hidden sm:block h-6 w-px bg-[#e5e7eb]" />
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-[#6b7280]" />
            Oct 24, 2024
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-[#6b7280]">
          This session has been successfully recorded.
        </p>

        <div className="mt-8 text-center">
          <h2 className="text-sm font-semibold text-[#374151]">
            How would you like to process this session?
          </h2>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            const selectedStyle =
              selected === card.id ? 'ring-2 ring-[#5b2c91]' : 'ring-1 ring-transparent';
            const toneStyle =
              card.tone === 'purple'
                ? 'bg-[#efe7ff] text-[#5b2c91]'
                : card.tone === 'yellow'
                ? 'bg-[#fff3c4] text-[#f59e0b]'
                : 'bg-[#f3f4f6] text-[#6b7280]';
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelected(card.id)}
                className={`rounded-2xl bg-white border border-[#e5e7eb] p-5 text-center shadow-[0_8px_18px_rgba(0,0,0,0.06)] ${selectedStyle}`}
              >
                <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${toneStyle}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[#1f2937]">{card.title}</h3>
                <p className="mt-2 text-xs text-[#6b7280]">{card.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            className="w-full sm:w-[320px] rounded-full bg-[#d1d5db] text-white py-3 text-sm font-semibold"
            disabled={!selected}
          >
            Confirm Selection
          </button>
          <button type="button" className="text-sm text-[#6b7280]">
            Need Help?
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionCompleted;
