import React, { useState } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { useNavigate } from 'react-router-dom';
import mentorLeft from '../assets/teach1.png';
import mentorBottom from '../assets/teach2.png';
import imageContainer from '../assets/Image Container.png';
import megaphone from '../assets/Vector.png';
import { Info } from 'lucide-react';

const MentorRegister = () => {
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedCareAreas, setSelectedCareAreas] = useState([]);
  const languagesOptions = ['Tamil', 'English', 'Telugu', 'Kannada'];
  const careAreaOptions = ['Anxiety', 'Relationships', 'Academic Stress'];
  const navigate = useNavigate();

  const handleMultiSelect = (event, setter) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    setter(values);
  };

  return (
    <div className="min-h-screen text-[#1f2937] flex flex-col">
      <TopAuth />

      <main className="flex-1 bg-transparent">
        <div className="w-full flex justify-center px-4 sm:px-6 lg:px-4 py-4 sm:py-6 lg:py-10 bg-transparent">
          <div className="rounded-[12px] overflow-hidden w-full max-w-[1266px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] xl:min-h-[820px]">
            <div className="grid grid-cols-1 xl:grid-cols-[591px_675px] h-full">
              
              {/* Left Side - Desktop Only */}
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

             
              {/* Right Side - Form Section */}
              <div className="p-4 sm:p-6 lg:p-10 bg-white text-[#1f2937] h-full overflow-y-auto">
                <div className="max-w-2xl mx-auto md:max-w-none md:mx-0">
                  <div className="inline-flex items-center rounded-full bg-[#e9ddff] text-xs text-[#5b2c91] px-3 py-1 font-medium">
                    Step 1 of 3
                  </div>
                  <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-[#1f2937]">
                    Apply as a Mentor
                  </h2>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Share your experience and guide students with care.
                  </p>
                  <p className="mt-4 text-xs sm:text-sm text-[#6b7280]">
                    Bond Room connects students with trusted mentors who listen without judgment.
                    Tell us about yourself so we can match you thoughtfully.
                  </p>

                  <form className="mt-6 space-y-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-xs font-medium text-[#6b7280] mb-1">
                          First name
                        </label>
                        <input 
                          id="firstName" 
                          className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all" 
                          placeholder="e.g. Priya" 
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-xs font-medium text-[#6b7280] mb-1">
                          Last name
                        </label>
                        <input 
                          id="lastName" 
                          className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all" 
                          placeholder="e.g. Sharma" 
                        />
                      </div>
                    </div>

                    {/* Email & Mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label htmlFor="email" className="block text-xs font-medium text-[#6b7280] mb-1">
                          Email
                        </label>
                        <input 
                          id="email" 
                          type="email" 
                          className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all" 
                          placeholder="name@example.com" 
                        />
                      </div>
                      <div>
                        <label htmlFor="mobile" className="block text-xs font-medium text-[#6b7280] mb-1">
                          Mobile Number
                        </label>
                        <input 
                          id="mobile" 
                          type="tel"
                          className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all" 
                          placeholder="+91 98765 43210" 
                        />
                      </div>
                    </div>

                    {/* DOB & Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label htmlFor="dob" className="block text-xs font-medium text-[#6b7280] mb-1">
                          Date of Birth
                        </label>
                        <input 
                          id="dob" 
                          type="date"
                          className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all" 
                          placeholder="dd/mm/yyyy" 
                        />
                      </div>
                      <div>
                        <label htmlFor="gender" className="block text-xs font-medium text-[#6b7280] mb-1">
                          Gender
                        </label>
                        <select 
                          id="gender" 
                          className="w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all"
                        >
                          <option value="">Select Gender</option>
                          <option>Female</option>
                          <option>Male</option>
                          <option>Non-binary</option>
                          <option>Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    {/* City/State */}
                    <div>
                      <label htmlFor="cityState" className="block text-xs font-medium text-[#6b7280] mb-1">
                        City / State
                      </label>
                      <input 
                        id="cityState" 
                        className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all" 
                        placeholder="e.g. Tiruchirappalli, Tamil Nadu" 
                      />
                    </div>

                    {/* Languages */}
                    <div>
                      <label htmlFor="languages" className="block text-xs font-medium text-[#6b7280] mb-1">
                        Languages Spoken
                      </label>
                      <select
                        id="languages"
                        multiple
                        size={3}
                        className="w-full rounded-md border bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all"
                        value={selectedLanguages}
                        onChange={(e) => handleMultiSelect(e, setSelectedLanguages)}
                      >
                        {languagesOptions.map((lang) => (
                          <option key={lang} value={lang} className="py-1 px-2 hover:bg-purple-50">
                            {lang}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[#6b7280] mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        <span className="hidden sm:inline">Hold Ctrl/Cmd to select multiple</span>
                        <span className="sm:hidden">Tap to select multiple</span>
                      </p>
                    </div>

                    {/* Care Areas */}
                    <div>
                      <label htmlFor="careAreas" className="block text-xs font-medium text-[#6b7280] mb-1">
                        Mentor Care Areas
                      </label>
                      <select
                        id="careAreas"
                        multiple
                        size={3}
                        className="w-full rounded-md border bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all"
                        value={selectedCareAreas}
                        onChange={(e) => handleMultiSelect(e, setSelectedCareAreas)}
                      >
                        {careAreaOptions.map((area) => (
                          <option key={area} value={area} className="py-1 px-2 hover:bg-purple-50">
                            {area}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[#6b7280] mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        <span className="hidden sm:inline">Hold Ctrl/Cmd to select multiple</span>
                        <span className="sm:hidden">Tap to select multiple</span>
                      </p>
                    </div>

                    {/* Qualification */}
                    <div>
                      <label htmlFor="qualification" className="block text-xs font-medium text-[#6b7280] mb-1">
                        Educational Qualification
                      </label>
                      <input 
                        id="qualification" 
                        className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all" 
                        placeholder="e.g. PhD in Psychology" 
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label htmlFor="bio" className="block text-xs font-medium text-[#6b7280] mb-1">
                        Brief Bio
                      </label>
                      <textarea
                        id="bio"
                        rows={3}
                        className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all resize-none"
                        placeholder="Tell us a bit about your professional background..."
                      />
                    </div>

                    {/* Consent */}
                    <label className="flex items-start gap-2 text-xs sm:text-sm text-[#6b7280] cursor-pointer">
                      <input 
                        id="consent" 
                        type="checkbox" 
                        className="mt-0.5 sm:mt-1 accent-[#5b2c91] w-4 h-4 cursor-pointer" 
                      />
                      <span>I agree to share my information for background verification purposes.</span>
                    </label>

                    {/* Submit Button */}
                    <button
                      type="button"
                      className="w-full rounded-md bg-[#5b2c91] hover:bg-[#4a2374] text-white py-3 text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98]"
                      onClick={() => navigate('/mentor-verify-identity')}
                    >
                      Submit Application
                    </button>
                    
                    {/* Terms */}
                    <p className="text-center text-xs text-[#6b7280] leading-relaxed">
                      By continuing, you agree to our{' '}
                      <a href="/terms" className="underline hover:text-[#5b2c91]">Terms &amp; Conditions</a>
                      {' '}and{' '}
                      <a href="/privacy" className="underline hover:text-[#5b2c91]">Privacy Policy</a>
                    </p>
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

export default MentorRegister;
