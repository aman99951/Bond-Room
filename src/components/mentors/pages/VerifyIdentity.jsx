import React, { useEffect, useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';
import mentorLeft from '../../assets/teach1.png';
import mentorBottom from '../../assets/teach2.png';
import imageContainer from '../../assets/Image Container.png';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorAuth } from '../../../apis/apihook/useMentorAuth';
import { useMentorData } from '../../../apis/apihook/useMentorData';
import { getAuthSession, getPendingMentorRegistration } from '../../../apis/api/storage';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const PROOF_OPTIONS = [
  { value: 'ration_card', label: 'Ration Card' },
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'passport', label: 'Passport' },
  { value: 'pan_card', label: 'PAN Card' },
  { value: 'driving_license', label: 'Driving License' },
];

const ADDRESS_PROOF_OPTIONS = PROOF_OPTIONS.filter((option) => option.value !== 'pan_card');

const PROOF_NUMBER_HINTS = {
  ration_card: '6-12 alphanumeric (A-Z, 0-9). No spaces/special characters.',
  aadhaar: 'Exactly 12 digits only.',
  passport: 'Format: A1234567 (1 uppercase letter + 7 digits).',
  pan_card: 'Format: ABCDE1234F (10 characters).',
  driving_license: '14-18 alphanumeric (A-Z, 0-9). No spaces/special characters.',
};

const resolveMediaUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) {
    const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return base ? `${base}${value}` : value;
  }
  return value;
};

const resolveDocumentKind = ({ file, url }) => {
  const fileType = (file?.type || '').toLowerCase();
  if (fileType.startsWith('image/')) return 'image';
  if (fileType === 'application/pdf') return 'pdf';
  if (/\.pdf($|\?)/i.test(url || '')) return 'pdf';
  if (/\.(png|jpe?g|gif|webp|bmp|svg)($|\?)/i.test(url || '')) return 'image';
  return 'unknown';
};

const sanitizeProofNumber = (proofType, value) => {
  const clean = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (proofType === 'aadhaar') return clean.replace(/[^0-9]/g, '').slice(0, 12);
  if (proofType === 'passport') return clean.slice(0, 8);
  if (proofType === 'pan_card') return clean.slice(0, 10);
  if (proofType === 'ration_card') return clean.slice(0, 12);
  if (proofType === 'driving_license') return clean.slice(0, 18);
  return clean.slice(0, 18);
};

const validateProofNumber = (proofType, proofNumber) => {
  const value = String(proofNumber || '').trim().toUpperCase();
  if (!proofType) return 'Please select a document type.';
  if (!value) return 'Document number is required.';

  if (proofType === 'ration_card' && !/^[A-Z0-9]{6,12}$/.test(value)) {
    return 'Ration Card number must be 6-12 alphanumeric characters (no spaces or special characters).';
  }
  if (proofType === 'aadhaar' && !/^[0-9]{12}$/.test(value)) {
    return 'Aadhaar number must be exactly 12 digits.';
  }
  if (proofType === 'passport' && !/^[A-Z][1-9][0-9]{6}$/.test(value)) {
    return 'Passport number must follow A1234567 format.';
  }
  if (proofType === 'pan_card' && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value)) {
    return 'PAN number must follow ABCDE1234F format.';
  }
  if (proofType === 'driving_license' && !/^[A-Z0-9]{14,18}$/.test(value)) {
    return 'Driving License number must be 14-18 alphanumeric characters (no spaces or special characters).';
  }
  return '';
};

const getUploadStatus = (file, uploaded) => {
  if (file?.name) return file.name;
  if (uploaded) return 'Uploaded';
  return 'Not uploaded';
};

const getFriendlyErrorMessage = (error, fallbackMessage) => {
  const message = String(error?.message || '').trim();
  if (!message || message.toLowerCase().includes('request failed')) return fallbackMessage;
  return message;
};

const UploadCard = ({
  title,
  file,
  uploaded,
  viewUrl,
  kind,
  onFileChange,
  error,
}) => (
  <div>
    <label
      className={`group h-[210px] border border-dashed rounded-xl p-4 flex flex-col items-center justify-between text-center gap-2 cursor-pointer hover:border-[#5b2c91] focus-within:border-[#5b2c91] focus-within:ring-2 focus-within:ring-[#5b2c91] ${
        uploaded
          ? 'border-[#22c55e] bg-[#f0fdf4]'
          : error
            ? 'border-red-500 bg-[#fff7f7]'
            : 'border-[#d7d0e2] bg-white'
      }`}
    >
      <input type="file" className="sr-only" accept=".jpg,.jpeg,.png,.pdf" onChange={onFileChange} />
      <div className="h-[94px] w-full overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f8fafc] flex items-center justify-center">
        {viewUrl && kind === 'image' ? (
          <img src={viewUrl} alt={title} className="h-full w-full object-contain bg-white" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-[#5b2c91] flex items-center justify-center">
            <Upload
              className={`h-5 w-5 ${uploaded ? 'text-[#FDD253]' : 'text-white'} group-focus-within:text-[#FDD253]`}
              aria-hidden="true"
            />
          </div>
        )}
      </div>
      <span className="text-sm text-[#1f2937] min-h-[20px] flex items-center justify-center leading-5">{title}</span>
      <span className="text-xs text-[#6b7280]">JPG, PNG or PDF</span>
      <span className={`text-xs max-w-full truncate ${uploaded ? 'text-[#166534] font-medium' : 'text-[#6b7280]'}`}>
        {getUploadStatus(file, uploaded)}
      </span>
      {viewUrl && kind === 'pdf' && <span className="text-[11px] text-[#5b2c91]">PDF uploaded</span>}
    </label>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const VerifyIdentity = () => {
  const navigate = useNavigate();
  const pendingMentor = useMemo(() => getPendingMentorRegistration(), []);
  const { mentor } = useMentorData();
  const { loginWithMobile } = useMentorAuth();

  const [idProofType, setIdProofType] = useState('');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [idProofFrontFile, setIdProofFrontFile] = useState(null);
  const [idProofBackFile, setIdProofBackFile] = useState(null);
  const [idProofFrontUrl, setIdProofFrontUrl] = useState('');
  const [idProofBackUrl, setIdProofBackUrl] = useState('');
  const [idProofFrontPreviewUrl, setIdProofFrontPreviewUrl] = useState('');
  const [idProofBackPreviewUrl, setIdProofBackPreviewUrl] = useState('');

  const [addressProofType, setAddressProofType] = useState('');
  const [addressProofNumber, setAddressProofNumber] = useState('');
  const [addressProofFrontFile, setAddressProofFrontFile] = useState(null);
  const [addressProofBackFile, setAddressProofBackFile] = useState(null);
  const [addressProofFrontUrl, setAddressProofFrontUrl] = useState('');
  const [addressProofBackUrl, setAddressProofBackUrl] = useState('');
  const [addressProofFrontPreviewUrl, setAddressProofFrontPreviewUrl] = useState('');
  const [addressProofBackPreviewUrl, setAddressProofBackPreviewUrl] = useState('');

  const [notes, setNotes] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [touched, setTouched] = useState({
    idProofType: false,
    idProofNumber: false,
    idProofFrontFile: false,
    idProofBackFile: false,
    addressProofType: false,
    addressProofNumber: false,
    addressProofFrontFile: false,
    addressProofBackFile: false,
  });
  const [authReady, setAuthReady] = useState(Boolean(getAuthSession()?.accessToken));

  const mentorId = pendingMentor?.mentorId || mentor?.id;
  const idProofFrontViewUrl = idProofFrontPreviewUrl || idProofFrontUrl;
  const idProofBackViewUrl = idProofBackPreviewUrl || idProofBackUrl;
  const addressProofFrontViewUrl = addressProofFrontPreviewUrl || addressProofFrontUrl;
  const addressProofBackViewUrl = addressProofBackPreviewUrl || addressProofBackUrl;
  const idProofFrontKind = resolveDocumentKind({ file: idProofFrontFile, url: idProofFrontViewUrl });
  const idProofBackKind = resolveDocumentKind({ file: idProofBackFile, url: idProofBackViewUrl });
  const addressProofFrontKind = resolveDocumentKind({ file: addressProofFrontFile, url: addressProofFrontViewUrl });
  const addressProofBackKind = resolveDocumentKind({ file: addressProofBackFile, url: addressProofBackViewUrl });
  const idProofFrontUploaded = Boolean(idProofFrontFile || idProofFrontUrl);
  const idProofBackUploaded = Boolean(idProofBackFile || idProofBackUrl);
  const addressProofFrontUploaded = Boolean(addressProofFrontFile || addressProofFrontUrl);
  const addressProofBackUploaded = Boolean(addressProofBackFile || addressProofBackUrl);

  const idProofNumberError = idProofNumber ? validateProofNumber(idProofType, idProofNumber) : '';
  const addressProofNumberError = addressProofNumber ? validateProofNumber(addressProofType, addressProofNumber) : '';
  const proofTypeConflict = idProofType && addressProofType && idProofType === addressProofType;
  const addressProofTypeOptions = useMemo(
    () => ADDRESS_PROOF_OPTIONS.filter((option) => option.value === addressProofType || option.value !== idProofType),
    [addressProofType, idProofType]
  );

  const showIdProofTypeError = (hasTriedSubmit || touched.idProofType) && !idProofType;
  const showAddressProofTypeError = (hasTriedSubmit || touched.addressProofType) && !addressProofType;
  const showIdProofNumberError = (hasTriedSubmit || touched.idProofNumber) && (!idProofNumber || Boolean(idProofNumberError));
  const showAddressProofNumberError =
    (hasTriedSubmit || touched.addressProofNumber) && (!addressProofNumber || Boolean(addressProofNumberError));
  const showIdProofFrontError = (hasTriedSubmit || touched.idProofFrontFile) && !idProofFrontUploaded;
  const showIdProofBackError = (hasTriedSubmit || touched.idProofBackFile) && !idProofBackUploaded;
  const showAddressProofFrontError = (hasTriedSubmit || touched.addressProofFrontFile) && !addressProofFrontUploaded;
  const showAddressProofBackError = (hasTriedSubmit || touched.addressProofBackFile) && !addressProofBackUploaded;

  useEffect(() => {
    if (addressProofType && (addressProofType === idProofType || addressProofType === 'pan_card')) {
      setAddressProofType('');
      setAddressProofNumber('');
    }
  }, [addressProofType, idProofType]);

  useEffect(() => {
    if (!idProofFrontFile) {
      setIdProofFrontPreviewUrl('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(idProofFrontFile);
    setIdProofFrontPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [idProofFrontFile]);

  useEffect(() => {
    if (!idProofBackFile) {
      setIdProofBackPreviewUrl('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(idProofBackFile);
    setIdProofBackPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [idProofBackFile]);

  useEffect(() => {
    if (!addressProofFrontFile) {
      setAddressProofFrontPreviewUrl('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(addressProofFrontFile);
    setAddressProofFrontPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [addressProofFrontFile]);

  useEffect(() => {
    if (!addressProofBackFile) {
      setAddressProofBackPreviewUrl('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(addressProofBackFile);
    setAddressProofBackPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [addressProofBackFile]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handleBackButton = () => {
      window.history.pushState(null, '', window.location.href);
      window.alert('You cannot go back from this page right now.');
    };
    window.addEventListener('popstate', handleBackButton);
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (authReady) return undefined;
    if (!pendingMentor?.mobile) return undefined;
    const ensureLogin = async () => {
      try {
        await loginWithMobile(pendingMentor.mobile, '123456', 'mentors');
        if (!cancelled) setAuthReady(true);
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            getFriendlyErrorMessage(err, 'Unable to authenticate your session right now. Please try again.')
          );
        }
      }
    };
    ensureLogin();
    return () => {
      cancelled = true;
    };
  }, [authReady, loginWithMobile, pendingMentor?.mobile]);

  useEffect(() => {
    let cancelled = false;
    if (!authReady || !mentorId) return undefined;
    const loadVerification = async () => {
      try {
        const response = await mentorApi.listIdentityVerifications({ mentor_id: mentorId });
        const list = Array.isArray(response) ? response : response?.results || [];
        const existing = list[0] || null;
        if (!cancelled && existing) {
          setVerificationId(existing.id);
          setVerificationStatus(existing.status || '');
          setIdProofType(existing.id_proof_type || '');
          setIdProofNumber(sanitizeProofNumber(existing.id_proof_type, existing.id_proof_number || ''));
          setIdProofFrontUrl(resolveMediaUrl(existing.id_proof_document));
          setIdProofBackUrl(resolveMediaUrl(existing.passport_or_license));
          setAddressProofType(existing.address_proof_type === 'pan_card' ? '' : existing.address_proof_type || '');
          setAddressProofNumber(sanitizeProofNumber(existing.address_proof_type, existing.address_proof_number || ''));
          setAddressProofFrontUrl(resolveMediaUrl(existing.address_proof_document || existing.aadhaar_front));
          setAddressProofBackUrl(resolveMediaUrl(existing.aadhaar_back));
          setNotes(existing.additional_notes || '');
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            getFriendlyErrorMessage(err, 'Unable to load your verification details right now.')
          );
        }
      }
    };
    loadVerification();
    return () => {
      cancelled = true;
    };
  }, [authReady, mentorId]);

  const validateBeforeSubmit = () => {
    const errors = [];
    if (!idProofType) errors.push('Please select an ID Proof type.');
    if (!addressProofType) errors.push('Please select an Address Proof type.');
    if (addressProofType === 'pan_card') errors.push('PAN Card is not allowed for Address Proof.');
    if (proofTypeConflict) errors.push('ID Proof and Address Proof must be different document types.');
    if (!idProofNumber) errors.push('ID Proof document number is required.');
    else {
      const issue = validateProofNumber(idProofType, idProofNumber);
      if (issue) errors.push(issue);
    }
    if (!addressProofNumber) errors.push('Address Proof document number is required.');
    else {
      const issue = validateProofNumber(addressProofType, addressProofNumber);
      if (issue) errors.push(issue);
    }
    if (!idProofFrontUploaded) errors.push('Please upload ID Proof Front image.');
    if (!idProofBackUploaded) errors.push('Please upload ID Proof Back image.');
    if (!addressProofFrontUploaded) errors.push('Please upload Address Proof Front image.');
    if (!addressProofBackUploaded) errors.push('Please upload Address Proof Back image.');
    return errors;
  };

  const handleSubmit = async () => {
    setHasTriedSubmit(true);
    setTouched({
      idProofType: true,
      idProofNumber: true,
      idProofFrontFile: true,
      idProofBackFile: true,
      addressProofType: true,
      addressProofNumber: true,
      addressProofFrontFile: true,
      addressProofBackFile: true,
    });
    setErrorMessage('');
    setInfoMessage('');
    if (!mentorId) {
      setErrorMessage('Mentor registration not found. Please register again.');
      return;
    }
    if (!authReady) {
      setErrorMessage('Please login to continue verification.');
      return;
    }
    const validationErrors = validateBeforeSubmit();
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors[0]);
      return;
    }
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('mentor', String(mentorId));
      payload.append('id_proof_type', idProofType);
      payload.append('id_proof_number', idProofNumber);
      payload.append('address_proof_type', addressProofType);
      payload.append('address_proof_number', addressProofNumber);
      if (idProofFrontFile) payload.append('id_proof_document', idProofFrontFile);
      if (idProofBackFile) payload.append('passport_or_license', idProofBackFile);
      if (addressProofFrontFile) {
        payload.append('address_proof_document', addressProofFrontFile);
        payload.append('aadhaar_front', addressProofFrontFile);
      }
      if (addressProofBackFile) payload.append('aadhaar_back', addressProofBackFile);
      if (notes) payload.append('additional_notes', notes);
      if (verificationId) await mentorApi.updateIdentityVerification(verificationId, payload);
      else await mentorApi.createIdentityVerification(payload);
      setInfoMessage('Identity verification submitted successfully.');
      navigate('/mentor-onboarding-status');
    } catch (err) {
      setErrorMessage(
        getFriendlyErrorMessage(err, 'Unable to submit verification right now. Please check details and try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2f7] text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="flex w-full justify-center px-4 py-4 sm:px-6 sm:py-8 lg:py-10">
          <div className="w-full max-w-[1580px] overflow-hidden rounded-xl border border-[#e6e2f1] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.7fr)]">
              <div className="relative hidden h-full grid-rows-2 bg-transparent xl:grid">
                <img
                  src={imageContainer}
                  alt=""
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[300px] h-[300px] md:w-[380px] md:h-[380px] lg:w-[500px] lg:h-[500px]"
                />
                <div className="grid grid-cols-[1.05fr_1fr]">
                  <div>
                    <img
                      src={mentorLeft}
                      alt="Mentor guidance"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="relative bg-[#5b2c91] p-6 text-white flex flex-col justify-between">
                    <div>
                      <h3 className="font-sans font-bold text-[37px] leading-[36.5px]">
                        Join a
                        <br />
                        community
                        <br />
                        built on trust
                        <br />
                        and care.
                      </h3>
                      <p className="mt-3 font-sans text-[16px] leading-[22.5px] font-normal text-white/90">
                        Your guidance can help a student feel seen -- beyond marks, ranks, and expectations.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[1.05fr_1fr]">
                  <div className="bg-[#f2c94c] p-6 text-[#1f2937] flex items-center justify-center">
                    <ul className="list-disc pl-4 space-y-3 text-sm">
                      <li>Bond Room exists to restore human connection in an exam-driven system.</li>
                      <li>You are not expected to teach.</li>
                      <li>Your presence and perspective are enough.</li>
                    </ul>
                  </div>
                  <div className="bg-black">
                    <img
                      src={mentorBottom}
                      alt="Students"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#f7f5fa] p-4 text-[#1f2937] sm:p-6 lg:p-10">
                <div className="max-w-2xl mx-auto md:max-w-none md:mx-0">
                  <div className="inline-flex items-center rounded-full bg-[#e9ddff] text-xs text-[#5b2c91] px-3 py-1 font-medium">
                    Step 3 of 3
                  </div>
                  <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-[#1f2937]">
                    Verify your Identity
                  </h2>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Upload one ID Proof and one Address Proof. For each proof, upload both Front and Back images.
                  </p>

                  <form className="mt-6 space-y-5">
                    <div className="grid gap-5 2xl:grid-cols-2">
                      <div className="rounded-xl border border-[#e5def2] bg-white p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-[#1f2937]">ID Proof</h3>
                        <div>
                          <label htmlFor="idProofType" className="text-xs text-[#6b7280]">Document Type</label>
                          <select
                            id="idProofType"
                            className={`mt-2 w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent ${
                              showIdProofTypeError
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-[#d7d0e2] focus:ring-[#5b2c91]'
                            }`}
                            value={idProofType}
                            onChange={(event) => {
                              const nextType = event.target.value;
                              setIdProofType(nextType);
                              setIdProofNumber((prev) => sanitizeProofNumber(nextType, prev));
                              setTouched((prev) => ({ ...prev, idProofType: true }));
                            }}
                            onBlur={() => setTouched((prev) => ({ ...prev, idProofType: true }))}
                          >
                            <option value="">Select document</option>
                            {PROOF_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          {showIdProofTypeError && <p className="mt-1 text-xs text-red-600">ID Proof type is required.</p>}
                        </div>

                        <div>
                          <label htmlFor="idProofNumber" className="text-xs text-[#6b7280]">Document Number</label>
                          <input
                            id="idProofNumber"
                            type="text"
                            className={`mt-2 w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent ${
                              showIdProofNumberError
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-[#d7d0e2] focus:ring-[#5b2c91]'
                            }`}
                            placeholder="Enter document number"
                            value={idProofNumber}
                            onChange={(event) => {
                              setIdProofNumber(sanitizeProofNumber(idProofType, event.target.value));
                              setTouched((prev) => ({ ...prev, idProofNumber: true }));
                            }}
                            onBlur={() => setTouched((prev) => ({ ...prev, idProofNumber: true }))}
                          />
                          <p className="mt-1 text-[11px] text-[#6b7280]">
                            {idProofType ? PROOF_NUMBER_HINTS[idProofType] : 'Choose a document type to see format.'}
                          </p>
                          {showIdProofNumberError && (
                            <p className="mt-1 text-xs text-red-600">{idProofNumberError || 'Document number is required.'}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <UploadCard
                            title="ID Proof Front"
                            file={idProofFrontFile}
                            uploaded={idProofFrontUploaded}
                            viewUrl={idProofFrontViewUrl}
                            kind={idProofFrontKind}
                            onFileChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              setIdProofFrontFile(file);
                              setTouched((prev) => ({ ...prev, idProofFrontFile: true }));
                            }}
                            error={showIdProofFrontError ? 'ID Proof Front is required.' : ''}
                          />
                          <UploadCard
                            title="ID Proof Back"
                            file={idProofBackFile}
                            uploaded={idProofBackUploaded}
                            viewUrl={idProofBackViewUrl}
                            kind={idProofBackKind}
                            onFileChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              setIdProofBackFile(file);
                              setTouched((prev) => ({ ...prev, idProofBackFile: true }));
                            }}
                            error={showIdProofBackError ? 'ID Proof Back is required.' : ''}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-[#e5def2] bg-white p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-[#1f2937]">Address Proof</h3>
                        <div>
                          <label htmlFor="addressProofType" className="text-xs text-[#6b7280]">Document Type</label>
                          <select
                            id="addressProofType"
                            className={`mt-2 w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent ${
                              showAddressProofTypeError
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-[#d7d0e2] focus:ring-[#5b2c91]'
                            }`}
                            value={addressProofType}
                            onChange={(event) => {
                              const nextType = event.target.value;
                              setAddressProofType(nextType);
                              setAddressProofNumber((prev) => sanitizeProofNumber(nextType, prev));
                              setTouched((prev) => ({ ...prev, addressProofType: true }));
                            }}
                            onBlur={() => setTouched((prev) => ({ ...prev, addressProofType: true }))}
                          >
                            <option value="">Select document</option>
                            {addressProofTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          <p className="mt-1 text-[11px] text-[#6b7280]">PAN Card is not available for Address Proof.</p>
                          {showAddressProofTypeError && <p className="mt-1 text-xs text-red-600">Address Proof type is required.</p>}
                        </div>

                        <div>
                          <label htmlFor="addressProofNumber" className="text-xs text-[#6b7280]">Document Number</label>
                          <input
                            id="addressProofNumber"
                            type="text"
                            className={`mt-2 w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent ${
                              showAddressProofNumberError
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-[#d7d0e2] focus:ring-[#5b2c91]'
                            }`}
                            placeholder="Enter document number"
                            value={addressProofNumber}
                            onChange={(event) => {
                              setAddressProofNumber(sanitizeProofNumber(addressProofType, event.target.value));
                              setTouched((prev) => ({ ...prev, addressProofNumber: true }));
                            }}
                            onBlur={() => setTouched((prev) => ({ ...prev, addressProofNumber: true }))}
                          />
                          <p className="mt-1 text-[11px] text-[#6b7280]">
                            {addressProofType ? PROOF_NUMBER_HINTS[addressProofType] : 'Choose a document type to see format.'}
                          </p>
                          {showAddressProofNumberError && (
                            <p className="mt-1 text-xs text-red-600">{addressProofNumberError || 'Document number is required.'}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <UploadCard
                            title="Address Proof Front"
                            file={addressProofFrontFile}
                            uploaded={addressProofFrontUploaded}
                            viewUrl={addressProofFrontViewUrl}
                            kind={addressProofFrontKind}
                            onFileChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              setAddressProofFrontFile(file);
                              setTouched((prev) => ({ ...prev, addressProofFrontFile: true }));
                            }}
                            error={showAddressProofFrontError ? 'Address Proof Front is required.' : ''}
                          />
                          <UploadCard
                            title="Address Proof Back"
                            file={addressProofBackFile}
                            uploaded={addressProofBackUploaded}
                            viewUrl={addressProofBackViewUrl}
                            kind={addressProofBackKind}
                            onFileChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              setAddressProofBackFile(file);
                              setTouched((prev) => ({ ...prev, addressProofBackFile: true }));
                            }}
                            error={showAddressProofBackError ? 'Address Proof Back is required.' : ''}
                          />
                        </div>
                      </div>
                    </div>

                    {hasTriedSubmit && proofTypeConflict && (
                      <p className="text-xs text-red-600">ID Proof and Address Proof must use different document types.</p>
                    )}

                    <div>
                      <label htmlFor="mentorAdditionalNotes" className="text-xs text-[#6b7280]">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        id="mentorAdditionalNotes"
                        rows={4}
                        className="mt-2 w-full rounded-md border border-[#d7d0e2] px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent"
                        placeholder="Add any context for verification..."
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                      />
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      {verificationStatus && (
                        <p className="text-xs text-[#6b7280]">
                          Current status: <span className="font-semibold">{verificationStatus}</span>
                        </p>
                      )}
                      {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
                      {!errorMessage && infoMessage && <p className="text-xs text-green-700">{infoMessage}</p>}
                      <button
                        type="button"
                        className="w-full rounded-md bg-[#5b2c91] text-white py-2.5 text-sm font-semibold hover:bg-[#4a2374] transition-all"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? 'Submitting...' : 'Submit for Verification'}
                      </button>
                      <p className="text-xs text-[#6b7280]">Verification usually takes 24-48 hours</p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default VerifyIdentity;
