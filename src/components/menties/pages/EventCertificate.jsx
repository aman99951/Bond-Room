import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import logo from '../../assets/Logo.svg';
import watermarkImage from '../../assets/logo bg rope.png';
import { menteeApi } from '../../../apis/api/menteeApi';

const formatDate = (value) => {
  if (!value) return 'Date unavailable';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
};

const COMMON_CERTIFICATE_DATA = {
  eventTitle: 'Voice of the Ocean',
  eventDate: '18-Apr-2026',
  issueDate: '18-Apr-2026',
  location: 'Besant Nagar beach, Chennai',
  website: 'www.bondroom.org',
  signatories: [
    { name: 'Smrithi Gajendran', title: 'Founder' },
    { name: 'Nikhil Vijay', title: 'Co-Founder' },
    { name: 'Babu Kuruchev', title: 'Director - Bondroom Foundation' },
  ],
};

const PRESET_CERTIFICATES = {
  'voice-of-ocean-anusha': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'E. Anusha Lalita, Bala Vidya Mandir Sr. Sec School',
    certificateNumber: 'BR-CERT-VOO-2026-ANUSHA',
  },
  'e-anusha-lalita': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'E. Anusha Lalita, Bala Vidya Mandir Sr. Sec School',
    certificateNumber: 'BR-CERT-VOO-2026-ANUSHA',
  },
  'g-neha': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'G. Neha, Bala vidya Mandir',
    certificateNumber: 'BR-CERT-VOO-2026-NEHA',
  },
  'deeptha-balaji': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'Deeptha Balaji, Bala Vidya Mandir Sr. Sec. School',
    certificateNumber: 'BR-CERT-VOO-2026-DEEPTHA',
  },
  'avantika-sri-sr': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'Avantika Sri SR, Bala Vidya Mandir Sr. Sec School',
    certificateNumber: 'BR-CERT-VOO-2026-AVANTIKA',
  },
  'm-hansika': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'M. Hansika, BVM',
    certificateNumber: 'BR-CERT-VOO-2026-HANSIKA',
  },
  'g-nishanth': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'G. Nishanth, Sir Sivaswami Kalakaya, mylapore',
    certificateNumber: 'BR-CERT-VOO-2026-NISHANTH',
  },
  sreeparvathy: {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'Sreeparvathy, Chettinad Harishree Vidyalam',
    certificateNumber: 'BR-CERT-VOO-2026-SREEPARVATHY',
  },
  'r-krusha': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'R. Krusha, BVM School',
    certificateNumber: 'BR-CERT-VOO-2026-KRUSHA',
  },
  'ezhilvisakan-selvakumar': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'Ezhilvisakan Selvakumar, National Public School, Gopalapuram',
    certificateNumber: 'BR-CERT-VOO-2026-EZHILVISAKAN',
  },
  'srinidhi-selvakumar': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'Srinidhi Selvakumar, National Public School, Gopalapuram',
    certificateNumber: 'BR-CERT-VOO-2026-SRINIDHI',
  },
  'p-b-mokshitha': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'P.B. Mokshitha, Bala Vidya Mandir',
    certificateNumber: 'BR-CERT-VOO-2026-MOKSHITHA',
  },
  'vishva-dev': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'Vishva dev, Bhavans rajaji vidhyashramam, Kilpauk',
    certificateNumber: 'BR-CERT-VOO-2026-VISHVADEV',
  },
  's-praneetha': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'S. Praneetha, Chrysalis high marq, Banglore',
    certificateNumber: 'BR-CERT-VOO-2026-PRANEETHA',
  },
  'pragya-senthil': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'Pragya Senthil, Chrysalis high marq, Banglore',
    certificateNumber: 'BR-CERT-VOO-2026-PRAGYA',
  },
  abirami: {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'Abirami, BVM',
    certificateNumber: 'BR-CERT-VOO-2026-ABIRAMI',
  },
  'sai-krishna': {
    ...COMMON_CERTIFICATE_DATA,
    participantName: 'Sai Krishna, BVM',
    certificateNumber: 'BR-CERT-VOO-2026-SAIKRISHNA',
  },
};

const EventCertificate = ({ presetKey = '' }) => {
  const navigate = useNavigate();
  const { registrationId, presetId } = useParams();
  const resolvedPresetKey = presetKey || presetId || '';
  const preset = PRESET_CERTIFICATES[resolvedPresetKey] || null;
  const certificateRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [registration, setRegistration] = useState(null);
  const [eventItem, setEventItem] = useState(null);

  useEffect(() => {
    if (preset) {
      setLoading(false);
      setError('');
      setRegistration({ id: preset.certificateNumber, full_name: preset.participantName });
      setEventItem({
        title: preset.eventTitle,
        date: preset.eventDate,
        completed_on: preset.eventDate,
        location: preset.location,
      });
      return undefined;
    }

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
  }, [preset, registrationId]);

  const participantName = preset?.participantName || registration?.full_name || 'Volunteer Participant';
  const eventTitle = preset?.eventTitle || registration?.volunteer_event_title || eventItem?.title || 'Volunteer Event';
  const eventDate = preset?.eventDate || formatDate(registration?.volunteer_event_date || eventItem?.date || eventItem?.completed_on);
  const issueDate = preset?.issueDate || formatDate(registration?.updated_at || registration?.created_at);
  const location =
    preset?.location ||
    eventItem?.location ||
    `${registration?.city || ''}${registration?.state ? `, ${registration.state}` : ''}`;
  const signatories = preset?.signatories || COMMON_CERTIFICATE_DATA.signatories;
  const certificateWebsite = preset?.website || COMMON_CERTIFICATE_DATA.website;
  const [participantPrimary, participantSecondary] = useMemo(() => {
    const [first, ...rest] = String(participantName).split(',').map((part) => part.trim());
    return [first || participantName, rest.join(', ')];
  }, [participantName]);

  const handleDownloadPdf = async () => {
    if (!certificateRef.current || downloading) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const image = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgRatio = canvas.width / canvas.height;
      const pageRatio = pageWidth / pageHeight;

      // Fit whole certificate without cropping, and paint page background
      // to avoid white margins in the final PDF.
      let targetWidth = pageWidth;
      let targetHeight = pageHeight;
      if (imgRatio > pageRatio) {
        targetHeight = pageWidth / imgRatio;
      } else {
        targetWidth = pageHeight * imgRatio;
      }
      const offsetX = (pageWidth - targetWidth) / 2;
      const offsetY = (pageHeight - targetHeight) / 2;

      pdf.setFillColor(49, 19, 95);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.addImage(image, 'PNG', offsetX, offsetY, targetWidth, targetHeight, undefined, 'FAST');
      const safeName = `${participantName}-${eventTitle}`.replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      pdf.save(`${safeName || 'bondroom-certificate'}.pdf`);
    } catch (err) {
      // Do not fallback to browser print because it injects URL/date headers and white margins.
      const message = err?.message ? `PDF generation failed: ${err.message}` : 'PDF generation failed. Please install dependencies and retry.';
      window.alert(message);
    } finally {
      setDownloading(false);
    }
  };

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
    <div className="print-only-root relative overflow-hidden p-4 sm:p-8">
      <style>
        {`
          @media print {
            @page {
              size: A4 landscape;
              margin: 0;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print { display: none !important; }
            body * { visibility: hidden !important; }
            .print-only-root, .print-only-root * { visibility: visible !important; }
            .print-only-root {
              position: absolute !important;
              inset: 0 !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            body { background: #fff !important; }
            .print-shell {
              box-shadow: none !important;
              border: 0 !important;
              border-radius: 0 !important;
              margin: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              min-height: 100vh !important;
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
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-full bg-[#5D3699] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4a2b7a]"
        >
          <Download className="h-3.5 w-3.5" />
          {downloading ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>

      <div ref={certificateRef} className="print-shell relative mx-auto aspect-[297/210] w-full max-w-6xl overflow-hidden rounded-[16px] border-[6px] border-[#7b5bb2] bg-[linear-gradient(160deg,#31135f_0%,#4d2a85_45%,#5D3699_100%)] shadow-[0_28px_80px_-50px_rgba(20,18,56,0.75)]">
        <div
          className="pointer-events-none absolute inset-3 z-0 rounded-[28px]"
          style={{
            backgroundImage: `url(${watermarkImage})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
            opacity: 0.6,
            filter: 'brightness(1.22) contrast(1.08)',
          }}
        />
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[rgba(248,217,107,0.15)]" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[rgba(199,169,255,0.2)]" />
        <div className="absolute -bottom-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[rgba(248,217,107,0.1)]" />
        <div className="absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-[rgba(199,169,255,0.2)]" />

        <div className="relative m-3 h-[calc(100%-24px)] rounded-[10px] border border-[rgba(248,217,107,0.35)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.03)_100%)] px-5 py-8 sm:px-8 sm:py-8">
          <div className="flex h-full flex-col justify-center gap-3">
            <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <img src={logo} alt="Bond Room" className="h-24 w-auto object-contain sm:h-28" />
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-4xl font-black tracking-[0.2em] text-[#f8d96b] sm:text-6xl">BOND ROOM FOUNDATION</h1>
                <p className="mt-3 text-sm font-bold tracking-[0.07em] text-[#ddd6fe] sm:text-base">
                  Government Registered Section 8 Non-Profit Organization
                </p>
              </div>
              <div className="w-[88px] sm:w-[104px]" />
            </div>

            <div className="rounded-2xl border border-[rgba(255,255,255,0.32)] bg-[rgba(255,255,255,0.12)] px-4 py-5 text-center backdrop-blur-[2px] sm:px-8 sm:py-6">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[#f8d96b]">This certificate is proudly awarded to</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">{participantPrimary}</h2>
              {participantSecondary ? <p className="mt-1 text-2xl font-bold text-[#f5f3ff] sm:text-3xl">{participantSecondary}</p> : null}
              <p className="mx-auto mt-4 max-w-4xl text-lg font-medium leading-7 text-white">
                for successful participation in
                <span className="mx-1.5 inline-flex items-center text-base font-bold leading-none text-white align-middle">{eventTitle}</span>
                organized by Bond Room.
              </p>
              <p className="mx-auto mt-2 max-w-4xl text-base font-semibold italic leading-7 text-[#f8d96b]">
                Your participation today is a building block for a better tomorrow; thank you for being a part of the change
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[rgba(255,255,255,0.32)] bg-[rgba(255,255,255,0.12)] px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#f8d96b]">Event Date</p>
                <div className="mt-1 flex items-center text-xl font-bold leading-tight text-white sm:text-2xl">
                  <span>{eventDate}</span>
                </div>
              </div>
              <div className="rounded-xl border border-[rgba(255,255,255,0.32)] bg-[rgba(255,255,255,0.12)] px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#f8d96b]">Location</p>
                <div className="mt-1 flex items-center text-lg font-bold leading-tight text-white sm:text-xl">
                  <span>{location || 'Community Venue'}</span>
                </div>
              </div>
              <div className="rounded-xl border border-[rgba(255,255,255,0.32)] bg-[rgba(255,255,255,0.12)] px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#f8d96b]">Issued On</p>
                <div className="mt-1 flex items-center text-xl font-bold leading-tight text-white sm:text-2xl">
                  <span>{issueDate}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[rgba(255,255,255,0.2)] pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {signatories.map((signatory) => (
                  <div key={signatory.name} className="text-center">
                    <p
                      className="mb-2 text-[22px] italic leading-tight text-[#f8d96b]"
                      style={{ fontFamily: '"Brush Script MT", "Segoe Script", cursive' }}
                    >
                      {signatory.name}
                    </p>
                    <div className="mx-auto mt-3 h-px w-48 bg-[rgba(255,255,255,0.4)]" />
                    <p className="mt-2 text-sm font-medium text-white">{signatory.title}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-[#f8d96b]">{certificateWebsite}</p>
                <p className="text-xs text-[#ddd6fe]">Bridging Old and New Destinies</p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCertificate;
