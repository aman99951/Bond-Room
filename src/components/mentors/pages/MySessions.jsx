import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const hours = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

const MySessions = () => {
  const [view, setView] = useState('calendar');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValue, setFilterValue] = useState('All Sessions');
  const filterOptions = ['All Sessions', 'Upcoming', 'Completed'];
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold text-primary">My Sessions</h1>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative" tabIndex={0} onBlur={() => setFilterOpen(false)}>
              <button
                type="button"
                className="rounded-md border border-default bg-surface px-3 py-2 text-xs text-secondary min-w-[140px] text-left"
                onClick={() => setFilterOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={filterOpen}
              >
                {filterValue}
              </button>
              {filterOpen && (
                <ul className="absolute z-10 mt-1 w-full rounded-md border border-default bg-surface text-primary text-xs shadow" role="listbox">
                  {filterOptions.map((opt) => (
                    <li key={opt}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted"
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

            <button className="inline-flex items-center gap-2 rounded-md border border-default bg-surface px-3 py-2 text-xs text-secondary min-w-[160px]">
              Dec 8 - 14, 2025
              <Calendar className="h-4 w-4 text-secondary" aria-hidden="true" />
            </button>

            <label className="inline-flex items-center gap-2 rounded-md border border-default bg-surface px-3 py-2 text-xs text-secondary min-w-[220px]">
              <Search className="h-4 w-4 text-secondary" aria-hidden="true" />
              <input className="outline-none text-xs bg-transparent w-full" placeholder="Search mentee name..." aria-label="Search mentee name" />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-default bg-surface overflow-hidden">
              <button
                className={`px-3 py-2 text-xs ${view === 'calendar' ? 'bg-muted text-primary' : 'text-secondary'}`}
                onClick={() => setView('calendar')}
                aria-pressed={view === 'calendar'}
              >
                Calendar View
              </button>
              <button
                className={`px-3 py-2 text-xs ${view === 'table' ? 'bg-muted text-primary' : 'text-secondary'}`}
                onClick={() => setView('table')}
                aria-pressed={view === 'table'}
              >
                Table View
              </button>
            </div>
            <div className="inline-flex items-center gap-1">
              <button className="h-8 w-8 rounded-md border border-default bg-surface text-secondary flex items-center justify-center">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button className="h-8 w-8 rounded-md border border-default bg-surface text-secondary flex items-center justify-center">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <button className="rounded-md border border-default bg-surface px-3 py-2 text-xs text-secondary">Today</button>
          </div>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="mt-4 rounded-xl border border-default bg-surface overflow-x-auto">
          <div className="min-w-[920px]">
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
                  <div key={c} className="border-l border-default p-2 h-14 relative">
                    {idx === 1 && c === 0 && (
                      <button
                        type="button"
                        className="absolute inset-2 rounded-md bg-muted/60 px-2 py-1 text-[10px] text-secondary text-left hover:bg-muted"
                        onClick={() => navigate('/mentor-session-completed')}
                      >
                        Rahul Pravin
                        <div className="text-muted">09:00 - 09:30</div>
                      </button>
                    )}
                    {idx === 6 && c === 2 && (
                      <button
                        type="button"
                        className="absolute inset-2 rounded-md bg-muted/60 px-2 py-1 text-[10px] text-secondary text-left hover:bg-muted"
                        onClick={() => navigate('/mentor-session-completed')}
                      >
                        Pavithra Raja
                        <div className="text-muted">02:30 - 03:00</div>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-default bg-surface overflow-x-auto">
          <table className="min-w-[520px] w-full text-xs">
            <thead className="bg-muted text-secondary">
              <tr>
                <th className="text-left p-3 border-b border-default">Mentee</th>
                <th className="text-left p-3 border-b border-default">Date</th>
                <th className="text-left p-3 border-b border-default">Time</th>
                <th className="text-left p-3 border-b border-default">Type</th>
              </tr>
            </thead>
            <tbody>
              {[
                { mentee: 'Rahul Pravin', date: 'Dec 9, 2025', time: '09:00 - 09:30', type: 'Session' },
                { mentee: 'Pavithra Raja', date: 'Dec 10, 2025', time: '02:30 - 03:00', type: 'Session' },
              ].map((s) => (
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
  );
};

export default MySessions;
