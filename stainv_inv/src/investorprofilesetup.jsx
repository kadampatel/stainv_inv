import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  User, Briefcase, Link as LinkIcon, 
  ChevronRight, ChevronLeft, Upload, CheckCircle2 
} from 'lucide-react';

const InvestorProfileSetup = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthResolving, setIsAuthResolving] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    profilePhoto: null,
    investorType: 'Angel investor',
    bio: '',
    pastInvolvement: '',
    experienceRole: 'Investor',
    valueAdd: [], 
    linkedin: ''
  });

  const CLOUDINARY_PRESET = "STAINVreal";
  const CLOUDINARY_CLOUD_NAME = "dpirxq5op";

  const investorTypes = ["Angel investor", "Strategic investor", "Founder-investor", "Operator / Advisor"];
  const valueAddOptions = ["Mentorship", "Industry access", "Hiring help", "Partnerships"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const docRef = doc(db, "investors", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          // CRITICAL FIX: Only redirect if status is explicitly 'complete'
          // Added pathname check to prevent infinite redirect loops
          if (docSnap.exists() && docSnap.data()?.profileStatus === "complete") {
            if (window.location.pathname !== '/investor-profile') {
                navigate('/investor-profile'); 
                return; 
            }
          }

          // STABILITY FIX: Pre-populate data from verification if it exists in Firestore
          if (docSnap.exists() && !formData.fullName) {
            setFormData(prev => ({
              ...prev,
              fullName: docSnap.data().fullName || '',
              linkedin: docSnap.data().linkedin || ''
            }));
          }
        } catch (err) {
          console.error("Firestore Sync Error:", err);
        }
      } else {
        // Fallback for unauthenticated users
        if (window.location.pathname !== '/') navigate('/');
      }
      setIsAuthResolving(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const validateStep = () => {
    if (step === 1) {
      if (!formData.fullName.trim()) { alert("Identity verification failed: Name required."); return false; }
      if (!formData.profilePhoto) { alert("Identity verification failed: Photo required."); return false; }
    }
    if (step === 2) {
      if (formData.bio.length < 10) { alert("Protocol requirement: Bio must be at least 10 characters."); return false; }
    }
    return true;
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_PRESET);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: data }
    );
    if (!response.ok) throw new Error("Cloudinary Node Failure");
    const resData = await response.json();
    return resData.secure_url;
  };

  const handleFinish = async () => {
    const activeUser = auth.currentUser;
    if (!activeUser) return alert("Session terminated. Re-authenticate.");

    if (validateStep()) {
      setLoading(true);
      try {
        const photoURL = await uploadToCloudinary(formData.profilePhoto);
        const investorRef = doc(db, "investors", activeUser.uid);

        const finalData = {
          uid: activeUser.uid,
          email: activeUser.email,
          fullName: formData.fullName,
          profilePhotoURL: photoURL,
          bio: formData.bio,
          investorType: formData.investorType,
          experienceRole: formData.experienceRole,
          pastInvolvement: formData.pastInvolvement,
          valueAdd: formData.valueAdd,
          linkedin: formData.linkedin,
          profileStatus: "complete", 
          commentPrivacy: 'all', 
          updatedAt: new Date().toISOString()
        };

        await setDoc(investorRef, finalData, { merge: true });
        navigate('/investor-profile'); 
      } catch (error) {
        console.error("Critical Setup Error:", error);
        alert("Sync failure in Registry.");
      } finally {
        setLoading(false);
      }
    }
  };

  const nextStep = () => { if (validateStep()) setStep((prev) => prev + 1); };
  const prevStep = () => setStep((prev) => prev - 1);

  const toggleValueAdd = (option) => {
    const current = [...formData.valueAdd];
    const index = current.indexOf(option);
    if (index > -1) current.splice(index, 1);
    else current.push(option);
    setFormData({ ...formData, valueAdd: current });
  };

  if (isAuthResolving) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 animate-pulse">Syncing Identity</p>
      </div>
    );
  }

  const slideIn = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.4 }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans flex flex-col">
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">Uploading Intelligence</p>
        </div>
      )}

      {/* HEADER: Sticky with consistent padding */}
      <nav className="flex justify-between items-center px-6 md:px-8 py-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <Link to="/"><img src="/stainvrb.png" alt="STAINV" className="h-30  w-auto" /></Link>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Phase {step} of 3</span>
        </div>
      </nav>

      {/* MAIN CONTENT: Centered container without rigid grid constraints */}
      <main className="flex-1 max-w-4xl mx-auto w-full pt-12 pb-40 px-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" {...slideIn} className="space-y-12">
              <header><h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none text-slate-900">The <br/> Identity.</h1></header>
              <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
                {/* Profile Photo Uploader */}
                <div className="relative w-40 h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center overflow-hidden group hover:border-amber-600 transition-all cursor-pointer flex-shrink-0">
                  {formData.profilePhoto ? (
                    <img src={URL.createObjectURL(formData.profilePhoto)} className="w-full h-full object-cover" alt="Preview" />
                  ) : <Upload className="text-slate-300 group-hover:text-amber-600 transition-all" />}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFormData({...formData, profilePhoto: e.target.files[0]})} />
                </div>

                {/* Name and Type Inputs */}
                <div className="space-y-8 flex-1 w-full">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                    <input type="text" placeholder="Authorized Member Name" className="w-full bg-transparent border-b-2 border-slate-100 py-4 text-2xl md:text-3xl font-bold focus:border-amber-600 outline-none transition-all text-slate-900" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Class</label>
                    <div className="relative">
                      <select className="w-full p-4 rounded-xl border-2 border-slate-100 font-bold focus:border-amber-600 outline-none appearance-none bg-white text-slate-900" value={formData.investorType} onChange={(e) => setFormData({...formData, investorType: e.target.value})}>
                        {investorTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" {...slideIn} className="space-y-12">
              <header><h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none text-slate-900">Expertise <br/> & Strategy.</h1></header>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Investment Thesis</label>
                <textarea placeholder="Describe your capital deployment strategy..." className="w-full border-2 border-slate-100 rounded-3xl p-6 md:p-8 h-48 text-lg focus:border-amber-600 outline-none transition-all text-slate-900" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Past Involvements</label>
                   <input type="text" placeholder="Primary Sector Involvement" className="w-full p-4 border-2 border-slate-100 rounded-xl font-bold focus:border-amber-600 outline-none text-slate-900" value={formData.pastInvolvement} onChange={(e) => setFormData({...formData, pastInvolvement: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">External Dossier</label>
                   <input type="text" placeholder="LinkedIn URL" className="w-full p-4 border-2 border-slate-100 rounded-xl font-bold focus:border-amber-600 outline-none text-slate-900" value={formData.linkedin} onChange={(e) => setFormData({...formData, linkedin: e.target.value})} />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" {...slideIn} className="space-y-12">
              <header><h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none text-slate-900">Value <br/> Deployment.</h1></header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {valueAddOptions.map((opt) => (
                  <button key={opt} onClick={() => toggleValueAdd(opt)} className={`p-6 md:p-8 rounded-3xl border-2 font-black uppercase tracking-widest text-[10px] transition-all text-left flex justify-between items-center ${formData.valueAdd.includes(opt) ? 'border-amber-600 bg-amber-50 text-amber-600 shadow-sm' : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'}`}>
                    {opt}
                    {formData.valueAdd.includes(opt) && <CheckCircle2 size={16} />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FOOTER: Fixed to bottom for reliable navigation */}
        <footer className="fixed bottom-0 left-0 right-0 p-6 md:p-8 bg-white/90 backdrop-blur-md border-t border-slate-100 flex justify-between items-center z-40">
          <button onClick={prevStep} className={`font-black uppercase text-[10px] tracking-[0.3em] hover:text-amber-600 transition-all ${step === 1 ? 'invisible' : ''}`}>Reverse</button>
          <div className="flex gap-4">
            {step < 3 ? (
              <button onClick={nextStep} className="px-8 md:px-12 py-4 md:py-5 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-amber-600 transition-all active:scale-95">Next Protocol</button>
            ) : (
              <button onClick={handleFinish} className="px-8 md:px-12 py-4 md:py-5 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all active:scale-95">Verify Registry</button>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
};

export default InvestorProfileSetup;