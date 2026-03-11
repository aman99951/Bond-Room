import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  FileText,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  User,
  Mail,
  Hash,
  FileCheck,
  AlertCircle,
  ZoomIn,
  Eye,
  LogOut,
  RefreshCw,
  ShieldCheck,
  GraduationCap,
  Gavel,
} from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { mentorApi } from '../../apis/api/mentorApi';
import { clearAuthSession, getAuthSession } from '../../apis/api/storage';

/* ───────── helpers ───────── */

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const resolveMediaUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
  const base = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
  if (value.startsWith('/')) return `${base}${value}`;
  return value;
};

const resolveDocumentKind = (url) => {
  if (!url) return 'unknown';
  const lowered = String(url).toLowerCase();
  if (/\.pdf($|\?)/i.test(lowered)) return 'pdf';
  if (/\.(png|jpe?g|gif|webp|bmp|svg)($|\?)/i.test(lowered)) return 'image';
  // Cloudinary secure URLs often omit file extensions (public_id only).
  // Infer the kind from resource type in the delivery path.
  if (lowered.includes('res.cloudinary.com')) {
    if (lowered.includes('/image/upload/')) return 'image';
    if (lowered.includes('/raw/upload/')) return 'pdf';
  }
  return 'unknown';
};

const getDocumentName = (url) => {
  if (!url) return '';
  const normalized = String(url).split('?')[0];
  const parts = normalized.split('/');
  return parts[parts.length - 1] || 'document';
};

const formatProofTypeLabel = (value) => {
  const map = {
    ration_card: 'Ration Card',
    aadhaar: 'Aadhaar',
    passport: 'Passport',
    pan_card: 'PAN Card',
    driving_license: 'Driving License',
  };
  return map[value] || '-';
};

const formatStatusLabel = (value) => String(value || 'pending').replace(/_/g, ' ');

const getDocDecisionChipClass = (value) => {
  if (value === 'approved')
    return 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30';
  if (value === 'rejected')
    return 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30';
  return 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30';
};

const getStatusChipClass = (status) => {
  if (status === 'completed' || status === 'verified')
    return 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30';
  if (status === 'rejected')
    return 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30';
  if (status === 'in_review')
    return 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30';
  return 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30';
};

const DOCUMENT_LABELS = {
  id_front: 'ID Proof Front',
  id_back: 'ID Proof Back',
  address_front: 'Address Proof Front',
  address_back: 'Address Proof Back',
};
const INITIAL_DOCUMENT_DECISIONS = {
  id_front: 'pending',
  id_back: 'pending',
  address_front: 'pending',
  address_back: 'pending',
};
const INITIAL_DOCUMENT_COMMENTS = {
  id_front: '',
  id_back: '',
  address_front: '',
  address_back: '',
};
const INITIAL_REJECT_DIALOG = {
  open: false,
  documentKey: '',
  documentLabel: '',
  comment: '',
  error: '',
};

const getIdentityStatusFromDocDecisions = (decisions) => {
  const values = Object.values(decisions || {});
  if (values.some((i) => i === 'rejected')) return 'rejected';
  if (values.length > 0 && values.every((i) => i === 'approved')) return 'verified';
  if (values.some((i) => i === 'approved')) return 'in_review';
  return 'pending';
};

const normalizeDocumentDecisions = (rawValue, identityStatus = '') => {
  const normalized = { ...INITIAL_DOCUMENT_DECISIONS };
  let hasExplicit = false;
  if (rawValue && typeof rawValue === 'object') {
    Object.keys(normalized).forEach((key) => {
      const v = String(rawValue[key] || '').toLowerCase();
      if (['pending', 'approved', 'rejected'].includes(v)) {
        normalized[key] = v;
        hasExplicit = true;
      }
    });
  }
  if (!hasExplicit && String(identityStatus).toLowerCase() === 'verified') {
    return { id_front: 'approved', id_back: 'approved', address_front: 'approved', address_back: 'approved' };
  }
  return normalized;
};

const normalizeDocumentComments = (rawValue) => {
  const normalized = { ...INITIAL_DOCUMENT_COMMENTS };
  if (!rawValue || typeof rawValue !== 'object') return normalized;
  Object.keys(normalized).forEach((key) => {
    normalized[key] = String(rawValue[key] || '');
  });
  return normalized;
};

/* ───────── component ───────── */

const AdminMentorReview = () => {
  const navigate = useNavigate();
  const { mentorId } = useParams();
  const session = getAuthSession();
  const reviewMentorId = Number(mentorId);

  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decisionLoading, setDecisionLoading] = useState('');
  const [decisionError, setDecisionError] = useState('');
  const [decisionSuccess, setDecisionSuccess] = useState('');
  const [documentDecisions, setDocumentDecisions] = useState(INITIAL_DOCUMENT_DECISIONS);
  const [documentComments, setDocumentComments] = useState(INITIAL_DOCUMENT_COMMENTS);
  const [rejectDialog, setRejectDialog] = useState(INITIAL_REJECT_DIALOG);
  const [lightbox, setLightbox] = useState({ open: false, title: '', url: '', kind: 'unknown' });

  const loadMentorDetails = useCallback(async () => {
    if (!Number.isFinite(reviewMentorId) || reviewMentorId <= 0) {
      setError('Invalid mentor id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setDecisionError('');
    setDecisionSuccess('');
    try {
      const [mentorRes, onboardingRes] = await Promise.all([
        mentorApi.getMentorById(reviewMentorId),
        mentorApi.getMentorOnboarding(reviewMentorId),
      ]);
      const iv = onboardingRes?.identity_verification || null;
      setSelectedMentor(mentorRes || null);
      setSelectedOnboarding(onboardingRes || null);
      setDocumentDecisions(normalizeDocumentDecisions(iv?.document_review_status, iv?.status));
      setDocumentComments(normalizeDocumentComments(iv?.document_review_comments));
      setRejectDialog(INITIAL_REJECT_DIALOG);
    } catch (err) {
      const fb = 'Unable to load mentor onboarding details.';
      const msg = String(err?.message || '').trim();
      setError(msg && msg !== 'Request failed' ? msg : fb);
      setSelectedMentor(null);
      setSelectedOnboarding(null);
    } finally {
      setLoading(false);
    }
  }, [reviewMentorId]);

  useEffect(() => {
    loadMentorDetails();
  }, [loadMentorDetails]);

  if (session?.role !== 'admin') return <Navigate to="/admin" replace />;

  const handleLogout = () => {
    clearAuthSession();
    navigate('/admin');
  };

  const identity = selectedOnboarding?.identity_verification || {};
  const onboardingStatus = selectedOnboarding?.status || {};
  const computedIdentityStatus = getIdentityStatusFromDocDecisions(documentDecisions);
  const identityDecision = identity?.status || computedIdentityStatus || 'pending';
  const trainingStatus = onboardingStatus?.training_status || 'pending';
  const headerStatus =
    onboardingStatus?.current_status ||
    onboardingStatus?.identity_status ||
    identityDecision ||
    'pending';

  const handleDocumentDecision = async (documentKey, decision, commentOverride = '') => {
    if (!identity?.id || decisionLoading) return false;
    const comment = String(commentOverride || documentComments[documentKey] || '').trim();
    if (decision === 'rejected' && !comment) {
      setDecisionError(`Comment is required for ${DOCUMENT_LABELS[documentKey] || 'this document'}.`);
      return false;
    }
    setDecisionLoading(documentKey);
    setDecisionError('');
    setDecisionSuccess('');
    try {
      const updated = await mentorApi.setIdentityDocumentDecision(identity.id, {
        document_key: documentKey,
        decision,
        comment: decision === 'rejected' ? comment : '',
      });
      setDocumentDecisions(normalizeDocumentDecisions(updated?.document_review_status, updated?.status));
      setDocumentComments(normalizeDocumentComments(updated?.document_review_comments));
      await loadMentorDetails();
      setDecisionSuccess(
        `${DOCUMENT_LABELS[documentKey] || 'Document'} ${decision === 'approved' ? 'approved' : 'rejected'} successfully.`,
      );
      return true;
    } catch (err) {
      const fb = 'Unable to update this document right now. Please try again.';
      const msg = String(err?.message || '').trim();
      setDecisionError(msg && msg !== 'Request failed' ? msg : fb);
      return false;
    } finally {
      setDecisionLoading('');
    }
  };

  const openRejectDialog = (doc) => {
    setRejectDialog({
      open: true,
      documentKey: doc.key,
      documentLabel: doc.label,
      comment: String(documentComments[doc.key] || ''),
      error: '',
    });
  };

  const closeRejectDialog = () => {
    if (decisionLoading) return;
    setRejectDialog(INITIAL_REJECT_DIALOG);
  };

  const handleRejectSubmit = async () => {
    if (!rejectDialog.documentKey) return;
    const comment = String(rejectDialog.comment || '').trim();
    if (!comment) {
      setRejectDialog((p) => ({
        ...p,
        error: `Rejection comment for ${p.documentLabel || 'this document'} is required.`,
      }));
      return;
    }
    setDocumentComments((p) => ({ ...p, [rejectDialog.documentKey]: comment }));
    const success = await handleDocumentDecision(rejectDialog.documentKey, 'rejected', comment);
    if (success) setRejectDialog(INITIAL_REJECT_DIALOG);
  };

  const identityDocs = [
    {
      key: 'id_front',
      label: 'ID Proof Front',
      url: resolveMediaUrl(identity.id_proof_document),
      proofType: identity.id_proof_type,
      proofNumber: identity.id_proof_number,
    },
    {
      key: 'id_back',
      label: 'ID Proof Back',
      url: resolveMediaUrl(identity.passport_or_license),
      proofType: identity.id_proof_type,
      proofNumber: identity.id_proof_number,
    },
    {
      key: 'address_front',
      label: 'Address Proof Front',
      url: resolveMediaUrl(identity.address_proof_document || identity.aadhaar_front),
      proofType: identity.address_proof_type,
      proofNumber: identity.address_proof_number,
    },
    {
      key: 'address_back',
      label: 'Address Proof Back',
      url: resolveMediaUrl(identity.aadhaar_back),
      proofType: identity.address_proof_type,
      proofNumber: identity.address_proof_number,
    },
  ];

  /* ───────── render ───────── */

  return (
    <div className="min-h-screen bg-[#0b0f1a] bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,_#1e1b4b33,_transparent)] p-3 sm:p-6">
      <div className="mx-auto max-w-[1440px]">

        {/* ── header ── */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-sm animate-fade-in-down">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
                <FileCheck className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">Mentor Review</h1>
                <p className="mt-1 text-sm text-slate-400">
                  Review identity documents and onboarding status
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to List
              </button>
              <button
                type="button"
                onClick={loadMentorDetails}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* ── loading ── */}
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-16 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400">Loading mentor details…</p>
          </div>
        )}

        {/* ── error ── */}
        {!loading && error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-rose-400" />
              <div>
                <h3 className="font-bold text-rose-400">Error Loading Data</h3>
                <p className="mt-1 text-sm text-rose-300/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── main content ── */}
        {!loading && !error && selectedMentor && selectedOnboarding && (
          <div className="space-y-6">

            {/* ── mentor info card ── */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl animate-fade-in">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-2xl font-black text-white shadow-lg shadow-violet-500/25">
                    {(selectedMentor.first_name?.[0] || 'M').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-black text-white">
                      {[selectedMentor.first_name, selectedMentor.last_name].filter(Boolean).join(' ') ||
                        `Mentor #${selectedMentor.id}`}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      {[
                        { icon: Mail, text: selectedMentor.email || 'No email' },
                        { icon: Hash, text: `ID: ${selectedMentor.id}` },
                        { icon: Calendar, text: formatDateTime(identity.submitted_at) },
                      ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-1.5 text-sm text-slate-400">
                          <Icon className="h-4 w-4 text-slate-500" />
                          {text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* onboarding status badge */}
                <div className="flex-shrink-0">
                  <div className="rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Onboarding Status
                    </p>
                    <div
                      className={`mt-2 rounded-lg px-4 py-2.5 text-center text-sm font-bold capitalize ${getStatusChipClass(
                        headerStatus,
                      )}`}
                    >
                      {formatStatusLabel(headerStatus)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── identity documents ── */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl animate-fade-in">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15">
                  <ShieldCheck className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Identity Documents</h3>
                  <p className="text-xs text-slate-500">Click any image to view full size</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {identityDocs.map((doc) => {
                  const available = Boolean(doc.url);
                  const kind = resolveDocumentKind(doc.url);
                  const docDecision = documentDecisions[doc.key] || 'pending';
                  const isLoadingThis = decisionLoading === doc.key;

                  return (
                    <div
                      key={doc.key}
                      className={`group rounded-2xl border transition-all duration-300 ${
                        available
                          ? 'border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:shadow-xl hover:shadow-black/30'
                          : 'border-slate-800 bg-slate-800/20'
                      }`}
                    >
                      {/* doc header */}
                      <div className="border-b border-slate-700/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white">{doc.label}</h4>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-slate-500">
                                Type: {formatProofTypeLabel(doc.proofType)}
                              </span>
                              <span className="text-xs text-slate-600">•</span>
                              <span className="text-xs text-slate-500">
                                No: {doc.proofNumber || '-'}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold capitalize ${getDocDecisionChipClass(
                              docDecision,
                            )}`}
                          >
                            {docDecision}
                          </span>
                        </div>
                      </div>

                      {/* doc preview */}
                      <div className="p-4">
                        {available ? (
                          <div className="space-y-3">
                            {kind === 'image' ? (
                              <div
                                className="relative cursor-pointer overflow-hidden rounded-xl border-2 border-slate-700 bg-slate-900 transition-all duration-300 hover:border-violet-500/60 hover:shadow-xl hover:shadow-violet-500/10"
                                onClick={() =>
                                  setLightbox({ open: true, title: doc.label, url: doc.url, kind })
                                }
                              >
                                <img
                                  src={doc.url}
                                  alt={doc.label}
                                  className="h-52 w-full object-cover"
                                />
                                {/* hover overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                  <div className="flex items-center gap-2 text-white">
                                    <ZoomIn className="h-5 w-5" />
                                    <span className="text-sm font-semibold">Click to enlarge</span>
                                  </div>
                                </div>
                              </div>
                            ) : kind === 'pdf' ? (
                              <div
                                className="relative flex h-52 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 transition-all duration-300 hover:border-amber-400/50 hover:shadow-xl"
                                onClick={() =>
                                  setLightbox({ open: true, title: doc.label, url: doc.url, kind })
                                }
                              >
                                <div className="text-center">
                                  <FileText className="mx-auto mb-2 h-16 w-16 text-amber-400" />
                                  <p className="text-sm font-bold text-amber-400">PDF Document</p>
                                  <p className="mt-1 text-xs text-amber-500/70">Click to view</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-52 items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/30">
                                <div className="text-center text-slate-600">
                                  <Eye className="mx-auto mb-2 h-12 w-12" />
                                  <p className="text-sm">Preview unavailable</p>
                                </div>
                              </div>
                            )}

                            {/* action buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDocumentDecision(doc.key, 'approved')}
                                disabled={isLoadingThis}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-400 transition-all hover:border-emerald-400/50 hover:bg-emerald-500/20 hover:text-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                {isLoadingThis ? 'Saving…' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                onClick={() => openRejectDialog(doc)}
                                disabled={isLoadingThis}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-400 transition-all hover:border-rose-400/50 hover:bg-rose-500/20 hover:text-rose-300 hover:shadow-lg hover:shadow-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <XCircle className="h-4 w-4" />
                                {isLoadingThis ? 'Saving…' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-52 items-center justify-center rounded-xl border-2 border-dashed border-slate-700/50 bg-slate-800/20">
                            <div className="text-center text-slate-600">
                              <AlertCircle className="mx-auto mb-2 h-12 w-12 text-slate-700" />
                              <p className="text-sm font-medium text-slate-500">Not uploaded</p>
                              <p className="mt-1 text-xs text-slate-600">
                                Document not provided by mentor
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── training modules ── */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl animate-fade-in">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15">
                  <GraduationCap className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Training Modules</h3>
                  <p className="text-xs text-slate-500">Track mentor's training progress</p>
                </div>
              </div>

              <div className="grid gap-4">
                {(selectedOnboarding?.training_modules || []).map((module) => (
                  <div
                    key={module.id}
                    className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 transition-all hover:border-slate-700 hover:bg-slate-800/60"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="flex-1 text-sm font-bold text-white">{module.title}</h4>
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusChipClass(
                          module.status,
                        )}`}
                      >
                        {formatStatusLabel(module.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-700/50">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all duration-500"
                          style={{
                            width: `${Math.max(0, Math.min(100, Number(module.progress_percent || 0)))}%`,
                          }}
                        />
                      </div>
                      <span className="whitespace-nowrap text-xs font-bold text-violet-400">
                        {Math.round(module.progress_percent || 0)}%
                      </span>
                    </div>
                  </div>
                ))}

                {!selectedOnboarding?.training_modules?.length && (
                  <div className="py-10 text-center">
                    <Clock className="mx-auto mb-3 h-12 w-12 text-slate-700" />
                    <p className="text-sm text-slate-500">No training modules found</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── admin decision ── */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl animate-fade-in">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15">
                  <Gavel className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Admin Decision</h3>
                  <p className="text-xs text-slate-500">Review and approve mentor onboarding</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* status overview */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      label: 'Identity Decision',
                      value: identityDecision,
                      note: 'Auto-calculated from document decisions',
                    },
                    {
                      label: 'Training Status',
                      value: trainingStatus,
                      note: null,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-5"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {item.label}
                      </p>
                      <div
                        className={`mt-3 rounded-lg px-4 py-2.5 text-sm font-bold capitalize ${getStatusChipClass(
                          item.value,
                        )}`}
                      >
                        {formatStatusLabel(item.value)}
                      </div>
                      {item.note && <p className="mt-2 text-xs text-slate-600">{item.note}</p>}
                    </div>
                  ))}
                </div>

                {/* feedback messages */}
                {decisionError && (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 animate-shake">
                    <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-400" />
                    <p className="text-sm font-medium text-rose-400">{decisionError}</p>
                  </div>
                )}
                {decisionSuccess && !decisionError && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 animate-fade-in">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                    <p className="text-sm font-medium text-emerald-400">{decisionSuccess}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ───────── REJECT DIALOG ───────── */}
      {rejectDialog.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={closeRejectDialog}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-rose-500/10 to-slate-900 p-5">
              <div>
                <h3 className="text-base font-bold text-white">
                  Reject {rejectDialog.documentLabel}
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Add a reason before submitting rejection.
                </p>
              </div>
              <button
                type="button"
                onClick={closeRejectDialog}
                disabled={decisionLoading === rejectDialog.documentKey}
                className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* body */}
            <div className="p-5">
              <label className="text-sm font-semibold text-slate-300">Rejection comment</label>
              <textarea
                rows={4}
                className="mt-2 w-full rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                placeholder="Enter rejection reason…"
                value={rejectDialog.comment}
                onChange={(e) =>
                  setRejectDialog((p) => ({ ...p, comment: e.target.value, error: '' }))
                }
              />
              {rejectDialog.error && (
                <p className="mt-2 text-xs font-semibold text-rose-400">{rejectDialog.error}</p>
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeRejectDialog}
                  disabled={decisionLoading === rejectDialog.documentKey}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  disabled={decisionLoading === rejectDialog.documentKey}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-5 py-2.5 text-sm font-bold text-rose-400 transition-all hover:border-rose-400/50 hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {decisionLoading === rejectDialog.documentKey ? 'Submitting…' : 'Submit Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────── LIGHTBOX ───────── */}
      {lightbox.open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 px-3 py-4 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox({ open: false, title: '', url: '', kind: 'unknown' })}
        >
          <div
            className="w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-700 bg-[#0a0e1a] shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#0d1224] p-5">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-bold text-white">{lightbox.title}</h3>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {getDocumentName(lightbox.url)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightbox({ open: false, title: '', url: '', kind: 'unknown' })}
                className="ml-4 rounded-full border border-slate-700 bg-slate-800 p-2.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* content */}
            <div className="max-h-[82vh] overflow-auto bg-slate-900/50 p-4 sm:p-6">
              {lightbox.kind === 'image' && (
                <img
                  src={lightbox.url}
                  alt={lightbox.title}
                  className="mx-auto max-h-[74vh] w-auto max-w-full rounded-xl border-2 border-slate-700 bg-slate-900 object-contain shadow-2xl"
                />
              )}
              {lightbox.kind === 'pdf' && (
                <iframe
                  title={lightbox.title}
                  src={lightbox.url}
                  className="h-[74vh] w-full rounded-xl border-2 border-slate-700 bg-white shadow-2xl"
                />
              )}
              {lightbox.kind === 'unknown' && (
                <div className="rounded-xl border-2 border-slate-700 bg-slate-800/50 p-12 text-center">
                  <AlertCircle className="mx-auto mb-4 h-16 w-16 text-slate-600" />
                  <p className="text-sm text-slate-400">
                    Preview is not available for this file type.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── animations ── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-fade-in      { animation: fadeIn .4s ease-out both; }
        .animate-fade-in-up   { animation: fadeInUp .5s ease-out both; }
        .animate-fade-in-down { animation: fadeInDown .5s ease-out both; }
        .animate-shake        { animation: shake .4s ease-in-out; }
      `}</style>
    </div>
  );
};

export default AdminMentorReview;
