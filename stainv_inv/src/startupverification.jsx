import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom'; 
import emailjs from '@emailjs/browser';
import { db, auth } from './firebase'; 
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // FIXED: Use real account creation
import { Country, City } from 'country-state-city';
import { 
  ArrowRight, ShieldCheck, Mail, User,
  Github, Linkedin, CheckCircle2, Lock, MapPin, Globe, ChevronLeft, Sparkles, Camera, Upload, X
} from 'lucide-react';

const StartupVerification = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [otpArray, setOtpArray] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);
  
  const [countries] = useState(Country.getAllCountries());
  const [cities, setCities] = useState([]);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '', 
    name: '', 
    description: '',
    stage: '', 
    industry: '',
    country: '',
    city: '',
    linkedin: '', 
    github: ''
  });

  useEffect(() => {
    emailjs.init("HCcDVQPc_QycQqvEz");
  }, []);

  useEffect(() => {
    if (formData.country) {
      const countryCode = countries.find(c => c.name === formData.country)?.isoCode;
      setCities(City.getCitiesOfCountry(countryCode) || []);
    }
  }, [formData.country, countries]);

  const validateStep = () => {
    if (step === 2 && (!formData.name || !formData.description)) return alert("Please fill all entity details.");
    if (step === 3 && (!formData.stage || !formData.industry || !formData.country || !formData.city)) {
      return alert("Location and operational data are mandatory.");
    }
    setStep(step + 1);
  };

  const generatePIN = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otpArray];
    newOtp[index] = element.value;
    setOtpArray(newOtp);
    if (element.value !== "" && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpArray[index] && index > 0) inputRefs.current[index - 1].focus();
  };

  const sendEmailOtp = async () => {
    if (!formData.fullName) return alert("Please enter your full name.");
    if (!formData.email || !formData.email.includes('@')) return alert("Corporate email required.");
    
    setLoading(true);
    const pin = generatePIN();
    setGeneratedOtp(pin);
    try {
      await emailjs.send('service_7c6niil', 'template_megdbbk', {
        to_name: formData.fullName,
        email: formData.email, 
        verification_code: pin, 
      }, 'HCcDVQPc_QycQqvEz');
    } catch (error) {
      alert("Verification server busy.");
    }
    setLoading(false);
  };

  const verifyOtp = () => {
    if (otpArray.join("") === generatedOtp) {
      setStep(2);
    } else {
      alert("Invalid Access Key.");
    }
  };

  // --- FIXED: CREATE REAL ACCOUNT ---
  const submitToFirebase = async () => {
    setLoading(true);
    try {
      // 1. Generate the Secure Internal Password to match signin.jsx
      const internalPass = `STAINV_SECURE_${formData.email.split('@')[0]}_HUB`;

      // 2. Create actual User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, internalPass);
      const user = userCredential.user;

      const startupData = {
        ...formData,
        uid: user.uid,
        createdAt: serverTimestamp(),
        profileStatus: "incomplete", // Matches logic in signin.jsx
        status: "verified",
        role: "startup"
      };

      // 3. Save to Firestore using user.uid
      await setDoc(doc(db, "startups", user.uid), startupData);
      
      setStep(5);
    } catch (error) {
      console.error("Registration Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("This email is already in the registry. Please log in.");
      } else {
        alert("Registration failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-black placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold";
  const labelStyle = "text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block";

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 font-sans text-slate-900 antialiased overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />

      <div className="w-full max-w-[500px] relative z-10">
        <div className="flex flex-col items-center mb-10">
          <Link to="/" className="h-32 mb-4 flex items-center justify-center transition-transform hover:scale-105">
            <img src="stainvrb.png" alt="Logo" className="w-full h-25 object-contain" />
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">Venture Portal</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Phase {step} of 4</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] rounded-[40px] overflow-hidden">
          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <header className="text-center">
                    <h2 className="text-2xl font-extrabold text-slate-900">Identity Check</h2>
                    <p className="text-slate-500 text-sm mt-2">Access restricted. Enter details to begin.</p>
                  </header>
                  <div className="space-y-4">
                    <div>
                      <label className={labelStyle}>Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500" size={18} />
                        <input type="text" placeholder="Full Name" className={`${inputStyle} pl-12`} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className={labelStyle}>Work Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500" size={18} />
                        <input type="email" placeholder="name@company.com" className={`${inputStyle} pl-12`} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                      </div>
                    </div>
                    {!generatedOtp ? (
                      <button onClick={sendEmailOtp} disabled={loading} className="w-full py-4 bg-slate-900 hover:bg-amber-600 text-white rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-[0.98]">
                        {loading ? "Processing..." : "Generate Access Key"}
                      </button>
                    ) : (
                      <div className="space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="flex justify-between gap-2">
                          {otpArray.map((data, index) => (
                            <input key={index} type="text" maxLength="1" ref={(el) => (inputRefs.current[index] = el)} className="w-full h-14 text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:bg-white text-slate-900 outline-none transition-all" value={data} onChange={(e) => handleOtpChange(e.target, index)} onKeyDown={(e) => handleKeyDown(e, index)} />
                          ))}
                        </div>
                        <button onClick={verifyOtp} className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold text-sm hover:bg-amber-700 transition-all shadow-lg shadow-amber-100">
                          Verify & Authenticate
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <header><h2 className="text-2xl font-extrabold text-slate-900">Venture Profile</h2></header>
                  <div className="space-y-5">
                    <div>
                      <label className={labelStyle}>Startup Name</label>
                      <input className={inputStyle} placeholder="Startup Name" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className={labelStyle}>Summary</label>
                      <textarea rows="3" className={`${inputStyle} resize-none`} placeholder="Executive summary..." onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>
                  </div>
                  <button onClick={validateStep} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 group transition-all">
                    Next Protocol <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <header><h2 className="text-2xl font-extrabold text-slate-900">Operational Data</h2></header>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyle}>Tier</label>
                      <select className={inputStyle} onChange={(e)=>setFormData({...formData, stage: e.target.value})}>
                        <option value="">Select</option>
                        <option>Ideation</option><option>Seed</option><option>Series A+</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelStyle}>Industry</label>
                      <select className={inputStyle} onChange={(e)=>setFormData({...formData, industry: e.target.value})}>
                        <option value="">Sector</option>
                        <option>Fintech</option><option>SaaS</option><option>Deep Tech</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyle}>Country</label>
                      <select className={inputStyle} onChange={(e) => setFormData({...formData, country: e.target.value})}>
                        <option value="">Global</option>
                        {countries.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelStyle}>City</label>
                      <select disabled={!formData.country} className={inputStyle} onChange={(e) => setFormData({...formData, city: e.target.value})}>
                        <option value="">Select City</option>
                        {cities.map((city, idx) => <option key={idx} value={city.name}>{city.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={validateStep} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold transition-all shadow-md">Continue</button>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <header><h2 className="text-2xl font-extrabold text-slate-900">Finalize Registry</h2></header>
                  <div className="space-y-4">
                    <div className="relative group">
                      <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input placeholder="LinkedIn URL" className={`${inputStyle} pl-12`} onChange={(e) => setFormData({...formData, linkedin: e.target.value})} />
                    </div>
                  </div>
                  <button onClick={submitToFirebase} disabled={loading} className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-3 hover:bg-amber-700 transition-all">
                    {loading ? "Registering Node..." : "Complete Registration"} <ShieldCheck size={20} />
                  </button>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="s5" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-6">
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Registry Access Granted</h2>
                  <button 
                    onClick={() => navigate("/startupprofilesetup")} 
                    className="px-10 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-amber-600 transition-all shadow-lg"
                  >
                    Configure Profile Hub
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {step > 1 && step < 5 && (
          <button onClick={() => setStep(step - 1)} className="mt-8 flex items-center gap-2 text-slate-400 hover:text-amber-600 transition-colors text-xs font-bold uppercase tracking-widest mx-auto group">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back
          </button>
        )}
      </div>
    </div>
  );
};

export default StartupVerification;