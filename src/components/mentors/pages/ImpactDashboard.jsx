import React from 'react';
import { Download, Star } from 'lucide-react';

const ImpactDashboard = () => {
  const sessions = [
    { date: 'Oct 24, 2025', mentee: 'James Kulandaisamy', duration: '45 min', status: 'Claimed', rating: 4, notes: 'Career guidance session' },
    { date: 'Oct 22, 2025', mentee: 'Priya Muthukaruppan', duration: '30 min', status: 'Donated', rating: 5, notes: 'Exam preparation tips' },
    { date: 'Oct 20, 2025', mentee: 'Jeeva Ravishankar', duration: '60 min', status: 'Claimed', rating: 5, notes: 'Study methodology discussion' },
    { date: 'Oct 18, 2025', mentee: 'Karthik Ganapathy', duration: '45 min', status: 'Donated', rating: 4, notes: 'Stress management techniques' },
    { date: 'Oct 15, 2025', mentee: 'Disha Raj', duration: '30 min', status: 'Rejected', rating: 4, notes: 'Exam preparation tips' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-primary">Impact Dashboard</h2>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-default px-3 py-2 text-xs text-secondary"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Export Report
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-default bg-surface p-4 shadow-sm">
              <p className="text-xs text-muted">Total Sessions</p>
              <p className="mt-2 text-2xl font-semibold text-primary">42</p>
              <p className="mt-1 text-xs text-muted">12% from last month</p>
            </div>
            <div className="rounded-xl border border-default bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">Hours Donated</p>
                <span className="text-xs text-muted">This month</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-primary">18.5</p>
              <p className="mt-1 text-xs text-muted">Total contribution</p>
            </div>
            <div className="rounded-xl border border-default bg-surface p-4 shadow-sm">
              <p className="text-xs text-muted">Hours Claimed</p>
              <p className="mt-2 text-2xl font-semibold text-primary">24.0</p>
              <p className="mt-1 text-xs text-muted">Pending payout: $1,200</p>
            </div>
            <div className="rounded-xl border border-default bg-surface p-4 shadow-sm">
              <p className="text-xs text-muted">Avg. Rating</p>
              <p className="mt-2 text-2xl font-semibold text-primary">4.9</p>
              <p className="mt-1 text-xs text-muted">Based on 38 reviews</p>
            </div>
          </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-default bg-surface p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-primary">Topics Addressed</h3>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Exam Anxiety', value: 45 },
                  { label: 'Study Methods', value: 30 },
                  { label: 'Peer Pressure', value: 15 },
                  { label: 'Other', value: 10 },
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

            <div className="rounded-xl border border-default bg-surface p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-primary">Monthly Contribution</h3>
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
                    <div className="w-full rounded-md bg-muted" style={{ height: `${item.value}px` }} />
                    <span className="text-[10px] text-muted">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-default bg-surface p-4 shadow-sm flex flex-col items-center">
              <h3 className="text-sm font-semibold text-primary self-start">Donation vs Claim Ratio</h3>
              <div className="mt-6 h-32 w-32 rounded-full border-[6px] border-muted flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">60%</span>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#5D3699]" />
                  Claimed
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted" />
                  Donated
                </span>
              </div>
            </div>
          </div>

      <div className="mt-5 rounded-xl border border-default bg-surface shadow-sm">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-primary">Session Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted border-t border-default">
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
                <tr key={`${row.date}-${row.mentee}`} className="border-t border-default">
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">{row.mentee}</td>
                  <td className="px-4 py-3">{row.duration}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] ${row.status === 'Rejected' ? 'bg-muted text-muted' : row.status === 'Donated' ? 'bg-[#5D3699] text-white' : 'bg-muted text-muted'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className={`h-3 w-3 ${idx < row.rating ? 'text-black' : 'text-muted'}`} fill={idx < row.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 text-xs text-muted border-t border-default">
          <span>Showing 1-5 of 42 sessions</span>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-md border border-default px-3 py-1">Previous</button>
            <button type="button" className="rounded-md bg-[#5D3699] text-white px-3 py-1">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactDashboard;
