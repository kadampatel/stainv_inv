import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { 
  Search as SearchIcon, X, User, Rocket, Clock, Trash2, Share2,
  ArrowRight, ShieldCheck, Globe, Zap, ArrowLeft
} from 'lucide-react';

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); 
  const navigate = useNavigate();

  // 1. Load History on Mount
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('stainv_search_history') || '[]');
    setHistory(savedHistory);
  }, []);

  // 2. Debounced Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async () => {
    setLoading(true);
    const term = searchTerm.toLowerCase().trim();
    
    try {
      const startupRef = collection(db, "startups");
      const investorRef = collection(db, "investors");

      const [startupSnap, investorSnap] = await Promise.all([
        getDocs(query(startupRef, limit(60))),
        getDocs(query(investorRef, limit(60)))
      ]);

      const uniqueResults = new Map();

      // Process Startups - Standardizing keys for Registry visibility
      startupSnap.docs.forEach(doc => {
        const data = doc.data();
        const searchPool = `${data.startupName} ${data.sector} ${data.industry} ${data.city}`.toLowerCase();
        
        if (searchPool.includes(term)) {
          uniqueResults.set(doc.id, { 
            id: doc.id, // CRITICAL: Mapping Firestore Doc ID
            type: 'startup', 
            ...data 
          });
        }
      });

      // Process Investors - Standardizing keys for Registry visibility
      investorSnap.docs.forEach(doc => {
        const data = doc.data();
        const searchPool = `${data.fullName} ${data.firmName} ${data.investorType}`.toLowerCase();
        
        if (searchPool.includes(term)) {
          uniqueResults.set(doc.id, { 
            id: doc.id, // CRITICAL: Mapping Firestore Doc ID
            type: 'investor', 
            ...data 
          });
        }
      });

      const myId = auth.currentUser?.uid;
      const combined = Array.from(uniqueResults.values()).filter(item => item.id !== myId);
      setResults(combined);
      
    } catch (error) {
      console.error("STAINV Search Protocol Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Navigation with ID Handshake Fixed
  const handleResultClick = (item) => {
    // Add to history (remove duplicates, keep latest 5)
    const newHistory = [item, ...history.filter(h => h.id !== item.id)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('stainv_search_history', JSON.stringify(newHistory));

    // Role-Based Routing
    if (item.type === 'startup' || item.role === 'startup') {
      navigate(`/startup-details/${item.id}`);
    } else {
      navigate(`/profile/${item.id}`);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('stainv_search_history');
  };

  const handleShare = (e, item) => {
    e.stopPropagation(); 
    const shareUrl = `${window.location.origin}/${item.type === 'startup' ? 'startup-details' : 'profile'}/${item.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: item.startupName || item.fullName,
        text: `Access verified ${item.type} dossier on STAINV.`,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Registry link copied to clipboard.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#1d1d1f] font-sans antialiased">
      <style>{`
        .glass-input { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(0, 0, 0, 0.05); }
        .result-card { background: #ffffff; border: 1px solid rgba(0, 0, 0, 0.04); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .result-card:hover { transform: translateY(-2px); border-color: #d97706; box-shadow: 0 15px 30px rgba(217, 119, 6, 0.05); }
      `}</style>

      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 p-4 md:p-6 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-black/5 rounded-2xl transition-colors text-slate-400 hover:text-black active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 relative group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-600 transition-colors" size={18} />
            <input 
              autoFocus
              type="text"
              placeholder="Search node registry..."
              className="w-full glass-input rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 ring-amber-500/10 focus:border-amber-500 transition-all text-lg font-medium shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
               <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/5 rounded-full text-slate-300 transition-all">
                 <X size={16} />
               </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-6 pt-8">
        {searchTerm.length === 0 && history.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-2">
                <Clock size={12} /> Recent Searches
              </h3>
              <button onClick={clearHistory} className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1 hover:underline active:scale-95">
                <Trash2 size={12} /> Wipe History
              </button>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} onClick={() => handleResultClick(item)} className="p-4 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-between cursor-pointer hover:border-amber-200 transition-all shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 overflow-hidden border border-black/5 shadow-inner">
                      <img src={item.logo || item.profilePhotoURL} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{item.startupName || item.fullName}</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-200" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Scanning Nodes</p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {!loading && results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Registry Matches</h3>
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">{results.length} Nodes Online</span>
              </div>
              
              {results.map((result) => (
                <motion.div 
                  layout
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="result-card p-5 rounded-[2.5rem] flex items-center justify-between cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center overflow-hidden border border-black/5 shadow-inner relative">
                      {(result.logo || result.profilePhotoURL) ? (
                        <img src={result.logo || result.profilePhotoURL} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="avatar" />
                      ) : (
                        result.type === 'startup' ? <Rocket size={20} className="text-white" /> : <User size={20} className="text-white" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-black text-md uppercase italic tracking-tight">{result.startupName || result.fullName}</h4>
                        <ShieldCheck size={14} className="text-amber-600" />
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                        <Zap size={10} className="text-amber-500" fill="currentColor"/> {result.type} • {result.industry || result.investorType || 'Verified Node'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleShare(e, result)}
                      className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-black hover:text-white transition-all active:scale-90"
                    >
                      <Share2 size={18} />
                    </button>
                    <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-black/5 group-hover:bg-amber-600 group-hover:text-white transition-all">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loading && searchTerm.length > 1 && results.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32">
              <Globe size={28} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em]">Node ID not found in registry</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default SearchPage;