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

const getUploadStatus = (file, uploaded) => {
  if (file?.name) return file.name;
  if (uploaded) return 'Uploaded';
  return 'Not uploaded';
};

const VerifyIdentity = () => {
  const navigate = useNavigate();
  const pendingMentor = useMemo(() => getPendingMentorRegistration(), []);
  const { mentor } = useMentorData();
  const { login } = useMentorAuth();
  const [aadhaarFront, setAadhaarFront] = useState(false);
  const [aadhaarBack, setAadhaarBack] = useState(false);
  const [passport, setPassport] = useState(false);
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null);
  const [passportFile, setPassportFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [authReady, setAuthReady] = useState(Boolean(getAuthSession()?.accessToken));
  const mentorId = pendingMentor?.mentorId || mentor?.id;

  useEffect(() => {
    let cancelled = false;
    if (authReady) return undefined;
    if (!pendingMentor?.email || !pendingMentor?.password) return undefined;

    const ensureLogin = async () => {
      try {
        await login(pendingMentor.email, pendingMentor.password, 'mentors');
        if (!cancelled) setAuthReady(true);
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err?.message || 'Unable to authenticate mentor session.');
        }
      }
    };

    ensureLogin();
    return () => {
      cancelled = true;
    };
  }, [authReady, login, pendingMentor?.email, pendingMentor?.password]);

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
          setAadhaarFront(Boolean(existing.aadhaar_front));
          setAadhaarBack(Boolean(existing.aadhaar_back));
          setPassport(Boolean(existing.passport_or_license));
          setNotes(existing.additional_notes || '');
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err?.message || 'Unable to load verification status.');
        }
      }
    };

    loadVerification();
    return () => {
      cancelled = true;
    };
  }, [authReady, mentorId]);

  const handleSubmit = async () => {
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

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('mentor', String(mentorId));
      if (aadhaarFrontFile) payload.append('aadhaar_front', aadhaarFrontFile);
      if (aadhaarBackFile) payload.append('aadhaar_back', aadhaarBackFile);
      if (passportFile) payload.append('passport_or_license', passportFile);
      if (notes) payload.append('additional_notes', notes);

      if (verificationId) {
        await mentorApi.updateIdentityVerification(verificationId, payload);
      } else {
        await mentorApi.createIdentityVerification(payload);
      }
      setInfoMessage('Identity verification submitted successfully.');
      navigate('/mentor-verify-contact');
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to submit verification right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2f7] text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="w-full flex justify-center px-4 sm:px-6 lg:px-4 py-4 sm:py-6 lg:py-10 bg-transparent">
          <div className="rounded-[12px] overflow-hidden w-full max-w-[1266px] border border-[#e6e2f1] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] xl:min-h-[820px]">
            <div className="grid grid-cols-1 xl:grid-cols-[591px_675px] h-full">
              <div className="hidden xl:grid grid-rows-2 h-full bg-transparent relative">
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
                      <h3 className="font-['Manrope'] font-bold text-[37px] leading-[36.5px]">
                        Join a
                        <br />
                        community
                        <br />
                        built on trust
                        <br />
                        and care.
                      </h3>
                      <p className="mt-3 font-['Manrope'] text-[16px] leading-[22.5px] font-normal text-white/90">
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

              <div className="p-4 sm:p-6 lg:p-10 bg-[#f7f5fa] text-[#1f2937] h-full">
                <div className="max-w-2xl mx-auto md:max-w-none md:mx-0">
                  <div className="inline-flex items-center rounded-full bg-[#e9ddff] text-xs text-[#5b2c91] px-3 py-1 font-medium">
                    Step 2 of 3
                  </div>
                  <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-[#1f2937]">
                    Verify your Identity
                  </h2>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Please upload the required documents to proceed with your application. This ensures the safety
                    of our community.
                  </p>

                  <form className="mt-6 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label
                        className={`group border border-dashed rounded-xl p-4 flex flex-col items-center text-center gap-2 cursor-pointer hover:border-[#5b2c91] focus-within:border-[#5b2c91] focus-within:ring-2 focus-within:ring-[#5b2c91] ${
                          aadhaarFront ? 'border-[#22c55e] bg-[#f0fdf4]' : 'border-[#d7d0e2] bg-white'
                        }`}
                      >
                        <input
                          type="file"
                          className="sr-only"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setAadhaarFrontFile(file);
                            setAadhaarFront(Boolean(file));
                          }}
                        />
                        <div className="h-10 w-10 rounded-full bg-[#5b2c91] flex items-center justify-center">
                          <Upload
                            className={`h-5 w-5 ${aadhaarFront ? 'text-[#FDD253]' : 'text-white'} group-focus-within:text-[#FDD253]`}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="text-sm text-[#1f2937]">Aadhaar Front</span>
                        <span className="text-xs text-[#6b7280]">JPG, PNG or PDF</span>
                        <span className={`text-xs max-w-full truncate ${aadhaarFront ? 'text-[#166534] font-medium' : 'text-[#6b7280]'}`}>
                          {getUploadStatus(aadhaarFrontFile, aadhaarFront)}
                        </span>
                      </label>

                      <label
                        className={`group border border-dashed rounded-xl p-4 flex flex-col items-center text-center gap-2 cursor-pointer hover:border-[#5b2c91] focus-within:border-[#5b2c91] focus-within:ring-2 focus-within:ring-[#5b2c91] ${
                          aadhaarBack ? 'border-[#22c55e] bg-[#f0fdf4]' : 'border-[#d7d0e2] bg-white'
                        }`}
                      >
                        <input
                          type="file"
                          className="sr-only"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setAadhaarBackFile(file);
                            setAadhaarBack(Boolean(file));
                          }}
                        />
                        <div className="h-10 w-10 rounded-full bg-[#5b2c91] flex items-center justify-center">
                          <Upload
                            className={`h-5 w-5 ${aadhaarBack ? 'text-[#FDD253]' : 'text-white'} group-focus-within:text-[#FDD253]`}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="text-sm text-[#1f2937]">Aadhaar Back</span>
                        <span className="text-xs text-[#6b7280]">JPG, PNG or PDF</span>
                        <span className={`text-xs max-w-full truncate ${aadhaarBack ? 'text-[#166534] font-medium' : 'text-[#6b7280]'}`}>
                          {getUploadStatus(aadhaarBackFile, aadhaarBack)}
                        </span>
                      </label>

                      <label
                        className={`group border border-dashed rounded-xl p-4 flex flex-col items-center text-center gap-2 cursor-pointer hover:border-[#5b2c91] focus-within:border-[#5b2c91] focus-within:ring-2 focus-within:ring-[#5b2c91] ${
                          passport ? 'border-[#22c55e] bg-[#f0fdf4]' : 'border-[#d7d0e2] bg-white'
                        }`}
                      >
                        <input
                          type="file"
                          className="sr-only"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setPassportFile(file);
                            setPassport(Boolean(file));
                          }}
                        />
                        <div className="h-10 w-10 rounded-full bg-[#5b2c91] flex items-center justify-center">
                          <Upload
                            className={`h-5 w-5 ${passport ? 'text-[#FDD253]' : 'text-white'} group-focus-within:text-[#FDD253]`}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="text-sm text-[#1f2937]">Passport/Driving License</span>
                        <span className="text-xs text-[#6b7280]">JPG, PNG or PDF</span>
                        <span className={`text-xs max-w-full truncate ${passport ? 'text-[#166534] font-medium' : 'text-[#6b7280]'}`}>
                          {getUploadStatus(passportFile, passport)}
                        </span>
                      </label>
                    </div>

                    <div>
                      <label htmlFor="mentorAdditionalNotes" className="text-xs text-[#6b7280]">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        id="mentorAdditionalNotes"
                        rows={4}
                        className="mt-2 w-full rounded-md border border-[#d7d0e2] px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent"
                        placeholder="Add a brief explanation if any detail differs from your application..."
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
