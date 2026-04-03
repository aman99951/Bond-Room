import React, { useMemo, useState } from 'react';
import { ArrowLeft, Heart, ShieldCheck } from 'lucide-react';
import { donationApi } from '../apis/api/donationApi';

const quickAmounts = [250, 500, 1000, 2500];

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[data-razorpay-sdk="1"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpaySdk = '1';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const DonationPage = () => {
  const [selectedAmount, setSelectedAmount] = useState(quickAmounts[1]);
  const [customAmount, setCustomAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const amountLabel = useMemo(
    () => `Rs ${Number(selectedAmount || 0).toLocaleString('en-IN')}`,
    [selectedAmount],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedAmount || Number(selectedAmount) <= 0 || !name.trim() || !email.trim()) return;

    setProcessing(true);
    setError('');

    try {
      const orderPayload = await donationApi.createRazorpayOrder({
        amount: Number(selectedAmount),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      if (orderPayload?.is_mock) {
        setError('Razorpay mock mode is enabled on backend. Disable mock mode and set real keys to continue payment.');
        setProcessing(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Unable to load Razorpay checkout script.');
      }

      const razorpay = new window.Razorpay({
        key: orderPayload.key_id,
        amount: orderPayload.amount,
        currency: orderPayload.currency || 'INR',
        name: 'Bond Room',
        description: 'Donation',
        order_id: orderPayload.order_id,
        prefill: {
          name: name.trim(),
          email: email.trim(),
          contact: phone.trim(),
        },
        theme: {
          color: '#5D3699',
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
        handler: async (response) => {
          try {
            const verifyPayload = await donationApi.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(selectedAmount),
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
            });

            if (!verifyPayload?.verified) {
              throw new Error('Payment verification failed.');
            }

            setSubmitted(true);
          } catch (verifyError) {
            setError(verifyError?.message || 'Payment verification failed.');
          } finally {
            setProcessing(false);
          }
        },
      });

      razorpay.on('payment.failed', (paymentEvent) => {
        const message =
          paymentEvent?.error?.description ||
          paymentEvent?.error?.reason ||
          'Payment failed. Please try again.';
        setError(message);
        setProcessing(false);
      });

      razorpay.open();
    } catch (submitError) {
      setError(submitError?.message || 'Unable to start payment.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f3ff_0%,#ffffff_55%,#f6f0ff_100%)] p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-[#e7d8ff] bg-white px-4 py-2 text-xs font-semibold text-[#5D3699] hover:bg-[#f8f4ff]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </a>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-[#e8dcff] bg-white p-6 shadow-[0_28px_60px_-46px_rgba(93,54,153,0.65)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Support Students</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#111827] sm:text-4xl">
              Help Us Expand
              <br />
              <span className="bg-gradient-to-r from-[#5D3699] to-[#8c63cc] bg-clip-text text-transparent">
                Safe Mentorship Access
              </span>
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#5f6472]">
              Your donation helps us improve mentorship quality, student support operations, and safety systems
              for underserved learners.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                'Student onboarding and support operations',
                'Mentor quality review and platform safety',
                'Learning resources for student wellbeing',
                'Scalable community outreach initiatives',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-[#ece3ff] bg-[#faf7ff] px-4 py-3 text-sm text-[#5f6472]"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#e8dcff] bg-white p-6 shadow-[0_28px_60px_-46px_rgba(93,54,153,0.65)] sm:p-8">
            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-semibold text-[#111827]">Donate Now</h2>
                <p className="mt-1 text-xs text-[#6b7280]">Choose an amount and pay securely with Razorpay.</p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount(String(amount));
                      }}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                        selectedAmount === amount
                          ? 'border-[#5D3699] bg-[#5D3699] text-white'
                          : 'border-[#e7e2f6] bg-white text-[#5D3699] hover:bg-[#f8f4ff]'
                      }`}
                    >
                      Rs {amount}
                    </button>
                  ))}
                </div>

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[#7b699d]">
                  Custom Amount (INR)
                </label>
                <div className="mt-1 flex items-center rounded-xl border border-[#e7e2f6] bg-white px-3 focus-within:border-[#c4b5fd]">
                  <span className="text-sm font-semibold text-[#5D3699]">Rs</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(event) => {
                      const digitsOnly = event.target.value.replace(/[^\d]/g, '');
                      setCustomAmount(digitsOnly);
                      setSelectedAmount(digitsOnly ? Number(digitsOnly) : 0);
                    }}
                    className="w-full border-0 bg-transparent px-2 py-2.5 text-sm text-[#111827] outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#6b7280]">You can enter any amount above Rs 1.</p>

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Name</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]"
                />

                <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]"
                />

                <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Phone (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]"
                />

                {error ? (
                  <p className="mt-3 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-xs font-semibold text-[#b91c1c]">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={processing || !selectedAmount || Number(selectedAmount) <= 0}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5D3699] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4a2b7a] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Heart className="h-4 w-4" />
                  {processing ? 'Processing...' : `Proceed with ${amountLabel}`}
                </button>
              </form>
            ) : (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f3ff]">
                  <ShieldCheck className="h-7 w-7 text-[#5D3699]" />
                </div>
                <h3 className="mt-3 text-xl font-semibold text-[#111827]">Thank You for Your Support</h3>
                <p className="mt-2 text-sm text-[#6b7280]">
                  Your donation of {amountLabel} is confirmed. We appreciate your support.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default DonationPage;
