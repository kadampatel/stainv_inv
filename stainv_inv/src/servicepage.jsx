import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Code2, Cpu, Globe2, 
  Layers, Layout, PieChart, ShieldCheck, 
  Smartphone, Terminal, Zap 
} from 'lucide-react';

const ServicePage = () => {
  const navigate = useNavigate();

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-amber-100">
      {/* MINIMAL NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-50 px-8 py-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="group flex items-center gap-2 text-slate-400 hover:text-black transition-all"
        >
          <ArrowLeft size={20} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Protocol Return</span>
        </button>
        <img src="/stainvrb.png" alt="STAINV" className="h-5 grayscale opacity-50" />
      </nav>

      {/* HERO SECTION */}
      <header className="max-w-6xl mx-auto px-8 py-24 md:py-32">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
            <Zap size={12} className="text-amber-600 fill-amber-600" />
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">Digital Transformation</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9]">
            We Build the <br /> <span className="text-slate-300">Infrastructure</span> <br /> of Tomorrow.
          </h1>
          <p className="text-xl text-slate-500 font-serif italic leading-relaxed pt-6">
            STAINV is more than a registry. We are a specialized development house that engineers high-performance web ecosystems for startups and institutional investors.
          </p>
        </motion.div>
      </header>

      {/* CORE SERVICES GRID */}
      <section className="max-w-7xl mx-auto px-8 pb-32">
        <motion.div 
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-4"
        >
          <ServiceCard 
            icon={<Terminal size={24} />}
            title="Full-Stack Engineering"
            desc="Developing resilient, scalable web applications using React, Firebase, and high-performance cloud architectures."
            tags={["React", "Real-time DB", "API"]}
          />
          <ServiceCard 
            icon={<Layout size={24} />}
            title="Venture UI/UX"
            desc="Designing ultra-clean, tech-noir interfaces that prioritize data clarity and professional institutional trust."
            tags={["Figma", "Branding", "Motion"]}
          />
          <ServiceCard 
            icon={<ShieldCheck size={24} />}
            title="Registry Deployment"
            desc="Architecting secure database environments with strict permission protocols and encrypted transmission."
            tags={["Cloud Ops", "Auth", "Security"]}
          />
        </motion.div>
      </section>

      {/* CAPABILITIES STRIP */}
      <section className="bg-slate-900 py-32 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="max-w-7xl mx-auto px-8 relative z-10 flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="md:w-1/2 space-y-6">
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">
              Specialized <br /> <span className="text-amber-500">Agency Division</span>
            </h2>
            <p className="text-slate-400 font-medium leading-relaxed italic">
              From MVP deployment to advanced investor dashboards, our engineering team works directly with founders to turn complex visions into sharp, market-ready digital nodes.
            </p>
            <div className="grid grid-cols-2 gap-y-4 pt-4">
              <CapabilityItem text="Responsive Systems" />
              <CapabilityItem text="Custom Admin Panels" />
              <CapabilityItem text="Venture Dashboards" />
              <CapabilityItem text="Cloud Integration" />
            </div>
          </div>
          <div className="md:w-1/2 flex items-center justify-center">
             <div className="relative aspect-square w-full max-w-sm rounded-[3rem] bg-gradient-to-br from-amber-500 to-amber-700 shadow-2xl flex items-center justify-center overflow-hidden group">
                <Code2 size={120} className="text-white/20 absolute -bottom-4 -right-4 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-48 h-48 border-2 border-white/20 rounded-full flex items-center justify-center"
                >
                  <div className="w-32 h-32 border border-white/40 rounded-full" />
                </motion.div>
                <div className="absolute text-center">
                  <p className="text-xs font-black uppercase tracking-[0.5em] mb-2">Build Logic</p>
                  <p className="text-3xl font-black italic uppercase tracking-tighter">Code. Scale.</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-4xl mx-auto px-8 py-32 text-center space-y-10">
        <motion.div {...fadeInUp} className="space-y-4">
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic">Start the Build.</h2>
          <p className="text-slate-500 font-serif italic text-lg">Partner with STAINV for your next digital initiative.</p>
        </motion.div>
        <button 
          onClick={() => navigate('/login')}
          className="px-16 py-6 bg-black text-white rounded-full font-black uppercase text-xs tracking-[0.4em] hover:bg-amber-600 transition-all shadow-2xl active:scale-95"
        >
          Initialize Connection
        </button>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-50 py-12 text-center">
        <p className="text-[8px] font-black uppercase tracking-[1em] text-slate-300">STAINV Services Group &copy; 2026</p>
      </footer>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const ServiceCard = ({ icon, title, desc, tags }) => (
  <motion.div 
    variants={{
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 }
    }}
    className="group p-10 bg-white border border-slate-100 rounded-[3rem] hover:border-amber-500 hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500 flex flex-col justify-between h-full"
  >
    <div className="space-y-6">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-sm">
        {icon}
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-black uppercase italic tracking-tight">{title}</h3>
        <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 pt-8">
      {tags.map((tag, i) => (
        <span key={i} className="px-3 py-1 bg-slate-50 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-400 border border-slate-100">
          {tag}
        </span>
      ))}
    </div>
  </motion.div>
);

const CapabilityItem = ({ text }) => (
  <div className="flex items-center gap-3">
    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
    <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">{text}</span>
  </div>
);

export default ServicePage;