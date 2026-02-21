import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase'; 
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Country, City } from 'country-state-city';
import { 
  Rocket, Users, BarChart3, Image as ImageIcon, 
  ChevronRight, ChevronLeft, Upload, Plus, Trash2, 
  CheckCircle2, Globe, Linkedin, MapPin, Calendar, Briefcase, Camera, X, Layout, Search
} from 'lucide-react';

const StartupProfileSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Search & List UI States
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showCountryList, setShowCountryList] = useState(false);
  const [showCityList, setShowCityList] = useState(false);

  const [formData, setFormData] = useState({
    startupName: '',
    tagline: '',
    logo: null,
    website: '',
    establishYear: '',
    stage: 'Ideation',
    city: '',
    country: '',
    countryCode: '', 
    
    founders: [{ 
      name: '', 
      role: '', 
      bio: '', 
      photos: [null, null, null, null], 
      linkedIn: '', 
      experience: '' 
    }],
    
    description: '',
    sector: '',
    revenue: 'Pre-revenue',
    employeeCount: '1-10',
    pitchDeckUrl: '',
  });

  // --- Filtered Lists for Search ---
  const allCountries = Country.getAllCountries();
  const filteredCountries = allCountries.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  ).slice(0, 15);

  const availableCities = formData.countryCode ? City.getCitiesOfCountry(formData.countryCode) : [];
  const filteredCities = availableCities.filter(c => 
    c.name.toLowerCase().includes(citySearch.toLowerCase())
  ).slice(0, 15);

  const uploadToCloudinary = async (file) => {
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
      console.error("Cloudinary Error:", err);
      return null;
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.startupName.trim() || !formData.tagline.trim() || !formData.logo) {
        alert("Core identity fields (Name, Tagline, Logo) are mandatory.");
        return false;
      }
      if (!formData.country || !formData.city) {
        alert("Please select a valid Country and City from the list.");
        return false;
      }
    }
    if (step === 2) {
      for (const f of formData.founders) {
        if (!f.name.trim() || !f.role.trim()) {
          alert("Each founder must have a Name and Role.");
          return false;
        }
        if (!f.photos[0]) {
          alert(`Founder ${f.name || ''} must have at least a primary photo.`);
          return false;
        }
      }
    }
    if (step === 3) {
        if (!formData.sector) {
            alert("Please select your industry sector.");
            return false;
        }
    }
    return true;
  };

  const handleDeploy = async () => {
    if (!validateStep()) return;
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return alert("Session expired. Please log in again.");
    }

    try {
      const logoUrl = await uploadToCloudinary(formData.logo);

      const processedFounders = await Promise.all(
        formData.founders.map(async (f) => {
          const uploadedPhotoUrls = await Promise.all(
            f.photos.map(async (photoFile) => {
              return photoFile ? await uploadToCloudinary(photoFile) : null;
            })
          );
          return {
            ...f,
            photos: uploadedPhotoUrls.filter(url => url !== null),
            photo: uploadedPhotoUrls[0] 
          };
        })
      );

      const startupPayload = {
        ...formData,
        logo: logoUrl,
        founders: processedFounders,
        uid: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
        role: 'startup', 
        type: 'startup',
        profileStatus: 'complete'
      };

      await setDoc(doc(db, "startups", user.uid), startupPayload);
      
      alert("Strategic Dossier Deployed!");
      navigate("/startup-home"); 
    } catch (error) {
      console.error("Deployment Error:", error);
      alert("Deployment failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const updateFounder = (index, field, value) => {
    const newFounders = [...formData.founders];
    newFounders[index][field] = value;
    setFormData({ ...formData, founders: newFounders });
  };

  const updateFounderPhoto = (founderIndex, photoIndex, file) => {
    const newFounders = [...formData.founders];
    newFounders[founderIndex].photos[photoIndex] = file;
    setFormData({ ...formData, founders: newFounders });
  };

  const addFounder = () => {
    setFormData({
      ...formData,
      founders: [...formData.founders, { 
        name: '', role: '', bio: '', photos: [null, null, null, null], linkedIn: '', experience: '' 
      }]
    });
  };

  const removeFounder = (index) => {
    if (formData.founders.length > 1) {
      const newFounders = formData.founders.filter((_, i) => i !== index);
      setFormData({ ...formData, founders: newFounders });
    }
  };

  const nextStep = () => validateStep() && setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans pb-32">
      <nav className="sticky top-0 z-[100] flex justify-between items-center px-8 py-6 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <img src="/stainvrb.png" alt="STAINV" className="h-25 w-auto" />
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Phase {step} / 3</span>
          <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div className="h-full bg-amber-500" animate={{ width: `${(step / 3) * 100}%` }} />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-16 px-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
              <header><h1 className="text-5xl font-black tracking-tighter uppercase italic">Core Identity.</h1></header>
              <div className="grid md:grid-cols-[180px_1fr] gap-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-40 h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden group">
                    {formData.logo ? <img src={URL.createObjectURL(formData.logo)} className="w-full h-full object-cover" alt="" /> : <Upload className="text-slate-300" />}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFormData({...formData, logo: e.target.files[0]})} />
                  </div>
                  <p className="text-[9px] font-black uppercase text-slate-400">Registry Logo</p>
                </div>
                <div className="space-y-6 w-full">
                  <input type="text" placeholder="Startup Name *" className="w-full bg-transparent border-b border-slate-200 py-3 text-3xl font-bold outline-none focus:border-amber-500 text-black" value={formData.startupName} onChange={e => setFormData({...formData, startupName: e.target.value})} />
                  <input type="text" placeholder="One-Line Pitch (Value Prop) *" className="w-full bg-transparent border-b border-slate-200 py-3 text-lg outline-none text-black" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Searchable Country Selector */}
                    <div className="relative">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1 mb-1 block">Origin Country</label>
                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 focus-within:border-amber-500 transition-all">
                            <Globe size={16} className="text-amber-500" />
                            <input 
                                placeholder="Search Country..." 
                                className="bg-transparent text-sm w-full outline-none text-black font-bold" 
                                value={countrySearch || formData.country}
                                onFocus={() => setShowCountryList(true)}
                                onChange={(e) => {setCountrySearch(e.target.value); setShowCountryList(true);}}
                            />
                        </div>
                        {showCountryList && (
                            <div className="absolute top-full left-0 w-full bg-white border border-slate-100 rounded-xl mt-1 shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                {filteredCountries.map(c => (
                                    <div key={c.isoCode} className="p-3 hover:bg-amber-50 cursor-pointer text-xs font-bold border-b border-slate-50 last:border-0" onClick={() => {
                                        setFormData({...formData, country: c.name, countryCode: c.isoCode, city: ''});
                                        setCountrySearch(c.name);
                                        setCitySearch("");
                                        setShowCountryList(false);
                                    }}>{c.name}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Searchable City Selector */}
                    <div className="relative">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1 mb-1 block">HQ City</label>
                        <div className={`flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 focus-within:border-amber-500 transition-all ${!formData.country && 'opacity-50'}`}>
                            <MapPin size={16} className="text-amber-500" />
                            <input 
                                disabled={!formData.country}
                                placeholder={formData.country ? "Search City..." : "Select Country First"}
                                className="bg-transparent text-sm w-full outline-none text-black font-bold" 
                                value={citySearch || formData.city}
                                onFocus={() => setShowCityList(true)}
                                onChange={(e) => {setCitySearch(e.target.value); setShowCityList(true);}}
                            />
                        </div>
                        {showCityList && formData.country && (
                            <div className="absolute top-full left-0 w-full bg-white border border-slate-100 rounded-xl mt-1 shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                {filteredCities.length > 0 ? filteredCities.map((city, idx) => (
                                    <div key={idx} className="p-3 hover:bg-amber-50 cursor-pointer text-xs font-bold border-b border-slate-50 last:border-0" onClick={() => {
                                        setFormData({...formData, city: city.name});
                                        setCitySearch(city.name);
                                        setShowCityList(false);
                                    }}>{city.name}</div>
                                )) : <div className="p-3 text-[10px] text-slate-400">No cities found in registry</div>}
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
              <header><h1 className="text-5xl font-black tracking-tighter uppercase italic">Architects.</h1></header>
              <div className="space-y-12">
                {formData.founders.map((founder, index) => (
                  <div key={index} className="p-8 rounded-[2.5rem] bg-white border border-slate-200 relative shadow-sm">
                    {formData.founders.length > 1 && <button onClick={() => removeFounder(index)} className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={18}/></button>}
                    
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <Camera size={12} className="text-amber-500" /> Team Visuals (Primary + Secondary)
                        </label>
                        <div className="grid grid-cols-4 gap-4">
                          {founder.photos.map((photo, pIdx) => (
                            <div key={pIdx} className={`relative aspect-square rounded-2xl border-2 border-dashed ${pIdx === 0 && !photo ? 'border-amber-300 bg-amber-50/30' : 'border-slate-100 bg-slate-50'} flex items-center justify-center overflow-hidden group transition-all`}>
                              {photo ? (
                                <>
                                  <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" alt="Founder" />
                                  <button onClick={() => updateFounderPhoto(index, pIdx, null)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                </>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <Upload size={16} className={pIdx === 0 ? "text-amber-400" : "text-slate-300"} />
                                  <span className="text-[8px] font-black mt-1 text-slate-400 uppercase">{pIdx === 0 ? "Primary *" : `Slot ${pIdx + 1}`}</span>
                                </div>
                              )}
                              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => updateFounderPhoto(index, pIdx, e.target.files[0])} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <input placeholder="Full Name" className="border-b border-slate-100 py-2 font-bold outline-none text-black" value={founder.name} onChange={e => updateFounder(index, 'name', e.target.value)} />
                        <input placeholder="Role (e.g. CEO)" className="border-b border-slate-100 py-2 font-bold text-amber-600 outline-none" value={founder.role} onChange={e => updateFounder(index, 'role', e.target.value)} />
                        <input placeholder="LinkedIn URL" className="md:col-span-2 border-b border-slate-100 py-2 text-xs outline-none text-black" value={founder.linkedIn} onChange={e => updateFounder(index, 'linkedIn', e.target.value)} />
                        <textarea placeholder="Professional Background & Experience" className="md:col-span-2 bg-slate-50 p-4 rounded-xl text-sm h-20 outline-none text-black" value={founder.bio} onChange={e => updateFounder(index, 'bio', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addFounder} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">+ Add Co-Architect</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
              <header><h1 className="text-5xl font-black tracking-tighter uppercase italic">Strategic Intel.</h1></header>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Funding Stage</label>
                  <select className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                    <option>Ideation</option><option>MVP / Stealth</option><option>Pre-Seed</option><option>Seed</option><option>Series A+</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Industry Sector</label>
                  <select className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black" value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})}>
                    <option value="">Select Sector</option>
                    <option>Fintech</option><option>SaaS</option><option>AI / ML</option><option>Web3</option><option>Healthcare</option><option>E-commerce</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Annual Revenue</label>
                  <select className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black" value={formData.revenue} onChange={e => setFormData({...formData, revenue: e.target.value})}>
                    <option>Pre-revenue</option><option>$1k - $50k</option><option>$50k - $250k</option><option>$250k - $1M</option><option>$1M+</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Establishment Year</label>
                  <input type="number" placeholder="2025" className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black" value={formData.establishYear} onChange={e => setFormData({...formData, establishYear: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic text-amber-600">Pitch Deck / Data Room URL</label>
                  <div className="flex items-center gap-3 bg-white border-2 border-amber-100 p-4 rounded-2xl">
                    <Layout size={20} className="text-amber-500" />
                    <input placeholder="https://docsend.com/view/..." className="w-full outline-none font-medium text-black" value={formData.pitchDeckUrl} onChange={e => setFormData({...formData, pitchDeckUrl: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Executive Ask & Long-term Vision</label>
                  <textarea className="w-full p-6 bg-white border border-slate-200 rounded-3xl h-32 outline-none focus:border-amber-500 text-black font-medium" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="fixed bottom-0 left-0 right-0 p-8 bg-white/90 backdrop-blur-xl border-t border-slate-200 flex justify-between items-center z-[100]">
          <button onClick={prevStep} disabled={step === 1 || loading} className={`flex items-center gap-2 font-black uppercase tracking-widest text-xs ${step === 1 ? 'opacity-0' : 'text-slate-400 hover:text-black'}`}><ChevronLeft size={16}/> Previous</button>
          {step < 3 ? (
            <button onClick={nextStep} className="bg-black text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-600 transition-all flex items-center gap-2">Continue <ChevronRight size={16}/></button>
          ) : (
            <button onClick={handleDeploy} disabled={loading} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-xl">
              {loading ? "Transmitting..." : "Finalize Dossier"} <CheckCircle2 size={16}/>
            </button>
          )}
        </footer>
      </main>
    </div>
  );
};

export default StartupProfileSetup;