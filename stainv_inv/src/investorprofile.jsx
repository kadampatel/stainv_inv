import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from './firebase'; 
import { 
  doc, getDoc, collection, query, where, onSnapshot, 
  orderBy, deleteDoc, setDoc, serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Briefcase, Star, Home, Rocket, PlusSquare, 
  MessageCircle, User, X, Settings, LogOut, Heart, Share2, MessageSquare,
  ChevronRight, ShieldCheck, Zap, Eye, BarChart3, Send, Trash2
} from 'lucide-react';

import { useInteractions } from './investorinteraction';
import InvestorShare from './InvestorShare';

const InvestorProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [investorData, setInvestorData] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState("profile"); 
  const [notifications, setNotifications] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  // EXPLORER, COMMENT & INSIGHTS STATES
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [commentingPostId, setCommentingPostId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [sharePost, setSharePost] = useState(null);
  
  const [viewingMetrics, setViewingMetrics] = useState(null);
  const [likersDetails, setLikersDetails] = useState([]);
  const [fetchingMetrics, setFetchingMetrics] = useState(false);

  const postRefs = useRef({});
  const scrollRef = useRef(null);

  const { handleLike, submitComment, deleteComment } = useInteractions();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "investors", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setInvestorData({ id: user.uid, ...docSnap.data() });

            // 1. STREAM MY POSTS
            const qPosts = query(collection(db, "posts"), where("authorId", "==", user.uid), orderBy("createdAt", "desc"));
            const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
              setMyPosts(snapshot.docs.map(d => ({ 
                id: d.id, 
                ...d.data(),
                comments: Array.isArray(d.data().comments) ? d.data().comments : []
              })));
              setLoading(false); 
            });

            // 2. STREAM NOTIFICATIONS
            const qNotifs = query(collection(db, "notifications"), where("recipientId", "==", user.uid), orderBy("createdAt", "desc"));
            const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
              setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            });

            return () => { unsubscribePosts(); unsubscribeNotifs(); };
          } else {
            navigate('/investorprofilesetup');
          }
        } catch (error) {
          console.error("Dossier Sync Error:", error);
          setLoading(false);
        }
      } else {
        navigate('/');
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  // AUTO-SCROLL TO SELECTED POST IN EXPLORER
  useEffect(() => {
    if (selectedPostId && postRefs.current[selectedPostId]) {
      postRefs.current[selectedPostId].scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [selectedPostId]);

  // INSIGHTS LOGIC
  const openMetrics = async (post) => {
    setViewingMetrics(post);
    setFetchingMetrics(true);
    const details = [];
    if (post.likedBy && post.likedBy.length > 0) {
      try {
        for (const uid of post.likedBy) {
          let uSnap = await getDoc(doc(db, "investors", uid));
          if (!uSnap.exists()) uSnap = await getDoc(doc(db, "startups", uid));
          if (uSnap.exists()) details.push({ id: uSnap.id, ...uSnap.data() });
        }
      } catch (e) { console.error("Stats failure:", e); }
    }
    setLikersDetails(details);
    setFetchingMetrics(false);
  };

  const activeCommentPost = myPosts.find(p => p.id === commentingPostId);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !commentingPostId) return;
    try {
      await submitComment(commentingPostId, newComment, investorData);
      setNewComment("");
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (err) { console.error(err); }
  };

  const handleNavClick = (target) => {
    switch (target) {
      case 'home': navigate('/investor-home', { state: { activeTab: 'home' } }); break;
      case 'startups': navigate('/investor-home', { state: { activeTab: 'startups' } }); break;
      case 'post': navigate('/investor-home', { state: { activeTab: 'home', triggerPost: true } }); break;
      case 'messages': navigate('/chat/hub'); break;
      case 'profile': setSelectedPostId(null); setActiveSubTab("profile"); break;
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-6" />
      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-600">Identity Syncing</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-40 font-sans relative antialiased">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ArrowLeft size={20} /></button>
           <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Dossier</span>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(true)} className="p-2.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-amber-600 transition-all"><Settings size={20} /></button>
          <img src="/stainvrb.png" alt="Logo" className="h-25 md:h-10 ml-2" />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-8">
        <div className="flex gap-8 mb-10 border-b border-slate-200/60 pb-4">
          <button onClick={() => setActiveSubTab("profile")} className={`text-[10px] font-black uppercase tracking-[0.5em] pb-4 ${activeSubTab === 'profile' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-300'}`}>Profile</button>
          <button onClick={() => setActiveSubTab("notifications")} className={`text-[10px] font-black uppercase tracking-[0.5em] pb-4 ${activeSubTab === 'notifications' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-300'}`}>Notifications</button>
        </div>

        <AnimatePresence mode="wait">
          {activeSubTab === "profile" ? (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <section className="relative aspect-[4/5] w-full bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden group">
                {investorData?.profilePhotoURL ? (
                  <img src={investorData.profilePhotoURL} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" alt="Profile" />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center font-serif italic text-slate-200 text-9xl uppercase">{investorData?.fullName?.charAt(0)}</div>
                )}
                <div className="absolute bottom-10 left-10 right-10 p-8 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-2">{investorData?.investorType}</p>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">{investorData?.fullName}</h2>
                </div>
              </section>

              <section className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm space-y-8">
                <div className="flex flex-wrap gap-3 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 rounded-full border border-slate-100"><MapPin size={12} className="text-amber-600"/> {investorData?.country}</span>
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 rounded-full border border-slate-100"><Briefcase size={12} className="text-amber-600"/> {investorData?.experienceRole}</span>
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 rounded-full border border-amber-100"><Star size={12} /> {investorData?.firmName}</span>
                </div>
                <p className="text-2xl text-slate-700 font-serif italic leading-relaxed">"{investorData?.bio || "Thesis restricted."}"</p>
              </section>

              <div className="grid grid-cols-3 gap-2 pb-20">
                {myPosts.map(post => (
                  <div key={post.id} onClick={() => setSelectedPostId(post.id)} className="relative aspect-square rounded-[1.5rem] overflow-hidden cursor-pointer group border border-slate-200 shadow-sm bg-white">
                    {post.mediaUrl ? (
                      <img src={post.mediaUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="p-4 flex items-center justify-center h-full text-center bg-slate-50">
                        <p className="text-[8px] text-slate-400 font-bold italic truncate">"{post.content}"</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Eye size={20} className="text-white" /></div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
               {notifications.length === 0 ? <p className="py-40 text-center text-[10px] font-black uppercase text-slate-300 tracking-[0.5em]">Clear Feed</p> : 
               notifications.map(n => <div key={n.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm font-black text-sm uppercase">{n.senderName} requested access</div>)}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FULL SCREEN TIMELINE EXPLORER */}
      <AnimatePresence>
        {selectedPostId && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 z-[600] bg-white overflow-y-auto">
            <nav className="sticky top-0 z-[610] bg-white border-b border-slate-100 p-6 flex items-center justify-between">
              <button onClick={() => setSelectedPostId(null)} className="p-2 bg-slate-50 rounded-full"><ArrowLeft size={20} /></button>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Timeline Explorer</h3>
              <div className="w-10" />
            </nav>
            <div className="max-w-2xl mx-auto p-4 space-y-12 py-10">
              {myPosts.map((post) => {
                const hasUserLiked = post.likedBy?.includes(auth.currentUser?.uid);
                return (
                  <div key={post.id} ref={el => postRefs.current[post.id] = el} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all">
                    <div className="p-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black uppercase text-xs overflow-hidden">
                        {investorData?.profilePhotoURL ? <img src={investorData.profilePhotoURL} className="w-full h-full object-cover" /> : investorData?.fullName?.[0]}
                      </div>
                      <div><h4 className="text-xs font-black uppercase text-slate-900">{investorData?.fullName}</h4><p className="text-[8px] font-black text-slate-400 uppercase">Authorized Signal</p></div>
                    </div>
                    <div className="px-8 pb-6 text-lg text-slate-700 italic font-serif leading-relaxed">"{post.content}"</div>
                    {post.mediaUrl && <div className="px-4 pb-4"><img src={post.mediaUrl} className="w-full rounded-[2rem] aspect-square object-cover" alt="" /></div>}
                    <div className="p-8 border-t border-slate-50 flex items-center gap-10 text-slate-400">
                       <button onClick={() => handleLike(post)} className={`flex items-center gap-2 transition-all ${hasUserLiked ? 'text-rose-500 scale-110' : 'hover:text-rose-500'}`}>
                         <Heart size={24} className={hasUserLiked ? "fill-rose-500" : ""} />
                         <span className="font-black text-xs">{post.likes || 0}</span>
                       </button>
                       <button onClick={() => setCommentingPostId(post.id)} className="flex items-center gap-2 hover:text-indigo-600">
                         <MessageSquare size={24} />
                         <span className="font-black text-xs">{post.comments?.length || 0}</span>
                       </button>
                       {/* INSIGHTS BUTTON RESTORED */}
                       <button onClick={() => openMetrics(post)} className="flex items-center gap-2 hover:text-amber-600 transition-all">
                         <BarChart3 size={24} />
                         <span className="text-[9px] font-black uppercase tracking-widest">Stats</span>
                       </button>
                       <button onClick={() => setSharePost(post)} className="ml-auto p-3 bg-slate-50 rounded-full hover:bg-amber-500 hover:text-white transition-all">
                         <Share2 size={20} />
                       </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INTEL REGISTRY (COMMENT OVERLAY) */}
      <AnimatePresence>
        {activeCommentPost && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 z-[1000] bg-white flex flex-col">
            <nav className="p-6 flex items-center gap-6 border-b border-slate-100 bg-white sticky top-0 z-20">
              <button onClick={() => setCommentingPostId(null)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-black transition-all"><ArrowLeft size={20}/></button>
              <div><h3 className="text-xs font-black uppercase tracking-[0.3em]">Intel Registry</h3><p className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Active Discussion</p></div>
            </nav>
            <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
              <div className="p-6 bg-white border-b border-slate-100 opacity-60"><p className="text-sm font-medium italic text-slate-600 leading-relaxed line-clamp-2">"{activeCommentPost.content}"</p></div>
              
              <div className="grid grid-cols-2 gap-4 p-6 border-b border-slate-100 bg-white">
                 <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-4">
                    <Eye size={18} className="text-amber-600"/><p className="text-lg font-black">{activeCommentPost.views || 0}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-4">
                    <Heart size={18} className="text-rose-500" fill="currentColor"/><p className="text-lg font-black">{activeCommentPost.likes || 0}</p>
                 </div>
              </div>

              <div className="p-6 space-y-4">
                {activeCommentPost.comments.map((c, idx) => {
                  const isPostOwner = activeCommentPost.authorId === auth.currentUser?.uid;
                  return (
                    <div key={`${activeCommentPost.id}-c-${idx}`} className="flex gap-4 items-start bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm">
                      <div onClick={() => { setCommentingPostId(null); navigate(`/profile/${c.authorId}`); }} className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center text-xs font-black cursor-pointer flex-shrink-0">{c.authorName?.[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p onClick={() => { setCommentingPostId(null); navigate(`/profile/${c.authorId}`); }} className="text-[10px] font-black uppercase text-amber-600 tracking-widest cursor-pointer truncate">{c.authorName}</p>
                          {(c.authorId === auth.currentUser?.uid || isPostOwner) && (
                            <button onClick={() => deleteComment(activeCommentPost.id, c)} className="text-slate-300 hover:text-rose-500 p-1"><Trash2 size={14}/></button>
                          )}
                        </div>
                        <p className="text-sm text-slate-800 font-bold break-words">{c.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </div>
            <div className="p-6 bg-white border-t border-slate-100 shadow-2xl">
              <form onSubmit={handleCommentSubmit} className="flex gap-3 items-center">
                <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add strategic insight..." className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-black outline-none focus:bg-white focus:border-amber-500 transition-all shadow-inner" />
                <button type="submit" disabled={!newComment.trim()} className="bg-black text-white p-4 rounded-2xl hover:bg-amber-600 active:scale-95 disabled:opacity-50"><Send size={18}/></button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* METRICS MODAL RESTORED */}
      <AnimatePresence>
        {viewingMetrics && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[70vh]">
              <header className="p-8 border-b border-slate-50 flex justify-between items-center bg-[#FDFDFD]">
                <div><h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600">Post Metrics</h3><p className="text-xs font-bold text-slate-400 tracking-tight">Engagement Analysis</p></div>
                <button onClick={() => setViewingMetrics(null)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-all"><X size={18}/></button>
              </header>
              <div className="grid grid-cols-2 p-8 bg-slate-50 gap-4 text-center">
                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100"><p className="text-2xl font-black italic">{viewingMetrics.views || 0}</p><p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">Impressions</p></div>
                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100"><p className="text-2xl font-black italic">{viewingMetrics.likes || 0}</p><p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">Interactions</p></div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 mb-4 px-2">Validated Partners</p>
                {fetchingMetrics ? (<div className="py-10 text-center animate-pulse text-[10px] font-black uppercase text-amber-600">Syncing Registry...</div>) : likersDetails.length > 0 ? (
                  likersDetails.map(user => (
                    <div key={user.id} className="p-4 bg-white border border-slate-100 rounded-[1.5rem] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black uppercase text-[10px]">{(user.profilePhotoURL || user.logo) ? <img src={user.profilePhotoURL || user.logo} className="w-full h-full object-cover" /> : user.fullName?.[0] || user.startupName?.[0]}</div>
                      <div><p className="text-xs font-black uppercase text-slate-900">{user.fullName || user.startupName}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{user.investorType || user.industry}</p></div>
                    </div>
                  ))
                ) : (<p className="py-10 text-center text-[10px] font-black uppercase text-slate-300 tracking-widest">No active interactions recorded</p>)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <InvestorShare isOpen={!!sharePost} onClose={() => setSharePost(null)} postData={sharePost} />

      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl space-y-8 z-10">
              <div className="flex justify-between items-center"><h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600">Profile Protocol</h3><button onClick={() => setShowSettings(false)} className="p-3 bg-slate-50 rounded-full"><X size={18}/></button></div>
              <button onClick={handleLogout} className="w-full p-6 bg-slate-50 hover:bg-black hover:text-white rounded-3xl transition-all flex items-center justify-between group text-left"><span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span><LogOut size={18} className="text-slate-300 group-hover:text-amber-500" /></button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-[450px] bg-white/80 backdrop-blur-2xl border border-slate-200 px-8 py-5 rounded-[32px] flex justify-between items-center z-50 shadow-2xl">
        <NavIcon icon={<Home />} label="home" currentTab="profile" onClick={() => handleNavClick('home')} />
        <NavIcon icon={<Rocket />} label="startups" currentTab="profile" onClick={() => handleNavClick('startups')} />
        <NavIcon icon={<PlusSquare />} label="post" currentTab="profile" onClick={() => handleNavClick('post')} />
        <NavIcon icon={<MessageCircle />} label="messages" currentTab="profile" onClick={() => handleNavClick('messages')} />
        <NavIcon icon={<User />} label="profile" active={true} onClick={() => handleNavClick('profile')} />
      </nav>
    </div>
  );
};

const NavIcon = ({ icon, label, currentTab, onClick, active }) => {
  const isActive = active || label === currentTab;
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-amber-600 scale-125' : 'text-slate-300 hover:text-slate-600'}`}>
      {React.cloneElement(icon, { size: 24, strokeWidth: isActive ? 2.5 : 2 })}
      {isActive && <motion.div layoutId="navDot" className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1" />}
    </button>
  );
};

export default InvestorProfile;