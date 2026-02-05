import React from 'react';

const Myprofile = () => {
  return (
    <div className="p-4 sm:p-6 bg-transparent">
      <div className="max-w-[1100px]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="text-[#111827]"
              style={{ fontFamily: 'DM Sans', fontSize: '30px', lineHeight: '36px', fontWeight: 700 }}
            >
              My Profile
            </h1>
            <p className="mt-1 text-sm text-[#6b7280]">Manage your mentor profile details.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e9ddff] text-xs text-[#5b2c91] px-3 py-1 font-medium">
            Mentor ID: BR-2409
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-[#e6e2f1] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[#ede9fe] text-[#5b2c91] flex items-center justify-center text-xl font-semibold">
                RS
              </div>
              <div>
                <div className="text-base font-semibold text-[#1f2937]">Rajeswari S.</div>
                <div className="text-sm text-[#6b7280]">Mentor • Chennai, India</div>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-[#6b7280]">
              <div className="flex items-center justify-between">
                <span>Sessions Completed</span>
                <span className="font-semibold text-[#1f2937]">42</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rating</span>
                <span className="font-semibold text-[#1f2937]">4.9</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Languages</span>
                <span className="font-semibold text-[#1f2937]">English, Tamil</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="inline-flex rounded-full bg-[#dcfce7] text-[#16a34a] text-xs px-2 py-0.5 font-semibold">Active</span>
              </div>
            </div>

            <button type="button" className="mt-6 w-full rounded-md border border-[#e5e7eb] px-4 py-2 text-sm text-[#6b7280]">
              Update Profile Photo
            </button>
          </div>

          <div className="rounded-2xl border border-[#e6e2f1] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Full Name</label>
                <input className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm" defaultValue="Rajeswari S." />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Email</label>
                <input className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm" defaultValue="rajeswari@bondroom.com" />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Phone</label>
                <input className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm" defaultValue="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">City</label>
                <input className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm" defaultValue="Chennai" />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Specialization</label>
                <input className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm" defaultValue="Academic Guidance" />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Experience</label>
                <input className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm" defaultValue="6 Years" />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-xs text-[#6b7280] mb-1">Bio</label>
              <textarea
                rows={4}
                className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                defaultValue="I help students build confidence and structure around their academic goals through empathetic mentorship."
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button type="button" className="rounded-md bg-[#5b2c91] text-white px-5 py-2 text-sm">
                Save Changes
              </button>
              <button type="button" className="rounded-md border border-[#e5e7eb] px-5 py-2 text-sm text-[#6b7280]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Myprofile;
