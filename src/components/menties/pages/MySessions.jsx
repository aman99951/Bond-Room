import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

const hours = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
];

const days = [
  { label: 'Mon', date: 16 },
  { label: 'Tue', date: 17 },
  { label: 'Wed', date: 18, active: true },
  { label: 'Thu', date: 19 },
  { label: 'Fri', date: 20 },
  { label: 'Sat', date: 21 },
  { label: 'Sun', date: 22 },
];

const sessions = [
  { dayIndex: 0, hourIndex: 3, title: 'Priya K.', time: '11:00 - 11:30', tone: 'light' },
  { dayIndex: 1, hourIndex: 1, title: 'Rahul S.', time: '09:30 - 10:30', tone: 'dark' },
  { dayIndex: 2, hourIndex: 6, title: 'Ananya M.', time: '1:30 - 2:30', tone: 'dark' },
  { dayIndex: 4, hourIndex: 6, title: 'Vikram N.', time: '02:30 - 03:30', tone: 'dark' },
];

const MySessions = () => {
  const [view, setView] = useState('calendar');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValue, setFilterValue] = useState('All Types');
  const filterOptions = ['All Types', 'Upcoming', 'Completed'];

  return (
    <div className="p-4 sm:p-6 bg-transparent">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1
          className="text-[#111827]"
          style={{ fontFamily: 'DM Sans', fontSize: '30px', lineHeight: '36px', fontWeight: 700 }}
        >
          My Sessions
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-xs text-[#6b7280] min-w-[220px]">
            <Search className="h-4 w-4 text-[#9ca3af]" />
            <input className="outline-none text-xs bg-transparent w-full" placeholder="Search mentee..." />
          </label>

          <div className="relative" tabIndex={0} onBlur={() => setFilterOpen(false)}>
            <button
              type="button"
              className="inline-flex items-center justify-between gap-2 rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-xs text-[#6b7280] min-w-[140px]"
              onClick={() => setFilterOpen((o) => !o)}
            >
              Filter: {filterValue}
              <ChevronDown className="h-4 w-4" />
            </button>
            {filterOpen && (
              <ul className="absolute z-10 mt-1 w-full rounded-md border border-[#e5e7eb] bg-white text-[#111827] text-xs shadow">
                {filterOptions.map((opt) => (
                  <li key={opt}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-[#f3f4f6]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFilterValue(opt);
                        setFilterOpen(false);
                      }}
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button className="inline-flex items-center gap-2 rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-xs text-[#6b7280]">
            This Week
            <ChevronDown className="h-4 w-4" />
          </button>

          <div className="inline-flex rounded-full border border-[#e5e7eb] bg-white overflow-hidden">
            <button
              className={`px-4 py-2 text-xs ${view === 'calendar' ? 'bg-[#5D3699] text-white' : 'text-[#6b7280]'}`}
              onClick={() => setView('calendar')}
            >
              Calendar
            </button>
            <button
              className={`px-4 py-2 text-xs ${view === 'table' ? 'bg-[#5D3699] text-white' : 'text-[#6b7280]'}`}
              onClick={() => setView('table')}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-white overflow-x-auto shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
          <div className="min-w-[1100px]" style={{ height: '716px' }}>
            <div className="grid grid-cols-[120px_repeat(7,142px)] border-b border-[#e5e7eb] text-xs text-[#6b7280]">
              <div className="p-3" />
              {days.map((d) => (
                <div key={d.label} className={`p-3 text-center border-l border-r border-[#e5e7eb] ${d.active ? 'bg-[#f8fafc]' : ''}`}>
                  <div className={`text-xs ${d.active ? 'text-[#5D3699] font-semibold' : 'text-[#6b7280]'}`}>{d.label}</div>
                  <div
                    className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full ${
                      d.active ? 'bg-[#5D3699] text-white' : ''
                    }`}
                    style={
                      d.active
                        ? { fontFamily: 'Inter', fontSize: '20px', lineHeight: '28px', fontWeight: 600, color: '#ffffff' }
                        : { fontFamily: 'DM Sans', fontSize: '30px', lineHeight: '36px', fontWeight: 700, color: '#1A202C' }
                    }
                  >
                    {d.date}
                  </div>
                </div>
              ))}
            </div>

            {hours.map((h, idx) => (
              <div key={h} className="grid grid-cols-[120px_repeat(7,142px)] border-b border-[#e5e7eb] text-xs">
                <div
                  className="p-3 text-[#6b7280]"
                  style={{ fontFamily: 'DM Sans', fontSize: '14px', lineHeight: '20px', fontWeight: 400, textAlign: 'right' }}
                >
                  {h}
                </div>
                {days.map((d, c) => {
                  const session = sessions.find((s) => s.dayIndex === c && s.hourIndex === idx);
                  return (
                    <div key={`${h}-${d.label}`} className={`border-l border-r border-[#e5e7eb] p-2 h-14 relative ${d.active ? 'bg-[#f8fafc]' : ''}`}>
                      {session && (
                        <div
                          className={`absolute inset-2 rounded-[6px] px-2 py-2 ${
                            session.tone === 'light'
                              ? 'bg-[#f3f4f6] text-[#374151]'
                              : 'bg-[#5D3699] text-white'
                          }`}
                          style={{ width: '114px', height: '52px' }}
                        >
                          <div style={{ fontFamily: 'Inter', fontSize: '14px', lineHeight: '20px', fontWeight: 600, textAlign: 'center' }}>
                            {session.title}
                          </div>
                          <div
                            style={{
                              fontFamily: 'DM Sans',
                              fontSize: '12px',
                              lineHeight: '16px',
                              fontWeight: 400,
                              textAlign: 'center',
                              textDecoration: session.tone === 'light' ? 'line-through' : 'none',
                            }}
                          >
                            {session.time}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-white overflow-x-auto shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
          <table className="min-w-[520px] w-full text-xs">
            <thead className="bg-[#f8fafc] text-[#6b7280]">
              <tr>
                <th className="text-left p-3 border-b border-[#e5e7eb]">Mentee</th>
                <th className="text-left p-3 border-b border-[#e5e7eb]">Date</th>
                <th className="text-left p-3 border-b border-[#e5e7eb]">Time</th>
                <th className="text-left p-3 border-b border-[#e5e7eb]">Type</th>
              </tr>
            </thead>
            <tbody>
              {[
                { mentee: 'Rahul Pravin', date: 'Dec 17, 2025', time: '09:30 - 10:30', type: 'Session' },
                { mentee: 'Ananya M.', date: 'Dec 18, 2025', time: '1:30 - 2:30', type: 'Session' },
              ].map((s) => (
                <tr key={s.mentee + s.time} className="border-b border-[#e5e7eb]">
                  <td className="p-3 text-[#111827]">{s.mentee}</td>
                  <td className="p-3 text-[#6b7280]">{s.date}</td>
                  <td className="p-3 text-[#6b7280]">{s.time}</td>
                  <td className="p-3 text-[#6b7280]">{s.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MySessions;
