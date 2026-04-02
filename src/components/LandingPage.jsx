import { useEffect, useState, useRef } from 'react';
import {
  motion, AnimatePresence,
  useScroll, useTransform,
} from 'framer-motion';
import logo       from './assets/Logo.svg';
import heroLeft   from './assets/left.png';
import heroRight  from './assets/right.png';
import avatarOne  from './assets/avatar-1.jpg';
import students   from './assets/teach2.png';
import {
  ShieldCheck, Users, Bot, Smile,
  Twitter, Linkedin, LockKeyhole,
  Ear, Brain, Handshake, ArrowUpRight,
} from 'lucide-react';
import { menteeApi } from '../apis/api/menteeApi';
import { settingsApi } from '../apis/api/settingsApi';
import './LandingPage.css';

/* ══════════════════════════════════════════
   CURSOR  —  dot + ring + canvas trail
   The canvas is rendered at document level
   (position:fixed, pointer-events:none)
   and the trail is drawn every rAF tick.
══════════════════════════════════════════ */
const Cursor = () => {
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const head = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const prev = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const speed = useRef(0);
  const ring = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const dotEl = useRef(null);
  const ringEl = useRef(null);
  const cvs = useRef(null);
  const pts = useRef([]);
  const raf = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('has-custom-cursor');

    const cv = cvs.current;
    const ctx = cv.getContext('2d');
    const setSize = () => {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);

    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const TRAIL_LEN = 22;

    const tick = () => {
      const mx = mouse.current.x;
      const my = mouse.current.y;

      // Smooth head for clean short trail, but still responsive.
      head.current.x += (mx - head.current.x) * 0.42;
      head.current.y += (my - head.current.y) * 0.42;

      const vx = head.current.x - prev.current.x;
      const vy = head.current.y - prev.current.y;
      const instantSpeed = Math.hypot(vx, vy);
      speed.current += (instantSpeed - speed.current) * 0.3;
      prev.current.x = head.current.x;
      prev.current.y = head.current.y;

      if (dotEl.current) {
        dotEl.current.style.left = head.current.x + 'px';
        dotEl.current.style.top = head.current.y + 'px';
        dotEl.current.style.setProperty('--dot-scale', (1 + Math.min(speed.current / 70, 0.26)).toFixed(3));
      }

      ring.current.x += (head.current.x - ring.current.x) * 0.24;
      ring.current.y += (head.current.y - ring.current.y) * 0.24;
      if (ringEl.current) {
        ringEl.current.style.left = ring.current.x + 'px';
        ringEl.current.style.top = ring.current.y + 'px';
        ringEl.current.style.setProperty('--ring-scale', (1 + Math.min(speed.current / 55, 0.34)).toFixed(3));
      }

      pts.current.push({ x: head.current.x, y: head.current.y });
      if (pts.current.length > TRAIL_LEN) pts.current.shift();

      ctx.clearRect(0, 0, cv.width, cv.height);

      if (pts.current.length > 2) {
        const smooth = pts.current;

        for (let i = 1; i < smooth.length; i++) {
          const t = i / (smooth.length - 1);
          const alpha = 0.04 + t * 0.72;
          const width = 0.8 + t * (2 + Math.min(speed.current / 8, 2));
          const p0 = smooth[i - 1];
          const p1 = smooth[i];

          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.strokeStyle = `rgba(112,72,207,${alpha})`;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }

        const tip = smooth[smooth.length - 1];
        const tipGlow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 18);
        tipGlow.addColorStop(0, 'rgba(164,124,242,0.58)');
        tipGlow.addColorStop(1, 'rgba(112,72,207,0)');
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = tipGlow;
        ctx.fill();

        // Creative touch: a short comet streak appears on faster movement.
        if (speed.current > 0.8) {
          const norm = Math.max(0.001, Math.hypot(vx, vy));
          const nx = vx / norm;
          const ny = vy / norm;
          const streakLen = Math.min(26, speed.current * 3.1);
          ctx.beginPath();
          ctx.moveTo(tip.x, tip.y);
          ctx.lineTo(tip.x - nx * streakLen, tip.y - ny * streakLen);
          ctx.strokeStyle = `rgba(184,152,246,${Math.min(0.8, 0.18 + speed.current / 22)})`;
          ctx.lineWidth = 1.2 + Math.min(2.8, speed.current / 5);
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', setSize);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, []);

  return (
    <>
      <canvas ref={cvs} className="cr-canvas" />
      <div ref={dotEl} className="cr-dot" />
      <div ref={ringEl} className="cr-ring" />
    </>
  );
};

/* ══════════════════════════════════════════
   ANIMATED COUNTER
══════════════════════════════════════════ */
const Count = ({ to, suffix = '' }) => {
  const [n, setN] = useState(0);
  const el        = useRef(null);
  const done      = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done.current) return;
      done.current = true;
      let v = 0;
      const step = Math.ceil(to / 55);
      const id = setInterval(() => {
        v = Math.min(v + step, to);
        setN(v);
        if (v >= to) clearInterval(id);
      }, 18);
    }, { threshold: 0.5 });
    if (el.current) obs.observe(el.current);
    return () => obs.disconnect();
  }, [to]);

  return <span ref={el}>{n}{suffix}</span>;
};

/* ══════════════════════════════════════════
   WORD-REVEAL  (no overflow:hidden on parent —
   that was clipping descenders like "y","g" etc.)
   We clip each word individually with a mask.
══════════════════════════════════════════ */
const SplitWords = ({ text, className = '', delay = 0, animate = true }) => (
  <span className={className} style={{ display: 'inline' }}>
    {text.split(' ').map((w, i) => (
      /* IMPORTANT: padding-bottom gives room for descenders before the clip */
      <span key={i} style={{
        display: 'inline-block',
        overflow: 'hidden',
        verticalAlign: 'bottom',
        paddingBottom: '0.15em',  /* ← room for "y","g","p" descenders */
        marginRight: '0.22em',
      }}>
        <motion.span
          style={{ display: 'inline-block', paddingBottom: '0.05em' }}
          initial={animate ? { y: '115%' } : { y: 0 }}
          whileInView={animate ? { y: 0 } : undefined}
          animate={!animate ? { y: 0 } : undefined}
          viewport={animate ? { once: true } : undefined}
          transition={animate ? { duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.08 } : undefined}
        >
          {w}
        </motion.span>
      </span>
    ))}
  </span>
);

/* ══════════════════════════════════════════
   HERO WORD  (single inline word reveal,
   with extra descender padding so letters
   like "b","y","G" show fully)
══════════════════════════════════════════ */
const HeroWord = ({ children, className = '', delay = 0 }) => (
  <span style={{
    display: 'inline-block',
    overflow: 'hidden',
    /* extra vertical room so the descender / ascender isn't eaten */
    paddingBottom: '0.12em',
    paddingTop: '0.06em',
    verticalAlign: 'bottom',
  }}>
    <motion.span
      className={className}
      style={{ display: 'inline-block' }}
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.span>
  </span>
);

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
const stories = [
  { quote: "I was so stressed about my board exams. Mr. Sharma helped me calm down — he didn't just give advice, he listened.", name: 'Arav',  meta: 'Student · 17', avatar: avatarOne },
  { quote: 'I felt lost choosing a career path. My mentor shared her journey of confusion and success, which gave me so much hope.', name: 'Priya', meta: 'Student · 19', avatar: students, cls: 'lp-av-left' },
  { quote: "It's different from talking to parents. My mentor feels like a wise friend who doesn't judge my mistakes.", name: 'Rohan', meta: 'Student · 16', avatar: students, cls: 'lp-av-right' },
];

const trustItems = [
  { Icon: ShieldCheck, title: 'Safe & Monitored',  body: 'Strict protocols — keyword monitoring and session recording keep every student safe.' },
  { Icon: Users,       title: 'Mentors 50+',        body: 'Vetted professionals, retirees, and parents who genuinely care about young minds.' },
  { Icon: Bot,         title: 'AI Matching',         body: 'Algorithm weighs academic needs, emotions, and language for the perfect pairing.' },
  { Icon: Smile,       title: 'Student-Friendly',    body: 'No complex onboarding — sign up, match, and start talking in minutes.' },
];

const howItems = [
  { Icon: Ear,       n: '01', title: 'Listen',    body: 'Students share concerns in a private, judgment-free space.' },
  { Icon: Brain,     n: '02', title: 'Understand', body: 'Intelligent matching finds the mentor who truly relates.' },
  { Icon: Handshake, n: '03', title: 'Guide',      body: 'Meaningful 1-on-1 free sessions that provide perspective and direction.' },
];

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.mentors)) return payload.mentors;
  return [];
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const resolveMediaUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) {
    const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return base ? `${base}${value}` : value;
  }
  return value;
};

const toLandingMentorCard = (mentor) => {
  const source = mentor?.mentor && typeof mentor.mentor === 'object' ? mentor.mentor : mentor;
  const name = `${source?.first_name || ''} ${source?.last_name || ''}`.trim() || `Mentor #${source?.id || ''}`;
  const tags = Array.isArray(source?.care_areas) ? source.care_areas.slice(0, 2) : [];
  const languages = Array.isArray(source?.languages) ? source.languages.filter(Boolean) : [];
  const bio = String(source?.bio || '').trim();
  const rating = Number(source?.average_rating || 0);
  const ratingText = Number.isFinite(rating) && rating > 0 ? `${rating.toFixed(1)} rated` : 'Verified mentor';

  return {
    id: source?.id,
    image: resolveMediaUrl(source?.profile_photo || source?.avatar || ''),
    name,
    role: source?.qualification || source?.city_state || 'Mentor',
    tags,
    copy:
      bio ||
      `Speaks ${languages.slice(0, 2).join(', ') || 'multiple languages'} and supports ${tags.join(' and ') || 'student growth'}.`,
    city: source?.city_state || '',
    qualification: source?.qualification || '',
    languages,
    rating: Number.isFinite(rating) ? rating : 0,
    ratingText,
  };
};

/* shared motion variants */
const fadeUp = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};
const staggerWrap = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const lineGrow = {
  hidden:  { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] } },
};

const HeroDepthScene = ({ parallax }) => {
  const stageRef = useRef(null);
  const [tilt, setTilt] = useState({ x: -8, y: 12 });
  const [glow, setGlow] = useState({ x: 52, y: 40 });

  const handleMove = (event) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: Number((-py * 14).toFixed(2)),
      y: Number((px * 20).toFixed(2)),
    });
    setGlow({
      x: Math.max(0, Math.min(100, (px + 0.5) * 100)),
      y: Math.max(0, Math.min(100, (py + 0.5) * 100)),
    });
  };

  const resetTilt = () => {
    setTilt({ x: -8, y: 12 });
    setGlow({ x: 52, y: 40 });
  };

  return (
    <motion.div className="lp-3d-wrap" style={{ y: parallax }}>
      <div className="lp-3d-glow" style={{ left: `${glow.x}%`, top: `${glow.y}%` }} />

      <div
        ref={stageRef}
        className="lp-3d-stage"
        style={{ '--rx': `${tilt.x}deg`, '--ry': `${tilt.y}deg` }}
        onMouseMove={handleMove}
        onMouseLeave={resetTilt}
        >
            <motion.div
              className="lp-3d-holo-core"
              style={{ z: 92 }}
              animate={{ y: [0, -10, 0], rotateY: [0, 360] }}
              transition={{
                y: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
                rotateY: { duration: 20, repeat: Infinity, ease: 'linear' },
              }}
            >
              <img src={logo} alt="Bond Room" className="lp-3d-holo-logo" />
            </motion.div>

            <motion.div
              className="lp-3d-holo-halo"
              style={{ z: 72 }}
              animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.42, 0.86, 0.42], rotate: [0, 360] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            />

            <motion.div
              className="lp-3d-holo-chip"
              style={{ z: 64 }}
              animate={{ y: [0, -7, 0], rotateZ: [-4, -1, -4] }}
              transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Users size={14} />
              <span>24x7 Guidance</span>
            </motion.div>

          <motion.div
            className="lp-3d-holo-panel lp-3d-holo-panel-a"
            style={{ z: 58 }}
            animate={{ y: [0, -9, 0], rotateZ: [-8, -4, -8] }}
            transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Bot size={18} />
            <div>
              <strong>AI Match</strong>
              <span>Right mentor, right moment</span>
            </div>
          </motion.div>

          <motion.div
            className="lp-3d-holo-panel lp-3d-holo-panel-b"
            style={{ z: 52 }}
            animate={{ y: [0, -12, 0], rotateZ: [9, 4, 9] }}
            transition={{ duration: 6.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ShieldCheck size={18} />
            <div>
              <strong>Safe Sessions</strong>
              <span>Monitored and trusted</span>
            </div>
          </motion.div>

          <motion.div
            className="lp-3d-ring lp-3d-ring-one"
            animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="49" fill="none" />
          </svg>
        </motion.div>
        <motion.div
          className="lp-3d-ring lp-3d-ring-two"
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="49" fill="none" />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
};

const MentorRingCarousel = ({ items, onSelectMentor }) => {
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  const hoverRef = useRef(false);
  const dragRef = useRef(false);
  const draggedRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const lastPointerXRef = useRef(0);
  const phaseRef = useRef(0);
  const speedRef = useRef(0.17);
  const targetSpeedRef = useRef(0.17);

  const BASE_SPEED = 0.17;
  const HOVER_SPEED = 0.35;
  const DRAG_PHASE_MULTIPLIER = 0.0033;
  const DRAG_MOMENTUM_MULTIPLIER = 0.0019;
  const DRAG_CLICK_THRESHOLD = 8;

  const applyArcLayout = () => {
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
      card.style.filter = blur > 0 ? `blur(${blur}px)` : 'none';
      card.style.zIndex = `${Math.round(900 - abs * 100)}`;
    });
  };

  useEffect(() => {
    applyArcLayout();

    const tick = (ts) => {
      if (lastTsRef.current === null) {
        lastTsRef.current = ts;
      }

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
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      lastTsRef.current = null;
    };
  }, [items.length]);

  useEffect(() => {
    const onResize = () => applyArcLayout();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [items.length]);

  const handleStageEnter = () => {
    hoverRef.current = true;
    if (!dragRef.current) {
      targetSpeedRef.current = HOVER_SPEED;
    }
  };

  const handleStageLeave = () => {
    hoverRef.current = false;
    if (!dragRef.current) {
      targetSpeedRef.current = BASE_SPEED;
    }
  };

  const handlePointerDown = (event) => {
    dragRef.current = true;
    draggedRef.current = false;
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
    if (dragDistanceRef.current > DRAG_CLICK_THRESHOLD) {
      draggedRef.current = true;
    }

    phaseRef.current = (phaseRef.current - dx * DRAG_PHASE_MULTIPLIER + items.length) % items.length;
    speedRef.current = -dx * DRAG_MOMENTUM_MULTIPLIER;
    applyArcLayout();
  };

  const handlePointerEnd = (event) => {
    if (!dragRef.current) return;

    dragRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    targetSpeedRef.current = hoverRef.current ? HOVER_SPEED : BASE_SPEED;
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  };

  const handleCardPointerUp = (event, item) => {
    event.stopPropagation();
    if (dragDistanceRef.current > DRAG_CLICK_THRESHOLD) return;
    if (typeof onSelectMentor === 'function') {
      onSelectMentor(item);
    }
  };

  const handleViewDetails = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = false;
    draggedRef.current = false;
    dragDistanceRef.current = 0;
    if (typeof onSelectMentor === 'function') {
      onSelectMentor(item);
    }
  };

  return (
    <div className="lp-arc-shell">
      <div
        ref={stageRef}
        className="lp-arc-stage"
        onMouseEnter={handleStageEnter}
        onMouseLeave={handleStageLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div className="lp-arc-track">
          {items.map((item, index) => {
            const { image, name, role } = item;
            return (
              <div
                key={`${name}-${index}`}
                className="lp-arc-card"
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                onPointerUp={(event) => handleCardPointerUp(event, item)}
              >
                <div className="lp-arc-card-inner">
                  <img src={image} alt={name} className="lp-arc-img" draggable={false} />
                  <div className="lp-arc-overlay" />
                  <div className="lp-arc-info">
                    <strong>{name}</strong>
                    <span>{role}</span>
                    <button
                      type="button"
                      className="lp-arc-action"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onPointerUp={(event) => handleViewDetails(event, item)}
                      onClick={(event) => handleViewDetails(event, item)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function LandingPage() {
  const [menuOpen, setMenuOpen]       = useState(false);
  const [activeStory, setActiveStory] = useState(0);
  const [mentorCards, setMentorCards] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [donateLinkEnabled, setDonateLinkEnabled] = useState(false);
  const { scrollY } = useScroll();
  const parallax    = useTransform(scrollY, [0, 600], [0, -50]);
  const navLinks = [['/about', 'About'], ['/volunteer', 'Volunteer'], ['#safety', 'Safety'], ['#stories', 'Stories']];

  useEffect(() => {
    const id = setInterval(() => setActiveStory(s => (s + 1) % stories.length), 4200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.style.background = '#f7f4ff';
    return () => { document.body.style.background = ''; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadDonationToggle = async () => {
      try {
        const payload = await settingsApi.getPublicDonateLinkSetting();
        if (!cancelled) {
          setDonateLinkEnabled(Boolean(payload?.enabled));
        }
      } catch {
        if (!cancelled) {
          setDonateLinkEnabled(false);
        }
      }
    };
    loadDonationToggle();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadMentors = async () => {
      try {
        const payload = await menteeApi.listPublicMentors();
        const list = normalizeList(payload);
        const mapped = list.map(toLandingMentorCard).filter((item) => item?.name);
        if (!cancelled) {
          setMentorCards(mapped);
        }
      } catch {
        if (!cancelled) {
          setMentorCards([]);
        }
      }
    };

    loadMentors();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="lp">

      {/* ═══ HEADER ═══ */}
      <motion.header className="lp-hdr"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>

        <a href="/" className="lp-logo">
          <img src={logo} alt="Bond Room" />
          <span>Bridging Old and New Destinies</span>
        </a>

        <nav className="lp-nav">
          {navLinks.map(([href, label], i) => (
            <motion.a key={href} href={href}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.35 }}>
              {label}
            </motion.a>
          ))}
        </nav>

        <div className="lp-hdr-actions">
          {donateLinkEnabled ? <a href="/donate" className="lp-ghost">Donate</a> : null}
          <a href="/login"    className="lp-ghost">Log in</a>
        </div>

        <button className="lp-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span className={menuOpen ? 'open' : ''} />
          <span className={menuOpen ? 'open' : ''} />
        </button>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div className="lp-drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
            {[
              ...navLinks,
              ...(donateLinkEnabled ? [['/donate', 'Donate']] : []),
              ['/login','Log in'],
              ['/register','Student Sign Up'],
            ].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HERO ═══ */}
      <Cursor />
      <section className="lp-hero">
        <div className="lp-orb lp-orb-a" />
        <div className="lp-orb lp-orb-b" />
        <div className="lp-hero-depth">
          <HeroDepthScene parallax={parallax} />
        </div>

        <div className="lp-hero-body">

          {/* eyebrow tag */}
          <motion.p className="lp-eyebrow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}>
            <span className="lp-edot" />
            Trusted mentoring platform
          </motion.p>

          {/* ── BIG EDITORIAL TYPE BLOCK ──
              Each .lp-row uses align-items:flex-end so
              different-height elements sit on the same baseline.
              .lp-word-clip wraps each word with just enough
              vertical padding that descenders ("y","g") are never clipped.
          */}
          <div className="lp-type-block">

            {/* ROW 1 : Guided  [photo]  by */}
            <div className="lp-row">
              <HeroWord className="lp-w" delay={0.35}>Guided</HeroWord>

              <motion.div className="lp-pill"
                initial={{ opacity: 0, scale: 0.75, rotate: -4 }}
                animate={{ opacity: 1, scale: 1,    rotate: 0 }}
                transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                <img src={heroLeft} alt="" />
              </motion.div>

              {/* FIX: "by" was clipped — HeroWord gives extra top+bottom padding */}
              <HeroWord className="lp-w lp-w-muted" delay={0.45}>by</HeroWord>
            </div>

            {/* ROW 2 : Experience */}
            <div className="lp-row">
              <HeroWord className="lp-w lp-w-accent" delay={0.52}>Experience</HeroWord>
            </div>

            {/* ROW 3 : [photo]  for */}
            <div className="lp-row">
              <motion.div className="lp-pill lp-pill-lg"
                initial={{ opacity: 0, scale: 0.75, rotate: 3 }}
                animate={{ opacity: 1, scale: 1,    rotate: 0 }}
                transition={{ delay: 0.65, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                <img src={heroRight} alt="" />
                <span className="lp-live-badge">
                  <span className="lp-ldot" />LIVE
                </span>
              </motion.div>

              <HeroWord className="lp-w lp-w-muted" delay={0.62}>for</HeroWord>
            </div>

            {/* ROW 4 : Students (outline) */}
            <div className="lp-row">
              <HeroWord className="lp-w lp-w-outline" delay={0.72}>Students</HeroWord>
            </div>

          </div>{/* /lp-type-block */}

          {/* hero footer strip */}
          <motion.div className="lp-hero-foot"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>

            <p className="lp-hero-desc">
              A safe platform where students grow through conversations
              with trusted mentors who have walked the path before.
            </p>

            <div className="lp-hero-ctas">
              <a href="/register"        className="lp-solid">Student Sign Up <ArrowUpRight size={14} /></a>
              <a href="/mentor-register" className="lp-ghost">Become a Mentor</a>
            </div>

            <p className="lp-note">
              <LockKeyhole size={12} />
              Sessions are monitored &amp; recorded for student safety.
            </p>
          </motion.div>

        </div>{/* /lp-hero-body */}

        {/* scroll cue */}
        <motion.div className="lp-scroll-cue"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}>
          <motion.span
            animate={{ y: [0, 9, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}>
            ↓
          </motion.span>
          scroll to discover
        </motion.div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <div className="lp-marquee" aria-hidden="true">
        {[0, 1].map(k => (
          <div key={k} className="lp-mtrack">
            {['LISTEN', 'UNDERSTAND', 'GUIDE', 'TRUSTED MENTORS', 'SAFE SESSIONS', 'AI MATCHING', 'BOND ROOM', '✦'].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        ))}
      </div>

      {/* ═══ STATS ═══ */}
      <motion.section className="lp-stats"
        initial="hidden" whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerWrap}>
        {[
          { n: 2400, s: '+',  label: 'Students guided'  },
          { n: 300,  s: '+',  label: 'Verified mentors' },
          { n: 98,   s: '%',  label: 'Satisfaction rate' },
          { n: 12,   s: 'K+', label: 'Sessions held'    },
        ].map(({ n, s, label }) => (
            <motion.div
              key={label}
              className="lp-stat"
              variants={fadeUp}
              whileHover={{ y: -8, scale: 1.01, transition: { duration: 0.22 } }}
            >
              <strong><Count to={n} suffix={s} /></strong>
              <span>{label}</span>
            </motion.div>
        ))}
      </motion.section>

      {/* ═══ HOW IT WORKS ═══ */}
      <motion.section
        id="about"
        className="lp-sec lp-sec-about"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div className="lp-sec-head"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerWrap}>
          <motion.div className="lp-label" variants={fadeUp}>
            <motion.span className="lp-rule" variants={lineGrow} style={{ originX: 0 }} />
            How it works
          </motion.div>
          <SplitWords text="How Guidance Flows" className="lp-h2" />
        </motion.div>

        <div className="lp-how-grid">
          {howItems.map(({ Icon, n, title, body }, i) => (
            <motion.div key={title} className={`lp-how-card${title === 'Guide' ? ' lp-how-card--featured' : ''}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }}
              whileHover={{ y: -10, rotateX: 3, rotateY: -3, transition: { duration: 0.28 } }}>
              <span className="lp-how-n">{n}</span>
              <div className="lp-how-ico"><Icon size={20} /></div>
              <h3>{title}</h3>
              <p>{body}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ═══ TRUST ═══ */}
      <motion.section
        id="safety"
        className="lp-sec lp-trust-sec lp-sec-trust"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div className="lp-sec-head"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerWrap}>
          <motion.div className="lp-label" variants={fadeUp}>
            <motion.span className="lp-rule" variants={lineGrow} style={{ originX: 0 }} />
            Safety first
          </motion.div>
          <SplitWords text="Built on Trust" className="lp-h2" />
        </motion.div>

        <div className="lp-trust-layout">
          <motion.div className="lp-trust-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -8, rotateX: 2, rotateY: -2, transition: { duration: 0.25 } }}>
            <p>"Every interaction is designed to be safe, respectful, and deeply human."</p>
            <a href="/register" className="lp-solid">Student Sign Up <ArrowUpRight size={14} /></a>
          </motion.div>

          <div className="lp-trust-list">
            {trustItems.map(({ Icon, title, body }, i) => (
              <motion.div key={title} className="lp-trust-item"
                initial={{ opacity: 0, x: 28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
                whileHover={{ x: 8, y: -2, transition: { duration: 0.2 } }}>
                <div className="lp-trust-ico"><Icon size={18} /></div>
                <div>
                  <h4>{title}</h4>
                  <p>{body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══ STORIES ═══ */}
      <motion.section
        id="stories"
        className="lp-sec lp-sec-stories"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div className="lp-sec-head"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerWrap}>
          <motion.div className="lp-label" variants={fadeUp}>
            <motion.span className="lp-rule" variants={lineGrow} style={{ originX: 0 }} />
            Student voices
          </motion.div>
          <SplitWords text="Stories That Matter" className="lp-h2" />
        </motion.div>

        <div className="lp-story-stage">
          <AnimatePresence mode="wait">
            <motion.div key={activeStory} className="lp-story"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -28 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}>
              <span className="lp-snum">0{activeStory + 1}</span>
              <blockquote>"{stories[activeStory].quote}"</blockquote>
              <div className="lp-sauthor">
                <img src={stories[activeStory].avatar} alt={stories[activeStory].name}
                  className={stories[activeStory].cls || ''} />
                <div>
                  <strong>{stories[activeStory].name}</strong>
                  <span>{stories[activeStory].meta}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="lp-sdots">
            {stories.map((_, i) => (
              <motion.button key={i}
                className={`lp-sdot${i === activeStory ? ' active' : ''}`}
                onClick={() => setActiveStory(i)}
                animate={{ width: i === activeStory ? 28 : 8 }}
                transition={{ duration: 0.3 }}
                aria-label={`Story ${i + 1}`} />
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══ MENTORS ═══ */}
      <motion.section
        className="lp-sec lp-sec-mentors"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div className="lp-sec-head lp-sec-head--row"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerWrap}>
          <div>
            <motion.div className="lp-label" variants={fadeUp}>
              <motion.span className="lp-rule" variants={lineGrow} style={{ originX: 0 }} />
              Our mentors
            </motion.div>
            <SplitWords text="Wisdom You Can See" className="lp-h2" />
          </div>
          <motion.a href="/login" className="lp-link-arr" variants={fadeUp}>
            Meet all <ArrowUpRight size={14} />
          </motion.a>
        </motion.div>

        {mentorCards.length > 0 ? (
          <MentorRingCarousel items={mentorCards} onSelectMentor={setSelectedMentor} />
        ) : (
          <div className="rounded-2xl border border-[#ddd7ed] bg-white/75 p-6 text-center text-sm text-[#5f6b81]">
            No mentors available from API right now.
          </div>
        )}
      </motion.section>
      <AnimatePresence>
        {selectedMentor ? (
          <motion.div
            className="lp-mentor-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMentor(null)}
          >
            <motion.div
              className="lp-mentor-modal"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.24 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="lp-mentor-modal-orb lp-mentor-modal-orb-a" />
              <div className="lp-mentor-modal-orb lp-mentor-modal-orb-b" />

              <div className="lp-mentor-modal-content">
                <div className="lp-mentor-modal-top">
                  <div className="lp-mentor-modal-avatar">
                    {selectedMentor?.image ? (
                      <img src={selectedMentor.image} alt={selectedMentor.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="lp-mentor-modal-head">
                    <p className="lp-mentor-modal-pill">
                      Mentor Profile
                    </p>
                    <h3>{selectedMentor.name}</h3>
                    <p className="lp-mentor-modal-role">
                      {selectedMentor.qualification || selectedMentor.role || 'Mentor'}
                      {selectedMentor.city ? ` | ${selectedMentor.city}` : ''}
                    </p>
                    <p className="lp-mentor-modal-copy">{selectedMentor.copy}</p>
                  </div>
                </div>

                <div className="lp-mentor-modal-metrics">
                  <div>
                    <span>Rating</span>
                    <strong>{selectedMentor.rating > 0 ? selectedMentor.rating.toFixed(1) : 'New'}</strong>
                  </div>
                  <div>
                    <span>Languages</span>
                    <strong>{(selectedMentor.languages || []).length || 0}</strong>
                  </div>
                  <div>
                    <span>Specialties</span>
                    <strong>{(selectedMentor.tags || []).length || 0}</strong>
                  </div>
                </div>

                <div className="lp-mentor-modal-section">
                  <p>Expertise</p>
                  <div className="lp-mentor-modal-tags">
                    {(selectedMentor.tags || []).map((tag) => (
                      <span key={tag} className="lp-tag-primary">
                        {tag}
                      </span>
                    ))}
                    {(selectedMentor.languages || []).slice(0, 3).map((language) => (
                      <span key={language} className="lp-tag-secondary">
                        {language}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lp-mentor-modal-actions">
                  <button
                    type="button"
                    className="lp-mentor-modal-btn lp-mentor-modal-btn-secondary"
                    onClick={() => setSelectedMentor(null)}
                  >
                    Close
                  </button>
                  <a
                    href="/login"
                    className="lp-mentor-modal-btn lp-mentor-modal-btn-primary"
                  >
                    Continue to Match
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ═══ EDITORIAL CTA ═══ */}
      <motion.section
        className="lp-cta-sec lp-cta-sec-animated"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lp-cta-grid" />
        <div className="lp-cta-inner">
          <motion.div className="lp-label lp-label-lt"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}>
            <motion.span className="lp-rule lp-rule-lt"
              initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              style={{ originX: 0 }} />
            Ready?
          </motion.div>

          <div className="lp-cta-type">
            <SplitWords text="Let's tell your"  className="lp-cta-line"              delay={0}    animate={false} />
            <br />
            <SplitWords text="next success"     className="lp-cta-line lp-cta-ol"   delay={0.15} animate={false} />
            <br />
            <SplitWords text="story."           className="lp-cta-line"              delay={0.3}  animate={false} />
          </div>

          <motion.div className="lp-cta-acts"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}>
            <a href="/register"        className="lp-solid lp-solid-lg">Student Sign Up <ArrowUpRight size={16} /></a>
            <a href="/mentor-register" className="lp-ghost lp-ghost-lt">Become a Mentor</a>
          </motion.div>
        </div>
      </motion.section>

      {/* ═══ FOOTER ═══ */}
      <motion.footer
        className="lp-footer"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lp-footer-top">
          <a href="/" className="lp-logo">
            <img src={logo} alt="Bond Room" />
            <span>Bridging Old and New Destinies</span>
          </a>
          <nav className="lp-fnav">
            {[
              ['/about','About'],
              ['/volunteer', 'Volunteer'],
              ...(donateLinkEnabled ? [['/donate', 'Donate']] : []),
              ['#safety','Safety'],
              ['#stories','Stories'],
              ['/terms','Terms'],
              ['/privacy','Privacy'],
              ['/support','Help'],
            ].map(([href, label]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>
          <div className="lp-fsocial">
            <motion.a href="https://www.instagram.com/bondroomofficial" target="_blank" rel="noopener noreferrer" whileHover={{ y: -3 }} aria-label="Instagram"><Twitter  size={16} /></motion.a>
            <motion.a href="https://www.linkedin.com/in/bond-room-374aaa393/" target="_blank" rel="noopener noreferrer" whileHover={{ y: -3 }} aria-label="LinkedIn"><Linkedin size={16} /></motion.a>
          </div>
        </div>
        <div className="lp-footer-btm">
          <span>© 2026 Bond Room Platform. All rights reserved.</span>
          <span><LockKeyhole size={11} /> Sessions monitored for safety.</span>
        </div>
      </motion.footer>
    </div>
  );
}


