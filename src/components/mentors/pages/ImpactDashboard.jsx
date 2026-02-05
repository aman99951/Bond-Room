import React from 'react';
import { Download, Star, Video, Leaf, Clock } from 'lucide-react';

const ImpactDashboard = () => {
  const sessions = [
    { date: 'Oct 24, 2025', mentee: 'James Kulandaisamy', duration: '45 min', status: 'Claimed', rating: 4, notes: 'Career guidance session' },
    { date: 'Oct 22, 2025', mentee: 'Priya Muthukaruppan', duration: '30 min', status: 'Donated', rating: 5, notes: 'Exam preparation tips' },
    { date: 'Oct 20, 2025', mentee: 'Jeeva Ravishankar', duration: '60 min', status: 'Claimed', rating: 5, notes: 'Study methodology discussion' },
    { date: 'Oct 18, 2025', mentee: 'Karthik Ganapathy', duration: '45 min', status: 'Donated', rating: 4, notes: 'Stress management techniques' },
    { date: 'Oct 15, 2025', mentee: 'Disha Raj', duration: '30 min', status: 'Rejected', rating: 4, notes: 'Exam preparation tips' },
  ];

  return (
    <div className="min-h-screen bg-transparent text-[#111827] p-6 sm:p-8 rounded-2xl">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-['DM_Sans'] font-bold text-[30px] leading-[36px] tracking-[0px] align-middle text-[#333333]">Impact Dashboard</h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white px-3 py-2 text-xs text-[#1f2937] self-start sm:self-auto"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export Report
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#e6e2f1] bg-white p-4 shadow-sm">
            <p
              className="text-[#333333]"
              style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Total Sessions
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-[#ede9fe] text-[#5b2c91] flex items-center justify-center">
                <Video className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[#5b2c91]">42</span>
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">12% from last month</p>
          </div>
          <div className="rounded-xl border border-[#e6e2f1] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p
                className="text-[#333333]"
                style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
              >
                Hours Donated
              </p>
              <span className="text-[11px] text-[#9ca3af]">This month</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center">
                <Leaf className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[#16a34a]">18.5</span>
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">Total contribution</p>
          </div>
          <div className="rounded-xl border border-[#e6e2f1] bg-white p-4 shadow-sm">
            <p
              className="text-[#333333]"
              style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Hours Claimed
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-[#dbeafe] text-[#3b82f6] flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[#3b82f6]">24.0</span>
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">Pending payout: ₹12,300</p>
          </div>
          <div className="rounded-xl border border-[#e6e2f1] bg-white p-4 shadow-sm">
            <p
              className="text-[#333333]"
              style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Avg. Rating
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-[#fef3c7] text-[#f59e0b] flex items-center justify-center">
                <Star className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[#f59e0b]">4.9</span>
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">Based on 38 reviews</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-white/15 bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
            <h3
              className="text-[#333333]"
              style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Topics Addressed
            </h3>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Exam Anxiety', value: 45 },
                { label: 'Study Methods', value: 30 },
                { label: 'Peer Pressure', value: 15 },
                { label: 'Other', value: 10 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-[#ede9fe]">
                    <div className="h-2 rounded-full bg-[#5b2c91]" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-[#4b2a86] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.3)] text-white">
            <h3
              className="text-white"
              style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Monthly Contribution
            </h3>
            <div className="mt-6 grid grid-cols-6 gap-2 items-end h-36">
              {[
                { month: 'May', value: 30 },
                { month: 'Jun', value: 50 },
                { month: 'Jul', value: 40 },
                { month: 'Aug', value: 70 },
                { month: 'Sep', value: 85 },
                { month: 'Oct', value: 60 },
              ].map((item) => (
                <div key={item.month} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-md ${item.month === 'Sep' ? 'bg-[#fdd253]' : 'bg-white/20'}`}
                    style={{ height: `${item.value}px` }}
                  />
                  <span className="text-[10px] text-white/70">{item.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#e6e2f1] bg-white p-4 shadow-sm flex flex-col items-center">
            <h3
              className="text-[#333333] self-start"
              style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Donation vs Claim Ratio
            </h3>
            <div
              className="mt-6 h-36 w-36 rounded-full flex items-center justify-center"
              style={{ background: 'conic-gradient(#22c55e 0% 30%, #3b82f6 30% 100%)' }}
            >
              <div className="h-28 w-28 rounded-full bg-white flex items-center justify-center">
                <span className="text-[16px] font-semibold text-[#333333]">60%</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-[11px] text-[#6b7280]">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                Claimed
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                Donated
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-white/15 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
          <div className="p-4">
            <h3
              className="text-[#333333]"
              style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Session Ledger
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="text-[#6b7280] border-t border-[#e6e2f1]">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Mentee</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((row) => (
                <tr key={`${row.date}-${row.mentee}`} className="border-t border-[#f1f5f9] text-[#4b5563]">
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">{row.mentee}</td>
                  <td className="px-4 py-3">{row.duration}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] ${
                      row.status === 'Rejected'
                        ? 'bg-[#dbeafe] text-[#2563eb]'
                        : row.status === 'Donated'
                        ? 'bg-[#22c55e] text-white'
                        : 'bg-[#f59e0b] text-white'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className={`h-3 w-3 ${idx < row.rating ? 'text-[#fbbf24]' : 'text-[#e5e7eb]'}`} fill={idx < row.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#9ca3af]">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          <div className="flex items-center justify-between p-4 text-[11px] text-[#6b7280] border-t border-[#e6e2f1]">
            <span>Showing 1-5 of 42 sessions</span>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-md border border-[#e6e2f1] px-3 py-1">Previous</button>
              <button type="button" className="rounded-md bg-[#5b2c91] text-white px-3 py-1">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactDashboard;


