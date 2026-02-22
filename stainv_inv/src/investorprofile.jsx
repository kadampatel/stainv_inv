import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from './firebase'; 
import { 
  doc, getDoc, collection, query, where, onSnapshot, 
  orderBy, updateDoc, deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Briefcase, Star, Home, Rocket, PlusSquare, 
  MessageCircle, User, X, Settings, LogOut, Heart, Share2, MessageSquare,
  ChevronRight, ShieldCheck, Zap, Eye, BarChart3, Send, Trash2, Edit3, Camera, Save, Loader2, MoreVertical
} from 'lucide-react';

import { useInteractions } from './investorinteraction';
import InvestorShare from './investorshare';

const InvestorProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [investorData, setInvestorData] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState("profile"); // profile, notifications, edit
  const [notifications, setNotifications] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [uploading, setUploading] = useState(false);

  // EXPLORER, COMMENT & INSIGHTS STATES
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [commentingPostId, setCommentingPostId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [sharePost, setSharePost] = useState(null);
  const [postActionId, setPostActionId] = useState(null); // For the 3-dots menu
  
  const [viewingMetrics, setViewingMetrics] = useState(null);
  const [likersDetails, setLikersDetails] = useState([]);
  const [fetchingMetrics, setFetchingMetrics] = useState(false);

  const postRefs = useRef({});
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

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

  // DELETE POST LOGIC
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Terminate this signal? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
      setPostActionId(null);
      alert("Signal Terminated.");
    } catch (err) {
      alert("Termination Failed.");
    }
  };

  // IMAGE SYNC LOGIC
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "investors", auth.currentUser.uid), { profilePhotoURL: url });
      setInvestorData({ ...investorData, profilePhotoURL: url });
      alert("Biometric Visual Synchronized.");
    } catch (err) {
      alert("Sync Failed.");
    }
    setUploading(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const docRef = doc(db, "investors", auth.currentUser.uid);
      await updateDoc(docRef, {
        fullName: investorData.fullName,
        bio: investorData.bio,
        investorType: investorData.investorType,
        firmName: investorData.firmName,
        country: investorData.country
      });
      setActiveSubTab("profile");
      alert("Dossier Updated.");
    } catch (err) {
      alert("Update Failed.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPostId && postRefs.current[selectedPostId]) {
      postRefs.current[selectedPostId].scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [selectedPostId]);

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
      } catch (e) { console.error(e); }
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

  const registryHandle = auth.currentUser?.email?.split('@')[0] || 'unknown';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-40 font-sans relative antialiased">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ArrowLeft size={20} /></button>
           <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Handle: <span className="text-black">{registryHandle}</span></span>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(true)} className="p-2.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-amber-600 transition-all"><Settings size={20} /></button>
          <img src="/stainvrb.png" alt="Logo" className="h-10 ml-2" />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-8">
        <div className="flex gap-8 mb-10 border-b border-slate-200/60 pb-4 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveSubTab("profile")} className={`text-[10px] font-black uppercase tracking-[0.5em] pb-4 flex-shrink-0 ${activeSubTab === 'profile' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-300'}`}>Dossier View</button>
          <button onClick={() => setActiveSubTab("edit")} className={`text-[10px] font-black uppercase tracking-[0.5em] pb-4 flex-shrink-0 ${activeSubTab === 'edit' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-300'}`}>Edit Terminal</button>
          <button onClick={() => setActiveSubTab("notifications")} className={`text-[10px] font-black uppercase tracking-[0.5em] pb-4 flex-shrink-0 ${activeSubTab === 'notifications' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-300'}`}>Notifications</button>
        </div>

        <AnimatePresence mode="wait">
          {activeSubTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
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
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 rounded-full border border-slate-100"><Briefcase size={12} className="text-amber-600"/> {investorData?.experienceRole || "Investor"}</span>
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
          )}

          {activeSubTab === "edit" && (
            <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8 pb-20">
              <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                  <div className="w-32 h-32 rounded-[2.5rem] bg-black overflow-hidden border-4 border-white shadow-2xl">
                    {investorData?.profilePhotoURL ? (
                      <img src={investorData.profilePhotoURL} className="w-full h-full object-cover opacity-60" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl">{investorData?.fullName?.[0]}</div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                  </div>
                </div>
                <input type="file" hidden ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-4">Change Visual Identity</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <EditInput label="Full Name" value={investorData?.fullName} onChange={(e) => setInvestorData({...investorData, fullName: e.target.value})} />
                <EditInput label="Investment Firm" value={investorData?.firmName} onChange={(e) => setInvestorData({...investorData, firmName: e.target.value})} />
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Investor Type</label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none focus:border-amber-600 shadow-sm"
                      value={investorData?.investorType}
                      onChange={(e) => setInvestorData({...investorData, investorType: e.target.value})}
                    >
                      <option value="Angel Investor">Angel Investor</option>
                      <option value="Venture Capital">Venture Capital</option>
                      <option value="Private Equity">Private Equity</option>
                      <option value="Family Office">Family Office</option>
                      <option value="Institutional">Institutional</option>
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Bio / Thesis</label>
                    <textarea rows="4" className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none focus:border-amber-600 shadow-sm" value={investorData?.bio} onChange={(e) => setInvestorData({...investorData, bio: e.target.value})} />
                </div>
                <button type="submit" className="w-full py-5 bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-amber-600 transition-all flex items-center justify-center gap-2"><Save size={16} /> Synchronize Dossier</button>
              </form>
            </motion.div>
          )}

          {activeSubTab === "notifications" && (
            <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
               {notifications.length === 0 ? <p className="py-40 text-center text-[10px] font-black uppercase text-slate-300 tracking-[0.5em]">Clear Feed</p> : 
               notifications.map(n => (
                 <div key={n.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between">
                   <div>
                    <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">{n.type || 'SIGNAL'}</p>
                    <p className="font-bold text-sm uppercase">{n.senderName} requested access</p>
                   </div>
                   <ChevronRight size={16} className="text-slate-200"/>
                 </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FULL SCREEN TIMELINE EXPLORER */}
      <AnimatePresence>
        {selectedPostId && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 z-[600] bg-white overflow-y-auto">
            <nav className="sticky top-0 z-[610] bg-white border-b border-slate-100 p-6 flex items-center justify-between">
              <button onClick={() => {setSelectedPostId(null); setPostActionId(null);}} className="p-2 bg-slate-50 rounded-full"><ArrowLeft size={20} /></button>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Timeline Explorer</h3>
              <div className="w-10" />
            </nav>
            <div className="max-w-2xl mx-auto p-4 space-y-12 py-10">
              {myPosts.map((post) => {
                const hasUserLiked = post.likedBy?.includes(auth.currentUser?.uid);
                return (
                  <div key={post.id} ref={el => postRefs.current[post.id] = el} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all relative">
                    {/* THREE DOTS MENU RESTORED */}
                    <button 
                      onClick={() => setPostActionId(postActionId === post.id ? null : post.id)} 
                      className="absolute top-6 right-6 p-2 text-slate-400 hover:text-black z-10"
                    >
                      <MoreVertical size={20} />
                    </button>

                    {/* ACTION OVERLAY */}
                    <AnimatePresence>
                      {postActionId === post.id && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }} 
                          animate={{ opacity: 1, scale: 1 }} 
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute top-16 right-6 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 z-20 w-40"
                        >
                          <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Delete Post</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

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

      {/* COMMENTS MODAL */}
      <AnimatePresence>
        {activeCommentPost && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 z-[1000] bg-white flex flex-col">
            <nav className="p-6 flex items-center gap-6 border-b border-slate-100 bg-white sticky top-0 z-20">
              <button onClick={() => setCommentingPostId(null)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-black transition-all"><ArrowLeft size={20}/></button>
              <div><h3 className="text-xs font-black uppercase tracking-[0.3em]">Intel Registry</h3><p className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Active Discussion</p></div>
            </nav>
            <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
              <div className="p-6 bg-white border-b border-slate-100 opacity-60"><p className="text-sm font-medium italic text-slate-600 leading-relaxed line-clamp-2">"{activeCommentPost.content}"</p></div>
              <div className="p-6 space-y-4">
                {activeCommentPost.comments.map((c, idx) => (
                    <div key={`${activeCommentPost.id}-c-${idx}`} className="flex gap-4 items-start bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm">
                      <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center text-xs font-black flex-shrink-0">{c.authorName?.[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest truncate">{c.authorName}</p>
                          {(c.authorId === auth.currentUser?.uid) && (
                            <button onClick={() => deleteComment(activeCommentPost.id, c)} className="text-slate-300 hover:text-rose-500 p-1"><Trash2 size={14}/></button>
                          )}
                        </div>
                        <p className="text-sm text-slate-800 font-bold break-words">{c.text}</p>
                      </div>
                    </div>
                  ))}
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

      {/* METRICS MODAL */}
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
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {fetchingMetrics ? (<div className="py-10 text-center animate-pulse text-[10px] font-black uppercase text-amber-600">Syncing Registry...</div>) : likersDetails.map(user => (
                    <div key={user.id} className="p-4 bg-white border border-slate-100 rounded-[1.5rem] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black uppercase text-[10px]">{(user.profilePhotoURL || user.logo) ? <img src={user.profilePhotoURL || user.logo} className="w-full h-full object-cover" /> : user.fullName?.[0]}</div>
                      <div><p className="text-xs font-black uppercase text-slate-900">{user.fullName || user.startupName}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{user.investorType || user.industry}</p></div>
                    </div>
                  ))}
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
        <NavIcon icon={<Home />} label="home" onClick={() => handleNavClick('home')} />
        <NavIcon icon={<Rocket />} label="startups" onClick={() => handleNavClick('startups')} />
        <NavIcon icon={<PlusSquare />} label="post" onClick={() => handleNavClick('post')} />
        <NavIcon icon={<MessageCircle />} label="messages" onClick={() => handleNavClick('messages')} />
        <NavIcon icon={<User />} label="profile" active={true} onClick={() => handleNavClick('profile')} />
      </nav>
    </div>
  );
};

const EditInput = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{label}</label>
    <input 
      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none focus:border-amber-600 shadow-sm transition-all"
      value={value || ""} 
      onChange={onChange} 
    />
  </div>
);

const NavIcon = ({ icon, label, onClick, active }) => {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-amber-600 scale-125' : 'text-slate-300 hover:text-slate-600'}`}>
      {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
      {active && <motion.div layoutId="navDot" className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1" />}
    </button>
  );
};

export default InvestorProfile;