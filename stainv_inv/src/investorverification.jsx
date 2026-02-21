import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { db, auth } from './firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'; 
import { 
  ChevronRight, ShieldCheck, Mail, Globe, 
  Linkedin, User, CheckCircle2, ChevronLeft, Search, Check
} from 'lucide-react';

const countries = [
  "United States", "United Kingdom", "Canada", "Germany", "France", "India", 
  "Singapore", "Australia", "United Arab Emirates", "Switzerland", "Japan",
  "Netherlands", "Israel", "Sweden", "Norway", "Denmark", "Finland", "Brazil"
].sort();

const InvestorVerification = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [otpArray, setOtpArray] = useState(new Array(6).fill(""));
  const [showCountryList, setShowCountryList] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    country: '',
    linkedin: ''
  });

  useEffect(() => {
    emailjs.init("HCcDVQPc_QycQqvEz");
  }, []);

  const generatePIN = () => Math.floor(100000 + Math.random() * 900000).toString();

  const sendEmailOtp = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) return alert("Credentials required.");
    setLoading(true);
    const pin = generatePIN();
    setGeneratedOtp(pin);
    try {
      await emailjs.send('service_7c6niil', 'template_megdbbk', {
        to_name: formData.fullName,
        email: formData.email, 
        verification_code: pin, 
      }, 'HCcDVQPc_QycQqvEz');
      setStep(2);
    } catch (error) {
      alert("Mail server error. Protocol offline.");
    }
    setLoading(false);
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otpArray];
    newOtp[index] = element.value;
    setOtpArray(newOtp);
    if (element.value !== "" && index < 5) inputRefs.current[index + 1].focus();
  };

  const verifyOtpAndProceed = () => {
    if (otpArray.join("") === generatedOtp) setStep(3);
    else alert("Invalid Security Code.");
  };

  const submitFinalProfile = async () => {
    if (!formData.country) return alert("Please select your country.");
    
    setLoading(true);
    try {
      // --- PERSISTENT AUTH PROTOCOL ---
      // SYNCED: Now matches signin.jsx handshake string exactly
      const internalPass = `STAINV_SECURE_${formData.email.split('@')[0]}_HUB`;
      
      let user;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, internalPass);
        user = userCredential.user;
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          const userCredential = await signInWithEmailAndPassword(auth, formData.email, internalPass);
          user = userCredential.user;
        } else {
          throw authError;
        }
      }

      const investorRef = doc(db, "investors", user.uid);
      const existingDoc = await getDoc(investorRef);

      if (!existingDoc.exists() || existingDoc.data().profileStatus !== "complete") {
        await setDoc(investorRef, {
          ...formData,
          uid: user.uid,
          timestamp: new Date().toISOString(),
          role: "investor",
          isVerified: true,
          profileStatus: "incomplete",
          commentPrivacy: 'all' 
        }, { merge: true });
        
        // SYNCED: Matches App.jsx route path
        navigate('/investorprofilesetup'); 
      } else {
        navigate('/investor-home');
      }
      
    } catch (error) {
      console.error("Critical System Error:", error);
      alert("Verification Sync Failed. Network interrupted.");
    }
    setLoading(false);
  };

  const filteredCountries = countries.filter(c => 
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
      
      <Link to="/" className="mb-12 relative z-10 transition-all hover:opacity-70">
        <img src="/stainvrb.png" alt="STAINV" className="h-25 w-auto" />
      </Link>

      <motion.div layout className="w-full max-w-xl bg-white border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] rounded-[48px] p-10 md:p-14 relative z-10">
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-10">
                <div className="bg-black w-14 h-14 rounded-2xl text-white flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <ShieldCheck size={28} />
                </div>
                <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Investor Entrance</h1>
                <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase mt-3">Identity Verification protocol</p>
              </div>

              <form onSubmit={sendEmailOtp} className="space-y-6">
                <InputField icon={<User size={18} />} label="Full Name" placeholder="Alex Sterling" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                <InputField icon={<Mail size={18} />} label="Work Email" placeholder="alex@capital.com" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                <button type="submit" disabled={loading} className="w-full py-5 bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] mt-4 flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-2xl active:scale-95 disabled:opacity-50">
                  {loading ? "Initializing Terminal..." : "Request Access Key"} <ChevronRight size={18} />
                </button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
              <Mail size={40} className="text-amber-600 mx-auto mb-6" />
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Decryption Key</h2>
              <p className="text-slate-400 text-sm mt-2 font-medium leading-relaxed">Verification key transmitted to <br/> <span className="text-slate-900 font-bold">{formData.email}</span></p>
              <div className="flex justify-center gap-3 my-10">
                {otpArray.map((data, index) => (
                  <input key={index} type="text" maxLength="1" ref={(el) => (inputRefs.current[index] = el)} className="w-12 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-xl font-black focus:border-amber-600 focus:bg-white outline-none transition-all text-slate-900" value={data} onChange={(e) => handleOtpChange(e.target, index)} />
                ))}
              </div>
              <button onClick={verifyOtpAndProceed} className="w-full py-5 bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-amber-600 active:scale-95">Validate Identity</button>
              <button onClick={() => setStep(1)} className="mt-8 flex items-center justify-center gap-2 text-[9px] text-slate-400 uppercase tracking-widest font-black hover:text-slate-900 transition-all"><ChevronLeft size={14} /> Correct email</button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-10">
                <Globe size={32} className="text-amber-600 mx-auto mb-4" />
                <h1 className="text-3xl font-black uppercase italic tracking-tight leading-none">Presence</h1>
                <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase mt-3">Registry Localization</p>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-2 relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Country of Residence</label>
                  <div 
                    onClick={() => setShowCountryList(!showCountryList)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-5 pl-14 pr-6 cursor-pointer flex items-center justify-between transition-all hover:bg-white"
                  >
                    <div className="absolute left-6 text-slate-400"><Globe size={20} /></div>
                    <span className={formData.country ? "text-slate-900 font-bold text-sm" : "text-slate-400 text-sm font-medium"}>
                      {formData.country || "Select Residency"}
                    </span>
                    <ChevronRight size={20} className={`text-slate-400 transition-transform ${showCountryList ? 'rotate-90' : ''}`} />
                  </div>

                  <AnimatePresence>
                    {showCountryList && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-[105%] left-0 w-full bg-white border-2 border-slate-100 shadow-2xl rounded-[32px] z-50 overflow-hidden" >
                        <div className="p-4 border-b border-slate-50 flex items-center gap-3 bg-slate-50/50">
                          <Search size={18} className="text-slate-400" />
                          <input autoFocus placeholder="Filter Registry..." className="w-full outline-none text-sm font-bold bg-transparent" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} />
                        </div>
                        <div className="max-h-56 overflow-y-auto custom-scrollbar">
                          {filteredCountries.map((c) => (
                            <div key={c} onClick={() => { setFormData({...formData, country: c}); setShowCountryList(false); setCountrySearch(""); }} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-amber-600 cursor-pointer flex items-center justify-between transition-colors" >
                              {c} {formData.country === c && <Check size={16} className="text-amber-600" />}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <InputField icon={<Linkedin size={18} />} label="LinkedIn Dossier (Optional)" placeholder="linkedin.com/in/username" value={formData.linkedin} required={false} onChange={(e) => setFormData({...formData, linkedin: e.target.value})} />
                
                <button onClick={submitFinalProfile} disabled={loading} className="w-full py-5 bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] mt-4 flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-2xl active:scale-95 disabled:opacity-50">
                  {loading ? "Establishing Link..." : "Verify & Enter STAINV"} <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const InputField = ({ icon, label, placeholder, type = "text", value, onChange, required = true }) => (
  <div className="flex flex-col gap-2 relative group">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors">{icon}</div>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-5 pl-14 pr-6 focus:outline-none focus:border-amber-600 focus:bg-white transition-all text-slate-900 text-sm font-bold shadow-sm placeholder:text-slate-300" />
    </div>
  </div>
);

export default InvestorVerification;