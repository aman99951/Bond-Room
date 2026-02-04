import React from 'react';

const Profile = () => {
  return (
    <div className="bg-transparent p-4 sm:p-6">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 sm:p-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src="https://cdn.pixabay.com/photo/2023/02/24/00/41/ai-generated-7809879_960_720.jpg"
                alt=""
                className="h-20 w-20 rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#f4c542]">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#111827]" aria-hidden="true">
                  <path
                    d="M4 20l4.5-1 9-9a1.4 1.4 0 0 0 0-2L16 5.5a1.4 1.4 0 0 0-2 0l-9 9L4 20z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  className="text-[12px] font-semibold uppercase tracking-[0.7px] text-[#6b7280]"
                  style={{ fontFamily: 'Inter' }}
                >
                  Full Name
                </label>
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-[#d1d5db] px-3 text-[14px] text-[#111827]"
                  style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}
                  value="Ananya Sharma"
                  readOnly
                />
              </div>
              <div>
                <label
                  className="text-[12px] font-semibold uppercase tracking-[0.7px] text-[#6b7280]"
                  style={{ fontFamily: 'Inter' }}
                >
                  Email
                </label>
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-[#d1d5db] px-3 text-[14px] text-[#111827]"
                  style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}
                  value="ananya.sharma@example.com"
                  readOnly
                />
              </div>
              <div>
                <label
                  className="text-[12px] font-semibold uppercase tracking-[0.7px] text-[#6b7280]"
                  style={{ fontFamily: 'Inter' }}
                >
                  Grade / Class
                </label>
                <div className="mt-1 flex h-10 w-full items-center justify-between rounded-lg border border-[#d1d5db] px-3 text-[14px] text-[#111827]">
                  <span style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>11th Grade</span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#6b7280]" aria-hidden="true">
                    <path
                      d="M6 9l6 6 6-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <label
                  className="text-[12px] font-semibold uppercase tracking-[0.7px] text-[#6b7280]"
                  style={{ fontFamily: 'Inter' }}
                >
                  Parent&apos;s Mobile Number
                </label>
                <div className="mt-1 flex h-10 w-full items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-3 text-[14px] text-[#111827]">
                  <span style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>+91 98765 43210</span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#9ca3af]" aria-hidden="true">
                    <path
                      d="M7 10V8a5 5 0 0 1 10 0v2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-[#eef2f7] pt-6">
              <div className="flex flex-col gap-3 rounded-xl border border-[#e5d9f5] bg-[#f7f2ff] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[16px] font-semibold text-[#111827]" style={{ fontFamily: 'Inter', lineHeight: '24px' }}>
                    Mood & Needs Assessment
                  </div>
                  <div className="mt-1 text-[14px] text-[#6b7280]" style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>
                    Last taken on 15 Nov 2025. Current Focus:{' '}
                    <span className="text-[#5D3699]" style={{ fontWeight: 500 }}>
                      Academic Stress
                    </span>
                  </div>
                </div>
                <button
                  className="h-9 rounded-lg border border-[#5D3699] px-4 text-[14px] text-[#5D3699]"
                  style={{ fontFamily: 'DM Sans', lineHeight: '20px', fontWeight: 500 }}
                >
                  Retake Assessment
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-[16px] font-semibold text-[#111827]" style={{ fontFamily: 'Inter', lineHeight: '24px' }}>
                Session Preferences
              </div>
              <div className="mt-1 text-[14px] text-[#6b7280]" style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>
                Help us find the best mentors for you.
              </div>

              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-[14px] text-[#6b7280]" style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>
                    Comfort level talking to new people
                  </div>
                  <div className="relative mt-3 h-1 rounded-full bg-[#e5e7eb]">
                    <div className="absolute left-1/2 -top-2 h-4 w-4 -translate-x-1/2 rounded-full bg-[#5D3699]" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[12px] text-[#9ca3af]" style={{ fontFamily: 'DM Sans' }}>
                    <span>Very Shy</span>
                    <span>Neutral</span>
                    <span>Very Outgoing</span>
                  </div>
                </div>
                <div>
                  <div className="text-[14px] text-[#6b7280]" style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>
                    Preferred Session Length
                  </div>
                  <div
                    className="mt-2 h-10 w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[14px] text-[#111827]"
                    style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}
                  >
                    45 Minutes
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-[14px] text-[#6b7280]" style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>
                  Preferred Mentor Type
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {['Listener', 'Advisor', 'Problem-Solver', 'Career Guide', 'Friendly'].map((t) => (
                    <button
                      key={t}
                      className={`rounded-full border px-4 py-2 text-[12px] ${
                        t === 'Listener' || t === 'Career Guide'
                          ? 'border-[#5D3699] bg-[#5D3699] text-white'
                          : 'border-[#e5e7eb] text-[#6b7280]'
                      }`}
                      style={{ fontFamily: 'DM Sans', lineHeight: '16px', fontWeight: 500 }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-4 border-t border-[#eef2f7] pt-6">
              <button className="text-[14px] text-[#6b7280]" style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>
                Cancel
              </button>
              <button
                className="h-10 rounded-lg bg-[#5D3699] px-6 text-[14px] text-white"
                style={{ fontFamily: 'DM Sans', lineHeight: '20px', fontWeight: 500 }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
