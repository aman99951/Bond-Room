import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { 
  ShieldCheck, 
  Users, 
  Bot, 
  Smile, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  Twitter, 
  Linkedin,
  LockKeyhole,
  Ear,
  Brain,
  Handshake,
  Menu,
  X
} from 'lucide-react';
import logo from './assets/logo.png';
import heroLeft from './assets/left.png';
import heroRight from './assets/right.png';
import mentorLeft from './assets/mentor-left.png';
import students from './assets/teach2.png';
import avatarOne from './assets/avatar-1.jpg';
import './LandingPage.css';

// --- 3D Components ---

const Background3D = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Suspense fallback={null}>
          <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <Sphere args={[1, 64, 64]} position={[-2, 1, -2]}>
              <MeshDistortMaterial
                color="#5D3699"
                attach="material"
                distort={0.4}
                speed={2}
              />
            </Sphere>
          </Float>
          <Float speed={1.5} rotationIntensity={2} floatIntensity={2}>
            <Sphere args={[0.6, 64, 64]} position={[3, -1, -3]}>
              <MeshDistortMaterial
                color="#7c4dff"
                attach="material"
                distort={0.5}
                speed={1.5}
              />
            </Sphere>
          </Float>
        </Suspense>
      </Canvas>
    </div>
  );
};

const FloatingHeroScene = () => {
  return (
    <div className="h-[400px] lg:h-[600px] w-full relative">
      <Canvas className="cursor-grab active:cursor-grabbing">
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <OrbitControls enableZoom={false} autoRotate speed={0.5} />
        <ambientLight intensity={0.8} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <Suspense fallback={null}>
          <Float speed={3} rotationIntensity={0.5} floatIntensity={1}>
            <mesh rotation={[0.5, 0.5, 0]}>
              <boxGeometry args={[2, 2, 2]} />
              <meshStandardMaterial color="#5D3699" metalness={0.5} roughness={0.2} />
            </mesh>
          </Float>
          <mesh position={[2, 1, -1]}>
            <torusGeometry args={[0.5, 0.2, 16, 100]} />
            <meshStandardMaterial color="#7c4dff" />
          </mesh>
          <mesh position={[-2, -1, 1]}>
            <octahedronGeometry args={[0.7]} />
            <meshStandardMaterial color="#ecfdf3" />
          </mesh>
        </Suspense>
      </Canvas>
    </div>
  );
};

// --- Framer Motion Variants ---

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = 'auto';
    };
  }, []);

  return (
    <div className="landing-new min-h-screen bg-[#fcfaff] text-[#111827] selection:bg-[#5D3699]/20">
      {/* Scroll Progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#5D3699] to-[#7c4dff] origin-left z-[100]"
        style={{ scaleX }}
      />

      <Background3D />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[#5D3699]/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <img src={logo} alt="Bond Room" className="h-10 w-auto" />
            <span className="text-xl font-black tracking-tighter text-[#5D3699]">BOND ROOM</span>
          </motion.div>

          <div className="hidden lg:flex items-center gap-10">
            {['About', 'Safety', 'Stories'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-sm font-bold text-gray-600 hover:text-[#5D3699] transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#5D3699] transition-all group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <a href="/login" className="text-sm font-bold text-gray-600 hover:text-gray-900 px-4">Log in</a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/register"
              className="px-6 py-3 rounded-2xl bg-[#5D3699] text-white text-sm font-bold shadow-xl shadow-purple-500/20 hover:bg-[#4a2b7a] transition-all"
            >
              Join the Room
            </motion.a>
          </div>

          <button 
            className="lg:hidden p-2 text-[#5D3699]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-b border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-8 flex flex-col gap-6">
                <a href="#about" className="text-lg font-bold" onClick={() => setIsMenuOpen(false)}>About</a>
                <a href="#safety" className="text-lg font-bold" onClick={() => setIsMenuOpen(false)}>Safety</a>
                <a href="#stories" className="text-lg font-bold" onClick={() => setIsMenuOpen(false)}>Stories</a>
                <hr className="border-gray-100" />
                <a href="/login" className="text-lg font-bold">Log in</a>
                <a href="/register" className="px-6 py-4 rounded-2xl bg-[#5D3699] text-white text-center font-bold">Get Started</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="relative z-10"
            >
              <motion.div 
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5f3ff] text-[#5D3699] text-xs font-black uppercase tracking-widest mb-8 border border-[#5D3699]/10"
              >
                <Sparkles size={14} className="animate-pulse" />
                Experience Wisdom in 3D
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="text-5xl lg:text-8xl font-black leading-[0.9] tracking-tighter mb-8"
              >
                GROWTH <br />
                <span className="text-[#5D3699] underline decoration-purple-200">THROUGH</span> <br />
                CONNECTION
              </motion.h1>

              <motion.p 
                variants={fadeInUp}
                className="text-xl text-gray-500 font-medium max-w-lg mb-10 leading-relaxed"
              >
                A multidimensional platform bridging students with vetted mentors through safe, thoughtful conversations.
              </motion.p>

              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.a
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  href="/register"
                  className="flex items-center justify-center gap-3 px-10 py-5 rounded-[2rem] bg-[#5D3699] text-white font-black text-lg shadow-2xl shadow-purple-500/30 group"
                >
                  Start Journey
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="/mentor-register"
                  className="flex items-center justify-center px-10 py-5 rounded-[2rem] bg-white border-2 border-gray-100 text-[#111827] font-black text-lg hover:border-[#5D3699]/20 transition-all"
                >
                  Become Mentor
                </motion.a>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1.2, type: "spring" }}
              viewport={{ once: true }}
              className="relative perspective-1000"
            >
              <FloatingHeroScene />
              
              {/* Floating Cards */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 right-0 bg-white p-6 rounded-3xl shadow-2xl border border-purple-50 max-w-[200px]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="text-xs font-black uppercase">Verified</span>
                </div>
                <p className="text-xs text-gray-500 font-bold leading-tight">50+ Wise mentors joined today</p>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-10 left-0 bg-[#5D3699] p-6 rounded-3xl shadow-2xl text-white max-w-[220px]"
              >
                <div className="flex items-center gap-3 mb-3 text-purple-200">
                  <Sparkles size={20} />
                  <span className="text-xs font-black uppercase">Active Now</span>
                </div>
                <p className="text-sm font-bold italic">&quot;The guidance I needed, when I needed it.&quot;</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Flow Section */}
      <section className="py-24 bg-white relative overflow-hidden" id="about">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter mb-6">THE GUIDANCE FLOW</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">A frictionless path from uncertainty to clarity.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-100 to-transparent -translate-y-1/2" />
            
            {[
              { icon: Ear, title: 'LISTEN', color: '#5D3699', desc: 'Secure space to share your concerns without judgment.' },
              { icon: Brain, title: 'UNDERSTAND', color: '#7c4dff', desc: 'AI matching with a mentor who truly understands your path.' },
              { icon: Handshake, title: 'GUIDE', color: '#10b981', desc: 'Interactive sessions driving real personal growth.' }
            ].map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
                viewport={{ once: true }}
                className="relative z-10 flex flex-col items-center group"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotateY: 180 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-24 h-24 rounded-[2.5rem] bg-[#fcfaff] shadow-xl flex items-center justify-center mb-8 border-2 border-white group-hover:border-purple-100"
                >
                  <step.icon size={40} style={{ color: step.color }} strokeWidth={2.5} />
                </motion.div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">{step.title}</h3>
                <p className="text-gray-500 text-center font-medium leading-relaxed max-w-[240px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section className="py-24 bg-[#fcfaff]" id="safety">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl lg:text-7xl font-black tracking-tighter mb-8 leading-[0.95]">
                BUILT ON <span className="text-[#5D3699]">TRUST</span> AND CARE
              </h2>
              <p className="text-xl text-gray-500 font-medium mb-12 leading-relaxed">
                Safety isn't a feature, it's our foundation. Every interaction is monitored and refined for your peace of mind.
              </p>
              <div className="flex gap-4">
                <div className="w-12 h-1.5 bg-[#5D3699] rounded-full" />
                <div className="w-4 h-1.5 bg-purple-200 rounded-full" />
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: ShieldCheck, title: 'Safe Sessions', desc: 'Real-time AI monitoring and encrypted recording.' },
                { icon: Users, title: 'Elite Mentors', desc: 'Strict vetting for professionals aged 50+.' },
                { icon: Bot, title: 'AI Match', desc: 'Hyper-personalized mentor recommendations.' },
                { icon: Smile, title: 'Pure Focus', desc: 'Designed for minimal distraction, maximum impact.' }
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10, rotateZ: idx % 2 === 0 ? 1 : -1 }}
                  className="p-8 rounded-[2rem] bg-white shadow-sm border border-purple-50 hover:shadow-xl transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[#5D3699] mb-6 group-hover:bg-[#5D3699] group-hover:text-white transition-colors">
                    <item.icon size={24} />
                  </div>
                  <h4 className="text-lg font-black mb-2 tracking-tight">{item.title}</h4>
                  <p className="text-gray-500 text-sm font-bold leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stories */}
      <section className="py-24 bg-[#5D3699] text-white rounded-[4rem] mx-4 lg:mx-10 my-10 relative overflow-hidden" id="stories">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="max-w-7xl mx-auto px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter mb-4">IMPACT STORIES</h2>
            <div className="w-20 h-1 bg-white/30 mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Arav', text: "Talking to Mr. Sharma helped me calm down about my board exams. He didn't just give advice, he listened.", age: 17, img: avatarOne },
              { name: 'Priya', text: "I felt lost choosing a career. My mentor shared her own journey which gave me so much hope.", age: 19, img: students },
              { name: 'Rohan', text: "It's different than talking to parents. My mentor feels like a wise friend who doesn't judge.", age: 16, img: students }
            ].map((story, idx) => (
              <motion.div
                key={story.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.2 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[3rem] group hover:bg-white/20 transition-all cursor-default"
              >
                <div className="text-5xl font-serif text-white/30 mb-6 group-hover:text-white/50 transition-colors">❝</div>
                <p className="text-lg font-bold italic leading-relaxed mb-10">&quot;{story.text}&quot;</p>
                <div className="flex items-center gap-4">
                  <img src={story.img} alt={story.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/30" />
                  <div>
                    <h4 className="font-black tracking-tight">{story.name}</h4>
                    <span className="text-white/60 text-xs font-bold uppercase">Student, {story.age}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-[#111827] rounded-[4rem] p-12 lg:p-24 text-center relative overflow-hidden group shadow-2xl shadow-[#5D3699]/40"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#5D3699]/30 rounded-full blur-[120px] -mr-48 -mt-48 transition-all group-hover:scale-110" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] -ml-48 -mb-48 transition-all group-hover:scale-110" />
            
            <h2 className="text-4xl lg:text-7xl font-black text-white tracking-tighter mb-8 relative z-10 leading-tight">
              READY TO ENTER <br />
              <span className="text-[#5D3699]">THE ROOM?</span>
            </h2>
            <p className="text-xl text-gray-400 font-medium mb-12 max-w-xl mx-auto relative z-10 leading-relaxed">
              Join a multi-generational community built on wisdom, trust, and shared growth.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/register"
                className="px-12 py-5 rounded-[2rem] bg-[#5D3699] text-white font-black text-xl shadow-2xl shadow-purple-500/40"
              >
                Begin as Student
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                href="/mentor-register"
                className="px-12 py-5 rounded-[2rem] bg-white/5 backdrop-blur-md border-2 border-white/10 text-white font-black text-xl"
              >
                Join as Mentor
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-20 border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-16">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Bond Room" className="h-12 w-auto" />
              <span className="text-2xl font-black tracking-tighter text-[#5D3699]">BOND ROOM</span>
            </div>

            <div className="flex gap-10">
              {['About', 'Privacy', 'Terms', 'Help'].map(l => (
                <a key={l} href="#" className="text-sm font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest">{l}</a>
              ))}
            </div>

            <div className="flex gap-6">
              <motion.a whileHover={{ scale: 1.2, rotate: 10 }} href="#" className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#5D3699] shadow-sm"><Twitter size={20} /></motion.a>
              <motion.a whileHover={{ scale: 1.2, rotate: -10 }} href="#" className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#5D3699] shadow-sm"><Linkedin size={20} /></motion.a>
            </div>
          </div>
          <div className="text-center text-gray-400 text-xs font-black uppercase tracking-[0.3em] pt-10 border-t border-gray-50">
            © 2025 Bond Room Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
