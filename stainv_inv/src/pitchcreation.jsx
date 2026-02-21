import React, { useState } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, X, DollarSign, Target, Rocket, Type, Loader2 } from 'lucide-react';

const PitchCreation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    headline: '',
    description: '',
    location: '',
    totalRequired: '',
    minPerInvestor: '', 
    keyHighlight: '',   
    revenueRunRate: '',
    type: 'investment_pitch'
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "STAINVreal"); // Using your verified preset
    data.append("cloud_name", "dpirxq5op");     // Using your verified cloud name

    const res = await fetch(`https://api.cloudinary.com/v1_1/dpirxq5op/image/upload`, {
      method: "POST",
      body: data,
    });
    const fileData = await res.json();
    return fileData.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return alert("Please login first");
    if (!image) return alert("Banner image is required for the Pitch Card");

    setLoading(true);
    try {
      // 1. Uplink visual asset to Cloudinary
      const uploadedImageUrl = await uploadToCloudinary(image);

      // 2. Transmit to Strategic Registry (PITCHES Collection)
      const pitchPayload = {
        ...formData,
        authorId: auth.currentUser.uid,
        // Syncing keys for StartupDetails.jsx visibility
        bgPhoto: uploadedImageUrl, 
        mediaUrl: uploadedImageUrl, 
        mediaType: 'image',
        totalRequired: Number(formData.totalRequired),
        minPerInvestor: Number(formData.minPerInvestor),
        minInvestment: Number(formData.minPerInvestor), // Redundancy for search mapping
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "pitches"), pitchPayload);

      // 3. Update Social Timeline (POSTS Collection)
      await addDoc(collection(db, "posts"), {
        content: `New Strategic Initiative: ${formData.headline}`,
        mediaUrl: uploadedImageUrl,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || "Verified Startup",
        type: 'strategic_pitch',
        createdAt: serverTimestamp(),
      });

      alert("Strategic Pitch Deployed!");
      navigate('/startup-profile');
    } catch (error) {
      console.error("Transmission Error:", error);
      alert("System sync failed. Please check network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans antialiased">
      <nav className="p-6 flex items-center gap-4 bg-white border-b border-slate-100 sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-400 hover:text-black">
          <X size={20}/>
        </button>
        <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Initialize Strategic Pitch</h2>
      </nav>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-6 py-10 space-y-8">
        
        {/* VISUAL UPLOAD AREA */}
        <section className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Visual Banner</label>
          <div className="relative aspect-video w-full rounded-[2.5rem] bg-slate-100 border-2 border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center group cursor-pointer transition-all hover:border-amber-500/50">
            {preview ? (
              <>
                <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                <button 
                  type="button"
                  onClick={() => {setImage(null); setPreview(null);}} 
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-rose-500 transition-colors"
                >
                  <X size={16}/>
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                <Upload className="text-slate-300 mb-2 group-hover:text-amber-500 transition-colors" size={32} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600">Upload Deck Banner</span>
                <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
              </label>
            )}
          </div>
        </section>

        {/* NARRATIVE DATA */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2"><Type size={12}/> Pitch Headline</label>
            <input 
              required 
              placeholder="e.g. Revolutionizing Node Logistics" 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
              value={formData.headline} 
              onChange={e => setFormData({...formData, headline: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Executive Narrative</label>
            <textarea 
              required 
              rows={4} 
              placeholder="Describe the mission scope..." 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </section>

        {/* FINANCIAL METRICS */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3"><Target size={12}/> Total Target</label>
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
              <DollarSign size={14} className="text-slate-400"/>
              <input 
                required 
                type="number" 
                placeholder="50000" 
                className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0 outline-none" 
                value={formData.totalRequired} 
                onChange={e => setFormData({...formData, totalRequired: e.target.value})}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3"><Rocket size={12}/> Min Entry</label>
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
              <DollarSign size={14} className="text-slate-400"/>
              <input 
                required 
                type="number" 
                placeholder="1000" 
                className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0 outline-none" 
                value={formData.minPerInvestor} 
                onChange={e => setFormData({...formData, minPerInvestor: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* STRATEGIC HIGHLIGHT */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
           <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-3">Key Strategic Point</label>
           <input 
             required 
             placeholder="Unique value proposition..." 
             className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
             value={formData.keyHighlight} 
             onChange={e => setFormData({...formData, keyHighlight: e.target.value})}
           />
        </section>

        <button 
          disabled={loading}
          type="submit" 
          className="w-full py-6 bg-black text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-amber-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> UPLINKING...</>
          ) : (
            "Transmit to Registry"
          )}
        </button>
      </form>
    </div>
  );
};

export default PitchCreation;