import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Trash2, Plus, AlertTriangle, Pencil } from 'lucide-react';

const ManageAvailability = () => {
  const [copyOpen, setCopyOpen] = useState('Tue');
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (!popoverRef.current) return;
      if (popoverRef.current.contains(event.target)) return;
      setCopyOpen(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  const [days, setDays] = useState([
    {
      label: 'Mon',
      slots: [
        { time: '10:00', end: '12:00', tone: 'purple' },
      ],
    },
    {
      label: 'Tue',
      slots: [],
    },
    {
      label: 'Wed',
      highlight: true,
      slots: [
        { time: '14:00', end: '15:00', tone: 'purple' },
        { time: '18:00', end: '19:00', tone: 'purple' },
      ],
    },
    {
      label: 'Thu',
      slots: [
        { time: '09:00', end: '10:30', tone: 'purple' },
        { time: '10:00', end: '11:00', tone: 'danger' },
      ],
    },
    { label: 'Fri', slots: [] },
    { label: 'Sat', slots: [] },
    { label: 'Sun', slots: [] },
  ]);

  const handleDrop = (targetLabel, payload) => {
    if (!payload) return;
    const { fromLabel, slotIndex } = payload;
    if (fromLabel === targetLabel) return;
    setDays((prev) => {
      const next = prev.map((day) => ({ ...day, slots: [...day.slots] }));
      const fromDay = next.find((d) => d.label === fromLabel);
      const toDay = next.find((d) => d.label === targetLabel);
      if (!fromDay || !toDay) return prev;
      const [moved] = fromDay.slots.splice(slotIndex, 1);
      if (!moved) return prev;
      toDay.slots.unshift(moved);
      return next;
    });
  };

  const slotPresets = [
    { time: '09:00', end: '10:00' },
    { time: '10:00', end: '11:00' },
    { time: '11:00', end: '12:00' },
    { time: '14:00', end: '15:00' },
    { time: '16:00', end: '17:00' },
  ];

  const addSlot = (dayLabel) => {
    setDays((prev) => {
      const next = prev.map((day) => ({ ...day, slots: [...day.slots] }));
      const target = next.find((d) => d.label === dayLabel);
      if (!target) return prev;
      const preset = slotPresets[target.slots.length % slotPresets.length];
      target.slots.push({ ...preset, tone: 'purple' });
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="rounded-2xl bg-transparent text-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className="text-[#111827]"
              style={{ fontFamily: 'DM Sans', fontSize: '30px', lineHeight: '36px', fontWeight: 700 }}
            >
              Manage Availability
            </h2>
            <p className="mt-1 text-xs text-[#6b7280]">Timezone: IST (GMT+5:30)</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#6b7280]">
            <div className="flex items-center gap-2">
              <button type="button" className="h-8 w-8 rounded-full border border-[#e6e2f1] grid place-items-center text-[#6b7280]">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[#111827]">Oct 24 - Oct 30</span>
              <button type="button" className="h-8 w-8 rounded-full border border-[#e6e2f1] grid place-items-center text-[#6b7280]">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button type="button" className="text-[#ef4444] text-xs font-semibold">
              Clear Week
            </button>
            <button type="button" className="rounded-full border border-[#d1d5db] px-3 py-1 text-xs text-[#111827] bg-white">
              Copy Week
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-[140px] gap-4 min-w-max">
          {days.map((day) => (
            <div key={day.label} className="relative">
              <div
                className={`rounded-t-md border border-white/10 py-2 text-center ${
                  day.highlight ? 'bg-[#fdd253] text-[#1f2937]' : 'bg-transparent text-[#333333]'
                }`}
              >
                <div className="font-['Inter'] font-bold text-[16px] leading-[24px] tracking-[0px] text-center align-middle">
                  {day.label}
                </div>
                <div className={`mt-2 flex items-center justify-center gap-2 text-[10px] ${
                  day.highlight ? 'text-[#5b2c91]' : 'text-[#333333]'
                }`}>
                  <Copy className="h-3 w-3" />
                  <Trash2 className="h-3 w-3" />
                </div>
              </div>
              <div
                className="rounded-b-md border border-white/10 bg-white h-[572px] px-2 py-3 text-[#1f2937] relative"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    handleDrop(day.label, data);
                  } catch {
                    // ignore
                  }
                }}
              >
                {copyOpen === day.label && (
                  <div
                    ref={popoverRef}
                    className="absolute left-3 top-10 z-10 w-[150px] rounded-lg border border-[#e6e2f1] bg-white shadow-xl p-3 text-xs"
                  >
                    <p className="text-[#1f2937] font-semibold mb-2">Copy to...</p>
                    <label className="flex items-center gap-2 text-[#6b7280]">
                      <input type="checkbox" className="accent-[#5b2c91]" />
                      Wed
                    </label>
                    <label className="mt-2 flex items-center gap-2 text-[#6b7280]">
                      <input type="checkbox" className="accent-[#5b2c91]" />
                      Thu
                    </label>
                    <label className="mt-2 flex items-center gap-2 text-[#6b7280]">
                      <input type="checkbox" className="accent-[#5b2c91]" />
                      Fri
                    </label>
                    <button type="button" className="mt-3 w-full rounded-md bg-[#5b2c91] text-white py-1.5 text-xs">
                      Apply
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {day.slots.map((slot, idx) => (
                    <div
                      key={`${day.label}-${idx}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', JSON.stringify({ fromLabel: day.label, slotIndex: idx }));
                      }}
                      className={`rounded-lg border border-l-4 px-2 py-2 ${
                        slot.tone === 'danger'
                          ? 'border-[#fca5a5] border-l-[#ef4444] bg-[#fff1f2] text-[#b91c1c]'
                          : 'border-[#e8e2f5] border-l-[#5b2c91] bg-[#f5f0ff] text-[#5b2c91]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className="mt-1 grid grid-cols-2 gap-0.5 text-[#9ca3af]">
                            {Array.from({ length: 6 }).map((_, dotIdx) => (
                              <span key={dotIdx} className="h-1 w-1 rounded-full bg-current" />
                            ))}
                          </div>
                          <div>
                            <div className="text-[12px] font-semibold leading-[14px]">
                              {slot.time}
                            </div>
                            <div className="text-[10px] leading-[12px] opacity-80">-to-</div>
                            <div className="text-[12px] font-semibold leading-[14px]">
                              {slot.end}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            type="button"
                            className="text-current"
                            onClick={() => setCopyOpen((prev) => (prev === day.label ? null : day.label))}
                            aria-label="Edit slot"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <Trash2 className="h-3 w-3" />
                        </div>
                      </div>
                      {slot.tone === 'danger' && (
                        <div className="mt-2 flex items-center gap-1 text-[10px]">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Conflict</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[115px] h-[40px] rounded-[8px] border-2 border-dashed border-[#cbd5f5] text-xs text-[#6b7280] flex items-center justify-center gap-1 bg-white"
                  style={{ borderStyle: 'dashed', borderWidth: 2, borderImage: 'repeating-linear-gradient(90deg, #cbd5f5 0 6px, transparent 6px 10px) 1' }}
                  onClick={() => addSlot(day.label)}
                >
                  <Plus className="h-3 w-3" />
                  Add Slot
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAvailability;
