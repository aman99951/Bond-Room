import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { menteeApi } from "../apis/api/menteeApi";
import logo from "./assets/logo.png";
import happyStudent from "./assets/happyStudent.png";
import avatarFallback from "./assets/avatar-1.jpg";

const MENTORS = [
  { id: 1, name: "Dr. Meera Iyer", role: "Retired Professor · Physics", city: "Bangalore", qualification: "Ph.D. Physics, IISc", bio: "35 years of teaching physics to young minds. Passionate about making complex concepts simple and fun.", tags: ["Physics", "Board Exams", "Career Guidance"], languages: ["English", "Hindi", "Kannada"], rating: 4.9, avatar: "MI", color: "#7B4CBC" },
  { id: 2, name: "Mr. Rajesh Sharma", role: "Software Engineer · Mentor", city: "Delhi", qualification: "B.Tech, IIT Delhi", bio: "From a small town to Silicon Valley and back. I love helping Teens navigate their career confusion.", tags: ["Computer Science", "Career", "Motivation"], languages: ["Hindi", "English"], rating: 4.8, avatar: "RS", color: "#5B2CC7" },
  { id: 3, name: "Mrs. Sunita Deshmukh", role: "School Counselor · 20 yrs", city: "Pune", qualification: "M.A. Psychology", bio: "I've helped thousands of Teens deal with exam stress, peer pressure, and self-doubt.", tags: ["Stress", "Anxiety", "Study Tips"], languages: ["Marathi", "Hindi", "English"], rating: 4.9, avatar: "SD", color: "#5D3699" },
  { id: 4, name: "Mr. Anil Kapoor", role: "Parent & Life Coach", city: "Mumbai", qualification: "MBA, XLRI", bio: "As a father of two teenagers, I understand the challenges kids face today. Let's talk!", tags: ["Life Skills", "Decision Making", "Communication"], languages: ["Hindi", "English", "Gujarati"], rating: 4.7, avatar: "AK", color: "#8E61CE" },
  { id: 5, name: "Dr. Fatima Khan", role: "Doctor & Wellness Guide", city: "Hyderabad", qualification: "MBBS, AIIMS", bio: "Health is wealth! I guide Teens on mental well-being, nutrition, and balanced living.", tags: ["Mental Health", "Wellness", "Biology"], languages: ["Urdu", "Hindi", "English", "Telugu"], rating: 5.0, avatar: "FK", color: "#4A2B7A" },
  { id: 6, name: "Mr. Thomas George", role: "Retired Principal", city: "Kochi", qualification: "M.Ed, Kerala University", bio: "40 years in education. I believe every Teen has unlimited potential waiting to bloom.", tags: ["Academics", "Discipline", "Goal Setting"], languages: ["Malayalam", "English", "Hindi"], rating: 4.8, avatar: "TG", color: "#7B4CBC" },
];

const STORIES = [
  { quote: "I was so stressed about my board exams. Mr. Sharma helped me calm down — he didn't just give advice, he listened.", name: "Arav", meta: "Teen · 17", emoji: "🎓" },
  { quote: "I felt lost choosing a career path. My mentor shared her journey of confusion and success, which gave me so much hope.", name: "Priya", meta: "Teen · 19", emoji: "✨" },
  { quote: "It's different from talking to parents. My mentor feels like a wise friend who doesn't judge my mistakes.", name: "Rohan", meta: "Teen · 16", emoji: "💬" },
];

const MARQUEE_ITEMS = ["LISTEN", "UNDERSTAND", "GUIDE", "TRUSTED MENTORS", "SAFE SESSIONS", "AI MATCHING", "BOND ROOM"];

const HOW_CARDS = [
  { num: "01", title: "Listen", desc: "Teens share concerns in a private, judgment-free space.", icon: "👂", gradient: "from-[#5D3699] to-[#7B4CBC]" },
  { num: "02", title: "Understand", desc: "Intelligent matching finds the mentor who truly relates.", icon: "🧠", gradient: "from-[#5B2CC7] to-[#8E61CE]" },
  { num: "03", title: "Guide", desc: "Meaningful 1-on-1 free sessions that provide perspective and direction.", icon: "🧭", gradient: "from-[#4A2B7A] to-[#5D3699]" },
];

const TRUST_ITEMS = [
  { icon: "🛡️", title: "Safe & Monitored", desc: "Strict protocols — keyword monitoring and session recording keep every Teen safe.", gradient: "from-green-50 to-emerald-50", border: "border-green-200/60" },
  { icon: "👴", title: "Mentors 50+", desc: "Vetted professionals, retirees, and parents who genuinely care about young minds.", gradient: "from-[#F7F4FF] to-[#EDE3FF]", border: "border-[#DDD7ED]/60" },
  { icon: "🤖", title: "AI Matching", desc: "Algorithm weighs academic needs, emotions, and language for the perfect pairing.", gradient: "from-blue-50 to-indigo-50", border: "border-blue-200/60" },
  { icon: "⚡", title: "Teen-Friendly", desc: "No complex onboarding — sign up, match, and start talking in minutes.", gradient: "from-amber-50 to-yellow-50", border: "border-amber-200/60" },
];

const FALLBACK_MENTORS = MENTORS.map((mentor) => ({
  ...mentor,
  image: happyStudent,
  copy: mentor.bio,
}));

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.mentors)) return payload.mentors;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const resolveMediaUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const base = import.meta.env.VITE_API_BASE_URL || "";
  if (!base) return value;
  try {
    const apiBase = new URL(base, window.location.origin);
    return new URL(value.startsWith("/") ? value : `/${value}`, apiBase.origin).toString();
  } catch {
    return value;
  }
};

const toLandingMentorCard = (mentor, index = 0) => {
  const source = mentor?.mentor && typeof mentor.mentor === "object" ? mentor.mentor : mentor;
  const firstName = String(source?.first_name || "").trim();
  const lastName = String(source?.last_name || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const name = fullName || String(source?.name || "").trim() || `Mentor #${source?.id || index + 1}`;
  const rating = Number(source?.average_rating ?? source?.rating ?? 0);
  const tagsRaw = Array.isArray(source?.care_areas) ? source.care_areas : Array.isArray(source?.tags) ? source.tags : [];
  const tags = tagsRaw.filter(Boolean).slice(0, 3);
  const languages = Array.isArray(source?.languages) ? source.languages.filter(Boolean) : [];
  const resolvedImage = resolveMediaUrl(source?.profile_photo || source?.avatar || source?.image || "");
  const image = String(resolvedImage || "").trim() || avatarFallback;
  const palette = ["#7B4CBC", "#5B2CC7", "#5D3699", "#8E61CE", "#4A2B7A"];
  const color = palette[(Number(source?.id) || index) % palette.length];
  const avatar = name.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase() || "").join("") || "M";
  const bio = String(source?.bio || source?.about || "").trim();
  const role = String(source?.qualification || source?.city_state || source?.role || "Mentor").trim();

  return {
    id: source?.id || index + 1,
    name,
    role,
    city: String(source?.city_state || source?.city || "").trim(),
    qualification: String(source?.qualification || "").trim(),
    bio: bio || `Supports Teens with ${tags.join(", ") || "guided mentoring"}.`,
    copy: bio || `Supports Teens with ${tags.join(", ") || "guided mentoring"}.`,
    tags,
    languages,
    rating: Number.isFinite(rating) ? rating : 0,
    image,
    avatar,
    color,
  };
};

function useCounter(end, duration = 2000, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => { if (!startTime) startTime = ts; const p = Math.min((ts - startTime) / duration, 1); setVal(Math.floor(p * end)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, [start, end, duration]);
  return val;
}

function useOnScreen(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="absolute rounded-full opacity-15" style={{
          width: `${3 + Math.random() * 6}px`, height: `${3 + Math.random() * 6}px`,
          background: ["#5D3699", "#5B2CC7", "#FDD253", "#8E61CE", "#7B4CBC"][i % 5],
          left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
          animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`, animationDelay: `${Math.random() * 3}s`,
        }} />
      ))}
    </div>
  );
}

/* ═══════════ Wrap helper – clamps content at 1440px on ultrawide ═══════════ */
function Wrap({ children, className = "" }) {
  return <div className={`w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16 min-[2200px]:px-16 min-[2500px]:px-20 ${className}`}>{children}</div>;
}

function MentorRingCarousel({ items, onSelectMentor }) {
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  const hoverRef = useRef(false);
  const dragRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const lastPointerXRef = useRef(0);
  const phaseRef = useRef(0);
  const speedRef = useRef(0.17);
  const targetSpeedRef = useRef(0.17);

  const BASE_SPEED = 0.17;
  const HOVER_SPEED = 0;
  const DRAG_PHASE_MULTIPLIER = 0.0033;
  const DRAG_MOMENTUM_MULTIPLIER = 0.0019;
  const DRAG_CLICK_THRESHOLD = 8;

  const applyArcLayout = useCallback(() => {
    const stageWidth = stageRef.current?.clientWidth || 1280;
    const count = items.length || 1;
    const half = count / 2;

    const slot = Math.min(286, Math.max(132, stageWidth * 0.17));
    const frontZ = Math.min(380, Math.max(210, stageWidth * 0.23));
    const zDrop = frontZ * 0.36;
    const yawStep = 11.8;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      let offset = index - phaseRef.current;
      if (offset > half) offset -= count;
      if (offset < -half) offset += count;

      const abs = Math.abs(offset);
      const x = offset * slot;
      const y = Math.pow(abs, 1.7) * 8;
      const z = frontZ - abs * zDrop;
      const rotateY = -offset * yawStep;
      const scale = 1 - Math.min(0.24, abs * 0.07);
      const opacity = abs <= 2.25 ? 1 : Math.max(0.34, 1 - (abs - 2.25) * 0.56);
      const blur = abs <= 2.6 ? 0 : Math.min(1.1, (abs - 2.6) * 1.2);

      card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotateY}deg) scale(${scale})`;
      card.style.opacity = `${opacity}`;
      card.style.filter = blur > 0 ? `blur(${blur}px)` : "none";
      card.style.zIndex = `${Math.round(900 - abs * 100)}`;
    });
  }, [items.length]);

  useEffect(() => {
    applyArcLayout();
    const tick = (ts) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      if (!dragRef.current) {
        const blend = 1 - Math.exp(-dt * 8.2);
        speedRef.current += (targetSpeedRef.current - speedRef.current) * blend;
        phaseRef.current = (phaseRef.current + speedRef.current * dt + items.length) % items.length;
        applyArcLayout();
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [applyArcLayout, items.length]);

  useEffect(() => {
    const onResize = () => applyArcLayout();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [applyArcLayout]);

  const handlePointerDown = (event) => {
    dragRef.current = true;
    dragDistanceRef.current = 0;
    lastPointerXRef.current = event.clientX;
    targetSpeedRef.current = 0;
    speedRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current) return;
    const dx = event.clientX - lastPointerXRef.current;
    lastPointerXRef.current = event.clientX;
    dragDistanceRef.current += Math.abs(dx);
    phaseRef.current = (phaseRef.current - dx * DRAG_PHASE_MULTIPLIER + items.length) % items.length;
    speedRef.current = -dx * DRAG_MOMENTUM_MULTIPLIER;
    applyArcLayout();
  };

  const handlePointerEnd = (event) => {
    if (!dragRef.current) return;
    if (dragDistanceRef.current <= DRAG_CLICK_THRESHOLD && typeof onSelectMentor === "function") {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const card = target?.closest?.(".lp-arc-card");
      const cardIndex = Number(card?.getAttribute("data-arc-index"));
      if (Number.isFinite(cardIndex) && items[cardIndex]) {
        onSelectMentor(items[cardIndex]);
      }
    }
    dragRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    targetSpeedRef.current = hoverRef.current ? HOVER_SPEED : BASE_SPEED;
  };

  return (
    <div className="lp-arc-shell">
      <div
        ref={stageRef}
        className="lp-arc-stage"
        onMouseEnter={() => { hoverRef.current = true; if (!dragRef.current) { speedRef.current = 0; targetSpeedRef.current = HOVER_SPEED; } }}
        onMouseLeave={() => { hoverRef.current = false; if (!dragRef.current) targetSpeedRef.current = BASE_SPEED; }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div className="lp-arc-track">
          {items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="lp-arc-card"
              data-arc-index={index}
              ref={(el) => { cardRefs.current[index] = el; }}
            >
              <div className="lp-arc-card-inner">
                <img src={item.image} alt={item.name} className="lp-arc-img" draggable={false} />
                <div className="lp-arc-overlay" />
                <div className="lp-arc-info">
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [donateEnabled] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [mentorCards, setMentorCards] = useState(FALLBACK_MENTORS);
  const [activeStory, setActiveStory] = useState(0);

  useEffect(() => { const t = setInterval(() => setActiveStory((p) => (p + 1) % STORIES.length), 5000); return () => clearInterval(t); }, []);
  useEffect(() => {
    let cancelled = false;
    const loadMentors = async () => {
      try {
        const payload = await menteeApi.listPublicMentors();
        const list = normalizeList(payload);
        const mapped = list.map((item, index) => toLandingMentorCard(item, index)).filter((item) => item?.name);
        if (!cancelled && mapped.length > 0) setMentorCards(mapped);
      } catch {
        if (!cancelled) setMentorCards(FALLBACK_MENTORS);
      }
    };
    loadMentors();
    return () => { cancelled = true; };
  }, []);

  const [statsRef, statsVis] = useOnScreen(0.15);
  const c1 = useCounter(2400, 2200, statsVis);
  const c2 = useCounter(180, 2000, statsVis);
  const c3 = useCounter(97, 2500, statsVis);
  const c4 = useCounter(9500, 2400, statsVis);

  const [heroRef, heroVis] = useOnScreen(0.05);
  const [howRef, howVis] = useOnScreen(0.1);
  const [trustRef, trustVis] = useOnScreen(0.1);
  const [voicesRef, voicesVis] = useOnScreen(0.1);
  const [mentorSecRef, mentorSecVis] = useOnScreen(0.1);
  const [ctaRef, ctaVis] = useOnScreen(0.1);
  const [whyRef, whyVis] = useOnScreen(0.1);
  const [faqRef, faqVis] = useOnScreen(0.1);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const NAV = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Volunteer", href: "/volunteer" },
    { label: "Safety", href: "/#safety" },
    { label: "Stories", href: "/#stories" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#FAF8FF] overflow-x-hidden font-sans text-[#111827]">
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
        @keyframes floatSlow{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-10px) rotate(2deg)}}
        @keyframes floatRev{0%,100%{transform:translateY(0)}50%{transform:translateY(12px)}}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 6px #5B2CC7}50%{box-shadow:0 0 20px #8E61CE}}
        @keyframes slideUp{from{opacity:0;transform:translateY(44px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideL{from{opacity:0;transform:translateX(50px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideR{from{opacity:0;transform:translateX(-50px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
        @keyframes blob{0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%}}
        @keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
        @keyframes grad{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        .af{animation:float 4s ease-in-out infinite}
        .afs{animation:floatSlow 6s ease-in-out infinite}
        .afr{animation:floatRev 5s ease-in-out infinite}
        .ab{animation:blob 8s ease-in-out infinite}
        .asp{animation:spin 18s linear infinite}
        .am{animation:marquee 24s linear infinite}
        .apg{animation:pulseGlow 2s ease-in-out infinite}
        .asu{animation:slideUp .65s ease both}
        .asl{animation:slideL .75s ease both}
        .asr{animation:slideR .75s ease both}
        .afi{animation:fadeIn .5s ease both}
        .asc{animation:scaleIn .45s ease both}
        .agr{background-size:200% 200%;animation:grad 4s ease infinite}
        .d1{animation-delay:.1s}.d2{animation-delay:.2s}.d3{animation-delay:.3s}
        .d4{animation-delay:.4s}.d5{animation-delay:.5s}.d6{animation-delay:.6s}
        .d7{animation-delay:.7s}.d8{animation-delay:.8s}.d10{animation-delay:1s}
        html{scroll-behavior:smooth}
        *::-webkit-scrollbar{width:5px}
        *::-webkit-scrollbar-track{background:#F7F4FF}
        *::-webkit-scrollbar-thumb{background:#8E61CE;border-radius:99px}
        .gl{background:rgba(255,255,255,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
        .hl{transition:all .28s ease}.hl:hover{transform:translateY(-5px);box-shadow:0 18px 36px -10px rgba(93,54,153,.16)}
        .cs{position:relative;overflow:hidden}
        .cs::after{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:linear-gradient(45deg,transparent 40%,rgba(255,255,255,.08) 50%,transparent 60%);transition:all .5s}
        .cs:hover::after{transform:translateX(100%) translateY(100%)}
        .tg{background:linear-gradient(135deg,#5D3699,#5B2CC7,#8E61CE);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .lp-arc-shell{width:100%;display:flex;flex-direction:column;align-items:center;gap:12px;padding:8px 0 4px}
        .lp-arc-stage{--card-w:clamp(190px,16vw,262px);--card-h:clamp(286px,34vw,410px);width:100%;height:clamp(390px,41vw,560px);perspective:1680px;perspective-origin:50% 44%;overflow:hidden;position:relative;user-select:none;touch-action:pan-y;cursor:grab}
        .lp-arc-stage:active{cursor:grabbing}
        .lp-arc-stage::before{content:'';position:absolute;inset:2% 10% auto;height:56%;pointer-events:none;background:radial-gradient(ellipse at 50% 30%,rgba(51,157,255,.2),rgba(51,157,255,0) 70%),radial-gradient(ellipse at 10% 20%,rgba(20,134,230,.2),rgba(20,134,230,0) 65%);filter:blur(14px)}
        .lp-arc-stage::after{content:'';position:absolute;left:50%;bottom:8px;width:min(78%,960px);height:clamp(38px,5vw,66px);transform:translateX(-50%);pointer-events:none;background:radial-gradient(ellipse,rgba(30,95,170,.42) 0%,rgba(30,95,170,0) 72%);filter:blur(7px)}
        .lp-arc-track{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;transform:translate3d(-50%,-50%,0);will-change:transform}
        .lp-arc-card{position:absolute;width:var(--card-w);height:var(--card-h);left:calc(var(--card-w)/-2);top:calc(var(--card-h)/-2);transform-style:preserve-3d;will-change:transform,opacity,filter;transition:opacity .18s linear,filter .18s linear;cursor:pointer}
        .lp-arc-card-inner{width:100%;height:100%;position:relative;border-radius:24px;overflow:hidden;background:#0a111b;border:1px solid rgba(119,165,221,.48);box-shadow:0 18px 36px rgba(0,0,0,.56),inset 0 1px 0 rgba(193,222,255,.2)}
        .lp-arc-img{width:100%;height:100%;object-fit:cover}
        .lp-arc-overlay{position:absolute;inset:0;background:radial-gradient(110% 90% at 50% 24%,rgba(41,166,255,.38),rgba(41,166,255,0) 58%),linear-gradient(90deg,rgba(2,10,18,.56) 0%,rgba(2,10,18,.1) 26%,rgba(2,10,18,.08) 74%,rgba(2,10,18,.56) 100%),linear-gradient(180deg,rgba(3,10,18,0) 44%,rgba(3,10,18,.88) 100%)}
        .lp-arc-info{position:absolute;left:14px;right:14px;bottom:13px}
        .lp-arc-info strong{display:block;color:#f1f7ff;font-size:clamp(.78rem,1.08vw,1.24rem);font-weight:700;line-height:1.2;text-shadow:0 4px 18px rgba(0,0,0,.56)}
        .lp-arc-info span{display:block;margin-top:2px;color:rgba(193,216,243,.9);font-size:clamp(.62rem,.74vw,.84rem);line-height:1.2;text-shadow:0 4px 14px rgba(0,0,0,.52)}
        .lp-arc-action{margin-top:10px;padding:6px 10px;border-radius:999px;border:1px solid rgba(190,220,255,.42);background:rgba(9,22,40,.62);color:#eef6ff;font-size:.68rem;font-weight:700;letter-spacing:.03em}
        .lp-arc-action:hover{background:rgba(22,48,82,.78)}
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header className="fixed top-0 inset-x-0 z-50 gl border-b border-[#DDD7ED]/40">
        <Wrap className="flex items-center justify-between h-[60px] 2xl:h-[72px] min-[2200px]:h-[84px]">
          <Link to="/" className="flex flex-col items-center leading-none group">
            <img src={logo} alt="Bond Room" className="h-10 2xl:h-12 min-[2200px]:h-14 w-auto object-contain group-hover:scale-105 transition-transform" />
            <span className="text-[9px] 2xl:text-[11px] min-[2200px]:text-[13px] text-[#000] tracking-wide mt-0.5 hidden sm:block">Bridging Old and New Destinies</span>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5 2xl:gap-1.5 min-[2200px]:gap-2">
            {NAV.map((n) => (
              n.href.includes("#")
                ? <a key={n.label} href={n.href} className="px-3 py-1.5 2xl:px-4 2xl:py-2 min-[2200px]:px-5 min-[2200px]:py-2.5 rounded-lg text-[13px] 2xl:text-[15px] min-[2200px]:text-[17px] font-medium text-[#5F6B81] hover:text-[#5D3699] hover:bg-[#EDE3FF]/60 transition-all">{n.label}</a>
                : <Link key={n.label} to={n.href} className="px-3 py-1.5 2xl:px-4 2xl:py-2 min-[2200px]:px-5 min-[2200px]:py-2.5 rounded-lg text-[13px] 2xl:text-[15px] min-[2200px]:text-[17px] font-medium text-[#5F6B81] hover:text-[#5D3699] hover:bg-[#EDE3FF]/60 transition-all">{n.label}</Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2 2xl:gap-3 min-[2200px]:gap-4">
            {donateEnabled && <Link to="/donate" className="px-3.5 py-1.5 2xl:px-4.5 2xl:py-2 min-[2200px]:px-5 min-[2200px]:py-2.5 text-[13px] 2xl:text-[15px] min-[2200px]:text-[17px] font-semibold text-[#5D3699] border border-[#DDD7ED] rounded-lg hover:bg-[#EDE3FF] hover:scale-105 transition-all">Donate</Link>}
            <Link to="/login" className="px-4 py-1.5 2xl:px-5 2xl:py-2 min-[2200px]:px-6 min-[2200px]:py-2.5 text-[13px] 2xl:text-[15px] min-[2200px]:text-[17px] font-semibold text-white bg-gradient-to-r from-[#5D3699] to-[#5B2CC7] rounded-lg shadow-md shadow-[#5D3699]/20 hover:shadow-[#5D3699]/40 hover:scale-105 transition-all">Log in</Link>
          </div>
          <button onClick={() => setMobileOpen(true)} className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#EDE3FF] transition">
            <svg className="w-5 h-5 text-[#5D3699]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </Wrap>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-[#4A2B7A]/40 backdrop-blur-sm" onClick={closeMobile} />
          <div className="relative ml-auto w-[270px] max-w-[82vw] bg-white h-full shadow-2xl flex flex-col asc">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-[#EDE3FF]">
              <span className="font-bold text-[#5D3699] text-sm">Menu</span>
              <button onClick={closeMobile} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#EDE3FF] transition text-sm">✕</button>
            </div>
            <nav className="flex flex-col gap-0.5 p-3 flex-1">
              {NAV.map((n) => (
                n.href.includes("#")
                  ? <a key={n.label} href={n.href} onClick={closeMobile} className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#5F6B81] hover:bg-[#EDE3FF] hover:text-[#5D3699] transition">{n.label}</a>
                  : <Link key={n.label} to={n.href} onClick={closeMobile} className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#5F6B81] hover:bg-[#EDE3FF] hover:text-[#5D3699] transition">{n.label}</Link>
              ))}
              {donateEnabled && <Link to="/donate" onClick={closeMobile} className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#5D3699] hover:bg-[#EDE3FF] transition">Donate 💜</Link>}
              <Link to="/login" onClick={closeMobile} className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#5F6B81] hover:bg-[#EDE3FF] hover:text-[#5D3699] transition">Log in</Link>
            </nav>
            <div className="p-3 border-t border-[#EDE3FF]">
              <Link to="/register" onClick={closeMobile} className="block text-center px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#5D3699] to-[#5B2CC7] rounded-lg shadow-md">Mentee Sign Up</Link>
            </div>
          </div>
        </div>
      )}

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative pt-[64px] bg-gradient-to-b from-[#F7F4FF] via-[#FAF8FF] to-[#EDE3FF] overflow-hidden">
        <Particles />
        <div className="absolute -top-36 -left-36 w-[480px] h-[480px] bg-[#5B2CC7]/[.07] rounded-full blur-3xl ab" />
        <div className="absolute top-8 -right-28 w-[400px] h-[400px] bg-[#8E61CE]/10 rounded-full blur-3xl ab d3" />
        <div className="absolute bottom-0 left-1/3 w-[420px] h-[420px] bg-[#FDD253]/[.07] rounded-full blur-3xl ab d6" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(#5D3699 1px,transparent 1px)", backgroundSize: "26px 26px" }} />

        <Wrap className="relative py-8 sm:py-10 lg:py-12 2xl:py-16 min-[2200px]:py-20 px-0">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-5 2xl:gap-8 min-[2200px]:gap-10 items-center">

            {/* LEFT */}
            <div className="hidden lg:flex lg:col-span-3 flex-col items-center min-[2200px]:items-start gap-4 2xl:gap-5 min-[2200px]:gap-6">
              <div className={`${heroVis ? "asr d3" : "opacity-0"} w-full max-w-[260px] 2xl:max-w-[320px] min-[2200px]:max-w-[420px]`}>
                <img src={happyStudent} alt="Happy Teens" className="w-full h-auto object-contain drop-shadow-[0_16px_30px_rgba(93,54,153,0.18)] rounded-2xl" />
              </div>
              <div className={`${heroVis ? "afi d7" : "opacity-0"} relative w-[110px] h-[110px] 2xl:w-[140px] 2xl:h-[140px] min-[2200px]:w-[180px] min-[2200px]:h-[180px]`}>
                <div className="absolute inset-0 border-2 border-dashed border-[#DDD7ED] rounded-full asp" />
                {["📖","🎯","💡","✅"].map((e,i) => (
                  <div key={i} className="absolute w-7 h-7 2xl:w-9 2xl:h-9 min-[2200px]:w-11 min-[2200px]:h-11 bg-white rounded-full flex items-center justify-center text-xs min-[2200px]:text-sm shadow border border-[#EDE3FF]"
                    style={{ top:i===0?"-10px":i===2?"auto":"50%", bottom:i===2?"-10px":"auto", left:i===3?"-10px":i===1?"auto":"50%", right:i===1?"-10px":"auto", transform:i===0||i===2?"translateX(-50%)":"translateY(-50%)" }}>{e}
                  </div>
                ))}
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl">🎓</span></div>
              </div>
              <div className={`${heroVis ? "afi d8" : "opacity-0"} w-full max-w-[260px] 2xl:max-w-[320px] min-[2200px]:max-w-[420px]`}>
                <div className="gl border border-[#DDD7ED]/70 rounded-xl 2xl:rounded-2xl p-3 2xl:p-4 min-[2200px]:p-5 shadow-md">
                  <p className="text-[10px] 2xl:text-xs min-[2200px]:text-sm font-bold uppercase tracking-[.14em] text-[#5D3699]">Why Teens Trust Us</p>
                  <p className="mt-1.5 text-[13px] 2xl:text-[15px] min-[2200px]:text-lg font-semibold text-[#111827] leading-snug">Real support beyond marks and rankings.</p>
                  <div className="mt-2 2xl:mt-3 space-y-1.5 2xl:space-y-2">
                    {[{l:"AI",t:"Personalized mentor matching"},{l:"1:1",t:"Guided one-on-one sessions"},{l:"Safe",t:"Monitored Teen-first environment"}].map((x,i)=>(
                      <div key={i} className="flex items-center gap-2 2xl:gap-2.5 text-[11px] 2xl:text-[13px] min-[2200px]:text-[15px] text-[#5F6B81]">
                        <span className="w-5 h-5 2xl:w-6 2xl:h-6 min-[2200px]:w-8 min-[2200px]:h-8 rounded bg-[#EDE3FF] flex items-center justify-center text-[8px] 2xl:text-[9px] min-[2200px]:text-[11px] font-bold text-[#5D3699] shrink-0">{x.l}</span>
                        <span>{x.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER */}
            <div className="lg:col-span-6 text-center min-[2200px]:px-8">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1 2xl:px-4 2xl:py-1.5 min-[2200px]:px-5 min-[2200px]:py-2 rounded-full gl border border-[#DDD7ED] shadow-sm mb-4 2xl:mb-5 ${heroVis?"asu":"opacity-0"}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#5B2CC7] animate-pulse" />
                <span className="text-[11px] 2xl:text-[13px] min-[2200px]:text-[15px] font-semibold tracking-wide uppercase text-[#5D3699]">Trusted mentoring platform</span>
              </div>

              <h1 className={heroVis?"asu d1":"opacity-0"}>
                <span className="block text-[2.2rem] sm:text-5xl md:text-[3.4rem] lg:text-[3.6rem] 2xl:text-[4.6rem] min-[2200px]:text-[5.8rem] min-[2500px]:text-[6.4rem] font-extrabold leading-[1.06] tracking-tight">
                  <span className="text-[#111827]">Guided </span><span className="text-[#5D3699]">by</span>
                </span>
                <span className="block text-[2.2rem] sm:text-5xl md:text-[3.4rem] lg:text-[3.6rem] 2xl:text-[4.6rem] min-[2200px]:text-[5.8rem] min-[2500px]:text-[6.4rem] font-extrabold leading-[1.06] tracking-tight mt-0.5">
                  <span className="relative inline-block"><span className="relative z-10 tg">Experience</span><span className="absolute -bottom-0.5 left-0 w-full h-2.5 bg-[#FDD253]/50 rounded-full -z-0" /></span>
                </span>
                <span className="block text-[2.2rem] sm:text-5xl md:text-[3.4rem] lg:text-[3.6rem] 2xl:text-[4.6rem] min-[2200px]:text-[5.8rem] min-[2500px]:text-[6.4rem] font-extrabold leading-[1.06] tracking-tight mt-0.5">
                  <span className="text-[#111827]">for </span><span className="text-[#5B2CC7]">Teens</span>
                  <span className="inline-flex items-center ml-2 align-middle px-2 py-0.5 2xl:px-3 2xl:py-1 min-[2200px]:px-4 min-[2200px]:py-1.5 rounded-full bg-gradient-to-r from-[#5D3699] to-[#5B2CC7] text-white text-[9px] 2xl:text-[11px] min-[2200px]:text-[13px] font-bold tracking-widest shadow-md apg">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FDD253] mr-1 animate-ping" />LIVE
                  </span>
                </span>
              </h1>

              <p className={`max-w-lg 2xl:max-w-2xl min-[2200px]:max-w-3xl mx-auto mt-4 2xl:mt-5 text-[15px] sm:text-base 2xl:text-xl min-[2200px]:text-[1.55rem] text-[#5F6B81] leading-relaxed ${heroVis?"asu d2":"opacity-0"}`}>
                A safe platform where Teens grow through conversations with trusted mentors who have walked the path before.
              </p>

              <div className={`flex flex-col sm:flex-row items-center justify-center gap-2.5 2xl:gap-4 mt-6 2xl:mt-8 ${heroVis?"asu d3":"opacity-0"}`}>
                <Link to="/register" className="group relative px-7 py-3 text-sm 2xl:px-10 2xl:py-4 2xl:text-base min-[2200px]:px-12 min-[2200px]:py-5 min-[2200px]:text-xl font-bold text-white bg-gradient-to-r from-[#5D3699] to-[#5B2CC7] rounded-xl 2xl:rounded-2xl shadow-lg shadow-[#5D3699]/25 hover:shadow-[#5D3699]/45 hover:scale-105 transition-all overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">Mentee Sign Up<span className="group-hover:translate-x-0.5 transition-transform">→</span></span>
                  <span className="absolute inset-0 bg-gradient-to-r from-[#4A2B7A] to-[#5D3699] opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link to="/mentor-register" className="px-7 py-3 text-sm font-bold text-[#5D3699] bg-white border-2 border-[#DDD7ED] rounded-xl hover:border-[#5D3699] hover:bg-[#EDE3FF]/40 hover:scale-105 transition-all shadow-sm">Become a Mentor 🤝</Link>
              </div>

              <p className={`mt-3 2xl:mt-4 text-[11px] 2xl:text-[13px] min-[2200px]:text-[16px] text-[#6B7280] flex items-center justify-center gap-1 ${heroVis?"afi d4":"opacity-0"}`}>
                🔒 Sessions are monitored & recorded for Teen safety.
              </p>

              <div className={`flex items-center justify-center gap-7 2xl:gap-10 min-[2200px]:gap-14 mt-5 2xl:mt-7 ${heroVis?"afi d5":"opacity-0"}`}>
                {[{v:"2400+",l:"Teens",i:"🎓"},{v:"180+",l:"Mentors",i:"👨‍🏫"},{v:"97%",l:"Happy",i:"😊"}].map((s,i)=>(
                  <div key={i} className="text-center group cursor-default">
                    <span className="text-base 2xl:text-2xl min-[2200px]:text-3xl group-hover:scale-125 inline-block transition-transform">{s.i}</span>
                    <p className="text-lg sm:text-xl 2xl:text-3xl min-[2200px]:text-5xl font-extrabold text-[#5D3699]">{s.v}</p>
                    <p className="text-[10px] 2xl:text-sm min-[2200px]:text-base text-[#6B7280] font-medium">{s.l}</p>
                  </div>
                ))}
              </div>

              <div className={`mt-5 flex flex-col items-center gap-1.5 ${heroVis?"afi d6":"opacity-0"}`}>
                <span className="text-[9px] uppercase tracking-[.18em] text-[#6B7280]">scroll to discover</span>
                <span className="w-4 h-7 border-2 border-[#DDD7ED] rounded-full flex items-start justify-center p-0.5"><span className="w-1 h-1 bg-[#5B2CC7] rounded-full animate-bounce" /></span>
              </div>
            </div>

            {/* RIGHT */}
            <div className="hidden lg:flex lg:col-span-3 flex-col items-start gap-3.5 2xl:gap-5 min-[2200px]:gap-6">
              <div className={`${heroVis?"asl d3":"opacity-0"} afs w-full max-w-[235px] 2xl:max-w-[300px] min-[2200px]:max-w-[360px]`}>
                <div className="gl border border-[#DDD7ED]/80 rounded-xl 2xl:rounded-2xl p-3.5 2xl:p-4 min-[2200px]:p-5 shadow-lg shadow-[#5D3699]/10 cs">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" /></span>
                    <span className="text-[9px] 2xl:text-[11px] min-[2200px]:text-[13px] font-bold text-green-600 uppercase tracking-wider">Live Session</span>
                  </div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="relative">
                      <div className="w-8 h-8 2xl:w-10 2xl:h-10 min-[2200px]:w-12 min-[2200px]:h-12 rounded-full bg-gradient-to-br from-[#5B2CC7] to-[#8E61CE] flex items-center justify-center text-white text-[9px] 2xl:text-[11px] min-[2200px]:text-[13px] font-bold">A</div>
                      <div className="absolute -bottom-0.5 -right-1.5 w-8 h-8 2xl:w-10 2xl:h-10 min-[2200px]:w-12 min-[2200px]:h-12 rounded-full bg-gradient-to-br from-[#FDD253] to-[#f5c518] flex items-center justify-center text-[9px] 2xl:text-[11px] min-[2200px]:text-[13px] font-bold border-2 border-white">M</div>
                    </div>
                    <div className="ml-1.5">
                      <p className="text-[11px] font-bold text-[#111827]">Arav × Dr. Iyer</p>
                      <p className="text-[9px] text-[#6B7280]">Physics · 12 min ago</p>
                    </div>
                  </div>
                  <div className="bg-[#F7F4FF] rounded-lg p-2 flex items-center gap-0.5">
                    {Array.from({length:10}).map((_,b) => <div key={b} className="w-[3px] bg-[#5B2CC7] rounded-full animate-pulse" style={{height:`${5+Math.random()*12}px`,animationDelay:`${b*.07}s`}} />)}
                    <span className="text-xs ml-auto">🎙️</span>
                  </div>
                </div>
              </div>

              <div className={`${heroVis?"asl d5":"opacity-0"} af w-full max-w-[235px] 2xl:max-w-[300px] min-[2200px]:max-w-[360px]`}>
                <div className="bg-gradient-to-br from-[#5D3699] to-[#5B2CC7] rounded-xl 2xl:rounded-2xl p-3.5 2xl:p-4 min-[2200px]:p-5 shadow-lg shadow-[#5D3699]/25 text-white cs">
                  <span className="text-xl block mb-1 opacity-40">❝</span>
                  <p className="text-[10px] leading-relaxed font-medium italic opacity-90">"My mentor changed my perspective on board exams completely!"</p>
                  <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-white/20">
                    <div className="w-6 h-6 2xl:w-8 2xl:h-8 min-[2200px]:w-10 min-[2200px]:h-10 rounded-full bg-white/20 flex items-center justify-center text-[9px] 2xl:text-[11px] min-[2200px]:text-[13px] font-bold">P</div>
                    <p className="text-[9px] opacity-75">Priya · Class 12</p>
                  </div>
                </div>
              </div>

              <div className={`${heroVis?"asl d7":"opacity-0"} afr w-full max-w-[235px] 2xl:max-w-[300px] min-[2200px]:max-w-[360px]`}>
                <div className="flex flex-col gap-2">
                  {[{i:"🛡️",t:"100% Safe",b:"bg-green-50 border-green-200"},{i:"🆓",t:"Always Free",b:"bg-[#EDE3FF] border-[#DDD7ED]"},{i:"🤖",t:"AI-Powered",b:"bg-blue-50 border-blue-200"},{i:"🌍",t:"Multi-Language",b:"bg-amber-50 border-amber-200"}].map((x,i)=>(
                    <span key={i} className={`flex items-center gap-2 2xl:gap-2.5 px-3 py-2 2xl:px-4 2xl:py-3 rounded-lg 2xl:rounded-xl border ${x.b} text-[11px] 2xl:text-[13px] min-[2200px]:text-[15px] font-semibold text-[#111827] shadow-sm hover:scale-[1.03] transition-all cursor-default`}>{x.i} {x.t}</span>
                  ))}
                </div>
              </div>

              <div className={`${heroVis?"asl d8":"opacity-0"} w-full max-w-[235px] 2xl:max-w-[300px] min-[2200px]:max-w-[360px]`}>
                <div className="gl border border-[#DDD7ED]/60 rounded-xl 2xl:rounded-2xl p-3 2xl:p-4">
                  <p className="text-[9px] font-bold text-[#5D3699] uppercase tracking-wider mb-1.5">🔥 Trending Topics</p>
                  <div className="flex flex-wrap gap-1 2xl:gap-1.5">{["Board Exams","JEE Prep","NEET","Career","Stress","Study Tips"].map(t=><span key={t} className="px-2 py-0.5 2xl:px-2.5 2xl:py-1 rounded bg-[#EDE3FF] text-[8px] 2xl:text-[10px] min-[2200px]:text-[11px] font-semibold text-[#5D3699]">{t}</span>)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile feature cards */}
          <div className="lg:hidden mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[{i:"🛡️",t:"100% Safe"},{i:"🆓",t:"Always Free"},{i:"🤖",t:"AI-Powered"},{i:"⭐",t:"4.9 Rated"}].map((c,i)=>(
              <div key={i} className="gl border border-[#DDD7ED]/60 rounded-xl p-2.5 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <span className="text-xl block mb-0.5">{c.i}</span>
                <p className="text-[10px] font-bold text-[#5D3699]">{c.t}</p>
              </div>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <div className="bg-gradient-to-r from-[#5D3699] via-[#5B2CC7] to-[#4A2B7A] py-2.5 overflow-hidden">
        <div className="flex am whitespace-nowrap">
          {[...MARQUEE_ITEMS,...MARQUEE_ITEMS,...MARQUEE_ITEMS,...MARQUEE_ITEMS].map((item,i)=>(
            <span key={i} className="flex items-center mx-5 sm:mx-7">
              <span className="text-xs sm:text-sm font-bold tracking-wider text-white/90">{item}</span>
              <span className="ml-5 sm:ml-7 w-1.5 h-1.5 rounded-full bg-[#FDD253]" />
            </span>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-r from-[#4A2B7A] via-[#5D3699] to-[#5B2CC7] py-2 overflow-hidden">
        <div className="flex whitespace-nowrap" style={{animation:"marquee 28s linear infinite reverse"}}>
          {[...MARQUEE_ITEMS,...MARQUEE_ITEMS,...MARQUEE_ITEMS,...MARQUEE_ITEMS].map((item,i)=>(
            <span key={i} className="flex items-center mx-5 sm:mx-7">
              <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-white/50">{item}</span>
              <span className="ml-5 sm:ml-7 w-1 h-1 rounded-full bg-white/25" />
            </span>
          ))}
        </div>
      </div>

      {/* ═══ STATS ═══ */}
      <section ref={statsRef} className="py-8 sm:py-10 bg-gradient-to-b from-[#EDE3FF] to-[#F7F4FF] relative overflow-hidden">
        <Particles />
        <Wrap>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {[{v:c1,s:"+",l:"Teens guided",e:"🎓",g:"from-[#5D3699] to-[#7B4CBC]"},
              {v:c2,s:"+",l:"Verified mentors",e:"✅",g:"from-[#5B2CC7] to-[#8E61CE]"},
              {v:c3,s:"%",l:"Satisfaction rate",e:"💯",g:"from-[#4A2B7A] to-[#5D3699]"},
              {v:c4,s:"+",l:"Sessions held",e:"💬",g:"from-[#7B4CBC] to-[#5B2CC7]"}].map((s,i)=>(
              <div key={i} className={`group relative gl border border-[#DDD7ED]/40 rounded-xl p-4 sm:p-5 text-center hl cs ${statsVis?`asu d${i+1}`:"opacity-0"}`}>
                <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-gradient-to-r ${s.g} opacity-60`} />
                <span className="text-2xl mb-1 block group-hover:scale-125 transition-transform">{s.e}</span>
                <span className="block text-2xl sm:text-3xl font-extrabold tg">{s.v.toLocaleString()}{s.s}</span>
                <span className="block text-[11px] sm:text-xs font-medium text-[#5F6B81] mt-0.5">{s.l}</span>
              </div>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="about" ref={howRef} className="py-10 sm:py-14 bg-[#FAF8FF] relative overflow-hidden">
        <Particles />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5B2CC7]/5 rounded-full blur-3xl" />
        <Wrap>
          <div className={`text-center mb-8 sm:mb-10 ${howVis?"asu":"opacity-0"}`}>
            <span className="inline-block px-3 py-1 rounded-full bg-[#EDE3FF] text-[#5D3699] text-[11px] font-bold uppercase tracking-wider mb-2">How it works</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827]">How Guidance <span className="tg">Flows</span></h2>
            <p className="max-w-lg mx-auto mt-2 text-[#5F6B81] text-sm">Three simple steps to connect with a mentor who understands your journey</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
            {HOW_CARDS.map((c,i)=>(
              <div key={i} className={`group relative bg-white border border-[#DDD7ED]/40 rounded-2xl p-5 sm:p-6 hl cs ${howVis?`asu d${(i+1)*2}`:"opacity-0"}`}>
                <div className={`absolute top-0 left-5 right-5 h-[3px] rounded-b-full bg-gradient-to-r ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                  <span className="text-2xl">{c.icon}</span>
                </div>
                <span className="text-[11px] font-bold text-[#8E61CE] tracking-wider">{c.num}</span>
                <h3 className="text-lg font-bold text-[#111827] mt-0.5 mb-1">{c.title}</h3>
                <p className="text-[13px] text-[#5F6B81] leading-relaxed">{c.desc}</p>
                {i<2 && <div className="hidden sm:block absolute top-1/2 -right-2 w-4 border-t-2 border-dashed border-[#DDD7ED]" />}
              </div>
            ))}
          </div>
          <div className="sm:hidden flex justify-center mt-5">
            <Link to="/register" className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#5D3699] to-[#5B2CC7] rounded-xl shadow-md hover:scale-105 transition-all">Get Started Now →</Link>
          </div>
        </Wrap>
      </section>

      {/* ═══ SAFETY / TRUST ═══ */}
      <section id="safety" ref={trustRef} className="py-10 sm:py-14 bg-gradient-to-b from-[#F7F4FF] to-[#EDE3FF] relative overflow-hidden">
        <Particles />
        <Wrap>
          <div className={`text-center mb-7 sm:mb-10 ${trustVis?"asu":"opacity-0"}`}>
            <span className="inline-block px-3 py-1 rounded-full gl border border-[#DDD7ED] text-[#5D3699] text-[11px] font-bold uppercase tracking-wider mb-2">🛡️ Safety first</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827]">Built on <span className="tg">Trust</span></h2>
          </div>

          <div className={`max-w-3xl mx-auto mb-7 sm:mb-10 ${trustVis?"asu d1":"opacity-0"}`}>
            <div className="relative bg-gradient-to-br from-[#5D3699] via-[#5B2CC7] to-[#4A2B7A] rounded-2xl p-6 sm:p-8 text-center shadow-2xl shadow-[#5D3699]/20 overflow-hidden agr">
              <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <span className="text-4xl mb-3 block  text-white">❝</span>
              <p className="text-base sm:text-lg font-medium text-white/95 leading-relaxed italic max-w-xl mx-auto">"Every interaction is designed to be safe, respectful, and deeply human."</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-6">
                <Link to="/register" className="px-6 py-2.5 rounded-lg bg-white text-[#5D3699] text-sm font-bold hover:scale-105 transition-all shadow-md flex items-center gap-1.5">Mentee Sign Up →</Link>
                <a href="#safety" className="px-5 py-2.5 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all border border-white/20">Learn about safety</a>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TRUST_ITEMS.map((t,i)=>(
              <div key={i} className={`group bg-gradient-to-br ${t.gradient} border ${t.border} rounded-xl p-4 sm:p-5 hl cs ${trustVis?`asu d${i+2}`:"opacity-0"}`}>
                <div className="w-11 h-11 rounded-xl bg-white/80 flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <span className="text-2xl">{t.icon}</span>
                </div>
                <h4 className="font-bold text-[#111827] mb-1 text-[15px]">{t.title}</h4>
                <p className="text-[13px] text-[#5F6B81] leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ═══ Teen VOICES ═══ */}
      <section id="stories" ref={voicesRef} className="py-10 sm:py-14 bg-[#FAF8FF] relative overflow-hidden">
        <Particles />
        <Wrap>
          <div className={`text-center mb-7 sm:mb-10 ${voicesVis?"asu":"opacity-0"}`}>
            <span className="inline-block px-3 py-1 rounded-full bg-[#EDE3FF] text-[#5D3699] text-[11px] font-bold uppercase tracking-wider mb-2">💬 Teen voices</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827]">Stories That <span className="tg">Matter</span></h2>
            <p className="max-w-lg mx-auto mt-2 text-[#5F6B81] text-sm">Real stories from real Teens whose lives were touched by Bond Room mentors</p>
          </div>

          <div className="hidden sm:grid sm:grid-cols-3 gap-3 sm:gap-4">
            {STORIES.map((s,i)=>(
              <div key={i} className={`group relative bg-white border border-[#DDD7ED]/40 rounded-2xl p-5 sm:p-6 hl cs ${voicesVis?`asu d${(i+1)*2}`:"opacity-0"}`}>
                <div className="absolute top-4 right-4 text-4xl opacity-[.07] group-hover:opacity-[.14] transition-opacity">❝</div>
                <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">{s.emoji}</span>
                <p className="text-[14px] text-[#111827] leading-relaxed font-medium italic mb-4">"{s.quote}"</p>
                <div className="flex items-center gap-2.5 pt-3 border-t border-[#EDE3FF]">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5D3699] to-[#8E61CE] flex items-center justify-center text-white text-xs font-bold shadow">{s.name[0]}</div>
                  <div><p className="text-[13px] font-bold text-[#111827]">{s.name}</p><p className="text-[11px] text-[#6B7280]">{s.meta}</p></div>
                  <div className="ml-auto flex gap-px">{[1,2,3,4,5].map(n=><span key={n} className="text-[10px]">⭐</span>)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile carousel */}
          <div className="sm:hidden">
            <div className={`bg-white border border-[#DDD7ED]/40 rounded-2xl p-5 ${voicesVis?"asu d2":"opacity-0"}`}>
              <span className="text-3xl mb-3 block">{STORIES[activeStory].emoji}</span>
              <p className="text-[14px] text-[#111827] leading-relaxed font-medium italic mb-4 min-h-[70px]">"{STORIES[activeStory].quote}"</p>
              <div className="flex items-center gap-2.5 pt-3 border-t border-[#EDE3FF]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5D3699] to-[#8E61CE] flex items-center justify-center text-white text-xs font-bold">{STORIES[activeStory].name[0]}</div>
                <div><p className="text-[13px] font-bold text-[#111827]">{STORIES[activeStory].name}</p><p className="text-[11px] text-[#6B7280]">{STORIES[activeStory].meta}</p></div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-3">{STORIES.map((_,i)=><button key={i} onClick={()=>setActiveStory(i)} className={`h-2 rounded-full transition-all ${i===activeStory?"bg-[#5D3699] w-6":"bg-[#DDD7ED] w-2"}`} />)}</div>
          </div>
        </Wrap>
      </section>

      {/* ═══ MENTORS ═══ */}
      <section id="volunteer" ref={mentorSecRef} className="py-10 sm:py-14 bg-gradient-to-b from-[#EDE3FF] to-[#F7F4FF] relative overflow-hidden">
        <Particles />
        <Wrap>
          <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between mb-7 sm:mb-10 gap-3 ${mentorSecVis?"asu":"opacity-0"}`}>
            <div>
              <span className="inline-block px-3 py-1 rounded-full gl border border-[#DDD7ED] text-[#5D3699] text-[11px] font-bold uppercase tracking-wider mb-2">Our mentors</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827]">Wisdom You Can <span className="tg">See</span></h2>
              <p className="mt-1 text-[#5F6B81] text-sm max-w-md">Click on any mentor to learn more about their background and expertise</p>
            </div>
            <a href="#volunteer" className="text-sm font-bold text-[#5D3699] hover:text-[#4A2B7A] flex items-center gap-1 group px-3 py-1.5 rounded-lg hover:bg-[#EDE3FF] transition-all">Meet all <span className="group-hover:translate-x-0.5 transition-transform">→</span></a>
          </div>

          {mentorCards.length===0 ? (
            <div className="text-center py-12 text-[#6B7280]">No mentors available from API right now.</div>
          ) : (
            <div className={mentorSecVis ? "asu d1" : "opacity-0"}>
              <MentorRingCarousel items={mentorCards} onSelectMentor={setSelectedMentor} />
            </div>
          )}
        </Wrap>
      </section>

      {/* Mentor Popup */}
      {selectedMentor && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3">
          <div className="absolute inset-0 bg-[#4A2B7A]/50 backdrop-blur-sm" onClick={()=>setSelectedMentor(null)} />
          <div className="relative bg-white rounded-2xl max-w-[420px] w-full max-h-[88vh] overflow-y-auto shadow-2xl asc">
            <div
              className="h-24 rounded-t-2xl relative overflow-hidden"
              style={selectedMentor.image
                ? {
                    backgroundImage: `linear-gradient(135deg, rgba(74,43,122,0.72), rgba(123,76,188,0.52)), url(${selectedMentor.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : { background: `linear-gradient(135deg,${selectedMentor.color || "#5D3699"},${(selectedMentor.color || "#5D3699")}99)` }}
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <button onClick={()=>setSelectedMentor(null)} className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition text-sm">✕</button>
              <div className="absolute -bottom-7 left-5">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-xl border-[3px] border-white overflow-hidden bg-white" style={{background:selectedMentor.image ? "#fff" : `linear-gradient(135deg,${selectedMentor.color || "#5D3699"},${(selectedMentor.color || "#5D3699")}cc)`}}>
                  {selectedMentor.image ? (
                    <img
                      src={selectedMentor.image}
                      alt={selectedMentor.name}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        if (event.currentTarget.src !== avatarFallback) {
                          event.currentTarget.src = avatarFallback;
                        }
                      }}
                    />
                  ) : (selectedMentor.avatar || "M")}
                </div>
              </div>
            </div>
            <div className="pt-10 px-5 pb-5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#EDE3FF] text-[#5D3699] text-[9px] font-bold uppercase tracking-wider mb-1.5">Mentor Profile</span>
              <h3 className="text-lg font-bold text-[#111827]">{selectedMentor.name}</h3>
              <p className="text-[13px] text-[#6B7280]">{selectedMentor.role||"Mentor"}</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">📍 {selectedMentor.city} • 🎓 {selectedMentor.qualification}</p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[{v:selectedMentor.rating||"New",l:"Rating"},{v:(selectedMentor.languages || []).length,l:"Languages"},{v:(selectedMentor.tags || []).length,l:"Specialties"}].map((x,i)=>(
                  <div key={i} className="bg-[#F7F4FF] rounded-lg p-2.5 text-center"><p className="text-base font-bold text-[#5D3699]">{x.v}</p><p className="text-[9px] text-[#6B7280] font-medium">{x.l}</p></div>
                ))}
              </div>
              <div className="mt-4"><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Expertise</p><div className="flex flex-wrap gap-1.5">{(selectedMentor.tags || []).map(tag=><span key={tag} className="px-2.5 py-1 rounded-full bg-[#EDE3FF] text-[#5D3699] text-[11px] font-semibold">{tag}</span>)}</div></div>
              <div className="mt-3"><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Languages</p><p className="text-[13px] text-[#5F6B81]">{(selectedMentor.languages || []).join(" · ")}</p></div>
              <div className="flex gap-2.5 mt-5">
                <button onClick={()=>setSelectedMentor(null)} className="w-full px-3 py-2.5 rounded-lg border-2 border-[#DDD7ED] text-[13px] font-bold text-[#5F6B81] hover:border-[#5D3699] hover:text-[#5D3699] transition-all">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ WHY BOND ROOM ═══ */}
      <section ref={whyRef} className="py-10 sm:py-14 bg-[#FAF8FF] relative overflow-hidden">
        <Particles />
        <Wrap>
          <div className={`text-center mb-7 sm:mb-10 ${whyVis?"asu":"opacity-0"}`}>
            <span className="inline-block px-3 py-1 rounded-full bg-[#EDE3FF] text-[#5D3699] text-[11px] font-bold uppercase tracking-wider mb-2">Why choose us</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827]">More Than Just <span className="tg">Mentoring</span></h2>
            <p className="max-w-lg mx-auto mt-2 text-[#5F6B81] text-sm">Bond Room bridges the generation gap, connecting Teens with experienced mentors who truly understand.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[{i:"🎯",t:"Goal-Oriented Sessions",d:"Every session is designed with clear outcomes to help Teens progress meaningfully.",g:"from-orange-50 to-amber-50",b:"border-orange-200/50"},
              {i:"🌍",t:"Multi-Language Support",d:"Speak in your comfort language — we match mentors who speak your mother tongue.",g:"from-blue-50 to-cyan-50",b:"border-blue-200/50"},
              {i:"📱",t:"Easy Mobile Access",d:"Access from any device, anywhere. Our platform is optimized for Teens on the go.",g:"from-violet-50 to-purple-50",b:"border-violet-200/50"},
              {i:"🤝",t:"100% Free for Teens",d:"Every session is completely free. Education guidance should never have a price tag.",g:"from-green-50 to-emerald-50",b:"border-green-200/50"},
              {i:"📊",t:"Progress Tracking",d:"Track your growth journey with session summaries and personal development insights.",g:"from-pink-50 to-rose-50",b:"border-pink-200/50"},
              {i:"💡",t:"Real-World Wisdom",d:"Learn from people who've lived through similar challenges and came out stronger.",g:"from-[#F7F4FF] to-[#EDE3FF]",b:"border-[#DDD7ED]/50"},
            ].map((item,i)=>(
              <div key={i} className={`group bg-gradient-to-br ${item.g} border ${item.b} rounded-xl p-4 sm:p-5 hl cs ${whyVis?`asu d${((i%3)+1)}`:"opacity-0"}`}>
                <div className="w-11 h-11 rounded-xl bg-white/80 flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <span className="text-2xl">{item.i}</span>
                </div>
                <h4 className="font-bold text-[#111827] mb-1 text-[15px]">{item.t}</h4>
                <p className="text-[13px] text-[#5F6B81] leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ═══ FAQ ═══ */}
      <section ref={faqRef} className="py-10 sm:py-14 bg-gradient-to-b from-[#F7F4FF] to-[#EDE3FF] relative overflow-hidden">
        <Particles />
        <div className="max-w-[720px] mx-auto px-4 sm:px-6">
          <div className={`text-center mb-7 sm:mb-10 ${faqVis?"asu":"opacity-0"}`}>
            <span className="inline-block px-3 py-1 rounded-full gl border border-[#DDD7ED] text-[#5D3699] text-[11px] font-bold uppercase tracking-wider mb-2">❓ Got questions?</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827]">Frequently <span className="tg">Asked</span></h2>
          </div>
          <div className="space-y-2">
            {[
              {q:"Is Bond Room really free for Teens?",a:"Yes! 100% free. Our mentors volunteer their time because they believe in giving back to the next generation."},
              {q:"How are mentors verified?",a:"Every mentor undergoes background checks, identity verification, and training before they can join the platform."},
              {q:"Are sessions safe and private?",a:"Absolutely. All sessions are monitored using AI keyword detection and recorded for safety."},
              {q:"Can I choose my own mentor?",a:"Our AI suggests the best match, but you can also browse mentor profiles and request a specific mentor."},
              {q:"What age group is this for?",a:"Bond Room is designed for Teens aged 14-19 (typically 10th to 12th grade and early college Teens)."},
              {q:"How long are the sessions?",a:"Sessions typically last 30-45 minutes, but can be shorter or longer based on the Teen's needs."},
            ].map((f,i)=>(<FaqItem key={i} question={f.q} answer={f.a} index={i} visible={faqVis} />))}
          </div>
        </div>
      </section>

      {/* ═══ EDITORIAL CTA ═══ */}
      <section ref={ctaRef} className="py-10 sm:py-14 bg-[#FAF8FF] relative overflow-hidden">
        <Particles />
        <div className="absolute top-6 left-6 w-16 h-16 bg-[#FDD253]/20 rounded-full blur-lg af" />
        <div className="absolute bottom-6 right-6 w-14 h-14 bg-[#5B2CC7]/10 rounded-lg rotate-45 blur-md afs" />
        <Wrap className={ctaVis?"asu":"opacity-0"}>
          <div className="relative bg-gradient-to-br from-[#5D3699] via-[#5B2CC7] to-[#4A2B7A] rounded-2xl p-7 sm:p-10 text-center shadow-2xl shadow-[#5D3699]/25 overflow-hidden agr">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#FDD253]/5 rounded-full translate-y-1/2 -translate-x-1/3" />
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold uppercase tracking-wider mb-4 border border-white/15">🚀 Ready?</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.1] text-white">
              Let's tell your<br /><span className="text-[#FDD253]">next success</span><br />story.
            </h2>
            <p className="max-w-md mx-auto mt-3 text-white/65 text-sm">Join thousands of Teens already growing with Bond Room mentors</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-7">
              <Link to="/register" className="group px-7 py-3 text-sm font-bold text-[#5D3699] bg-white rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-1.5">Mentee Sign Up 🎓 <span className="group-hover:translate-x-0.5 transition-transform">→</span></Link>
              <Link to="/mentor-register" className="px-7 py-3 text-sm font-bold text-white bg-white/10 border-2 border-white/25 rounded-xl hover:bg-white/20 hover:scale-105 transition-all">Become a Mentor 🤝</Link>
            </div>
            <div className="flex items-center justify-center gap-5 mt-6 text-white/45 text-[11px]">
              {["Free forever","No credit card","Start in 2 min"].map((t,i)=>(
                <span key={i} className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#FDD253]" />{t}</span>
              ))}
            </div>
          </div>
        </Wrap>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-gradient-to-b from-[#5D3699] to-[#3D1F6D] text-white relative overflow-hidden">
        <svg className="absolute -top-px left-0 w-full" viewBox="0 0 1440 48" fill="none" preserveAspectRatio="none">
          <path d="M0 48L48 40C96 32 192 16 288 13.3C384 10.7 480 21.3 576 24C672 26.7 768 21.3 864 18.7C960 16 1056 16 1152 18.7C1248 21.3 1344 26.7 1392 29.3L1440 32V0H0V48Z" fill="#FAF8FF" />
        </svg>
        <div className="absolute top-16 right-8 w-36 h-36 bg-white/[.02] rounded-full blur-2xl" />
        <Wrap className="relative pt-16 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-8">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <img src={logo} alt="Bond Room" className="h-9 w-auto object-contain" />
                <span className="text-lg font-extrabold">Bond Room</span>
              </div>
              <p className="text-[13px] text-white/55 leading-relaxed mb-4">Bridging Old and New Destinies — A safe mentoring platform connecting Teens with experienced mentors who genuinely care.</p>
              <div className="flex items-center gap-3">
                <a href="https://www.instagram.com/bondroomofficial" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[13px] text-white/70 hover:text-white transition">
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" />
                    </svg>
                  </span>
                  <span>bondroomofficial</span>
                </a>
                <a href="https://www.linkedin.com/in/bond-room-374aaa393/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[13px] text-white/70 hover:text-white transition">
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 8.98h4v12H3v-12Zm7 0h3.8v1.64h.06c.53-1 1.83-2.06 3.76-2.06 4.02 0 4.76 2.65 4.76 6.1v6.32h-4v-5.61c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.97v5.7h-4v-12Z" />
                    </svg>
                  </span>
                  <span>Bond Room</span>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/35 mb-2">Platform</p>
                <div className="flex flex-col gap-1.5">{["About","Volunteer","Safety","Stories"].map(l=><a key={l} href={`#${l.toLowerCase()}`} className="text-[13px] text-white/65 hover:text-white transition">{l}</a>)}</div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/35 mb-2">Support</p>
                <div className="flex flex-col gap-1.5">
                  {donateEnabled && <Link to="/donate" className="text-[13px] text-white/65 hover:text-white transition">Donate</Link>}
                  {["Help","Terms","Privacy"].map(l=><a key={l} href="#" className="text-[13px] text-white/65 hover:text-white transition">{l}</a>)}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/35 mb-2">Resources</p>
                <div className="flex flex-col gap-1.5">{["Blog","Guides","Events","Newsletter"].map(l=><a key={l} href="#" className="text-[13px] text-white/65 hover:text-white transition">{l}</a>)}</div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/35 mb-2">Get Started</p>
                <div className="flex flex-col gap-2">
                  <Link to="/register" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 text-[13px] font-semibold text-white hover:bg-white/20 transition border border-white/10 w-fit">Mentee Sign Up 🎓</Link>
                  <Link to="/mentor-register" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 text-[13px] font-semibold text-white hover:bg-white/20 transition border border-white/10 w-fit">Become Mentor 🤝</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-white/35">
            <p>© 2026 Bond Room Platform. All rights reserved.</p>
            <p className="flex items-center gap-1">🔒 Sessions monitored for safety.</p>
          </div>
        </Wrap>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer, index, visible }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`gl border border-[#DDD7ED]/40 rounded-xl overflow-hidden hl ${visible?`asu d${index+1}`:"opacity-0"}`}>
      <button onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between gap-3 p-4 text-left">
        <span className="text-[13px] sm:text-[14px] font-semibold text-[#111827]">{question}</span>
        <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-300 ${open?"bg-[#5D3699] text-white rotate-45 shadow-md shadow-[#5D3699]/20":"bg-[#EDE3FF] text-[#5D3699]"}`}>+</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open?"max-h-40":"max-h-0"}`}>
        <p className="px-4 pb-4 text-[13px] text-[#5F6B81] leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}


