import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
// Added missing ShieldCheck, MapPin, and Zap icons
import { 
  ArrowLeft, 
  DollarSign, 
  CheckCircle2, 
  ShieldCheck, 
  Zap,
  MapPin 
} from 'lucide-react';

const PitchBroadcast = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    totalRequired: '',
    minPerInvestor: '',
    revenueRunRate: '',
    salesGrowth: '',
    keyHighlight: '',
    description: ''
  });

  const handlePost = async () => {
    if (!formData.totalRequired || !formData.description) {
      return alert("Investment amount and Executive Summary are mandatory.");
    }

    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      alert("Authentication session lost. Please log in again.");
      navigate('/login');
      return;
    }

    try {
      await addDoc(collection(db, "pitches"), {
        totalRequired: Number(formData.totalRequired),
        minPerInvestor: Number(formData.minPerInvestor),
        revenueRunRate: formData.revenueRunRate,
        salesGrowth: formData.salesGrowth,
        keyHighlight: formData.keyHighlight,
        description: formData.description,
        authorId: user.uid,
        type: 'investment_pitch',
        createdAt: serverTimestamp()
      });

      alert("Dossier Broadcasted to Global Network!");
      navigate('/home');
    } catch (err) {
      console.error("Firestore Error:", err);
      alert("Transmission Failed: Update your Firebase Rules for the 'pitches' collection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans pb-32 selection:bg-amber-100 overflow-x-hidden">
      {/* HEADER NAV */}
      <nav className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-400 hover:text-black"
        >
          <ArrowLeft size={20}/>
        </button>
        <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Broadcast Terminal</h1>
        <ShieldCheck size={20} className="text-amber-600" />
      </nav>

      <main className="max-w-xl mx-auto p-6 space-y-10 pt-12">
        <header>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-5xl font-black italic uppercase tracking-tighter leading-none"
          >
            Pitch.
          </motion.h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-3">Seek strategic capital acquisition.</p>
        </header>

        <section className="space-y-8">
          {/* FINANCIAL PARAMETERS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Total Required ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="number" 
                  placeholder="700,000" 
                  className="w-full p-5 pl-10 bg-white border border-slate-200 rounded-2xl font-black text-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all text-black" 
                  value={formData.totalRequired} 
                  onChange={e => setFormData({...formData, totalRequired: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Min per Investor ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="number" 
                  placeholder="35,000" 
                  className="w-full p-5 pl-10 bg-white border border-slate-200 rounded-2xl font-black text-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all text-black"
                  value={formData.minPerInvestor} 
                  onChange={e => setFormData({...formData, minPerInvestor: e.target.value})} 
                />
              </div>
            </div>
          </div>

          {/* EXECUTIVE SUMMARY */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Executive Summary</label>
            <textarea 
              placeholder="Tell your story... Ocado’s best-selling beer!" 
              className="w-full p-6 bg-white border border-slate-200 rounded-[2.5rem] h-40 outline-none font-medium text-black leading-relaxed shadow-sm focus:border-amber-500 transition-all"
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </div>

          {/* STRATEGIC POINTS */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-amber-500" fill="currentColor"/>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Performance Metrics</p>
            </div>

            <div className="space-y-3">
              <input 
                placeholder="Metric 1: e.g. £1m revenue run-rate" 
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:bg-white focus:border-amber-400 transition-all"
                value={formData.revenueRunRate} 
                onChange={e => setFormData({...formData, revenueRunRate: e.target.value})} 
              />
              <input 
                placeholder="Metric 2: e.g. National sales up 178%" 
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:bg-white focus:border-amber-400 transition-all"
                value={formData.salesGrowth} 
                onChange={e => setFormData({...formData, salesGrowth: e.target.value})} 
              />
              <input 
                placeholder="Metric 3: e.g. Best-selling brand in UK" 
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:bg-white focus:border-amber-400 transition-all"
                value={formData.keyHighlight} 
                onChange={e => setFormData({...formData, keyHighlight: e.target.value})} 
              />
            </div>
          </div>
        </section>

        {/* BROADCAST BUTTON */}
        <button 
          onClick={handlePost} 
          disabled={loading} 
          className="w-full py-6 bg-black text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-amber-600 transition-all flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50 active:scale-95"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Finalize & Post Pitch <CheckCircle2 size={18} /></>
          )}
        </button>
      </main>
    </div>
  );
};

export default PitchBroadcast;