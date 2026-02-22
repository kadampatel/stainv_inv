import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { db, auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth'; 
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Mail, ChevronRight, ShieldCheck, Lock, ArrowLeft, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [otpArray, setOtpArray] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    emailjs.init("HCcDVQPc_QycQqvEz");
  }, []);

  const generatePIN = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    
    try {
      const invQuery = query(collection(db, "investors"), where("email", "==", email));
      const startupQuery = query(collection(db, "startups"), where("email", "==", email));
      const [invSnap, startupSnap] = await Promise.all([getDocs(invQuery), getDocs(startupQuery)]);

      if (invSnap.empty && startupSnap.empty) {
        setLoading(false);
        return alert("Registry Error: Node ID not recognized.");
      }

      const pin = generatePIN();
      setGeneratedOtp(pin);

      await emailjs.send('service_7c6niil', 'template_megdbbk', {
        email: email,
        verification_code: pin 
      }, 'HCcDVQPc_QycQqvEz');

      setStep(2);
    } catch (error) {
      console.error("Transmission Failure:", error);
      alert("Encryption server sync failed.");
    }
    setLoading(false);
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otpArray];
    newOtp[index] = element.value;
    setOtpArray(newOtp);

    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const verifyAndRedirect = async () => {
    if (otpArray.join("") !== generatedOtp) return alert("Security Error: Access Key Mismatch.");

    setLoading(true);
    try {
      const internalPass = `STAINV_SECURE_${email.split('@')[0]}_HUB`;
      const userCredential = await signInWithEmailAndPassword(auth, email, internalPass);
      const user = userCredential.user;

      const [invSnap, startupSnap] = await Promise.all([
        getDoc(doc(db, "investors", user.uid)),
        getDoc(doc(db, "startups", user.uid))
      ]);

      if (invSnap.exists()) {
        const invData = invSnap.data();
        // Standardized check for Investors
        invData.profileStatus === "complete" ? navigate('/investor-home') : navigate('/investorprofilesetup');
      } else if (startupSnap.exists()) {
        const startupData = startupSnap.data();
        // Standardized check for Startups
        startupData.profileStatus === "complete" ? navigate('/startup-home') : navigate('/startupprofilesetup');
      } else {
        alert("Dossier Mismatch. Manual authorization required.");
        navigate('/');
      }
    } catch (error) {
      console.error("Protocol Error:", error);
      alert(`Terminal Handshake Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden font-sans antialiased">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-slate-50 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-amber-50/40 blur-[80px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-[0.05]" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md relative z-10"
      >
        <div className="flex items-center justify-between mb-12 px-2">
          <button 
            onClick={() => (step === 2 ? setStep(1) : navigate(-1))} 
            className="group flex items-center gap-2 text-slate-400 hover:text-black transition-all active:scale-95"
          >
            <ArrowLeft size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{step === 2 ? 'Return' : 'Registry'}</span>
          </button>
          <img src="/stainvrb.png" alt="STAINV" className="h-16 md:h-20" />
        </div>

        <div className="bg-white border border-slate-100 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.04)] rounded-[48px] p-10 md:p-12 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full">
                <div className="mb-12">
                  <div className="inline-flex p-3 bg-slate-50 rounded-2xl mb-6">
                    <ShieldCheck size={28} className="text-amber-600" />
                  </div>
                  <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Terminal.</h1>
                  <p className="text-slate-400 text-[9px] mt-4 font-black uppercase tracking-[0.4em]">Registry Handshake Required</p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-6 w-full">
                  <div className="space-y-2">
                    <div className="relative group">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                      <input 
                        type="email" 
                        required 
                        placeholder="Authorized Email" 
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl py-5 pl-14 pr-6 outline-none focus:border-amber-600 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300 shadow-sm" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-5 bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : "Request Access Code"}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full">
                <div className="text-center mb-12">
                  <div className="inline-flex p-3 bg-slate-50 rounded-2xl mb-6">
                    <Lock size={28} className="text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 leading-none">Authentication</h2>
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-4">Transmitting to: <span className="text-black italic">{email}</span></p>
                </div>

                {/* MOBILE COMPACT OTP GRID */}
                <div className="flex justify-center gap-2 md:gap-3 mb-12 w-full">
                  {otpArray.map((data, index) => (
                    <input 
                      key={index} 
                      type="text" 
                      inputMode="numeric"
                      maxLength="1" 
                      ref={(el) => (inputRefs.current[index] = el)} 
                      className="w-[14%] aspect-square max-w-[60px] text-center text-xl font-black bg-slate-50 border border-slate-100 rounded-2xl focus:border-amber-600 focus:bg-white outline-none transition-all text-slate-900 shadow-inner" 
                      value={data} 
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                    />
                  ))}
                </div>

                <button 
                  onClick={verifyAndRedirect} 
                  disabled={loading} 
                  className="w-full py-5 bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Establish Connection"}
                </button>
                
                <p className="text-center mt-10 text-[8px] text-slate-300 font-black uppercase tracking-[0.4em]">
                  Secure Interface v.2.0.26
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-12 text-[8px] text-slate-400 font-black uppercase tracking-[0.6em] opacity-40">
          STAINV Institutional Registry
        </p>
      </motion.div>
    </div>
  );
};

export default Login;