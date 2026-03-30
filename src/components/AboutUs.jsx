import React from 'react';
import { ArrowLeft, HeartHandshake, ShieldCheck, Users, Brain, Sparkles, CheckCircle2 } from 'lucide-react';
import studentsImage from './assets/teach2.png';
import mentorImage from './assets/mentor2.png';
import supportImage from './assets/student2.png';
import communityImage from './assets/teach1.png';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f3ff_0%,#ffffff_55%,#f6f0ff_100%)] p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-[#e7d8ff] bg-white px-4 py-2 text-xs font-semibold text-[#5D3699] hover:bg-[#f8f4ff]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </a>

        <section className="relative mt-5 overflow-hidden rounded-[28px] border border-[#e8dcff] bg-white p-6 shadow-[0_28px_60px_-46px_rgba(93,54,153,0.65)] sm:p-10">
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#efe6ff] blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-[#f4edff] blur-2xl" />

          <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">About Bond Room</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#111827] sm:text-5xl">
                Bridging Generations
                <br />
                <span className="bg-gradient-to-r from-[#5D3699] to-[#8c63cc] bg-clip-text text-transparent">
                  Through Mentorship
                </span>
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-[#5f6472] sm:text-base">
                Bond Room connects students with trusted mentors for meaningful one-on-one guidance.
                We focus on emotional safety, career clarity, and confidence building through real conversations.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="overflow-hidden rounded-2xl border border-[#eadfff] bg-[#f8f3ff] p-1">
                <img src={studentsImage} alt="Students receiving guidance" className="h-36 w-full object-contain sm:h-44" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#eadfff] bg-[#f8f3ff] p-1">
                <img src={mentorImage} alt="Mentor support" className="h-36 w-full object-contain sm:h-44" />
              </div>
              <div className="col-span-2 overflow-hidden rounded-2xl border border-[#eadfff] bg-[#f8f3ff] p-1">
                <img src={supportImage} alt="Student wellbeing and support" className="h-40 w-full object-contain sm:h-48" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: HeartHandshake,
              title: 'Human-First Guidance',
              body: 'Mentorship that listens first and supports students with empathy and respect.',
            },
            {
              icon: ShieldCheck,
              title: 'Safety by Design',
              body: 'Session monitoring and safety workflows help protect every student interaction.',
            },
            {
              icon: Users,
              title: 'Trusted Mentors',
              body: 'Experienced mentors across domains who understand student pressure and growth.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-2xl border border-[#e9ddff] bg-white p-5 shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)]"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
                  <Icon className="h-5 w-5 text-[#5D3699]" />
                </div>
                <h2 className="mt-3 text-base font-semibold text-[#111827]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5f6472]">{item.body}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <article className="rounded-2xl border border-[#e9ddff] bg-white p-6 shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Why Bond Room Exists</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#111827]">Students Need More Than Academic Advice</h2>
            <p className="mt-3 text-sm leading-7 text-[#5f6472]">
              Many students carry academic pressure, emotional stress, and uncertainty about future decisions.
              Bond Room was built to create a structured and safe support layer where students can talk openly,
              be heard without judgment, and receive practical guidance from mentors who understand these challenges.
            </p>
            <p className="mt-3 text-sm leading-7 text-[#5f6472]">
              We combine human mentorship with platform intelligence so the right student gets connected to the right mentor
              at the right time.
            </p>
          </article>

          <article className="overflow-hidden rounded-2xl border border-[#e9ddff] bg-white shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)]">
            <div className="bg-[#f8f3ff] p-1">
              <img src={communityImage} alt="Community mentorship activity" className="h-44 w-full object-contain" />
            </div>
            <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">How It Works</p>
            <ul className="mt-3 space-y-3 text-sm text-[#5f6472]">
              {[
                'Student completes onboarding and needs assessment.',
                'AI-assisted matching recommends suitable mentors.',
                'Student books sessions and gets guided support.',
                'Platform tracks safety and feedback for quality.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5D3699]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[#e9ddff] bg-white p-6 shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)]">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
              <Brain className="h-5 w-5 text-[#5D3699]" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-[#111827]">Mentor Quality & Relevance</h3>
            <p className="mt-2 text-sm leading-7 text-[#5f6472]">
              Mentor matching considers language comfort, care areas, student preferences, and availability overlap.
              This improves session relevance and helps students build trust faster.
            </p>
          </article>

          <article className="rounded-2xl border border-[#e9ddff] bg-white p-6 shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)]">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
              <Sparkles className="h-5 w-5 text-[#5D3699]" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-[#111827]">Safety & Responsible Monitoring</h3>
            <p className="mt-2 text-sm leading-7 text-[#5f6472]">
              Session-level monitoring signals, transcript analysis, and reporting workflows help flag risky behavior early.
              This ensures a safer and more reliable experience for students, mentors, and families.
            </p>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-[#e8dcff] bg-[linear-gradient(135deg,#ffffff_0%,#fcfaff_45%,#f8f3ff_100%)] p-6 shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)] sm:p-8">
          <h2 className="text-2xl font-semibold text-[#111827]">Our Commitment</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-[#5f6472]">
            Bond Room is committed to building a mentoring platform that is accessible, trustworthy, and student-centered.
            We continuously improve matching quality, mentor standards, and safety controls so students receive meaningful
            guidance that supports both wellbeing and long-term growth.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/register"
              className="rounded-xl bg-[#5D3699] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4a2b7a]"
            >
              Student Sign Up
            </a>
            <a
              href="/mentor-register"
              className="rounded-xl border border-[#d8c7fb] bg-white px-5 py-2.5 text-sm font-semibold text-[#5D3699] hover:bg-[#f8f4ff]"
            >
              Become a Mentor
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
