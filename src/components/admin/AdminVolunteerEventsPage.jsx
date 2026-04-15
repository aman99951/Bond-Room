
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ImagePlus, PencilLine, PlusCircle, RefreshCw, X } from 'lucide-react';
import { menteeApi } from '../../apis/api/menteeApi';
import { getAuthSession } from '../../apis/api/storage';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200';

const VOLUNTEER_ROLE_OPTIONS = [
  'Program Coordinators',
  'Outreach Volunteers',
  'Mentor Engagement Volunteers',
  'Event Organizers',
  'Content & Communication Volunteers',
  'Data & Research Volunteers',
  'Tech Support Volunteers',
  'Fundraising & Partnerships Volunteers',
  'Admin & Documentation Volunteers',
  'Registration Desk Volunteers',
  'Check-in Support Volunteers',
  'Guest Welcome Volunteers',
  'Venue Setup Volunteers',
  'Venue Cleanup Volunteers',
  'Stage Management Volunteers',
  'Session Coordination Volunteers',
  'Speaker Support Volunteers',
  'Hospitality Volunteers',
  'Refreshments Coordination Volunteers',
  'Crowd Management Volunteers',
  'Help Desk Volunteers',
  'Information Desk Volunteers',
  'Logistics Support Volunteers',
  'Transport Coordination Volunteers',
  'Photography Volunteers',
  'Videography Volunteers',
  'Social Media Coverage Volunteers',
  'Certificate & Documentation Volunteers',
  'Feedback Collection Volunteers',
  'Safety & Emergency Support Volunteers',
];

const THUMBNAIL_MAX_BYTES = 450 * 1024;
const GALLERY_MAX_BYTES = 500 * 1024;
const THUMBNAIL_MAX_SIDE = 1600;
const GALLERY_MAX_SIDE = 1800;
const EVENT_IMAGE_TARGET_BYTES = 320 * 1024;
const EVENT_IMAGE_SOFT_MAX_BYTES = 480 * 1024;
const EVENT_IMAGE_MAX_LONG_EDGE = 1280;
const EVENT_MAX_IMAGE_BYTES = 1024 * 1024;
const EVENT_MAX_TOTAL_UPLOAD_BYTES = 6 * 1024 * 1024;

const getFriendlyErrorMessage = (error, fallbackMessage) => {
  const message = String(error?.message || '').trim();
  if (
    /413/.test(message) ||
    /request entity too large/i.test(message) ||
    /payload too large/i.test(message)
  ) {
    return 'Images are too large for upload. Please use smaller images and try again.';
  }
  if (!message || message.toLowerCase().includes('request failed')) return fallbackMessage;
  return message;
};

const formatFileSizeLabel = (bytes) => {
  const value = Number(bytes || 0);
  if (!value || value < 1024) return `${value || 0} B`;
  const kb = value / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to process image file.'));
    img.src = src;
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Unable to optimize image.'));
      },
      type,
      quality,
    );
  });

const compressImageFile = async (file, { maxBytes, maxSide }) => {
  if (!file || !String(file.type || '').startsWith('image/')) return file;
  if (file.size <= maxBytes) return file;

  const src = await readFileAsDataUrl(file);
  const image = await loadImage(src);
  const longest = Math.max(image.width, image.height) || 1;
  const initialScale = Math.min(1, maxSide / longest);
  let width = Math.max(1, Math.round(image.width * initialScale));
  let height = Math.max(1, Math.round(image.height * initialScale));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  let quality = 0.86;
  let blob = null;

  while (true) {
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    if (blob.size <= maxBytes) break;

    if (quality > 0.46) {
      quality = Math.max(0.46, quality - 0.08);
      continue;
    }

    if (Math.max(width, height) <= 720) break;
    width = Math.max(720, Math.round(width * 0.86));
    height = Math.max(720, Math.round(height * 0.86));
  }

  if (!blob || blob.size >= file.size) return file;
  const safeName = String(file.name || 'image').replace(/\.[^.]+$/, '');
  return new File([blob], `${safeName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
};

const compressEventImageIfNeeded = async (file) => {
  if (!file) return null;
  const fileType = String(file.type || '').toLowerCase();
  if (!fileType.startsWith('image/')) return file;
  if (file.size <= EVENT_IMAGE_TARGET_BYTES) return file;

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  let width = image.naturalWidth || image.width || 0;
  let height = image.naturalHeight || image.height || 0;
  if (!width || !height) return file;

  const longEdge = Math.max(width, height);
  if (longEdge > EVENT_IMAGE_MAX_LONG_EDGE) {
    const ratio = EVENT_IMAGE_MAX_LONG_EDGE / longEdge;
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return file;

  let attemptWidth = width;
  let attemptHeight = height;
  let bestBlob = null;
  const qualitySteps = [0.92, 0.86, 0.8, 0.74, 0.68];

  for (let resizePass = 0; resizePass < 3; resizePass += 1) {
    canvas.width = attemptWidth;
    canvas.height = attemptHeight;
    context.clearRect(0, 0, attemptWidth, attemptHeight);
    context.drawImage(image, 0, 0, attemptWidth, attemptHeight);

    for (const quality of qualitySteps) {
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
      if (!blob) continue;
      if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;
      if (blob.size <= EVENT_IMAGE_TARGET_BYTES) {
        const nextName = String(file.name || `event_image_${Date.now()}`)
          .replace(/\.[^.]+$/, '')
          .concat('.jpg');
        return new File([blob], nextName, { type: 'image/jpeg' });
      }
    }

    if (bestBlob && bestBlob.size <= EVENT_IMAGE_SOFT_MAX_BYTES) {
      const nextName = String(file.name || `event_image_${Date.now()}`)
        .replace(/\.[^.]+$/, '')
        .concat('.jpg');
      return new File([bestBlob], nextName, { type: 'image/jpeg' });
    }

    attemptWidth = Math.max(1, Math.round(attemptWidth * 0.85));
    attemptHeight = Math.max(1, Math.round(attemptHeight * 0.85));
  }

  if (bestBlob) {
    const nextName = String(file.name || `event_image_${Date.now()}`)
      .replace(/\.[^.]+$/, '')
      .concat('.jpg');
    return new File([bestBlob], nextName, { type: 'image/jpeg' });
  }
  return file;
};

const createEmptyForm = () => ({
  title: '',
  stream: '',
  description: '',
  summary: '',
  status: 'upcoming',
  date: '',
  time: '',
  completed_on: '',
  joinedCount: '0',
  budgetSpent: '0',
  completionBrief: '',
  galleryImageFiles: [],
  location: '',
  organizer: '',
  seats: '0',
  impact: '',
  availableRoles: [],
  imageFile: null,
  is_active: true,
});

const eventToForm = (eventItem) => ({
  title: String(eventItem?.title || ''),
  stream: String(eventItem?.stream || ''),
  description: String(eventItem?.description || ''),
  summary: String(eventItem?.summary || ''),
  status: String(eventItem?.status || 'upcoming'),
  date: String(eventItem?.date || ''),
  time: String(eventItem?.time || ''),
  completed_on: String(eventItem?.completed_on || ''),
  joinedCount: String(Number(eventItem?.joined_count || 0)),
  budgetSpent: String(Number(eventItem?.budget_spent || 0)),
  completionBrief: String(eventItem?.completion_brief || ''),
  galleryImageFiles: [],
  location: String(eventItem?.location || ''),
  organizer: String(eventItem?.organizer || ''),
  seats: String(Number(eventItem?.seats || 0)),
  impact: String(eventItem?.impact || ''),
  availableRoles: Array.isArray(eventItem?.available_roles) ? eventItem.available_roles : [],
  imageFile: null,
  is_active: Boolean(eventItem?.is_active),
});

const EventFormModal = ({
  open,
  mode,
  form,
  saving,
  onClose,
  onSubmit,
  onFieldChange,
  onThumbnailFileChange,
  onToggleRole,
  onAppendGalleryFiles,
  onRemoveGalleryFile,
}) => {
  const galleryInputRef = useRef(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-3">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">{mode === 'edit' ? 'Edit Event' : 'Add Event'}</h2>
            <p className="text-xs text-slate-400">Create or update volunteer event details.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="max-h-[78vh] overflow-y-auto px-5 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Title *</label>
              <input className={inputClass} value={form.title} onChange={(e) => onFieldChange('title', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stream</label>
              <input className={inputClass} value={form.stream} onChange={(e) => onFieldChange('stream', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => onFieldChange('status', e.target.value)}>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Date</label>
              <input type="date" className={inputClass} value={form.date} onChange={(e) => onFieldChange('date', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed On</label>
              <input
                type="date"
                className={inputClass}
                value={form.completed_on}
                onChange={(e) => onFieldChange('completed_on', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Time</label>
              <input className={inputClass} value={form.time} onChange={(e) => onFieldChange('time', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Seats</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.seats}
                onChange={(e) => onFieldChange('seats', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Joined Count</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.joinedCount}
                onChange={(e) => onFieldChange('joinedCount', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Budget Spent</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={form.budgetSpent}
                onChange={(e) => onFieldChange('budgetSpent', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Location</label>
              <input className={inputClass} value={form.location} onChange={(e) => onFieldChange('location', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Organizer</label>
              <input className={inputClass} value={form.organizer} onChange={(e) => onFieldChange('organizer', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Upload Image (Event Thumbnail)</label>
              <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
                <ImagePlus className="h-4 w-4 text-violet-400" />
                <span>{form.imageFile ? form.imageFile.name : 'Choose thumbnail image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onThumbnailFileChange(e)}
                />
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</label>
              <textarea rows={3} className={inputClass} value={form.description} onChange={(e) => onFieldChange('description', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Summary</label>
              <textarea rows={2} className={inputClass} value={form.summary} onChange={(e) => onFieldChange('summary', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completion Brief</label>
              <textarea
                rows={4}
                className={inputClass}
                value={form.completionBrief}
                onChange={(e) => onFieldChange('completionBrief', e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Upload Gallery Images</label>
              <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
                <ImagePlus className="h-4 w-4 text-violet-400" />
                <span>{form.galleryImageFiles.length ? `${form.galleryImageFiles.length} file(s) selected` : 'Choose gallery images'}</span>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    onAppendGalleryFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
              {form.galleryImageFiles.length ? (
                <div className="mt-2 rounded-xl border border-slate-700 bg-slate-800/40 p-2">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold text-slate-400">Selected gallery files (you can add more)</p>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="rounded-md border border-violet-500/40 px-2 py-1 text-[10px] font-semibold text-violet-300 hover:bg-violet-500/10"
                    >
                      Add More Photos
                    </button>
                  </div>
                  <div className="max-h-28 space-y-1 overflow-y-auto pr-1 text-xs text-slate-300">
                    {form.galleryImageFiles.map((file) => (
                      <div
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                        className="flex items-center justify-between gap-2 rounded-md border border-slate-700 px-2 py-1"
                      >
                        <p className="truncate">{file.name}</p>
                        <button
                          type="button"
                          onClick={() => onRemoveGalleryFile(file)}
                          className="rounded-md border border-slate-600 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Roles for Registration</label>
                <span className="text-[11px] font-semibold text-violet-300">{form.availableRoles.length} selected</span>
              </div>
              <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {VOLUNTEER_ROLE_OPTIONS.map((role) => (
                    <label
                      key={role}
                      className="inline-flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs text-slate-200"
                    >
                      <input
                        type="checkbox"
                        checked={form.availableRoles.includes(role)}
                        onChange={() => onToggleRole(role)}
                        className="mt-0.5 h-3.5 w-3.5 accent-violet-500"
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-300">
                <input type="checkbox" checked={form.is_active} onChange={(e) => onFieldChange('is_active', e.target.checked)} />
                Active Event
              </label>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-bold text-white"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                {saving ? (mode === 'edit' ? 'Updating...' : 'Creating...') : mode === 'edit' ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const EventDetailModal = ({ open, eventItem, onClose }) => {
  if (!open || !eventItem) return null;
  const eventImage = eventItem.image_file || eventItem.image_url || eventItem.image || '';
  const galleryImages = Array.isArray(eventItem.gallery_images) ? eventItem.gallery_images : [];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-3">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">{eventItem.title || `Event #${eventItem.id}`}</h2>
            <p className="text-xs text-slate-400">Detailed event information</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-5">
          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              {eventImage ? (
                <img src={eventImage} alt={eventItem.title || 'Event'} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-[240px] items-center justify-center text-sm font-semibold text-slate-500">No thumbnail</div>
              )}
            </div>
            <div className="grid gap-2 text-sm text-slate-200">
              <p><span className="font-semibold text-white">Status:</span> {eventItem.status || '-'}</p>
              <p><span className="font-semibold text-white">Stream:</span> {eventItem.stream || '-'}</p>
              <p><span className="font-semibold text-white">Date:</span> {eventItem.date || '-'}</p>
              <p><span className="font-semibold text-white">Completed On:</span> {eventItem.completed_on || '-'}</p>
              <p><span className="font-semibold text-white">Time:</span> {eventItem.time || '-'}</p>
              <p><span className="font-semibold text-white">Location:</span> {eventItem.location || '-'}</p>
              <p><span className="font-semibold text-white">Organizer:</span> {eventItem.organizer || '-'}</p>
              <p><span className="font-semibold text-white">Seats:</span> {eventItem.seats ?? 0}</p>
              <p><span className="font-semibold text-white">Joined:</span> {eventItem.joined_count ?? 0}</p>
              <p><span className="font-semibold text-white">Budget Spent:</span> {eventItem.budget_spent ?? 0}</p>
              <p><span className="font-semibold text-white">Impact:</span> {eventItem.impact || '-'}</p>
              <p><span className="font-semibold text-white">Active:</span> {eventItem.is_active ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Description</p>
              <p className="text-sm text-slate-200">{eventItem.description || '-'}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Summary</p>
              <p className="text-sm text-slate-200">{eventItem.summary || '-'}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Completion Brief</p>
              <p className="text-sm text-slate-200">{eventItem.completion_brief || '-'}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Gallery ({galleryImages.length})</p>
              {galleryImages.length ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {galleryImages.map((url, index) => (
                    <div key={`${url}-${index}`} className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                      <img src={url} alt={`Gallery ${index + 1}`} className="h-28 w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No gallery images.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminVolunteerEventsPage = () => {
  const navigate = useNavigate();
  const session = getAuthSession();
  const isAdmin = session?.role === 'admin';

  const [eventForm, setEventForm] = useState(createEmptyForm);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventError, setEventError] = useState('');
  const [eventSuccess, setEventSuccess] = useState('');
  const [volunteerEvents, setVolunteerEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingEventId, setEditingEventId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const sortedEvents = useMemo(
    () => [...volunteerEvents].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0)),
    [volunteerEvents],
  );

  const loadVolunteerEvents = useCallback(async (page = 1) => {
    if (!isAdmin) return;
    setEventLoading(true);
    setEventError('');
    try {
      const payload = await menteeApi.listVolunteerEvents({ page });
      const list = normalizeList(payload);
      const count = Number(payload?.count ?? list.length ?? 0);
      const computedTotalPages = Math.max(1, Math.ceil(count / 6));

      setVolunteerEvents(list);
      setCurrentPage(page);
      setTotalEvents(count);
      setTotalPages(computedTotalPages);
      setHasNextPage(Boolean(payload?.next));
      setHasPrevPage(Boolean(payload?.previous));
    } catch (err) {
      setVolunteerEvents([]);
      setTotalEvents(0);
      setTotalPages(1);
      setHasNextPage(false);
      setHasPrevPage(false);
      setEventError(err?.message || 'Unable to load volunteer events.');
    } finally {
      setEventLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    loadVolunteerEvents(1);
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

  const handleThumbnailFileChange = async (event) => {
    const selected = event?.target?.files?.[0] || null;
    if (!selected) {
      setEventForm((prev) => ({ ...prev, imageFile: null }));
      return;
    }
    try {
      if (!String(selected.type || '').toLowerCase().startsWith('image/')) {
        throw new Error('Please select a valid image file.');
      }
      const optimized = await compressEventImageIfNeeded(selected);
      if (optimized && optimized.size > EVENT_MAX_IMAGE_BYTES) {
        throw new Error(
          `Image is too large (${formatFileSizeLabel(optimized.size)}). Please upload a smaller image.`
        );
      }
      setEventForm((prev) => ({ ...prev, imageFile: optimized }));
      if (optimized.size < selected.size) {
        setEventSuccess('Image optimized for faster upload.');
        window.setTimeout(() => setEventSuccess(''), 3500);
      }
    } catch (err) {
      setEventError(getFriendlyErrorMessage(err, 'Unable to process this image. Please try a different file.'));
    } finally {
      if (event?.target) event.target.value = '';
    }
  };

  const appendGalleryFiles = async (incomingFiles) => {
    const filesToAdd = Array.from(incomingFiles || []);
    if (!filesToAdd.length) return;
    try {
      const optimizedFiles = [];
      let optimizedCount = 0;
      for (const selected of filesToAdd) {
        if (!String(selected.type || '').toLowerCase().startsWith('image/')) continue;
        const optimized = await compressEventImageIfNeeded(selected);
        if (optimized && optimized.size > EVENT_MAX_IMAGE_BYTES) {
          throw new Error(
            `Image is too large (${formatFileSizeLabel(optimized.size)}). Please upload a smaller image.`
          );
        }
        if (optimized && optimized.size < selected.size) optimizedCount += 1;
        if (optimized) optimizedFiles.push(optimized);
      }
      setEventForm((prev) => {
        const existingKeys = new Set(prev.galleryImageFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
        const dedupedNewFiles = optimizedFiles.filter((file) => !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`));
        return { ...prev, galleryImageFiles: [...prev.galleryImageFiles, ...dedupedNewFiles] };
      });
      if (optimizedCount > 0) {
        setEventSuccess('Selected images were optimized for faster upload.');
        window.setTimeout(() => setEventSuccess(''), 3500);
      }
    } catch (err) {
      setEventError(getFriendlyErrorMessage(err, 'Unable to process one or more gallery images.'));
    }
  };

  const removeGalleryFile = (targetFile) => {
    const targetKey = `${targetFile.name}-${targetFile.size}-${targetFile.lastModified}`;
    setEventForm((prev) => ({
      ...prev,
      galleryImageFiles: prev.galleryImageFiles.filter(
        (file) => `${file.name}-${file.size}-${file.lastModified}` !== targetKey,
      ),
    }));
  };

  const toggleRoleSelection = (role) => {
    setEventForm((prev) => {
      const alreadySelected = prev.availableRoles.includes(role);
      return {
        ...prev,
        availableRoles: alreadySelected
          ? prev.availableRoles.filter((item) => item !== role)
          : [...prev.availableRoles, role],
      };
    });
  };

  const openCreateModal = () => {
    setFormMode('create');
    setEditingEventId(null);
    setEventForm(createEmptyForm());
    setEventError('');
    setEventSuccess('');
    setFormOpen(true);
  };

  const openEditModal = (eventItem) => {
    setFormMode('edit');
    setEditingEventId(eventItem.id);
    setEventForm(eventToForm(eventItem));
    setEventError('');
    setEventSuccess('');
    setFormOpen(true);
  };

  const openDetailModal = (eventItem) => {
    setSelectedEvent(eventItem);
    setDetailOpen(true);
  };

  const closeFormModal = () => {
    if (eventSaving) return;
    setFormOpen(false);
  };

  const handleSaveEvent = async (event) => {
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
    const totalUploadBytes =
      Number(eventForm.imageFile?.size || 0) +
      eventForm.galleryImageFiles.reduce((sum, file) => sum + Number(file?.size || 0), 0);
    if (totalUploadBytes > EVENT_MAX_TOTAL_UPLOAD_BYTES) {
      setEventError(
        `Total upload is too large (${formatFileSizeLabel(totalUploadBytes)}). Keep total images under ${formatFileSizeLabel(EVENT_MAX_TOTAL_UPLOAD_BYTES)}.`
      );
      return;
    }

    setEventSaving(true);
    try {
      const baseFormData = new FormData();
      baseFormData.append('title', eventForm.title.trim());
      baseFormData.append('stream', eventForm.stream.trim());
      baseFormData.append('description', eventForm.description.trim());
      baseFormData.append('summary', eventForm.summary.trim());
      baseFormData.append('status', eventForm.status);
      baseFormData.append('date', eventForm.date || '');
      baseFormData.append('time', eventForm.time.trim());
      baseFormData.append('completed_on', eventForm.completed_on || '');
      baseFormData.append('joined_count', String(Number(eventForm.joinedCount || 0)));
      baseFormData.append('budget_spent', String(Number(eventForm.budgetSpent || 0)));
      baseFormData.append('completion_brief', eventForm.completionBrief.trim());
      baseFormData.append('location', eventForm.location.trim());
      baseFormData.append('organizer', eventForm.organizer.trim());
      baseFormData.append('seats', String(Number(eventForm.seats || 0)));
      baseFormData.append('impact', eventForm.impact.trim());
      eventForm.availableRoles.forEach((role) => baseFormData.append('available_roles', role));
      baseFormData.append('is_active', eventForm.is_active ? 'true' : 'false');

      let eventId = editingEventId;
      if (formMode === 'edit' && editingEventId) {
        await menteeApi.updateVolunteerEvent(editingEventId, baseFormData);
      } else {
        const created = await menteeApi.createVolunteerEvent(baseFormData);
        eventId = Number(created?.id || 0) || null;
      }

      if (!eventId) {
        throw new Error('Event saved but event id was not returned. Please refresh and retry image uploads.');
      }

      if (eventForm.imageFile) {
        const optimizedThumbnail = await compressImageFile(eventForm.imageFile, {
          maxBytes: THUMBNAIL_MAX_BYTES,
          maxSide: THUMBNAIL_MAX_SIDE,
        });
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('image_file', optimizedThumbnail);
        await menteeApi.updateVolunteerEvent(eventId, thumbnailFormData);
      }

      for (const galleryFile of eventForm.galleryImageFiles) {
        const optimizedGalleryImage = await compressImageFile(galleryFile, {
          maxBytes: GALLERY_MAX_BYTES,
          maxSide: GALLERY_MAX_SIDE,
        });
        const galleryFormData = new FormData();
        galleryFormData.append('gallery_image_files', optimizedGalleryImage);
        await menteeApi.updateVolunteerEvent(eventId, galleryFormData);
      }

      setEventSuccess(formMode === 'edit' ? 'Volunteer event updated successfully.' : 'Volunteer event created successfully.');
      setFormOpen(false);
      setEventForm(createEmptyForm());
      setEditingEventId(null);
      await loadVolunteerEvents(formMode === 'edit' ? currentPage : 1);
      window.setTimeout(() => setEventSuccess(''), 5000);
    } catch (err) {
      setEventError(
        getFriendlyErrorMessage(
          err,
          `Unable to ${formMode === 'edit' ? 'update' : 'create'} volunteer event.`
        )
      );
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
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div>
            <h1 className="text-2xl font-black text-white">Volunteer Events</h1>
            <p className="text-sm text-slate-400">Manage events using table view, popup details, and popup create/edit.</p>
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

        {eventError ? <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{eventError}</div> : null}
        {eventSuccess ? <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{eventSuccess}</div> : null}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15">
                <CalendarDays className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Events Table</h2>
                <p className="text-xs text-slate-400">
                  {totalEvents} events • Page {currentPage} of {totalPages}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadVolunteerEvents(currentPage)}
                disabled={eventLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${eventLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white"
              >
                <PlusCircle className="h-4 w-4" />
                Add Event
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800">
            <div className="max-h-[68vh] overflow-auto">
              <table className="min-w-full text-left">
                <thead className="sticky top-0 z-10 bg-slate-800/95">
                  <tr className="text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-3">Thumbnail</th>
                    <th className="px-3 py-3">Title</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Location</th>
                    <th className="px-3 py-3">Joined</th>
                    <th className="px-3 py-3">Budget</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {eventLoading ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-400">Loading events...</td>
                    </tr>
                  ) : sortedEvents.length ? (
                    sortedEvents.map((item) => {
                      const eventImage = item.image_file || item.image_url || item.image || '';
                      return (
                        <tr
                          key={item.id}
                          onClick={() => openDetailModal(item)}
                          className="cursor-pointer border-t border-slate-800/80 bg-slate-900/50 text-sm text-slate-200 hover:bg-slate-800/55"
                        >
                          <td className="px-3 py-2">
                            <div className="h-14 w-20 overflow-hidden rounded-md border border-slate-700 bg-slate-950">
                              {eventImage ? (
                                <img src={eventImage} alt={item.title || 'Event'} className="h-full w-full object-cover" loading="lazy" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-500">No image</div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <p className="max-w-[260px] truncate font-semibold text-white">{item.title || `Event #${item.id}`}</p>
                            <p className="max-w-[260px] truncate text-xs text-slate-400">{item.stream || '-'}</p>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-violet-500/20 text-violet-300'
                              }`}
                            >
                              {item.status || 'upcoming'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-300">{item.status === 'completed' ? item.completed_on || '-' : item.date || '-'}</td>
                          <td className="px-3 py-2 text-xs text-slate-300">{item.location || '-'}</td>
                          <td className="px-3 py-2 text-xs text-emerald-300">{item.joined_count ?? 0}</td>
                          <td className="px-3 py-2 text-xs text-amber-300">{item.budget_spent ?? 0}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(item);
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
                            >
                              <PencilLine className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-400">No volunteer events found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
            <p className="text-xs text-slate-400">
              Showing page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => loadVolunteerEvents(Math.max(1, currentPage - 1))}
                disabled={eventLoading || !hasPrevPage}
                className="rounded-md border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300 disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).slice(0, 7).map((_, index) => {
                const pageNumber = index + 1;
                const isActive = pageNumber === currentPage;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => loadVolunteerEvents(pageNumber)}
                    disabled={eventLoading}
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                      isActive
                        ? 'border-violet-500 bg-violet-500/20 text-violet-200'
                        : 'border-slate-700 text-slate-300'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => loadVolunteerEvents(Math.min(totalPages, currentPage + 1))}
                disabled={eventLoading || !hasNextPage}
                className="rounded-md border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <EventFormModal
        open={formOpen}
        mode={formMode}
        form={eventForm}
        saving={eventSaving}
        onClose={closeFormModal}
        onSubmit={handleSaveEvent}
        onFieldChange={updateEventForm}
        onThumbnailFileChange={handleThumbnailFileChange}
        onToggleRole={toggleRoleSelection}
        onAppendGalleryFiles={appendGalleryFiles}
        onRemoveGalleryFile={removeGalleryFile}
      />

      <EventDetailModal
        open={detailOpen}
        eventItem={selectedEvent}
        onClose={() => {
          setDetailOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};

export default AdminVolunteerEventsPage;
