import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, Zap, Globe, 
  Target, Users, Rocket, BarChart3 
} from 'lucide-react';

const AboutPage = () => {
  const navigate = useNavigate();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-amber-100">
      {/* HEADER */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-50 px-8 py-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="group flex items-center gap-2 text-slate-400 hover:text-black transition-all"
        >
          <ArrowLeft size={20} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Return</span>
        </button>
        <img src="/stainvrb.png" alt="STAINV" className="h-5 grayscale opacity-50" />
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-20 space-y-32">
        
        {/* SECTION 1: MISSION */}
        <motion.section {...fadeIn} className="space-y-8 text-center md:text-left">
          <div className="inline-flex p-3 bg-slate-50 rounded-2xl mb-4">
            <ShieldCheck size={28} className="text-amber-600" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-none">
            The Institutional <br /> <span className="text-amber-600">Standard.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 font-serif italic leading-relaxed max-w-2xl">
            "STAINV is a private discovery terminal designed to bridge the gap between visionary founders and institutional capital through a verified, commission-free registry."
          </p>
        </motion.section>

        {/* SECTION 2: WHAT WE DO */}
        <section className="grid md:grid-cols-2 gap-16 border-t border-slate-100 pt-20">
          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-600">Core Protocol</h2>
            <h3 className="text-3xl font-black uppercase italic tracking-tight">Venture Discovery</h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              We remove the "Middleman Tax." By providing a secure, encrypted platform where startups list strategic pitches and investors browse verified dossiers, we ensure that capital flows directly into innovation without brokerage friction.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FeatureBox icon={<Globe size={20}/>} title="Global Registry" />
            <FeatureBox icon={<Zap size={20}/>} title="Direct Link" />
            <FeatureBox icon={<Target size={20}/>} title="Vetted Nodes" />
            <FeatureBox icon={<BarChart3 size={20}/>} title="Zero Fees" />
          </div>
        </section>

        {/* SECTION 3: HOW TO USE */}
        <section className="space-y-12">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 text-center">Execution Roadmap</h2>
          <div className="space-y-4">
            <StepRow 
              number="01" 
              title="Verification" 
              desc="Nodes undergo manual vetting via professional credentials (LinkedIn/Portfolio) to ensure high-integrity participation." 
            />
            <StepRow 
              number="02" 
              title="Deployment" 
              desc="Startups deploy 'Strategic Pitches' to the registry. Investors establish 'Connect Protocols' to unlock deeper dossiers." 
            />
            <StepRow 
              number="03" 
              title="Syndication" 
              desc="Direct messaging facilitates due diligence and capital transfer. No commissions are ever taken by the platform." 
            />
          </div>
        </section>

        {/* SECTION 4: CTA */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="bg-black rounded-[3rem] p-12 md:p-20 text-center text-white space-y-8 shadow-2xl"
        >
          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">Ready to initialize?</h2>
          <p className="text-slate-400 text-sm uppercase tracking-widest font-bold">Join the next generation of venture discovery.</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-12 py-5 bg-white text-black rounded-full font-black uppercase text-xs tracking-[0.3em] hover:bg-amber-600 hover:text-white transition-all active:scale-95"
          >
            Access Terminal
          </button>
        </motion.section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-50 py-20 text-center space-y-4">
        <p className="text-[8px] font-black uppercase tracking-[0.8em] text-slate-300">STAINV Private Registry &copy; 2026</p>
      </footer>
    </div>
  );
};

const FeatureBox = ({ icon, title }) => (
  <div className="p-6 bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center gap-3 border border-slate-100 hover:border-amber-200 transition-all cursor-default">
    <div className="text-amber-600">{icon}</div>
    <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">{title}</span>
  </div>
);

const StepRow = ({ number, title, desc }) => (
  <div className="flex flex-col md:flex-row gap-6 md:gap-12 p-10 bg-white border border-slate-100 rounded-[2.5rem] hover:shadow-xl hover:shadow-slate-100/50 transition-all group">
    <div className="text-4xl font-black italic text-slate-100 group-hover:text-amber-600 transition-colors">{number}</div>
    <div className="space-y-2">
      <h4 className="text-xl font-black uppercase italic tracking-tight">{title}</h4>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default AboutPage;