import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth } from './firebase'; 
import { 
  doc, onSnapshot, query, collection, where, orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Rocket, ShieldCheck, Zap, Heart, MessageSquare, Share2,
  MessageCircle, Home, PlusSquare, User, Eye, Linkedin, MapPin, X, ChevronRight, Target, DollarSign
} from 'lucide-react';

import { useInteractions } from './investorinteraction';
import InvestorShare from './InvestorShare';

const StartupProfile = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("profile"); 
  const [contentTab, setContentTab] = useState("posts"); 
  const [notifications, setNotifications] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [myPitches, setMyPitches] = useState([]); 
  const [selectedArchitect, setSelectedArchitect] = useState(null);

  // EXPLORER STATES
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const postRefs = useRef({});

  const { handleLike } = useInteractions();
  const isOwnProfile = !id || (auth.currentUser && auth.currentUser.uid === id);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      const targetId = id || (user ? user.uid : null);

      if (!targetId) {
        if (!id) navigate('/');
        setLoading(false);
        return;
      }

      // 1. DATA Dossier
      onSnapshot(doc(db, "startups", targetId), (snap) => {
        if (snap.exists()) setProfileData(snap.data());
        else if (isOwnProfile) navigate('/startupprofilesetup');
        setLoading(false);
      });

      // 2. Timeline (Exclude strategic pitches from timeline grid)
      const qPosts = query(collection(db, "posts"), where("authorId", "==", targetId), orderBy("createdAt", "desc"));
      onSnapshot(qPosts, (snap) => {
        const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMyPosts(posts.filter(p => p.type !== 'strategic_pitch'));
      }, (err) => console.log("Post Index Syncing..."));

      // 3. Pitches Registry (Only strategic items)
      const qPitches = query(collection(db, "pitches"), where("authorId", "==", targetId), orderBy("createdAt", "desc"));
      onSnapshot(qPitches, (snap) => {
        setMyPitches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => console.log("Pitch Index Syncing..."));

      if (user && isOwnProfile) {
        const qNotifs = query(collection(db, "notifications"), where("recipientId", "==", user.uid), orderBy("createdAt", "desc"));
        onSnapshot(qNotifs, (snapshot) => setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
      }
    });
    return () => {};
  }, [id, navigate, isOwnProfile]);

  useEffect(() => {
    if (selectedPostId && postRefs.current[selectedPostId]) {
      setTimeout(() => postRefs.current[selectedPostId].scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [selectedPostId]);

  const handleNavClick = (target) => {
    switch (target) {
      case 'home': navigate('/startup-home'); break;
      case 'startups': navigate('/startup-home', { state: { activeTab: 'startups' } }); break;
      case 'post': navigate('/startup-home', { state: { triggerPost: true } }); break;
      case 'messages': navigate('/chat/hub'); break;
      case 'profile': setSelectedPostId(null); setActiveSubTab("profile"); break;
      default: navigate('/startup-home');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  const data = profileData || { startupName: "Restricted" };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-40 font-sans overflow-x-hidden relative antialiased">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-black"><ArrowLeft size={20} /></button>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Dossier</span>
          </div>
        </div>
        <img src="/stainvrb.png" alt="Logo" className="h-25 object-contain" />
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-8">
        <div className="flex gap-8 mb-10 border-b border-slate-200">
          <button onClick={() => setActiveSubTab("profile")} className={`text-[10px] font-black uppercase tracking-[0.5em] pb-4 transition-all ${activeSubTab === 'profile' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-300'}`}>Profile</button>
          {isOwnProfile && (
            <button onClick={() => setActiveSubTab("notifications")} className={`relative text-[10px] font-black uppercase tracking-[0.5em] pb-4 transition-all ${activeSubTab === 'notifications' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-300'}`}>
              Notifications {notifications.length > 0 && <span className="absolute top-0 -right-4 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span></span>}
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeSubTab === "profile" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
              <section className="relative aspect-[4/5] w-full bg-slate-200 rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
                {data.logo ? <img src={data.logo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-7xl font-black text-slate-200 uppercase">{data.startupName?.[0]}</div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10 right-10 p-8 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-2">{data.sector || data.industry || "Venture Node"}</p>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">{data.startupName}</h2>
                </div>
              </section>

              {/* OPERATIONAL INTEL */}
              <section className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm space-y-8">
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 text-[9px] font-black uppercase text-slate-500 tracking-widest"><Rocket size={12} className="text-amber-600" /> {data.tagline}</div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 text-[9px] font-black uppercase text-slate-500 tracking-widest"><MapPin size={12} className="text-amber-600" /> {data.city}, {data.country}</div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-black rounded-full text-[9px] font-black uppercase text-white shadow-lg tracking-widest"><Zap size={10} className="text-amber-500" fill="currentColor" /> {data.stage}</div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Executive Narrative</h4>
                  <p className="text-2xl text-slate-800 font-serif italic leading-relaxed">"{data.description}"</p>
                </div>
              </section>

              {/* ARCHITECTS */}
              <div className="space-y-6 pt-6">
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300 px-4">The Architects</h3>
                <div className="grid grid-cols-2 gap-4">
                  {data.founders?.map((founder, index) => (
                    <motion.div key={index} whileTap={{ scale: 0.98 }} onClick={() => setSelectedArchitect(founder)} className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm cursor-pointer hover:border-amber-500 transition-all group">
                      <div className="h-12 w-12 rounded-2xl bg-black overflow-hidden flex-shrink-0 border border-black/10 shadow-inner">
                        {founder.photo ? <img src={founder.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-black">{founder.name?.[0]}</div>}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-black uppercase text-slate-900 truncate group-hover:text-amber-600">{founder.name}</p>
                        <p className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">{founder.role}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* FEED TABS */}
              <div className="pt-10 space-y-8">
                <div className="flex justify-center gap-4 bg-slate-100/50 p-1.5 rounded-full max-w-fit mx-auto border border-slate-200">
                  <button onClick={() => setContentTab("posts")} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${contentTab === 'posts' ? 'bg-black text-white shadow-lg' : 'text-slate-400'}`}>Timeline</button>
                  <button onClick={() => setContentTab("pitches")} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${contentTab === 'pitches' ? 'bg-black text-white shadow-lg' : 'text-slate-400'}`}>Pitches</button>
                </div>

                <div className="pb-20">
                  {contentTab === "posts" ? (
                    <div className="grid grid-cols-3 gap-3">
                      {myPosts.map(post => (
                        <div key={post.id} onClick={() => setSelectedPostId(post.id)} className="aspect-square bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden cursor-pointer relative group">
                          {post.mediaUrl ? <img src={post.mediaUrl} className="w-full h-full object-cover" /> : <div className="p-4 flex items-center justify-center h-full bg-slate-50 text-[8px] text-slate-400 italic text-center">"{post.content.substring(0,20)}..."</div>}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><Eye size={20} className="text-white"/></div>
                        </div>
                      ))}
                      {myPosts.length === 0 && <p className="col-span-3 text-center py-20 text-[10px] font-black uppercase text-slate-300">No entries logged.</p>}
                    </div>
                  ) : (
                    <div className="space-y-12 w-full">
                      {isOwnProfile && (
                        <button onClick={() => navigate('/create-pitch')} className="w-full py-5 bg-amber-50 text-amber-600 border border-amber-200 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-amber-100 transition-all">
                          <PlusSquare size={18} /> Initialize Strategic Pitch
                        </button>
                      )}
                      {myPitches.map(pitch => {
                        const hasLiked = pitch.likedBy?.includes(auth.currentUser?.uid);
                        return (
                          <div key={pitch.id} className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-xl relative group">
                             <img src={pitch.bgPhoto || pitch.mediaUrl} className="w-full h-64 object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt="Banner" />
                             <div className="p-10 space-y-6">
                                <div>
                                  <h3 className="text-3xl font-black uppercase italic text-slate-900 leading-tight mb-2 tracking-tighter">{pitch.headline}</h3>
                                  <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest">
                                    <MapPin size={14} /> {pitch.location || "Global"}
                                  </div>
                                </div>
                                <p className="text-lg text-slate-600 italic leading-relaxed">"{pitch.description}"</p>
                                
                                {/* Strategic Bullets (Mapped to keyHighlight) */}
                                <div className="space-y-4 py-8 border-y border-slate-50">
                                  {pitch.keyHighlight && (
                                    <div className="flex items-start gap-4">
                                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                                      <p className="text-md font-bold text-slate-800 tracking-tight">{pitch.keyHighlight}</p>
                                    </div>
                                  )}
                                  {pitch.bulletPoints?.map((bp, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                                      <p className="text-md font-bold text-slate-800 tracking-tight">{bp}</p>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex justify-between items-end pt-4">
                                   <div className="flex gap-10">
                                      <div>
                                         <p className="text-3xl font-black text-slate-900 tracking-tighter">${pitch.totalRequired?.toLocaleString()}</p>
                                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Required</p>
                                      </div>
                                      <div>
                                         <p className="text-3xl font-black text-slate-900 tracking-tighter">${(pitch.minPerInvestor || pitch.minInvestment || 0).toLocaleString()}</p>
                                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min per Investor</p>
                                      </div>
                                   </div>
                                   <div className="flex gap-4">
                                      <button onClick={() => handleLike(pitch)} className={`p-5 rounded-[2rem] bg-slate-50 transition-all ${hasLiked ? 'text-rose-500 scale-110 shadow-lg shadow-rose-500/10' : 'text-slate-400 hover:text-rose-500'}`}>
                                        <Heart size={28} fill={hasLiked ? "currentColor" : "none"}/>
                                      </button>
                                      <button onClick={() => setSharePost(pitch)} className="p-5 rounded-[2rem] bg-slate-50 text-slate-400 hover:text-amber-600 transition-all shadow-sm">
                                        <Share2 size={28}/>
                                      </button>
                                   </div>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                      {myPitches.length === 0 && <p className="text-center py-20 text-[10px] font-black uppercase text-slate-300">No Strategic Registry entries found.</p>}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* OVERLAY: FOUNDER DOSSIER */}
      <AnimatePresence>
        {selectedArchitect && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 30 }} className="fixed inset-0 z-[1000] bg-white overflow-y-auto">
            <div className="sticky top-0 z-50 p-6 flex justify-between items-center bg-white/80 backdrop-blur-md">
              <button onClick={() => setSelectedArchitect(null)} className="p-3 bg-slate-100 rounded-full hover:bg-black hover:text-white transition-all"><ArrowLeft size={24}/></button>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Architect Dossier</h3>
              <div className="w-12" />
            </div>
            <div className="max-w-2xl mx-auto px-4 pt-4 pb-40 space-y-8">
              <section className="relative aspect-[4/5] w-full rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-white">
                <img src={selectedArchitect.photo} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10 right-10 p-8 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/20">
                  <p className="text-[10px] font-black uppercase text-amber-500 mb-2">{data.startupName}</p>
                  <h2 className="text-5xl font-black italic uppercase text-white tracking-tighter leading-none">{selectedArchitect.name}</h2>
                </div>
              </section>
              <section className="bg-white rounded-[3rem] p-12 border border-slate-100 space-y-8 shadow-sm">
                <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 rounded-2xl border border-amber-100 max-w-fit"><ShieldCheck className="text-amber-600" size={18} /><span className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">{selectedArchitect.role}</span></div>
                <div className="h-[2px] w-16 bg-slate-900" />
                <p className="text-2xl text-slate-700 font-serif italic leading-relaxed">{selectedArchitect.bio || "Lead visionary scaling technological growth."}</p>
                {selectedArchitect.linkedIn && (
                  <a href={selectedArchitect.linkedIn} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-blue-600 font-black text-xs uppercase tracking-widest hover:underline pt-6 border-t border-slate-50"><Linkedin size={20} /> Access External Profile</a>
                )}
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY: TIMELINE EXPLORER */}
      <AnimatePresence>
        {selectedPostId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1100] bg-[#F8FAFC] overflow-y-auto">
            <div className="sticky top-0 z-[1200] bg-white/80 backdrop-blur-xl p-6 border-b border-slate-100 flex items-center justify-between">
              <button onClick={() => setSelectedPostId(null)} className="p-2 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"><ArrowLeft size={20} /></button>
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Venture Feed</h3>
              <div className="w-10" />
            </div>
            <div className="max-w-2xl mx-auto p-4 space-y-12 py-10 pb-40">
              {myPosts.map((post) => {
                const hasUserLiked = post.likedBy?.includes(auth.currentUser?.uid);
                return (
                  <div key={post.id} ref={el => postRefs.current[post.id] = el} className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl transition-all">
                    <div className="p-8 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-black overflow-hidden flex items-center justify-center">
                        {data.logo ? <img src={data.logo} className="w-full h-full object-cover" /> : <div className="text-white font-black">{data.startupName?.[0]}</div>}
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase text-slate-900">{data.startupName}</h4>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Network Transmission</p>
                      </div>
                    </div>
                    <div className="px-10 pb-8 text-xl text-slate-700 font-serif italic leading-relaxed">"{post.content}"</div>
                    {post.mediaUrl && <div className="px-6 pb-6"><img src={post.mediaUrl} className="w-full rounded-[2.5rem] aspect-square object-cover shadow-inner" alt="post" /></div>}
                    <div className="p-10 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex gap-12 text-slate-400">
                          <button onClick={() => handleLike(post)} className={`flex items-center gap-2 transition-all ${hasUserLiked ? 'text-rose-500 scale-110' : 'hover:text-rose-500'}`}><Heart size={26} fill={hasUserLiked ? "currentColor" : "none"} /><span className="font-black text-xs">{post.likes || 0}</span></button>
                          <button className="flex items-center gap-2 hover:text-indigo-600 transition-all"><MessageSquare size={26} /><span className="font-black text-xs">{post.commentsCount || 0}</span></button>
                       </div>
                       <button onClick={() => setSharePost(post)} className="p-4 bg-slate-50 rounded-full hover:bg-amber-500 hover:text-white transition-all shadow-sm"><Share2 size={22} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InvestorShare isOpen={!!sharePost} onClose={() => setSharePost(null)} postData={sharePost} />

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-[450px] bg-white/80 backdrop-blur-2xl border border-slate-200 px-8 py-5 rounded-[32px] flex justify-between items-center z-50 shadow-2xl">
        <NavIcon icon={<Home />} active={false} onClick={() => handleNavClick('home')} />
        <NavIcon icon={<Rocket />} active={false} onClick={() => handleNavClick('startups')} />
        <NavIcon icon={<PlusSquare />} active={false} onClick={() => handleNavClick('post')} />
        <NavIcon icon={<MessageCircle />} active={false} onClick={() => handleNavClick('messages')} />
        <NavIcon icon={<User />} active={activeSubTab === 'profile' && !selectedPostId} onClick={() => handleNavClick('profile')} />
      </nav>
    </div>
  );
};

const NavIcon = ({ icon, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-amber-600 scale-125' : 'text-slate-300 hover:text-slate-600'}`}>
    {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
    {active && <motion.div layoutId="navDot" className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1" />}
  </button>
);

export default StartupProfile;