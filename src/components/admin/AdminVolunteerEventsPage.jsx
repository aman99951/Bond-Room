import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ImagePlus, PlusCircle, RefreshCw } from 'lucide-react';
import { menteeApi } from '../../apis/api/menteeApi';
import { getAuthSession } from '../../apis/api/storage';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200';

const defaultEventForm = {
  title: '',
  stream: '',
  description: '',
  summary: '',
  status: 'upcoming',
  date: '',
  time: '',
  completed_on: '',
  location: '',
  organizer: '',
  seats: '0',
  impact: '',
  image: '',
  imageFile: null,
  is_active: true,
};

const AdminVolunteerEventsPage = () => {
  const navigate = useNavigate();
  const session = getAuthSession();
  const isAdmin = session?.role === 'admin';

  const [eventForm, setEventForm] = useState(defaultEventForm);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventError, setEventError] = useState('');
  const [eventSuccess, setEventSuccess] = useState('');
  const [volunteerEvents, setVolunteerEvents] = useState([]);

  const loadVolunteerEvents = useCallback(async () => {
    if (!isAdmin) return;
    setEventLoading(true);
    setEventError('');
    try {
      const payload = await menteeApi.listVolunteerEvents();
      setVolunteerEvents(normalizeList(payload));
    } catch (err) {
      setVolunteerEvents([]);
      setEventError(err?.message || 'Unable to load volunteer events.');
    } finally {
      setEventLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    loadVolunteerEvents();
  }, [isAdmin, loadVolunteerEvents]);

  const updateEventForm = (key, value) => {
    if (key === 'imageFile') {
      setEventForm((prev) => ({ ...prev, imageFile: value }));
      return;
    }
    if (key === 'status') {
      setEventForm((prev) => ({
        ...prev,
        status: value,
        completed_on: value === 'completed' ? prev.completed_on : '',
      }));
      return;
    }
    if (key === 'is_active') {
      setEventForm((prev) => ({ ...prev, is_active: Boolean(value) }));
      return;
    }
    setEventForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    setEventError('');
    setEventSuccess('');
    if (!eventForm.title.trim()) {
      setEventError('Event title is required.');
      return;
    }
    if (eventForm.status === 'upcoming' && !eventForm.date) {
      setEventError('Date is required for upcoming events.');
      return;
    }
    if (eventForm.status === 'completed' && !eventForm.completed_on) {
      setEventError('Completed date is required for completed events.');
      return;
    }

    const formData = new FormData();
    formData.append('title', eventForm.title.trim());
    formData.append('stream', eventForm.stream.trim());
    formData.append('description', eventForm.description.trim());
    formData.append('summary', eventForm.summary.trim());
    formData.append('status', eventForm.status);
    formData.append('date', eventForm.date || '');
    formData.append('time', eventForm.time.trim());
    formData.append('completed_on', eventForm.completed_on || '');
    formData.append('location', eventForm.location.trim());
    formData.append('organizer', eventForm.organizer.trim());
    formData.append('seats', String(Number(eventForm.seats || 0)));
    formData.append('impact', eventForm.impact.trim());
    formData.append('image', eventForm.image.trim());
    formData.append('is_active', eventForm.is_active ? 'true' : 'false');
    if (eventForm.imageFile) formData.append('image_file', eventForm.imageFile);

    setEventSaving(true);
    try {
      await menteeApi.createVolunteerEvent(formData);
      setEventSuccess('Volunteer event created successfully.');
      setEventForm(defaultEventForm);
      await loadVolunteerEvents();
      window.setTimeout(() => setEventSuccess(''), 5000);
    } catch (err) {
      setEventError(err?.message || 'Unable to create volunteer event.');
    } finally {
      setEventSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] p-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-center">
          <p className="text-sm text-slate-300">Admin login required.</p>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] p-3 sm:p-6">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div>
            <h1 className="text-2xl font-black text-white">Volunteer Events</h1>
            <p className="text-sm text-slate-400">Create and manage volunteer events</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15">
                <PlusCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Create Volunteer Event</h2>
                <p className="text-xs text-slate-400">Fill complete event details including image.</p>
              </div>
            </div>

            {eventError ? <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{eventError}</div> : null}
            {eventSuccess ? <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{eventSuccess}</div> : null}

            <form onSubmit={handleCreateEvent} className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2"><label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Title *</label><input className={inputClass} value={eventForm.title} onChange={(e) => updateEventForm('title', e.target.value)} /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stream</label><input className={inputClass} value={eventForm.stream} onChange={(e) => updateEventForm('stream', e.target.value)} /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</label><select className={inputClass} value={eventForm.status} onChange={(e) => updateEventForm('status', e.target.value)}><option value="upcoming">Upcoming</option><option value="completed">Completed</option></select></div>
              <div><label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Date</label><input type="date" className={inputClass} value={eventForm.date} onChange={(e) => updateEventForm('date', e.target.value)} /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed On</label><input type="date" className={inputClass} value={eventForm.completed_on} onChange={(e) => updateEventForm('completed_on', e.target.value)} /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Time</label><input className={inputClass} value={eventForm.time} onChange={(e) => updateEventForm('time', e.target.value)} /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Seats</label><input type="number" min={0} className={inputClass} value={eventForm.seats} onChange={(e) => updateEventForm('seats', e.target.value)} /></div>
              <div className="md:col-span-2"><label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Location</label><input className={inputClass} value={eventForm.location} onChange={(e) => updateEventForm('location', e.target.value)} /></div>
              <div className="md:col-span-2"><label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Organizer</label><input className={inputClass} value={eventForm.organizer} onChange={(e) => updateEventForm('organizer', e.target.value)} /></div>
              <div className="md:col-span-2"><label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Image URL</label><input className={inputClass} value={eventForm.image} onChange={(e) => updateEventForm('image', e.target.value)} /></div>
              <div className="md:col-span-2"><label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Upload Image</label><label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300"><ImagePlus className="h-4 w-4 text-violet-400" /><span>{eventForm.imageFile ? eventForm.imageFile.name : 'Choose image file'}</span><input type="file" accept="image/*" className="hidden" onChange={(e) => updateEventForm('imageFile', e.target.files?.[0] || null)} /></label></div>
              <div className="md:col-span-2"><label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</label><textarea rows={3} className={inputClass} value={eventForm.description} onChange={(e) => updateEventForm('description', e.target.value)} /></div>
              <div className="md:col-span-2"><label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Summary</label><textarea rows={2} className={inputClass} value={eventForm.summary} onChange={(e) => updateEventForm('summary', e.target.value)} /></div>
              <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-300"><input type="checkbox" checked={eventForm.is_active} onChange={(e) => updateEventForm('is_active', e.target.checked)} />Active Event</label>
                <button type="submit" disabled={eventSaving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-bold text-white">{eventSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}{eventSaving ? 'Creating...' : 'Create Event'}</button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15">
                  <CalendarDays className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Existing Events</h2>
                  <p className="text-xs text-slate-400">{volunteerEvents.length} records</p>
                </div>
              </div>
              <button type="button" onClick={loadVolunteerEvents} disabled={eventLoading} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300"><RefreshCw className={`h-3.5 w-3.5 ${eventLoading ? 'animate-spin' : ''}`} />Refresh</button>
            </div>

            <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
              {eventLoading ? (
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-6 text-center text-sm text-slate-400">Loading events...</div>
              ) : volunteerEvents.length ? (
                volunteerEvents.map((item) => {
                  const eventImage = item.image_file || item.image_url || item.image || '';
                  return (
                    <div key={item.id} className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                          {eventImage ? (
                            <img
                              src={eventImage}
                              alt={item.title || `Event ${item.id}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-500">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {item.title || `Event #${item.id}`}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-400">
                                {item.location || 'Location not set'}
                              </p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-violet-500/20 text-violet-300'}`}>{item.status || 'upcoming'}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400"><span>{item.date || '-'}</span><span>-</span><span>{item.time || 'Time TBA'}</span><span>-</span><span>Seats: {item.seats ?? 0}</span></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-6 text-center text-sm text-slate-400">No volunteer events found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminVolunteerEventsPage;
