import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Download, MapPin } from 'lucide-react';
import logo from '../../../assets/logo.png';
import { menteeApi } from '../../../apis/api/menteeApi';

const formatDate = (value) => {
  if (!value) return 'Date unavailable';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
};

const EventCertificate = () => {
  const navigate = useNavigate();
  const { registrationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registration, setRegistration] = useState(null);
  const [eventItem, setEventItem] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!registrationId) {
        setLoading(false);
        setError('Certificate not found.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await menteeApi.getVolunteerEventRegistrationById(registrationId);
        if (cancelled) return;
        setRegistration(response || null);

        const eventId = response?.volunteer_event;
        if (eventId) {
          try {
            const eventResponse = await menteeApi.getVolunteerEventById(eventId);
            if (!cancelled) setEventItem(eventResponse || null);
          } catch {
            if (!cancelled) setEventItem(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setRegistration(null);
          setEventItem(null);
          setError(err?.message || 'Unable to load certificate details.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [registrationId]);

  const certificateNumber = useMemo(() => {
    const numeric = Number(registration?.id || registrationId || 0);
    if (!Number.isFinite(numeric) || numeric <= 0) return 'BR-CERT-0000';
    return `BR-CERT-${String(numeric).padStart(4, '0')}`;
  }, [registration?.id, registrationId]);

  const participantName = registration?.full_name || 'Volunteer Participant';
  const eventTitle = registration?.volunteer_event_title || eventItem?.title || 'Volunteer Event';
  const eventDate = formatDate(registration?.volunteer_event_date || eventItem?.date || eventItem?.completed_on);
  const issueDate = formatDate(registration?.updated_at || registration?.created_at);
  const location = eventItem?.location || `${registration?.city || ''}${registration?.state ? `, ${registration.state}` : ''}`;

  if (loading) {
    return (
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#e8dcff] bg-white p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#e7d8ff] border-t-[#5D3699]" />
          <p className="mt-3 text-sm text-[#6b7280]">Preparing certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center">
          <p className="text-sm text-red-600">{error || 'Certificate not available.'}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#5D3699] px-4 py-2 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden p-4 sm:p-8">
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { background: #fff !important; }
            .print-shell {
              box-shadow: none !important;
              border: 0 !important;
              margin: 0 !important;
              max-width: none !important;
            }
          }
        `}
      </style>

      <div className="no-print mx-auto mb-5 flex w-full max-w-5xl items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 rounded-full border border-[#e7d8ff] bg-white px-4 py-2 text-xs font-semibold text-[#5D3699] hover:bg-[#f8f4ff]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-[#5D3699] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4a2b7a]"
        >
          <Download className="h-3.5 w-3.5" />
          Download PDF
        </button>
      </div>

      <div className="print-shell relative mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#d6c8f2] bg-[linear-gradient(145deg,#ffffff_0%,#f9f4ff_45%,#eefcf2_100%)] shadow-[0_30px_80px_-40px_rgba(60,16,120,0.5)]">
        <div className="absolute left-8 top-8 h-20 w-20 rounded-full bg-[#f3e8ff] blur-2xl" />
        <div className="absolute bottom-8 right-8 h-20 w-20 rounded-full bg-[#dcfce7] blur-2xl" />
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05]">
          <img src={logo} alt="" className="h-72 w-72 object-contain" />
        </div>

        <div className="relative p-6 sm:p-12">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e9ddff] pb-5">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-xl border border-[#e7d8ff] bg-white p-1.5">
                <img src={logo} alt="Bond Room" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f4ca6]">Bond Room</p>
                <h1 className="text-lg font-semibold text-[#111827] sm:text-xl">Certificate of Participation</h1>
              </div>
            </div>
            <div className="rounded-xl border border-[#d9f9e6] bg-[#f0fdf4] px-3 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#166534]">Certificate No.</p>
              <p className="text-sm font-semibold text-[#14532d]">{certificateNumber}</p>
            </div>
          </div>

          <div className="py-8 text-center sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b699d]">This certifies that</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#2e1065] sm:text-5xl">{participantName}</h2>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[#374151] sm:text-base">
              has successfully completed and participated in
              <span className="mx-1 font-semibold text-[#14532d]">{eventTitle}</span>
              as part of the Bond Room community impact initiatives.
            </p>
          </div>

          <div className="grid gap-3 border-t border-[#e9ddff] pt-5 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e8dcff] bg-white px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7b699d]">Event Date</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[#111827]">
                <Calendar className="h-4 w-4 text-[#5D3699]" />
                {eventDate}
              </p>
            </div>
            <div className="rounded-xl border border-[#e8dcff] bg-white px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7b699d]">Location</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[#111827]">
                <MapPin className="h-4 w-4 text-[#5D3699]" />
                {location || 'Community Venue'}
              </p>
            </div>
            <div className="rounded-xl border border-[#d9f9e6] bg-[#f0fdf4] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#166534]">Issued On</p>
              <p className="mt-1 text-sm font-semibold text-[#14532d]">{issueDate}</p>
            </div>
          </div>

          <div className="mt-10 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-2xl italic leading-none text-[#4c1d95]" style={{ fontFamily: '"Brush Script MT", "Segoe Script", cursive' }}>
                A. Raman
              </p>
              <div className="h-px w-44 bg-[#c4b5fd]" />
              <p className="mt-1 text-xs text-[#6b7280]">Program Coordinator</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f4ca6]">Bond Room</p>
              <p className="text-[11px] text-[#6b7280]">Empowering through mentorship and service</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCertificate;
