import { useEffect, useState, useRef } from 'react';
import {
  motion, AnimatePresence,
  useScroll, useTransform,
} from 'framer-motion';
import logo       from './assets/logo.png';
import heroLeft   from './assets/left.png';
import heroRight  from './assets/right.png';
import mentorLeft from './assets/mentor-left.png';
import avatarOne  from './assets/avatar-1.jpg';
import students   from './assets/teach2.png';
import {
  ShieldCheck, Users, Bot, Smile,
  Twitter, Linkedin, LockKeyhole,
  Ear, Brain, Handshake, ArrowUpRight,
} from 'lucide-react';
import './LandingPage.css';

/* ══════════════════════════════════════════
   CURSOR  —  dot + ring + canvas trail
   The canvas is rendered at document level
   (position:fixed, pointer-events:none)
   and the trail is drawn every rAF tick.
══════════════════════════════════════════ */
const Cursor = () => {
  const mouse  = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const ring   = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const dotEl  = useRef(null);
  const ringEl = useRef(null);
  const cvs    = useRef(null);
  const pts    = useRef([]);   // trail history
  const raf    = useRef(null);
  useEffect(() => {
    document.documentElement.classList.add('has-custom-cursor');

    /* ── canvas setup ── */
    const cv  = cvs.current;
    const ctx = cv.getContext('2d');
    const setSize = () => {
      cv.width  = window.innerWidth;
      cv.height = window.innerHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);

    /* ── mouse tracking ── */
    const onMove = e => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    /* ── animation loop ── */
    const TRAIL_LEN = 80;

    const tick = () => {
      const mx = mouse.current.x;
      const my = mouse.current.y;

      /* -- hard dot snaps to cursor -- */
      if (dotEl.current) {
        dotEl.current.style.left = mx + 'px';
        dotEl.current.style.top  = my + 'px';
      }

      /* -- ring lerps behind cursor -- */
      ring.current.x += (mx - ring.current.x) * 0.11;
      ring.current.y += (my - ring.current.y) * 0.11;
      if (ringEl.current) {
        ringEl.current.style.left = ring.current.x + 'px';
        ringEl.current.style.top  = ring.current.y + 'px';
      }

      /* -- trail accumulates mouse positions -- */
      pts.current.push({ x: mx, y: my });
      if (pts.current.length > TRAIL_LEN) pts.current.shift();

      /* -- draw trail -- */
      ctx.clearRect(0, 0, cv.width, cv.height);

      if (pts.current.length > 3) {
        // Catmull-Rom interpolation for a smoother snake-like path.
        const raw = pts.current;
        const smooth = [];
        const SUBDIV = 3;

        for (let i = 0; i < raw.length - 1; i++) {
          const p0 = raw[Math.max(0, i - 1)];
          const p1 = raw[i];
          const p2 = raw[i + 1];
          const p3 = raw[Math.min(raw.length - 1, i + 2)];

          for (let j = 0; j < SUBDIV; j++) {
            const u = j / SUBDIV;
            const u2 = u * u;
            const u3 = u2 * u;
            const x = 0.5 * (
              (2 * p1.x) +
              (-p0.x + p2.x) * u +
              (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
              (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3
            );
            const y = 0.5 * (
              (2 * p1.y) +
              (-p0.y + p2.y) * u +
              (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
              (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3
            );
            smooth.push({ x, y });
          }
        }
        smooth.push(raw[raw.length - 1]);

        for (let i = 1; i < smooth.length; i++) {
          const t = i / (smooth.length - 1);         // 0 tail -> 1 head
          const body = Math.sin(Math.PI * t);        // snake body bulge
          const alpha = 0.22 + body * 0.72;          // visible from both ends
          const width = 2.4 + body * 6.2;            // thick start/end + thickest middle

          const p0 = smooth[i - 1];
          const p1 = smooth[i];

          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);

          const r = Math.round(91 + t * 48);
          const g = Math.round(44 + t * 52);
          const b = Math.round(199 + t * 37);

          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }

        // Head glow.
        const tip = smooth[smooth.length - 1];
        const tipGlow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 26);
        tipGlow.addColorStop(0, 'rgba(139,96,236,0.62)');
        tipGlow.addColorStop(1, 'rgba(91,44,199,0)');
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 26, 0, Math.PI * 2);
        ctx.fillStyle = tipGlow;
        ctx.fill();

        // Tail glow.
        const tail = smooth[0];
        const tailGlow = ctx.createRadialGradient(tail.x, tail.y, 0, tail.x, tail.y, 14);
        tailGlow.addColorStop(0, 'rgba(91,44,199,0.28)');
        tailGlow.addColorStop(1, 'rgba(91,44,199,0)');
        ctx.beginPath();
        ctx.arc(tail.x, tail.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = tailGlow;
        ctx.fill();
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
      {/* canvas lives behind everything, fixed to viewport */}
      <canvas ref={cvs}    className="cr-canvas" />
      {/* solid dot — snaps instantly */}
      <div    ref={dotEl}  className="cr-dot"    />
      {/* ring — lerps softly */}
      <div    ref={ringEl} className="cr-ring"   />
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
const SplitWords = ({ text, className = '', delay = 0 }) => (
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
          initial={{ y: '115%' }}
          whileInView={{ y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.08 }}
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
const HeroWord = ({ children, className = '', delay = 0, animate = true }) => (
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
      initial={animate ? { y: '115%' } : { y: 0 }}
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
  { Icon: Handshake, n: '03', title: 'Guide',      body: 'Meaningful 1-on-1 sessions that provide perspective and direction.' },
];

const mentorCards = [
  { image: heroRight,   name: 'Dr. Anand K.',     role: 'Retired Prof.',   tags: ['Academic Stress', 'Physics'],    copy: 'I help students find joy in learning rather than fearing exams.' },
  { image: mentorLeft,  name: 'Mrs. Radha',        role: 'Ex-HR Director', tags: ['Career Guidance', 'Confidence'], copy: 'Guiding young minds to discover their true potential.' },
  { image: heroLeft,    name: 'Col. Singh (Retd)', role: 'Army Veteran',   tags: ['Discipline', 'Leadership'],      copy: 'Building character and resilience for the challenges ahead.' },
];

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

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function LandingPage() {
  const [menuOpen, setMenuOpen]       = useState(false);
  const [activeStory, setActiveStory] = useState(0);
  const { scrollY } = useScroll();
  const parallax    = useTransform(scrollY, [0, 600], [0, -50]);

  useEffect(() => {
    const id = setInterval(() => setActiveStory(s => (s + 1) % stories.length), 4200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.style.background = '#f7f4ff';
    return () => { document.body.style.background = ''; };
  }, []);

  return (
    <div className="lp">
      <Cursor />

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
          {[['#about','About'], ['#safety','Safety'], ['#stories','Stories']].map(([href, label], i) => (
            <motion.a key={href} href={href}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.35 }}>
              {label}
            </motion.a>
          ))}
        </nav>

        <div className="lp-hdr-actions">
          <a href="/login"    className="lp-ghost">Log in</a>
          <a href="/register" className="lp-solid">Student Sign Up</a>
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
            {[['#about','About'], ['#safety','Safety'], ['#stories','Stories'], ['/login','Log in'], ['/register','Student Sign Up']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HERO ═══ */}
      <section className="lp-hero">
        <div className="lp-orb lp-orb-a" />
        <div className="lp-orb lp-orb-b" />

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
          <motion.div key={label} className="lp-stat" variants={fadeUp}>
            <strong><Count to={n} suffix={s} /></strong>
            <span>{label}</span>
          </motion.div>
        ))}
      </motion.section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="about" className="lp-sec">
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
            <motion.div key={title} className="lp-how-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }}
              whileHover={{ y: -6, transition: { duration: 0.28 } }}>
              <span className="lp-how-n">{n}</span>
              <div className="lp-how-ico"><Icon size={20} /></div>
              <h3>{title}</h3>
              <p>{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ TRUST ═══ */}
      <section id="safety" className="lp-sec lp-trust-sec">
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
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
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
                whileHover={{ x: 5, transition: { duration: 0.18 } }}>
                <div className="lp-trust-ico"><Icon size={18} /></div>
                <div>
                  <h4>{title}</h4>
                  <p>{body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STORIES ═══ */}
      <section id="stories" className="lp-sec">
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
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
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
      </section>

      {/* ═══ MENTORS ═══ */}
      <section className="lp-sec">
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
          <motion.a href="/mentors" className="lp-link-arr" variants={fadeUp}>
            Meet all <ArrowUpRight size={14} />
          </motion.a>
        </motion.div>

        <div className="lp-mentor-grid">
          {mentorCards.map(({ image, name, role, tags, copy }, i) => (
            <motion.div key={name} className="lp-mcard"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }}
              whileHover={{ y: -8, transition: { duration: 0.28 } }}>
              <div className="lp-mimg">
                <img src={image} alt={name} />
                <div className="lp-mcover" />
              </div>
              <div className="lp-mbody">
                <div className="lp-mmeta">
                  <strong>{name}</strong><span>{role}</span>
                </div>
                <p>{copy}</p>
                <div className="lp-mtags">
                  {tags.map(t => <span key={t}>{t}</span>)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ EDITORIAL CTA ═══ */}
      <section className="lp-cta-sec">
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
            <SplitWords text="Let's tell your"  className="lp-cta-line"              delay={0}    />
            <br />
            <SplitWords text="next success"     className="lp-cta-line lp-cta-ol"   delay={0.15} />
            <br />
            <SplitWords text="story."           className="lp-cta-line"              delay={0.3}  />
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
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <a href="/" className="lp-logo">
            <img src={logo} alt="Bond Room" />
            <span>Bridging Old and New Destinies</span>
          </a>
          <nav className="lp-fnav">
            {[['#about','About'], ['#safety','Safety'], ['#stories','Stories'], ['/terms','Terms'], ['/privacy','Privacy'], ['/support','Help']].map(([href, label]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>
          <div className="lp-fsocial">
            <motion.a href="#" whileHover={{ y: -3 }} aria-label="Twitter"><Twitter  size={16} /></motion.a>
            <motion.a href="#" whileHover={{ y: -3 }} aria-label="LinkedIn"><Linkedin size={16} /></motion.a>
          </div>
        </div>
        <div className="lp-footer-btm">
          <span>© 2026 Bond Room Platform. All rights reserved.</span>
          <span><LockKeyhole size={11} /> Sessions monitored for safety.</span>
        </div>
      </footer>
    </div>
  );
}
