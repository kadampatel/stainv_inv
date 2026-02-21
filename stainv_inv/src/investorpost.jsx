import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from './firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  Image as ImageIcon, Video, X, Send, 
  ShieldCheck, Loader2, Sparkles 
} from 'lucide-react';

const InvestorPost = ({ userProfile, onComplete }) => {
  const navigate = useNavigate();
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); 
  const [uploading, setUploading] = useState(false);

  // --- CLOUDINARY CONFIG (UPDATED WITH YOUR DETAILS) ---
  const CLOUDINARY_CLOUD_NAME = "dpirxq5op"; 
  const CLOUDINARY_UPLOAD_PRESET = "STAINVreal"; 

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!caption && !media) return alert("Please add content or media.");
    setUploading(true);

    try {
      let finalMediaUrl = "";

      // 1. UPLOAD TO CLOUDINARY
      if (media) {
        const formData = new FormData();
        formData.append("file", media);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        // Define resource type for Cloudinary API
        const resourceType = mediaType === 'video' ? 'video' : 'image';
        
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
          { method: "POST", body: formData }
        );

        const data = await response.json();
        
        if (data.secure_url) {
          finalMediaUrl = data.secure_url;
        } else {
          console.error("Cloudinary Error:", data);
          throw new Error(data.error?.message || "Upload failed");
        }
      }

      // 2. SAVE TO FIRESTORE (Matches your Rules Section 3)
      await addDoc(collection(db, "posts"), {
        authorId: auth.currentUser.uid,
        authorName: userProfile?.fullName || "Verified Investor",
        authorLogo: userProfile?.profilePhotoURL || null,
        authorRole: "investor",
        content: caption,
        mediaUrl: finalMediaUrl,
        mediaType: mediaType,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        verified: true
      });

      alert("Broadcast Live!");
      
      // Reset state
      setCaption("");
      setMedia(null);
      setPreview(null);

      if (onComplete) onComplete();
      
      // Navigate to Home Feed
      navigate('/investor-home', { state: { activeTab: 'home' } });

    } catch (error) {
      console.error("Post Error:", error);
      alert("System Error: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-xl mx-auto mt-6">
      {/* TERMINAL HEADER */}
      <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg"><Sparkles size={16} /></div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Network Broadcast Terminal</h2>
        </div>
        <div className="flex items-center gap-2">
           <ShieldCheck size={18} className="text-emerald-400" />
           <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Authenticated Node</span>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* PREVIEW AREA */}
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative aspect-video rounded-3xl overflow-hidden bg-slate-50 border border-slate-100">
              {mediaType === 'video' ? (
                <video src={preview} className="w-full h-full object-contain" controls />
              ) : (
                <img src={preview} className="w-full h-full object-contain" alt="Preview" />
              )}
              <button 
                onClick={() => {setPreview(null); setMedia(null);}} 
                className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-all"
              >
                <X size={18} />
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
               <label className="h-32 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-slate-400 group">
                  <ImageIcon size={24} className="group-hover:text-indigo-600 transition-colors" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Attach Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
               </label>
               <label className="h-32 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-slate-400 group">
                  <Video size={24} className="group-hover:text-indigo-600 transition-colors" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Attach Video</span>
                  <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
               </label>
            </div>
          )}
        </AnimatePresence>

        {/* MESSAGE INPUT */}
        <div className="space-y-2">
          <textarea 
            className="w-full h-32 bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-slate-700 font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all resize-none shadow-inner"
            placeholder="Share an update, request for pitches, or an investment thesis..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        {/* PUBLISH ACTION */}
        <button 
          onClick={handlePublish}
          disabled={uploading}
          className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50"
        >
          {uploading ? (
            <><Loader2 className="animate-spin" size={18} /> Uplinking...</>
          ) : (
            <>Transmit to Network <Send size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
};

export default InvestorPost;