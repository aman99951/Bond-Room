import React from 'react';
import { Upload, IdCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';

const VerifyIdentity = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-20 py-8 sm:py-10">
          <div className="border border-default rounded-2xl overflow-hidden bg-surface shadow-sm">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex justify-end">
                <div className="inline-flex items-center rounded-full bg-muted text-xs text-muted px-3 py-1">
                  Step 2 of 5
                </div>
              </div>
              <div className="mt-2 flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <IdCard className="h-5 w-5 text-secondary" aria-hidden="true" />
                </div>
                <h2 className="mt-3 text-lg sm:text-xl font-semibold text-primary">Verify Your Identity</h2>
                <p className="mt-1 text-sm text-muted max-w-xl">
                  Please upload the required documents to proceed with your application. This ensures the
                  safety of our community.
                </p>
              </div>

              <form className="mt-6 sm:mt-8 space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="group border border-dashed border-default rounded-xl p-4 flex flex-col items-center text-center gap-2 cursor-pointer hover:border-black focus-within:border-black focus-within:ring-2 focus-within:ring-black">
                    <input type="file" className="sr-only" accept=".jpg,.jpeg,.png,.pdf" />
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-5 w-5 text-secondary" aria-hidden="true" />
                    </div>
                    <span className="text-sm text-primary">Aadhaar Front</span>
                    <span className="text-xs text-muted">JPG, PNG or PDF</span>
                  </label>

                  <label className="group border border-dashed border-default rounded-xl p-4 flex flex-col items-center text-center gap-2 cursor-pointer hover:border-black focus-within:border-black focus-within:ring-2 focus-within:ring-black">
                    <input type="file" className="sr-only" accept=".jpg,.jpeg,.png,.pdf" />
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-5 w-5 text-secondary" aria-hidden="true" />
                    </div>
                    <span className="text-sm text-primary">Aadhaar Back</span>
                    <span className="text-xs text-muted">JPG, PNG or PDF</span>
                  </label>

                  <label className="group border border-dashed border-default rounded-xl p-4 flex flex-col items-center text-center gap-2 cursor-pointer hover:border-black focus-within:border-black focus-within:ring-2 focus-within:ring-black">
                    <input type="file" className="sr-only" accept=".jpg,.jpeg,.png,.pdf" />
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-5 w-5 text-secondary" aria-hidden="true" />
                    </div>
                    <span className="text-sm text-primary">Passport/Driving License</span>
                    <span className="text-xs text-muted">JPG, PNG or PDF</span>
                  </label>
                </div>

                <div>
                  <label htmlFor="mentorAdditionalNotes" className="text-xs text-muted">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    id="mentorAdditionalNotes"
                    rows={4}
                    className="mt-2 w-full rounded-md border border-default px-3 py-2 text-sm"
                    placeholder="Add a brief explanation if any detail differs from your application..."
                  />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    className="px-8 rounded-md bg-[#5D3699] text-white py-2.5 text-sm"
                    onClick={() => navigate('/mentor-verify-contact')}
                  >
                    Submit for Verification
                  </button>
                  <p className="text-xs text-muted">Verification usually takes 24–48 hours</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default VerifyIdentity;
