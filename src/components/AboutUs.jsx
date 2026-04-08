import React from 'react';
import { ArrowLeft, HeartHandshake, ShieldCheck, Users, Brain, Sparkles, CheckCircle2 } from 'lucide-react';
import studentsImage from './assets/teach2.png';
import mentorImage from './assets/mentor2.png';
import supportImage from './assets/student2.png';
import communityImage from './assets/teach1.png';
import volunteerOneImage from './assets/student2.png';
import volunteerTwoImage from './assets/happystudent.png';
import volunteerThreeImage from './assets/download.png';
import smrithiFounderImage from './assets/smrithi(co-founder).png';
import nikhilFounderImage from './assets/Nikhil(co-founder).jpg';

const AboutUs = () => {
  const founders = [
    {
      name: 'Smrithi',
      role: 'Co-Founder',
      bio: 'Co-creates the vision and growth direction for Bond Room.',
      image: smrithiFounderImage,
      objectPosition: 'center 18%',
    },
    {
      name: 'Nikhil',
      role: 'Co-Founder',
      bio: 'Builds product and platform experiences focused on student impact.',
      image: nikhilFounderImage,
      objectPosition: 'center 12%',
    },
  ];

  const leadershipTeam = [
    {
      name: 'Dr KV Kishore Kumar',
      role: 'Executive Director',
      bio: 'Leads institutional strategy, governance, and execution across key initiatives.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Dr Archana Padmakar',
      role: 'Director - Programs',
      bio: 'Designs high-impact student support programs with measurable outcomes.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Dr Preetha Krishnadas',
      role: 'Director - Programs',
      bio: 'Oversees mentorship curriculum quality and learner experience consistency.',
      image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Ms Swapna Krishnakumar',
      role: 'Director - Operations',
      bio: 'Runs operations and delivery systems for reliable, safe, and scalable execution.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=900&q=80',
    },
  ];

  const volunteers = [
    {
      name: 'Volunteer Mentor Circle',
      role: 'Community Volunteers',
      bio: 'Volunteers who show up consistently to support students with patience and empathy.',
      image: volunteerOneImage,
    },
    {
      name: 'Student Support Volunteers',
      role: 'Youth Engagement',
      bio: 'Peers and community members helping students feel seen, heard, and guided.',
      image: volunteerTwoImage,
    },
    {
      name: 'Program Volunteers',
      role: 'Events and Outreach',
      bio: 'On-ground contributors enabling sessions, workshops, and local outreach activities.',
      image: volunteerThreeImage,
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f3ff_0%,#ffffff_55%,#f6f0ff_100%)] p-4 sm:p-8">
      <div className="mx-auto w-full max-w-[2440px]">
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

        <section className="mt-6 space-y-6">
          <article className="rounded-2xl border border-[#e8dcff] bg-[linear-gradient(135deg,#fcf8ff_0%,#ffffff_45%,#f7f1ff_100%)] p-6 shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Founders</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#111827] sm:text-3xl">People Behind Bond Room</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {founders.map((member) => (
                <article
                  key={member.name}
                  className="group overflow-hidden rounded-2xl border border-[#e5d8fb] bg-white shadow-[0_22px_40px_-30px_rgba(93,54,153,0.78)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_44px_-26px_rgba(93,54,153,0.85)]"
                >
                  <div className="relative h-56 overflow-hidden bg-[#f6f0ff] 2xl:h-[22rem] min-[2200px]:h-[26rem]">
                    <img
                      src={member.image}
                      alt={`${member.name} - ${member.role}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      style={{ objectPosition: member.objectPosition || 'center center' }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-[#111827]">{member.name}</h3>
                    <p className="mt-1 text-sm font-medium text-[#5D3699]">{member.role}</p>
                    <p className="mt-2 text-sm leading-6 text-[#5f6472]">{member.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[#e8dcff] bg-[linear-gradient(135deg,#fcf8ff_0%,#ffffff_45%,#f7f1ff_100%)] p-6 shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Leadership Team</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#111827] sm:text-3xl">Program and Operations Leadership</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {leadershipTeam.map((member) => (
                <article
                  key={member.name}
                  className="group overflow-hidden rounded-2xl border border-[#e5d8fb] bg-white shadow-[0_22px_40px_-30px_rgba(93,54,153,0.78)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_44px_-26px_rgba(93,54,153,0.85)]"
                >
                  <div className="relative h-52 overflow-hidden bg-[#f6f0ff] 2xl:h-[17rem] min-[2200px]:h-[19rem]">
                    <img
                      src={member.image}
                      alt={`${member.name} - ${member.role}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-[#111827]">{member.name}</h3>
                    <p className="mt-1 text-sm font-medium text-[#5D3699]">{member.role}</p>
                    <p className="mt-2 text-sm leading-6 text-[#5f6472]">{member.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[#e8dcff] bg-[linear-gradient(135deg,#fcf8ff_0%,#ffffff_45%,#f7f1ff_100%)] p-6 shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Volunteers</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#111827] sm:text-3xl">Volunteer Community</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5f6472]">
              Bond Room is powered by a volunteer community that supports programs, student engagement, and outreach.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {volunteers.map((member) => (
                <article
                  key={member.name}
                  className="group overflow-hidden rounded-2xl border border-[#e5d8fb] bg-white shadow-[0_22px_40px_-30px_rgba(93,54,153,0.78)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_44px_-26px_rgba(93,54,153,0.85)]"
                >
                  <div className="relative h-56 overflow-hidden bg-[#f6f0ff] 2xl:h-72 min-[2200px]:h-80">
                    <img
                      src={member.image}
                      alt={`${member.name} - ${member.role}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-[#111827]">{member.name}</h3>
                    <p className="mt-1 text-sm font-medium text-[#5D3699]">{member.role}</p>
                    <p className="mt-2 text-sm leading-6 text-[#5f6472]">{member.bio}</p>
                  </div>
                </article>
              ))}
            </div>
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
