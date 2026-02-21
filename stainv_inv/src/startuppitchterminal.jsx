import React, { useState } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Rocket, 
  DollarSign, 
  Target, 
  BarChart3, 
  X, 
  Upload, 
  Send, 
  Briefcase, 
  TrendingUp 
} from 'lucide-react';

const StartupPitchTerminal = ({ userProfile, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [pitchData, setPitchData] = useState({
    headline: '',
    description: '',
    totalRequired: '',
    minInvestment: '',
    arr: '',
    yoyGrowth: '',
    bulletPoints: ['', '', ''],
    bgPhoto: null
  });

  const uploadFile = async (file) => {
    if (!file) return null;
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "STAINVreal");
    data.append("cloud_name", "dpirxq5op");

    try {
      const resp = await fetch(`https://api.cloudinary.com/v1_1/dpirxq5op/image/upload`, {
        method: "POST",
        body: data
      });
      const res = await resp.json();
      return res.secure_url;
    } catch (err) {
      console.error("Cloudinary Uplink Failure:", err);
      return null;
    }
  };

  const handlePostPitch = async () => {
    if (!pitchData.bgPhoto || !pitchData.headline || !pitchData.totalRequired) {
      return alert("Visual identity, Headline, and Capital requirements are mandatory.");
    }
    
    setLoading(true);
    try {
      const visualUrl = await uploadFile(pitchData.bgPhoto);
      
      if (!visualUrl) throw new Error("Visual asset transmission failed.");

      const payload = {
        headline: pitchData.headline,
        description: pitchData.description,
        totalRequired: Number(pitchData.totalRequired),
        minInvestment: Number(pitchData.minInvestment),
        // Compatibility Fix: Ensure both keys exist for Registry and Search sync
        minPerInvestor: Number(pitchData.minInvestment), 
        arr: pitchData.arr,
        yoyGrowth: pitchData.yoyGrowth,
        bulletPoints: pitchData.bulletPoints.filter(bp => bp.trim() !== ""),
        bgPhoto: visualUrl, 
        mediaUrl: visualUrl, // PRIMARY FIX: Matches details logic
        mediaType: 'image',
        
        // Metadata for Registry Identification
        authorId: auth.currentUser.uid,
        authorName: userProfile?.startupName || "Verified Startup",
        authorLogo: userProfile?.logo || "",
        location: `${userProfile?.city || 'Global'}, ${userProfile?.country || 'Remote'}`,
        createdAt: serverTimestamp(),
        type: 'strategic_pitch'
      };

      // TRANSMIT TO PITCHES REGISTRY
      await addDoc(collection(db, "pitches"), payload);

      // OPTIONAL: Update social timeline if you want it visible on the Home Feed as well
      /* await addDoc(collection(db, "posts"), {
        content: `New Strategic Pitch: ${pitchData.headline}`,
        mediaUrl: visualUrl,
        authorId: auth.currentUser.uid,
        type: 'strategic_pitch',
        createdAt: serverTimestamp()
      }); 
      */

      alert("Strategic Pitch Deployed to Startup Registry!");
      onComplete();
    } catch (e) {
      console.error("Pitch Deployment Error:", e);
      alert("System error during transmission: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBullet = (index, value) => {
    const newBullets = [...pitchData.bulletPoints];
    newBullets[index] = value;
    setPitchData({ ...pitchData, bulletPoints: newBullets });
  };

  const inputClass = "w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-black font-bold outline-none focus:border-amber-500 transition-all text-sm";
  const labelClass = "text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block";

  return (
    <div className="bg-white rounded-[3rem] p-8 md:p-10 space-y-8 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
      <header className="flex justify-between items-center border-b border-slate-50 pb-6">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Venture Deck Terminal</h2>
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">Authorized Startup Registry Entry</p>
        </div>
      </header>

      <div className="space-y-6">
        {/* BG Photo Upload */}
        <div className="space-y-2">
            <label className={labelClass}>Visual Identity (Banner)</label>
            <label className="block w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-slate-100 group">
            {pitchData.bgPhoto ? (
                <img src={URL.createObjectURL(pitchData.bgPhoto)} className="w-full h-full object-cover" alt="Preview" />
            ) : (
                <>
                <div className="p-4 bg-white rounded-2xl shadow-sm mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="text-amber-500" size={20} />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400">Upload Background Image</span>
                </>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={(e) => setPitchData({...pitchData, bgPhoto: e.target.files[0]})} />
            </label>
        </div>

        <div className="space-y-2">
            <label className={labelClass}>Pitch Headline</label>
            <input 
              placeholder="e.g. Revolutionizing logistics nodes..." 
              className="w-full text-xl font-black border-b-2 border-slate-100 py-2 outline-none focus:border-amber-500 text-slate-900" 
              value={pitchData.headline} 
              onChange={e => setPitchData({...pitchData, headline: e.target.value})} 
            />
        </div>
        
        <div className="space-y-2">
            <label className={labelClass}>Executive Narrative</label>
            <textarea placeholder="Describe the mission scope..." className="w-full bg-slate-50 p-6 rounded-[2rem] text-sm font-medium outline-none h-32 focus:ring-2 ring-amber-500/10 text-black" value={pitchData.description} onChange={e => setPitchData({...pitchData, description: e.target.value})} />
        </div>

        {/* Financials Grid */}
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1">
              <label className={labelClass}>Total Required ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="number" placeholder="425000" className={`${inputClass} pl-10`} value={pitchData.totalRequired} onChange={e => setPitchData({...pitchData, totalRequired: e.target.value})}/>
              </div>
           </div>
           <div className="space-y-1">
              <label className={labelClass}>Min Investment ($)</label>
              <div className="relative">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="number" placeholder="60000" className={`${inputClass} pl-10`} value={pitchData.minInvestment} onChange={e => setPitchData({...pitchData, minInvestment: e.target.value})}/>
              </div>
           </div>
           <div className="space-y-1">
              <label className={labelClass}>ARR ($)</label>
              <div className="relative">
                <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input placeholder="e.g. 400k" className={`${inputClass} pl-10`} value={pitchData.arr} onChange={e => setPitchData({...pitchData, arr: e.target.value})}/>
              </div>
           </div>
           <div className="space-y-1">
              <label className={labelClass}>YoY Growth (%)</label>
              <div className="relative">
                <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input placeholder="e.g. 300%" className={`${inputClass} pl-10`} value={pitchData.yoyGrowth} onChange={e => setPitchData({...pitchData, yoyGrowth: e.target.value})}/>
              </div>
           </div>
        </div>

        {/* Strategic Points */}
        <div className="space-y-3">
          <label className={labelClass}>Strategic Bullet Points</label>
          {pitchData.bulletPoints.map((bp, i) => (
            <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <input placeholder={`Strategic Highlight ${i+1}`} className={inputClass} value={bp} onChange={e => updateBullet(i, e.target.value)} />
            </div>
          ))}
        </div>

        <button 
          onClick={handlePostPitch} 
          disabled={loading} 
          className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-amber-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Rocket size={18}/> Deploy Pitch to Registry</>
          )}
        </button>
      </div>
    </div>
  );
};

export default StartupPitchTerminal;