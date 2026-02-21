import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { 
  ArrowLeft, Mail, MessageSquare, Send, 
  Globe, CheckCircle2, Loader2, MapPin 
} from 'lucide-react';

const ContactPage = () => {
  const navigate = useNavigate();
  const form = useRef();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Using your existing EmailJS Service & Public Key
      // Template ID should be created in your EmailJS dashboard to map these fields
      await emailjs.sendForm(
        'service_7c6niil', 
        'template_megdbbk', // You can use your existing template or create a specific contact one
        form.current, 
        'HCcDVQPc_QycQqvEz'
      );
      
      setSent(true);
      setTimeout(() => setSent(false), 5000);
      form.current.reset();
    } catch (error) {
      console.error("Inquiry Transmission Error:", error);
      alert("Terminal Link Offline. Please try again later.");
    } finally {
      setLoading(false);
    }
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
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Exit Terminal</span>
        </button>
        <img src="/stainvrb.png" alt="STAINV" className="h-5 grayscale opacity-50" />
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-20 grid md:grid-cols-2 gap-20">
        
        {/* LEFT COLUMN: INTEL */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-12"
        >
          <div className="space-y-6">
            <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">
              Establish <br /> <span className="text-amber-600">Contact.</span>
            </h1>
            <p className="text-xl text-slate-500 font-serif italic leading-relaxed max-w-md">
              "Direct lines for institutional inquiries, partnership proposals, and technical support."
            </p>
          </div>

          <div className="space-y-8 pt-10">
            
            <ContactInfo icon={<Globe size={20}/>} label="Operational Hub" value="Global / Digital" />
            <ContactInfo icon={<MapPin size={20}/>} label="Headquarters" value="Ahmedabad" />
          </div>
        </motion.div>

        {/* RIGHT COLUMN: FORM */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-sm"
        >
          <form ref={form} onSubmit={handleSendInquiry} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Identify (Full Name)</label>
              <input 
                name="from_name"
                type="text" 
                required 
                placeholder="Ex: John Doe" 
                className="w-full bg-white border border-slate-200 rounded-2xl py-5 px-6 outline-none focus:border-amber-600 transition-all font-bold text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Node Email</label>
              <input 
                name="reply_to"
                type="email" 
                required 
                placeholder="node@example.com" 
                className="w-full bg-white border border-slate-200 rounded-2xl py-5 px-6 outline-none focus:border-amber-600 transition-all font-bold text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Transmission Details</label>
              <textarea 
                name="message"
                required 
                rows="5"
                placeholder="Describe your inquiry..." 
                className="w-full bg-white border border-slate-200 rounded-3xl py-5 px-6 outline-none focus:border-amber-600 transition-all font-bold text-slate-900 resize-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-6 bg-black text-white rounded-3xl font-black uppercase text-xs tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-amber-600 transition-all active:scale-95 shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : sent ? (
                <><CheckCircle2 size={20} /> Transmission Sent</>
              ) : (
                <><Send size={18} /> Dispatch Message</>
              )}
            </button>
          </form>
        </motion.div>
      </main>

      <footer className="py-20 text-center">
        <p className="text-[8px] font-black uppercase tracking-[1em] text-slate-300">STAINV Communications Layer &copy; 2026</p>
      </footer>
    </div>
  );
};

const ContactInfo = ({ icon, label, value }) => (
  <div className="flex items-center gap-6 group cursor-default">
    <div className="p-4 bg-slate-50 rounded-2xl text-amber-600 border border-slate-100 group-hover:bg-black group-hover:text-white transition-all">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

export default ContactPage;