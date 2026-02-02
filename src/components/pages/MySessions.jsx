import React, { useState } from 'react';

const hours = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
const sessionsList = [
  { mentee: 'Rahul Pravin', date: 'Dec 9, 2025', time: '09:00 - 09:30', type: 'Session' },
  { mentee: 'Pavithra Raja', date: 'Dec 10, 2025', time: '02:30 - 03:00', type: 'Session' },
];

const MySessions = () => {
  const [view, setView] = useState('calendar');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValue, setFilterValue] = useState('All Sessions');
  const filterOptions = ['All Sessions', 'Upcoming', 'Completed'];

  return (
    <div className="p-4 sm:p-6">
      <div className="rounded-2xl border border-default bg-surface p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-primary">My Sessions</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
            <div className="relative w-full sm:w-auto" tabIndex={0} onBlur={() => setFilterOpen(false)}>
              <button
                type="button"
                className="rounded-md border border-default bg-surface px-3 py-2 text-xs text-secondary w-full sm:w-auto text-left"
                onClick={() => setFilterOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={filterOpen}
              >
                {filterValue}
              </button>
              {filterOpen && (
                <ul className="absolute z-10 mt-1 w-full rounded-md border border-accent bg-accent text-on-accent text-xs shadow" role="listbox">
                  {filterOptions.map((opt) => (
                    <li key={opt}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-black/80"
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
            <button className="rounded-md border border-default bg-surface px-3 py-2 text-xs text-secondary w-full sm:w-auto">
              Dec 8 – 14, 2025
            </button>
            <label className="flex items-center gap-2 rounded-md border border-default bg-surface px-3 py-2 text-xs text-secondary w-full sm:w-auto">
              <svg className="h-4 w-4 text-secondary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input className="outline-none text-xs bg-transparent w-full" placeholder="Search mentee name..." aria-label="Search mentee name" />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`rounded-md border px-3 py-2 text-xs w-full sm:w-auto ${view === 'calendar' ? 'bg-accent text-on-accent border-accent' : 'bg-surface text-secondary border-default'}`}
              onClick={() => setView('calendar')}
              aria-pressed={view === 'calendar'}
            >
              Calendar View
            </button>
            <button
              className={`rounded-md border px-3 py-2 text-xs w-full sm:w-auto ${view === 'table' ? 'bg-accent text-on-accent border-accent' : 'bg-surface text-secondary border-default'}`}
              onClick={() => setView('table')}
              aria-pressed={view === 'table'}
            >
              Table View
            </button>
            <div className="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-start">
              <button className="h-8 w-8 rounded-md border border-default bg-surface text-secondary">‹</button>
              <button className="h-8 w-8 rounded-md border border-default bg-surface text-secondary">›</button>
            </div>
            <button className="rounded-md border border-default bg-surface px-3 py-2 text-xs text-secondary w-full sm:w-auto">Today</button>
          </div>
        </div>

        {view === 'calendar' ? (
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[640px] sm:min-w-[720px] border border-default rounded-xl">
              <div className="grid grid-cols-8 border-b border-default text-xs text-muted">
                <div className="p-2" />
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                  <div key={d} className="p-2 text-center border-l border-default">
                    <div className="text-muted">{d}</div>
                    <div className="text-primary font-semibold">{8 + i}</div>
                  </div>
                ))}
              </div>
              {hours.map((h, idx) => (
                <div key={h} className="grid grid-cols-8 border-b border-default text-xs">
                  <div className="p-2 text-muted">{h}</div>
                  {Array.from({ length: 7 }).map((_, c) => (
                    <div key={c} className="border-l border-default p-2 h-12 relative">
                      {idx === 1 && c === 0 && (
                        <div className="absolute inset-2 rounded-md bg-muted px-2 py-1 text-[10px] text-secondary">
                          Rahul Pravin
                          <div className="text-muted">09:00 - 09:30</div>
                        </div>
                      )}
                      {idx === 6 && c === 2 && (
                        <div className="absolute inset-2 rounded-md bg-muted px-2 py-1 text-[10px] text-secondary">
                          Pavithra Raja
                          <div className="text-muted">02:30 - 03:00</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[520px] w-full border border-default rounded-xl text-xs">
              <thead className="bg-muted text-secondary">
                <tr>
                  <th className="text-left p-3 border-b border-default">Mentee</th>
                  <th className="text-left p-3 border-b border-default">Date</th>
                  <th className="text-left p-3 border-b border-default">Time</th>
                  <th className="text-left p-3 border-b border-default">Type</th>
                </tr>
              </thead>
              <tbody>
                {sessionsList.map((s) => (
                  <tr key={s.mentee + s.time} className="border-b border-default">
                    <td className="p-3 text-secondary">{s.mentee}</td>
                    <td className="p-3 text-secondary">{s.date}</td>
                    <td className="p-3 text-secondary">{s.time}</td>
                    <td className="p-3 text-secondary">{s.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySessions;
