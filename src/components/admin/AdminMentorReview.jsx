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
  Eye
} from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { mentorApi } from '../../apis/api/mentorApi';
import { clearAuthSession, getAuthSession } from '../../apis/api/storage';

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString([], { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
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
  if (value === 'approved') return 'bg-[#dcfce7] text-[#166534] ring-1 ring-[#166534]/20';
  if (value === 'rejected') return 'bg-[#fee2e2] text-[#b91c1c] ring-1 ring-[#b91c1c]/20';
  return 'bg-[#ede9fe] text-[#5b2c91] ring-1 ring-[#5b2c91]/20';
};

const getStatusChipClass = (status) => {
  if (status === 'completed' || status === 'verified') 
    return 'bg-[#dcfce7] text-[#166534] ring-1 ring-[#166534]/20';
  if (status === 'rejected') 
    return 'bg-[#fee2e2] text-[#b91c1c] ring-1 ring-[#b91c1c]/20';
  if (status === 'in_review') 
    return 'bg-[#fef3c7] text-[#92400e] ring-1 ring-[#92400e]/20';
  return 'bg-[#ede9fe] text-[#5b2c91] ring-1 ring-[#5b2c91]/20';
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
  if (values.some((item) => item === 'rejected')) return 'rejected';
  if (values.length > 0 && values.every((item) => item === 'approved')) return 'verified';
  if (values.some((item) => item === 'approved')) return 'in_review';
  return 'pending';
};

const normalizeDocumentDecisions = (rawValue, identityStatus = '') => {
  const normalized = { ...INITIAL_DOCUMENT_DECISIONS };
  let hasExplicitValue = false;
  if (rawValue && typeof rawValue === 'object') {
    Object.keys(normalized).forEach((key) => {
      const nextValue = String(rawValue[key] || '').toLowerCase();
      if (['pending', 'approved', 'rejected'].includes(nextValue)) {
        normalized[key] = nextValue;
        hasExplicitValue = true;
      }
    });
  }
  if (!hasExplicitValue && String(identityStatus).toLowerCase() === 'verified') {
    return {
      id_front: 'approved',
      id_back: 'approved',
      address_front: 'approved',
      address_back: 'approved',
    };
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
  const [lightbox, setLightbox] = useState({
    open: false,
    title: '',
    url: '',
    kind: 'unknown',
  });

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
      const [mentorResponse, onboardingResponse] = await Promise.all([
        mentorApi.getMentorById(reviewMentorId),
        mentorApi.getMentorOnboarding(reviewMentorId),
      ]);
      const identityVerification = onboardingResponse?.identity_verification || null;
      setSelectedMentor(mentorResponse || null);
      setSelectedOnboarding(onboardingResponse || null);
      setDocumentDecisions(
        normalizeDocumentDecisions(
          identityVerification?.document_review_status,
          identityVerification?.status
        )
      );
      setDocumentComments(
        normalizeDocumentComments(identityVerification?.document_review_comments)
      );
      setRejectDialog(INITIAL_REJECT_DIALOG);
    } catch (err) {
      const fallback = 'Unable to load mentor onboarding details.';
      const message = String(err?.message || '').trim();
      setError(message && message !== 'Request failed' ? message : fallback);
      setSelectedMentor(null);
      setSelectedOnboarding(null);
    } finally {
      setLoading(false);
    }
  }, [reviewMentorId]);

  useEffect(() => {
    loadMentorDetails();
  }, [loadMentorDetails]);

  if (session?.role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

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
      setDocumentDecisions(
        normalizeDocumentDecisions(updated?.document_review_status, updated?.status)
      );
      setDocumentComments(
        normalizeDocumentComments(updated?.document_review_comments)
      );
      await loadMentorDetails();
      setDecisionSuccess(
        `${DOCUMENT_LABELS[documentKey] || 'Document'} ${decision === 'approved' ? 'approved' : 'rejected'} successfully.`
      );
      return true;
    } catch (err) {
      const fallback = 'Unable to update this document right now. Please try again.';
      const message = String(err?.message || '').trim();
      setDecisionError(message && message !== 'Request failed' ? message : fallback);
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
      setRejectDialog((prev) => ({
        ...prev,
        error: `Rejection comment for ${prev.documentLabel || 'this document'} is required.`,
      }));
      return;
    }
    setDocumentComments((prev) => ({
      ...prev,
      [rejectDialog.documentKey]: comment,
    }));
    const success = await handleDocumentDecision(
      rejectDialog.documentKey,
      'rejected',
      comment
    );
    if (success) {
      setRejectDialog(INITIAL_REJECT_DIALOG);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f2f7] via-[#faf8ff] to-[#f0edf7] p-4 sm:p-6">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="rounded-2xl border border-[#e6e2f1] bg-white/80 backdrop-blur-sm p-6 shadow-lg mb-6 animate-fade-in-down">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5b2c91] to-[#4a2374] flex items-center justify-center shadow-lg shadow-[#5b2c91]/25">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#5b2c91] to-[#4a2374] bg-clip-text text-transparent">
                  Mentor Review
                </h1>
                <p className="text-sm text-[#6b7280] mt-1">
                  Review identity documents and onboarding status
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-all duration-200 shadow-sm"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to List
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-all duration-200 shadow-sm"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-2xl border border-[#e6e2f1] bg-white p-12 text-center shadow-sm animate-pulse">
            <div className="w-12 h-12 border-4 border-[#5b2c91] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#6b7280]">Loading mentor details...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-[#fecaca] bg-[#fee2e2] p-6 shadow-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-[#b91c1c] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#b91c1c]">Error Loading Data</h3>
                <p className="text-sm text-[#b91c1c] mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && selectedMentor && selectedOnboarding && (
          <div className="space-y-6">
            {/* Mentor Info Card */}
            <div className="rounded-2xl border border-[#e6e2f1] bg-white p-6 shadow-sm animate-fade-in">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5b2c91] to-[#4a2374] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#5b2c91]/25">
                  {(selectedMentor.first_name?.[0] || 'M').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-[#111827]">
                    {[selectedMentor.first_name, selectedMentor.last_name]
                      .filter(Boolean)
                      .join(' ') || `Mentor #${selectedMentor.id}`}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5 text-sm text-[#6b7280]">
                      <Mail className="w-4 h-4" />
                      {selectedMentor.email || 'No email'}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-[#6b7280]">
                      <Hash className="w-4 h-4" />
                      ID: {selectedMentor.id}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-[#6b7280]">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(identity.submitted_at)}
                    </div>
                  </div>
                </div>
                </div>
                <div className="lg:ml-4">
                  <div className="rounded-xl border border-[#e6e2f1] bg-gradient-to-br from-[#faf8ff] to-white px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                      Onboarding Status
                    </p>
                    <div
                      className={`mt-2 rounded-lg px-3 py-2 text-sm font-semibold capitalize text-center ${getStatusChipClass(
                        headerStatus
                      )}`}
                    >
                      {formatStatusLabel(headerStatus)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Identity Documents Section */}
            <div className="rounded-2xl border border-[#e6e2f1] bg-white p-6 shadow-sm animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#ede9fe] flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-[#5b2c91]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#111827]">
                    Identity Documents
                  </h3>
                  <p className="text-xs text-[#6b7280]">
                    Click on any image to view in full size
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {identityDocs.map((doc) => {
                  const available = Boolean(doc.url);
                  const kind = resolveDocumentKind(doc.url);
                  const docDecision = documentDecisions[doc.key] || 'pending';

                  return (
                    <div
                      key={doc.key}
                      className={`rounded-xl border transition-all duration-300 ${
                        available
                          ? 'border-[#e2d7f5] bg-gradient-to-br from-white to-[#faf8ff] hover:shadow-lg'
                          : 'border-[#e5e7eb] bg-[#f9fafb]'
                      }`}
                    >
                      {/* Document Header */}
                      <div className="p-4 border-b border-[#e6e2f1]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-[#111827] text-sm">
                              {doc.label}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="text-xs text-[#6b7280]">
                                Type: {formatProofTypeLabel(doc.proofType)}
                              </span>
                              <span className="text-xs text-[#9ca3af]">•</span>
                              <span className="text-xs text-[#6b7280]">
                                No: {doc.proofNumber || '-'}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize whitespace-nowrap ${getDocDecisionChipClass(
                              docDecision
                            )}`}
                          >
                            {docDecision}
                          </span>
                        </div>
                      </div>

                      {/* Document Preview */}
                      <div className="p-4">
                        {available ? (
                          <div className="space-y-3">
                            {/* Image/PDF Preview */}
                            {kind === 'image' ? (
                              <div
                                className="relative group rounded-lg overflow-hidden border-2 border-[#e2d7f5] bg-white cursor-pointer transition-all duration-300 hover:border-[#5b2c91] hover:shadow-xl"
                                onClick={() =>
                                  setLightbox({
                                    open: true,
                                    title: doc.label,
                                    url: doc.url,
                                    kind,
                                  })
                                }
                              >
                                <img
                                  src={doc.url}
                                  alt={doc.label}
                                  className="w-full h-48 object-cover"
                                />
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                  <div className="flex items-center gap-2 text-white">
                                    <ZoomIn className="w-5 h-5" />
                                    <span className="text-sm font-medium">
                                      Click to enlarge
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : kind === 'pdf' ? (
                              <div
                                className="relative group rounded-lg overflow-hidden border-2 border-[#e2d7f5] bg-gradient-to-br from-[#fef3c7] to-[#fde68a] cursor-pointer transition-all duration-300 hover:border-[#5b2c91] hover:shadow-xl h-48 flex items-center justify-center"
                                onClick={() =>
                                  setLightbox({
                                    open: true,
                                    title: doc.label,
                                    url: doc.url,
                                    kind,
                                  })
                                }
                              >
                                <div className="text-center">
                                  <FileText className="w-16 h-16 text-[#92400e] mx-auto mb-2" />
                                  <p className="text-sm font-semibold text-[#92400e]">
                                    PDF Document
                                  </p>
                                  <p className="text-xs text-[#92400e]/70 mt-1">
                                    Click to view
                                  </p>
                                </div>
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>
                            ) : (
                              <div className="rounded-lg border-2 border-dashed border-[#e5e7eb] bg-[#f9fafb] h-48 flex items-center justify-center">
                                <div className="text-center text-[#9ca3af]">
                                  <Eye className="w-12 h-12 mx-auto mb-2" />
                                  <p className="text-sm">Preview unavailable</p>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="flex-1 rounded-lg border-2 border-[#bbf7d0] bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] px-4 py-2.5 text-sm font-semibold text-[#166534] hover:from-[#dcfce7] hover:to-[#bbf7d0] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleDocumentDecision(doc.key, 'approved')}
                                disabled={decisionLoading === doc.key}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                {decisionLoading === doc.key ? 'Saving...' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                className="flex-1 rounded-lg border-2 border-[#fecaca] bg-gradient-to-r from-[#fef2f2] to-[#fee2e2] px-4 py-2.5 text-sm font-semibold text-[#b91c1c] hover:from-[#fee2e2] hover:to-[#fecaca] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => openRejectDialog(doc)}
                                disabled={decisionLoading === doc.key}
                              >
                                <XCircle className="w-4 h-4" />
                                {decisionLoading === doc.key ? 'Saving...' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg border-2 border-dashed border-[#e5e7eb] bg-[#fafafa] h-48 flex items-center justify-center">
                            <div className="text-center text-[#9ca3af]">
                              <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                              <p className="text-sm font-medium">Not uploaded</p>
                              <p className="text-xs mt-1">
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

            {/* Training Modules Section */}
            <div className="rounded-2xl border border-[#e6e2f1] bg-white p-6 shadow-sm animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#ede9fe] flex items-center justify-center">
                  <Award className="w-5 h-5 text-[#5b2c91]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#111827]">
                    Training Modules
                  </h3>
                  <p className="text-xs text-[#6b7280]">
                    Track mentor's training progress
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {(selectedOnboarding?.training_modules || []).map((module) => (
                  <div
                    key={module.id}
                    className="rounded-xl border border-[#e6e2f1] bg-gradient-to-r from-white to-[#faf8ff] p-4 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="font-semibold text-[#111827] text-sm flex-1">
                        {module.title}
                      </h4>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize whitespace-nowrap ${getStatusChipClass(
                          module.status
                        )}`}
                      >
                        {formatStatusLabel(module.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 rounded-full bg-[#ede9fe] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#5b2c91] to-[#7c3aed] transition-all duration-500"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, Number(module.progress_percent || 0))
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#5b2c91] whitespace-nowrap">
                        {Math.round(module.progress_percent || 0)}%
                      </span>
                    </div>
                  </div>
                ))}
                {!selectedOnboarding?.training_modules?.length && (
                  <div className="text-center py-8 text-[#6b7280]">
                    <Clock className="w-12 h-12 mx-auto mb-2 text-[#9ca3af]" />
                    <p className="text-sm">No training modules found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Decision Section */}
            <div className="rounded-2xl border border-[#e6e2f1] bg-white p-6 shadow-sm animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#ede9fe] flex items-center justify-center">
                  <User className="w-5 h-5 text-[#5b2c91]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#111827]">
                    Admin Decision
                  </h3>
                  <p className="text-xs text-[#6b7280]">
                    Review and approve mentor onboarding
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Status Overview */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-[#e6e2f1] bg-gradient-to-br from-[#faf8ff] to-white p-4">
                    <label className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
                      Identity Decision
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold capitalize ${getStatusChipClass(
                          identityDecision
                        )}`}
                      >
                        {formatStatusLabel(identityDecision)}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-[#9ca3af]">
                      Auto-calculated from document decisions
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#e6e2f1] bg-gradient-to-br from-[#faf8ff] to-white p-4">
                    <label className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
                      Training Status
                    </label>
                    <div className="mt-2">
                      <div
                        className={`rounded-lg px-3 py-2.5 text-sm font-semibold capitalize ${getStatusChipClass(
                          trainingStatus
                        )}`}
                      >
                        {formatStatusLabel(trainingStatus)}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Feedback Messages */}
                {decisionError && (
                  <div className="rounded-lg bg-[#fee2e2] border border-[#fecaca] px-4 py-3 flex items-start gap-3 animate-shake">
                    <XCircle className="w-5 h-5 text-[#b91c1c] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#b91c1c]">{decisionError}</p>
                  </div>
                )}
                {decisionSuccess && !decisionError && (
                  <div className="rounded-lg bg-[#dcfce7] border border-[#bbf7d0] px-4 py-3 flex items-start gap-3 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-[#166534] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#166534]">{decisionSuccess}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Comment Modal */}
      {rejectDialog.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-6"
          role="dialog"
          aria-modal="true"
          onClick={closeRejectDialog}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#e6e2f1] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e6e2f1] px-5 py-4 bg-gradient-to-r from-[#fff5f5] to-white">
              <div>
                <h3 className="text-base font-semibold text-[#111827]">
                  Reject {rejectDialog.documentLabel}
                </h3>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Add a reason before submitting rejection.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-[#e5e7eb] bg-white p-2 text-[#6b7280] hover:bg-[#f9fafb] transition-colors"
                onClick={closeRejectDialog}
                disabled={decisionLoading === rejectDialog.documentKey}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <label className="text-sm font-medium text-[#374151]">
                Rejection comment
              </label>
              <textarea
                rows={4}
                className="mt-1.5 w-full rounded-lg border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent"
                placeholder="Enter rejection reason..."
                value={rejectDialog.comment}
                onChange={(event) =>
                  setRejectDialog((prev) => ({
                    ...prev,
                    comment: event.target.value,
                    error: '',
                  }))
                }
              />
              {rejectDialog.error && (
                <p className="mt-2 text-xs font-medium text-[#b91c1c]">
                  {rejectDialog.error}
                </p>
              )}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
                  onClick={closeRejectDialog}
                  disabled={decisionLoading === rejectDialog.documentKey}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[#fecaca] bg-gradient-to-r from-[#fef2f2] to-[#fee2e2] px-4 py-2 text-sm font-semibold text-[#b91c1c] hover:from-[#fee2e2] hover:to-[#fecaca] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleRejectSubmit}
                  disabled={decisionLoading === rejectDialog.documentKey}
                >
                  {decisionLoading === rejectDialog.documentKey ? 'Submitting...' : 'Submit Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightbox.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6 animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() =>
            setLightbox({ open: false, title: '', url: '', kind: 'unknown' })
          }
        >
          <div
            className="w-full max-w-6xl rounded-3xl border border-[#e6e2f1] bg-white shadow-2xl overflow-hidden animate-fade-in-up"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e6e2f1] px-6 py-4 bg-gradient-to-r from-[#faf8ff] to-white">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-[#111827] truncate">
                  {lightbox.title}
                </h3>
                <p className="text-sm text-[#6b7280] truncate mt-0.5">
                  {getDocumentName(lightbox.url)}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  type="button"
                  className="rounded-lg border border-[#e5e7eb] bg-white p-2 text-[#6b7280] hover:bg-[#f9fafb] transition-colors duration-200"
                  onClick={() =>
                    setLightbox({ open: false, title: '', url: '', kind: 'unknown' })
                  }
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="max-h-[80vh] overflow-auto bg-[#faf8ff] p-6">
              {lightbox.kind === 'image' && (
                <img
                  src={lightbox.url}
                  alt={lightbox.title}
                  className="mx-auto max-h-[72vh] w-auto max-w-full rounded-xl border-2 border-[#e2d7f5] bg-white shadow-2xl object-contain"
                />
              )}
              {lightbox.kind === 'pdf' && (
                <iframe
                  title={lightbox.title}
                  src={lightbox.url}
                  className="w-full h-[72vh] rounded-xl border-2 border-[#e2d7f5] bg-white shadow-2xl"
                />
              )}
              {lightbox.kind === 'unknown' && (
                <div className="rounded-xl border-2 border-[#e2d7f5] bg-white p-12 text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-[#9ca3af]" />
                  <p className="text-sm text-[#6b7280]">
                    Preview is not available for this file type.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMentorReview;
