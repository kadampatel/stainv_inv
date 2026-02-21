import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Instagram, Twitter, Users, Rocket, ArrowRight, 
  ChevronRight, Zap, ShieldCheck, Plus, Minus, 
  Target, Sparkles, Handshake, Menu, X
} from 'lucide-react';

const LandingPage = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const reveal = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* 1. NAVBAR */}
      <nav className="flex justify-between items-center px-8 md:px-16 py-4 sticky top-0 bg-[#020617] border-b border-white/5 z-50 shadow-2xl">
        <div className="flex items-center hover:opacity-80 transition-opacity cursor-pointer">
          {/* Logo height set to 25px */}
          <img src="/stainv1234.png" alt="STAINV Logo" className="h-25 w-auto object-contain" />
        </div>

        <div className="hidden md:flex items-center gap-8 bg-white/5 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
          <NavLink to="/about">About</NavLink>
          <NavLink to="/services">Our Services</NavLink>
          <NavLink to="/contact">Contact Us</NavLink>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden sm:block">
            <button className="group relative px-8 py-2.5 bg-white text-black rounded-full font-bold transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95">
              <span className="relative z-10 flex items-center gap-2 text-sm uppercase tracking-wider italic">Sign in <ChevronRight size={16} /></span>
            </button>
          </Link>
          <button className="md:hidden text-white p-2" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-[#020617] border-b border-white/10 p-8 flex flex-col gap-6 md:hidden shadow-2xl"
            >
              <Link to="/about" className="text-white text-lg font-bold">About</Link>
              <Link to="/services" className="text-white text-lg font-bold">Our Services</Link>
              <Link to="/contact" className="text-white text-lg font-bold">Contact Us</Link>
              <Link to="/login" className="text-blue-500 text-lg font-bold uppercase italic">Sign In</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-20 pb-24 px-8 md:px-24 overflow-hidden min-h-[95vh] flex items-center">
        <div className="absolute right-[-15%] md:right-[-5%] top-1/2 -translate-y-1/2 w-[700px] md:w-[1100px] h-[700px] md:h-[1100px] z-0 pointer-events-none">
          <div className="absolute inset-0 bg-blue-500/10 blur-[120px] rounded-full" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="w-full h-full relative">
            <svg viewBox="0 0 100 100" className="w-full h-full text-blue-600/30 fill-current">
              <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2,2" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.1" />
              <ellipse cx="50" cy="50" rx="49" ry="15" fill="none" stroke="currentColor" strokeWidth="0.1" />
              <ellipse cx="50" cy="50" rx="15" ry="49" fill="none" stroke="currentColor" strokeWidth="0.1" />
              {[...Array(50)].map((_, i) => (
                <circle key={i} cx={15 + Math.random() * 70} cy={15 + Math.random() * 70} r="0.6" className="text-blue-500/60" />
              ))}
            </svg>
            <div className="absolute inset-[25%] bg-blue-400/5 blur-[60px] rounded-full" />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#FDFDFF] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl w-full text-left">
          <motion.h1 {...reveal} className="text-6xl md:text-[9.5rem] font-black leading-[0.85] tracking-tighter mb-12 text-slate-900 italic">
            DIRECT. <br /> <span className="text-blue-600">UNBIASED.</span> <br /> CAPITAL.
          </motion.h1>

          <div className="grid md:grid-cols-2 gap-8 mt-12 max-w-4xl">
            <RoleCard title="Investor" desc="Access exclusive equity opportunities." icon={<Users size={36} />} linkTo="/investorverification" />
            <RoleCard title="Startup" desc="Fund your mission, keep your equity." icon={<Rocket size={36} />} linkTo="/startupverification" />
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-32 px-8 md:px-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <motion.div {...reveal} className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase italic"> STAINV Process</h2>
            <p className="text-slate-500 text-lg font-medium">Three steps to revolutionary growth.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard step="01" icon={<Target className="text-blue-600" />} title="Profile Verification" desc="Rigorous vetting ensures only high-quality startups and investors enter the room." />
            <StepCard step="02" icon={<Sparkles className="text-blue-600" />} title="Direct Connection" desc="Founders pitch directly to investors without brokers taking a cut." />
            <StepCard step="03" icon={<Handshake className="text-blue-600" />} title="Scale & Exit" desc="Leverage our ecosystem for future rounds and meaningful industry impact." />
          </div>
        </div>
      </section>

      {/* 4. GROW SECTION */}
      <section className="py-32 px-8 md:px-20 bg-slate-50/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
          <motion.div {...reveal} className="md:w-1/2">
            <h2 className="text-5xl md:text-7xl font-black leading-[0.9] mb-8 tracking-tighter text-slate-900 uppercase italic">
              Grow your startup <br/><span className="text-blue-600">at light speed.</span>
            </h2>
            <p className="text-xl text-slate-500 leading-relaxed mb-10 font-medium">
              STAINV places your vision directly in the hands of those with the power to scale it. Commission-free forever.
            </p>
            <div className="space-y-4">
              <CheckItem text="Verified Professional Investor Network" />
              <CheckItem text="Direct Messaging & Pitch Deck Access" />
              <CheckItem text="Sole Revenue Model: Profile Boosts" />
            </div>
          </motion.div>
          <motion.div {...reveal} className="md:w-1/2 relative group">
            <div className="absolute -inset-4 bg-blue-100 rounded-[3.5rem] blur-3xl opacity-30"></div>
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80" 
              className="relative rounded-[3rem] shadow-2xl border-8 border-white hover:scale-[1.01] transition-transform duration-700" 
              alt="Elite Office"
            />
          </motion.div>
        </div>
      </section>

      {/* 5. FINAL CTA */}
      <section className="py-32 px-8">
        <motion.div {...reveal} className="max-w-5xl mx-auto bg-blue-600 rounded-[4rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-none uppercase italic">Build the future?</h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto font-medium"></p>
          <Link to="/login">
            <button className="px-10 py-5 bg-white text-blue-600 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-2xl uppercase italic">
              Get Started Now
            </button>
          </Link>
        </motion.div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-32 px-8 md:px-20 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-16 uppercase italic">Frequently Asked Questions</h2>
          <div className="text-left space-y-4">
            <FaqItem q="How is it truly zero cost?" a="We believe in democratizing capital. We generate revenue through optional profile 'Boosts' only." />
            <FaqItem q="How do you vet investors?" a="Every investor undergoes manual LinkedIn and background verification before terminal access is granted." />
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-slate-900 text-white pt-24 pb-12 px-8 md:px-20 rounded-t-[4rem]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 mb-20">
          <div>
            {/* Footer logo height set to 25px */}
             <img src="/stainv1234.png" alt="STAINV Logo" className="h-25 w-auto mb-8 brightness-0 invert opacity-80" />
             <div className="flex gap-6 mt-4">
              <Instagram className="cursor-pointer text-slate-500 hover:text-white transition-colors" />
              <Twitter className="cursor-pointer text-slate-500 hover:text-white transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-12 text-sm uppercase tracking-widest font-bold text-slate-500">
            <div className="flex flex-col gap-5">
              {/* Linked to Login as it is the functional Platform */}
              <Link to="/login" className="hover:text-blue-400 transition italic">Platform</Link>
              <Link to="/about" className="hover:text-blue-400 transition italic">About</Link>
            </div>
            <div className="flex flex-col gap-5">
              <Link to="/privacy" className="hover:text-blue-400 transition italic">Privacy</Link>
              <Link to="/contact" className="hover:text-blue-400 transition italic">Contact</Link>
            </div>
          </div>
        </div>
        <div className="text-center text-slate-600 text-xs tracking-[0.2em] font-bold uppercase pt-12 border-t border-white/5">
          © 2026 STAINV. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
};

// --- SUB COMPONENTS ---

const NavLink = ({ to, children }) => (
  <Link to={to} className="text-slate-300 hover:text-white text-xs font-bold uppercase tracking-[0.2em] transition-colors relative group italic">
    {children}
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
  </Link>
);

const StepCard = ({ step, icon, title, desc }) => (
  <div className="p-8 bg-white border border-slate-100 rounded-[2rem] hover:border-blue-200 transition-all group">
    <div className="text-xs font-black text-blue-600 mb-4">{step}</div>
    <div className="mb-6 scale-125 origin-left group-hover:scale-150 transition-transform duration-500">{icon}</div>
    <h3 className="text-2xl font-bold mb-3 uppercase italic tracking-tight">{title}</h3>
    <p className="text-slate-500 leading-relaxed font-medium">{desc}</p>
  </div>
);

const CheckItem = ({ text }) => (
  <div className="flex items-center gap-3 text-slate-700 font-bold italic text-sm">
    <div className="bg-blue-600 text-white rounded-full p-1">
      <ShieldCheck size={14} />
    </div>
    {text}
  </div>
);

const RoleCard = ({ title, desc, icon, linkTo }) => (
  <Link to={linkTo} className="group p-12 bg-transparent border-2 border-slate-100 rounded-[3rem] hover:border-blue-600 hover:bg-white hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 relative overflow-hidden text-left">
    <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 text-blue-600">
      {icon}
    </div>
    <h3 className="text-4xl font-black mb-3 text-slate-900 uppercase italic tracking-tight">{title}</h3>
    <p className="text-slate-500 text-lg group-hover:text-slate-700 transition-colors font-medium">{desc}</p>
    <div className="absolute top-12 right-12 opacity-0 group-hover:opacity-100 transition-all -rotate-45 text-blue-600">
      <ArrowRight size={28} />
    </div>
  </Link>
);

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 py-6 cursor-pointer" onClick={() => setOpen(!open)}>
      <div className="flex justify-between items-center">
        <h4 className="text-xl font-bold text-slate-900 uppercase italic tracking-tight">{q}</h4>
        {open ? <Minus size={20} className="text-blue-600" /> : <Plus size={20} className="text-slate-400" />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="text-slate-500 pt-3 font-medium">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;