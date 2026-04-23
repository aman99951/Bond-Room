import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, ShieldCheck, Users, Brain, Sparkles, CheckCircle2, X } from 'lucide-react';
import logo from './assets/Logo.svg';
import smrithiFounderImage from './assets/smrithi(co-founder).png';
import nikhilFounderImage from './assets/Nikhil.jfif';
import santhiDirectorImage from './assets/Santhi.jpg';
import babuDirectorImage from './assets/Babu.jfif';
import hemachandraImage from './assets/Hemachandra patil.png';
import avantikaImage from './assets/Avantika.jfif';
import anushaVolunteerImage from './assets/Anusha.png';

const AboutUs = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const NAV = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Volunteer', href: '/volunteer' },
    { label: 'Safety', href: '/#safety' },
    { label: 'Stories', href: '/#stories' },
  ];

  const founders = [
    {
      name: 'Smrithi',
      role: 'Co-Founder',
      bio: 'I’m Smrithi, a curious, self-driven student figuring things out as I go. I love finding patterns in everything, whether it’s math, algorithms, or just how people think. I’ve mostly built my journey on my own, pushing through what I don’t understand until I do. I’m into tech, learning, and growing both mentally and physically (yes, the gym too). I like doing things that matter, whether it’s small initiatives or bigger goals. Not perfect, but definitely not average, and I’m working my way toward something big.',
      image: smrithiFounderImage,
      objectPosition: 'center 18%',
    },
    {
      name: 'Nikhil',
      role: 'Co-Founder & Creative Director',
      bio: 'Hey! My name is Nikhil Vijay, I am the Co-Founder & Creative Director at BondRoom, I’m passionate about building meaningful connections, and creating opportunities for people to learn from one another. Often, I enjoy playing tennis, creating art, pondering about the wonders of medical innovation, and leading initiatives that bring communities together. Through BondRoom, I’m learning, apprehending, and applying, the ideology of connecting different generations among various backgrounds. I’m doing this by helping people grow from mentorship, conversation, and shared experiences. I am very excited to expand our impact and create a space where everyone feels forever included and inspired.',
      image: nikhilFounderImage,
      objectPosition: 'center 12%',
    },
  ];

  const leadershipTeam = [
    {
      name: 'Babu',
      role: 'Director - Bondroom Foundation',
      bio: 'Serving Bondroom Foundation as Director, focused on strengthening people, systems, and long-term community impact.',
      image: babuDirectorImage,
    },
    {
      name: 'Santhi',
      role: 'Director - Bondroom Foundation',
      bio: 'Serving Bondroom Foundation as Director, with focus on people-first program development and responsible execution.',
      image: santhiDirectorImage,
    },
    {
      name: 'Hemachandra Patil',
      role: 'Director of External Relations & Legal Affairs',
      bio: 'Hello, my name is Hemachandra Patil and I am currently a junior in high school. I am excited to work with Bondroom and serve the people of my community. Outside of Bondroom, I sing Carnatic music and participate in DEC.',
      image: hemachandraImage,
    },
    {
      name: 'Avantika',
      role: 'Creative Director',
      bio: 'I love creating through art and theatre, and I like losing myself in the beauty of oceans and animals. I’m passionate about Tamil history, enjoy reading, and care deeply about uplifting people around me.',
      image: avantikaImage,
    },
  ];

  const volunteers = [
    {
      name: 'Anusha',
      role: 'Volunteer',
      bio: 'My introduction: Hey all. I am Anusha. I love listening to music and dancing around. I always goof around, jumping from here to there! I love seeing someone else smile and have fun, as it makes me happier and motivates me to do better at what I do! Also, I’m my favourite, I am my first love! I am very honoured to be a volunteer in the Bond Room!! Keep going, all of you out there! You all got this!!',
      image: anushaVolunteerImage,
      objectPosition: 'center top',
    },
  ];

  const openProfile = (member) => setSelectedProfile(member);
  const closeProfile = () => setSelectedProfile(null);

  const renderProfileCard = (
    member,
    imageHeightClass = 'h-56',
    imagePosition = 'center center',
    previewLines = 4,
    buttonLabel = 'Read More',
  ) => (
    <article
      key={member.name}
      className="group overflow-hidden rounded-2xl border border-[#e5d8fb] bg-white shadow-[0_22px_40px_-30px_rgba(93,54,153,0.78)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_44px_-26px_rgba(93,54,153,0.85)]"
    >
      <div className={`relative ${imageHeightClass} overflow-hidden bg-[#f6f0ff]`}>
        <img
          src={member.image}
          alt={`${member.name} - ${member.role}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          style={{ objectPosition: member.objectPosition || imagePosition }}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-[#111827]">{member.name}</h3>
        <p className="mt-1 text-sm font-medium text-[#5D3699]">{member.role}</p>
        <p
          className="mt-2 text-sm leading-6 text-[#5f6472] [display:-webkit-box] [-webkit-box-orient:vertical] overflow-hidden"
          style={{ WebkitLineClamp: previewLines }}
        >
          {member.bio}
        </p>
        <button
          type="button"
          onClick={() => openProfile(member)}
          className="mt-3 rounded-lg border border-[#d8c7fb] bg-white px-3 py-1.5 text-xs font-semibold text-[#5D3699] transition hover:bg-[#f8f4ff]"
        >
          {buttonLabel}
        </button>
      </div>
    </article>
  );

  return (
    <div className="theme-v-page min-h-screen pt-[64px]">
      <div className="mx-auto w-full max-w-[2440px] px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10 lg:px-10 xl:px-12 2xl:px-16 min-[2200px]:px-16 min-[2500px]:px-20">
        <header className="theme-v-header fixed top-0 inset-x-0 z-50">
          <div className="mx-auto flex h-[60px] w-full max-w-[1920px] items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16 min-[2200px]:h-[84px] min-[2200px]:px-16 min-[2500px]:px-20">
            <Link to="/" className="flex flex-col items-center leading-none group">
              <img src={logo} alt="Bond Room" className="theme-v-logo h-10 w-auto object-contain transition-transform group-hover:scale-105 2xl:h-12 min-[2200px]:h-14" />
              <span className="theme-v-tagline mt-0.5 block text-[8px] leading-tight tracking-wide sm:text-[9px] 2xl:text-[11px] min-[2200px]:text-[13px]">
                Bridging Old and New Destinies
              </span>
            </Link>

            <nav className="hidden items-center gap-0.5 md:flex 2xl:gap-1.5 min-[2200px]:gap-2">
              {NAV.map((n) => (
                n.href.includes('#') ? (
                  <a
                    key={n.label}
                    href={n.href}
                    className="theme-v-nav-link rounded-lg px-3 py-1.5 text-[13px] font-medium 2xl:px-4 2xl:py-2 2xl:text-[15px] min-[2200px]:px-5 min-[2200px]:py-2.5 min-[2200px]:text-[17px]"
                  >
                    {n.label}
                  </a>
                ) : (
                  <Link
                    key={n.label}
                    to={n.href}
                    className="theme-v-nav-link rounded-lg px-3 py-1.5 text-[13px] font-medium 2xl:px-4 2xl:py-2 2xl:text-[15px] min-[2200px]:px-5 min-[2200px]:py-2.5 min-[2200px]:text-[17px]"
                  >
                    {n.label}
                  </Link>
                )
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex 2xl:gap-3 min-[2200px]:gap-4">
              <Link to="/donate" className="theme-v-cta rounded-lg px-3.5 py-1.5 text-[13px] font-semibold hover:scale-105 2xl:px-4.5 2xl:py-2 2xl:text-[15px] min-[2200px]:px-5 min-[2200px]:py-2.5 min-[2200px]:text-[17px]">
                Donate
              </Link>
              <Link to="/login" className="theme-v-cta rounded-lg px-4 py-1.5 text-[13px] font-semibold shadow-md shadow-[#2D1A4F]/30 transition-all hover:scale-105 hover:shadow-[#2D1A4F]/45 2xl:px-5 2xl:py-2 2xl:text-[15px] min-[2200px]:px-6 min-[2200px]:py-2.5 min-[2200px]:text-[17px]">
                Log in
              </Link>
            </div>

            <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/10 md:hidden">
              <svg className="theme-v-menu-icon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {mobileOpen ? (
          <div className="fixed inset-0 z-[100] flex">
            <div className="absolute inset-0 bg-[#4A2B7A]/40 backdrop-blur-sm" onClick={closeMobile} />
            <div className="relative ml-auto flex h-full w-[270px] max-w-[82vw] flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#EDE3FF] px-4 pb-2 pt-4">
                <span className="text-sm font-bold text-[#5D3699]">Menu</span>
                <button onClick={closeMobile} className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-[#EDE3FF]">X</button>
              </div>
              <nav className="flex flex-1 flex-col gap-0.5 p-3">
                {NAV.map((n) => (
                  n.href.includes('#') ? (
                    <a key={n.label} href={n.href} onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5F6B81] transition hover:bg-[#EDE3FF] hover:text-[#5D3699]">
                      {n.label}
                    </a>
                  ) : (
                    <Link key={n.label} to={n.href} onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5F6B81] transition hover:bg-[#EDE3FF] hover:text-[#5D3699]">
                      {n.label}
                    </Link>
                  )
                ))}
                <Link to="/donate" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5D3699] transition hover:bg-[#EDE3FF]">
                  Donate
                </Link>
                <Link to="/login" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5F6B81] transition hover:bg-[#EDE3FF] hover:text-[#5D3699]">
                  Log in
                </Link>
              </nav>
              <div className="border-t border-[#EDE3FF] p-3">
                <Link to="/register" onClick={closeMobile} className="block rounded-lg bg-[#fdd253] px-4 py-2.5 text-center text-sm font-bold text-[#1f2937] shadow-md shadow-[#fdd253]/30">
                  Mentee Sign Up
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <main>
        <section className="theme-v-hero relative overflow-hidden rounded-[28px] p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#fdd253] opacity-40 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-[#5D3699] opacity-20 blur-2xl" />
          <div className="pointer-events-none absolute -right-20 bottom-10 h-20 w-20 rounded-full bg-[#fdd253] opacity-30 blur-xl" />

          <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="theme-v-kicker text-xs font-semibold uppercase tracking-wide">About Bond Room</p>
              <h1 className="theme-v-title mt-2 text-3xl font-semibold leading-tight sm:text-5xl">
                Bridging Generations
                <br />
                <span className="theme-v-highlight">
                  Through Mentorship
                </span>
              </h1>
              <p className="theme-v-subtitle mt-5 max-w-3xl text-sm leading-7 sm:text-base">
                Bond Room connects students with trusted mentors for meaningful one-on-one guidance.
                We focus on emotional safety, career clarity, and confidence building through real conversations.
              </p>
            </div>

            <div className="flex items-center justify-center rounded-2xl border border-[#eadfff] bg-gradient-to-br from-[#f8f3ff] to-[#fdf8e0] p-6 sm:p-8">
              <img src={logo} alt="Bond Room logo" className="h-36 w-auto object-contain sm:h-44" />
            </div>
          </div>
        </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: HeartHandshake,
              title: 'Human-First Guidance',
              body: 'Mentorship that listens first and supports students with empathy and respect.',
              accent: 'gold',
            },
            {
              icon: ShieldCheck,
              title: 'Safety by Design',
              body: 'Session monitoring and safety workflows help protect every student interaction.',
              accent: 'accent',
            },
            {
              icon: Users,
              title: 'Trusted Mentors',
              body: 'Experienced mentors across domains who understand student pressure and growth.',
              accent: 'gold',
            },
          ].map((item) => {
            const Icon = item.icon;
            const isGold = item.accent === 'gold';
            return (
              <article
                key={item.title}
                className="rounded-2xl border border-[#e9ddff] bg-white p-5 shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)]"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${isGold ? 'bg-[#fdd253]/30' : 'bg-[#f5f3ff]'}`}>
                  <Icon className={`h-5 w-5 ${isGold ? 'text-[#c9a227]' : 'text-[#5D3699]'}`} />
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

          <article className="rounded-2xl border border-[#e9ddff] bg-white p-6 shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)]">
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
          </article>
        </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[#e9ddff] bg-white p-6 shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)]">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#fdd253]/30">
              <Brain className="h-5 w-5 text-[#c9a227]" />
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
          <article className="rounded-2xl border border-[#e8dcff] bg-[linear-gradient(135deg,#fffdf0_0%,#ffffff_45%,#fef9e7_100%)] p-6 shadow-[0_24px_44px_-34px_rgba(253,210,83,0.5)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Founders</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#111827] sm:text-3xl">People Behind Bond Room</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {founders.map((member) => renderProfileCard(member, 'h-56 2xl:h-[22rem] min-[2200px]:h-[26rem]'))}
            </div>
          </article>

          <article className="rounded-2xl border border-[#e8dcff] bg-[linear-gradient(135deg,#fcf8ff_0%,#fffdf0_45%,#fef9e7_100%)] p-6 shadow-[0_24px_44px_-34px_rgba(253,210,83,0.4)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Leadership Team</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#111827] sm:text-3xl">Program and Operations Leadership</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {leadershipTeam.map((member) => renderProfileCard(member, 'h-52 2xl:h-[17rem] min-[2200px]:h-[19rem]', 'top center', 3, 'Read more'))}
            </div>
          </article>

          {volunteers.length ? (
            <article className="rounded-2xl border border-[#e8dcff] bg-[linear-gradient(135deg,#fffdf0_0%,#ffffff_45%,#fef9e7_100%)] p-6 shadow-[0_24px_44px_-34px_rgba(253,210,83,0.4)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Volunteers</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#111827] sm:text-3xl">Volunteer Community</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5f6472]">
                Bond Room is powered by a volunteer community that supports programs, student engagement, and outreach.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {volunteers.map((member) => renderProfileCard(member, 'h-56 2xl:h-72 min-[2200px]:h-80'))}
              </div>
            </article>
          ) : null}
        </section>

        <section className="theme-v-hero mt-6 rounded-2xl p-6 sm:p-8">
          <h2 className="theme-v-title text-2xl font-semibold">Our Commitment</h2>
          <p className="theme-v-subtitle mt-3 max-w-4xl text-sm leading-7">
            Bond Room is committed to building a mentoring platform that is accessible, trustworthy, and student-centered.
            We continuously improve matching quality, mentor standards, and safety controls so students receive meaningful
            guidance that supports both wellbeing and long-term growth.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/register"
              className="theme-v-cta rounded-xl px-5 py-2.5 text-sm font-semibold shadow-[0_4px_14px_rgba(253,210,83,0.4)]"
            >
              Student Sign Up
            </a>
            <a
              href="/mentor-register"
              className="theme-v-cta rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              Become a Mentor
            </a>
          </div>
        </section>

        {selectedProfile ? (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4 py-8">
            <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#e8dcff] bg-white p-6 shadow-[0_24px_54px_-26px_rgba(0,0,0,0.45)] sm:p-8">
              <button
                type="button"
                onClick={closeProfile}
                aria-label="Close writeup"
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e8dcff] text-[#5D3699] transition hover:bg-[#f8f4ff]"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                <div className="overflow-hidden rounded-xl border border-[#eadfff] bg-[#f8f3ff]">
                  <img
                    src={selectedProfile.image}
                    alt={`${selectedProfile.name} - ${selectedProfile.role}`}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: selectedProfile.objectPosition || 'center center' }}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Team Writeup</p>
                  <h3 className="mt-1 text-2xl font-semibold text-[#111827]">{selectedProfile.name}</h3>
                  <p className="mt-1 text-sm font-medium text-[#5D3699]">{selectedProfile.role}</p>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#5f6472]">{selectedProfile.bio}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        </main>
      </div>
    </div>
  );
};

export default AboutUs;

