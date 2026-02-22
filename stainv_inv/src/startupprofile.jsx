import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth, storage } from './firebase'; 
import { 
  doc, onSnapshot, query, collection, where, orderBy, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Rocket, ShieldCheck, Zap, Heart, MessageSquare, Share2,
  MessageCircle, Home, PlusSquare, User, Eye, Linkedin, MapPin, X, ChevronRight, Target, DollarSign,
  Camera, Save, Loader2, Trash2, MoreVertical, FileText, Edit3
} from 'lucide-react';

import { useInteractions } from './investorinteraction';
import InvestorShare from './investorshare';

const StartupProfile = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("profile"); // profile, edit, notifications
  const [contentTab, setContentTab] = useState("posts"); 
  const [notifications, setNotifications] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [myPitches, setMyPitches] = useState([]); 
  const [selectedArchitect, setSelectedArchitect] = useState(null);
  const [uploading, setUploading] = useState(false);

  // EXPLORER & EDIT STATES
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [postActionId, setPostActionId] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [newPitchLink, setNewPitchLink] = useState("");
  const [newPitchTitle, setNewPitchTitle] = useState("");
  
  const postRefs = useRef({});
  const fileInputRef = useRef(null);

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
      const unsubscribeProfile = onSnapshot(doc(db, "startups", targetId), (snap) => {
        if (snap.exists()) setProfileData({ id: targetId, ...snap.data() });
        else if (isOwnProfile) navigate('/startupprofilesetup');
        setLoading(false);
      });

      // 2. Timeline
      const qPosts = query(collection(db, "posts"), where("authorId", "==", targetId), orderBy("createdAt", "desc"));
      const unsubscribePosts = onSnapshot(qPosts, (snap) => {
        const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMyPosts(posts.filter(p => p.type !== 'strategic_pitch'));
      });

      // 3. Pitches Registry
      const qPitches = query(collection(db, "pitches"), where("authorId", "==", targetId), orderBy("createdAt", "desc"));
      const unsubscribePitches = onSnapshot(qPitches, (snap) => {
        setMyPitches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      if (user && isOwnProfile) {
        const qNotifs = query(collection(db, "notifications"), where("recipientId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { unsubscribeProfile(); unsubscribePosts(); unsubscribePitches(); unsubscribeNotifs(); };
      }

      return () => { unsubscribeProfile(); unsubscribePosts(); unsubscribePitches(); };
    });
    return () => {};
  }, [id, navigate, isOwnProfile]);

  // EDIT LOGIC: Image Sync
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `startups/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "startups", auth.currentUser.uid), { logo: url });
      setProfileData({ ...profileData, logo: url });
      alert("Logo Visual Synchronized.");
    } catch (err) { alert("Sync Failed."); }
    setUploading(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "startups", auth.currentUser.uid), profileData);
      setActiveSubTab("profile");
      alert("Registry Updated.");
    } catch (err) { alert("Update Failed."); }
    setLoading(false);
  };

  // PITCH MANAGEMENT
  const addPitchLink = async () => {
    if (!newPitchLink || !newPitchTitle) return alert("Enter Title and Link.");
    const newPitch = { title: newPitchTitle, url: newPitchLink, id: Date.now() };
    await updateDoc(doc(db, "startups", auth.currentUser.uid), {
      pitches: arrayUnion(newPitch)
    });
    setNewPitchLink(""); setNewPitchTitle("");
  };

  const removePitchLink = async (pitch) => {
    await updateDoc(doc(db, "startups", auth.currentUser.uid), {
      pitches: arrayRemove(pitch)
    });
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Terminate this signal?")) return;
    await deleteDoc(doc(db, "posts", postId));
    setPostActionId(null);
    alert("Signal Expunged.");
  };

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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  const data = profileData || { startupName: "Restricted" };
  const registryHandle = auth.currentUser?.email?.split('@')[0] || 'node';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-40 font-sans overflow-x-hidden relative antialiased">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-black"><ArrowLeft size={20} /></button>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node: <span className="text-black">{registryHandle}</span></span>
          </div>
        </div>
        <img src="/stainvrb.png" alt="Logo" className="h-10 object-contain" />
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-8">
        <div className="flex gap-8 mb-10 border-b border-slate-200 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveSubTab("profile")} className={`text-[10px] font-black uppercase tracking-[0.5em] pb-4 transition-all flex-shrink-0 ${activeSubTab === 'profile' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-300'}`}>Dossier View</button>
          {isOwnProfile && (
            <>
              <button onClick={() => setActiveSubTab("edit")} className={`text-[10px] font-black uppercase tracking-[0.5em] pb-4 transition-all flex-shrink-0 ${activeSubTab === 'edit' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-300'}`}>Edit Terminal</button>
              <button onClick={() => setActiveSubTab("notifications")} className={`relative text-[10px] font-black uppercase tracking-[0.5em] pb-4 transition-all flex-shrink-0 ${activeSubTab === 'notifications' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-300'}`}>
                Notifications {notifications.length > 0 && <span className="absolute top-0 -right-4 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span></span>}
              </button>
            </>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeSubTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
              <section className="relative aspect-[4/5] w-full bg-slate-200 rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden group">
                {data.logo ? <img src={data.logo} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-7xl font-black text-slate-200 uppercase">{data.startupName?.[0]}</div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10 right-10 p-8 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-2">{data.sector || data.industry || "Venture Node"}</p>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">{data.startupName}</h2>
                </div>
              </section>

              <section className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm space-y-8">
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 text-[9px] font-black uppercase text-slate-500 tracking-widest"><Rocket size={12} className="text-amber-600" /> {data.tagline}</div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 text-[9px] font-black uppercase text-slate-500 tracking-widest"><MapPin size={12} className="text-amber-600" /> {data.city}, {data.country}</div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-black rounded-full text-[9px] font-black uppercase text-white shadow-lg tracking-widest"><Zap size={10} className="text-amber-500" fill="currentColor" /> {data.stage}</div>
                </div>
                {data.pitches?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {data.pitches.map(p => (
                      <a key={p.id} href={p.url} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 hover:bg-amber-600 hover:text-white transition-all"><FileText size={12}/> {p.title}</a>
                    ))}
                  </div>
                )}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Executive Narrative</h4>
                  <p className="text-2xl text-slate-800 font-serif italic leading-relaxed">"{data.description}"</p>
                </div>
              </section>

              {/* ARCHITECTS SECTION */}
              <div className="space-y-6 pt-6">
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300 px-4">The Architects</h3>
                <div className="grid grid-cols-2 gap-4">
                  {data.founders?.map((founder, index) => (
                    <motion.div key={index} whileTap={{ scale: 0.98 }} onClick={() => setSelectedArchitect(founder)} className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm cursor-pointer hover:border-amber-500 transition-all group">
                      <div className="h-12 w-12 rounded-2xl bg-black overflow-hidden flex-shrink-0 shadow-inner">
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
                  <button onClick={() => setContentTab("pitches")} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${contentTab === 'pitches' ? 'bg-black text-white shadow-lg' : 'text-slate-400'}`}>Strategic</button>
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
                    </div>
                  ) : (
                    <div className="space-y-12">
                      {myPitches.map(pitch => {
                        const hasLiked = pitch.likedBy?.includes(auth.currentUser?.uid);
                        return (
                          <div key={pitch.id} className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-xl relative group">
                             <img src={pitch.bgPhoto || pitch.mediaUrl} className="w-full h-64 object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt="Banner" />
                             <div className="p-10 space-y-6">
                                <div>
                                  <h3 className="text-3xl font-black uppercase italic text-slate-900 leading-tight mb-2 tracking-tighter">{pitch.headline}</h3>
                                  <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest"><MapPin size={14} /> {pitch.location || "Global"}</div>
                                </div>
                                <p className="text-lg text-slate-600 italic leading-relaxed">"{pitch.description}"</p>
                                <div className="flex justify-between items-end pt-4">
                                   <div className="flex gap-10">
                                      <div><p className="text-3xl font-black text-slate-900 tracking-tighter">${pitch.totalRequired?.toLocaleString()}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Required</p></div>
                                      <div><p className="text-3xl font-black text-slate-900 tracking-tighter">${(pitch.minPerInvestor || 0).toLocaleString()}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min Ticket</p></div>
                                   </div>
                                   <div className="flex gap-4">
                                      <button onClick={() => handleLike(pitch)} className={`p-5 rounded-[2rem] bg-slate-50 transition-all ${hasLiked ? 'text-rose-500 scale-110 shadow-lg' : 'text-slate-400 hover:text-rose-500'}`}><Heart size={28} fill={hasLiked ? "currentColor" : "none"}/></button>
                                      <button onClick={() => setSharePost(pitch)} className="p-5 rounded-[2rem] bg-slate-50 text-slate-400 hover:text-amber-600 transition-all shadow-sm"><Share2 size={28}/></button>
                                   </div>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeSubTab === "edit" && (
            <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-12 pb-40">
              <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                  <div className="w-32 h-32 rounded-[2.5rem] bg-black overflow-hidden border-4 border-white shadow-2xl">
                    {data.logo ? <img src={data.logo} className="w-full h-full object-cover opacity-60" /> : <div className="w-full h-full flex items-center justify-center text-white"><Camera /></div>}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                  </div>
                </div>
                <input type="file" hidden ref={fileInputRef} onChange={handleImageUpload} />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-4">Change Startup Logo</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <EditInput label="Startup Name" value={data.startupName} onChange={(e) => setProfileData({...data, startupName: e.target.value})} />
                <EditInput label="Mission Tagline" value={data.tagline} onChange={(e) => setProfileData({...data, tagline: e.target.value})} />
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Executive Description</label>
                    <textarea rows="4" className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none focus:border-amber-600 shadow-sm" value={data.description} onChange={(e) => setProfileData({...data, description: e.target.value})} />
                </div>
                <button type="submit" className="w-full py-5 bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-amber-600 transition-all flex items-center justify-center gap-2"><Save size={16} /> Synchronize Dossier</button>
              </form>

              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Pitch Terminal</h3>
                <div className="space-y-4 mb-8">
                  {data.pitches?.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black uppercase">{p.title}</span>
                      <button onClick={() => removePitchLink(p)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <input placeholder="Pitch Title (e.g. Series A)" className="w-full bg-slate-50 p-4 rounded-2xl text-[10px] font-black uppercase outline-none" value={newPitchTitle} onChange={(e) => setNewPitchTitle(e.target.value)} />
                  <input placeholder="Document URL" className="w-full bg-slate-50 p-4 rounded-2xl text-[10px] font-black outline-none" value={newPitchLink} onChange={(e) => setNewPitchLink(e.target.value)} />
                  <button onClick={addPitchLink} className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase hover:border-amber-600 transition-all">+ Add Pitch Node</button>
                </div>
              </div>
            </motion.div>
          )}

          {activeSubTab === "notifications" && (
            <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
               {notifications.length === 0 ? <p className="py-40 text-center text-[10px] font-black uppercase text-slate-300 tracking-[0.5em]">Clear Feed</p> : 
               notifications.map(n => (
                 <div key={n.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between">
                    <div><p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">{n.type}</p><p className="font-bold text-sm uppercase">{n.senderName} interacted with your dossier</p></div>
                    <ChevronRight size={16} className="text-slate-200"/>
                 </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* OVERLAY: TIMELINE EXPLORER (With Delete Support) */}
      <AnimatePresence>
        {selectedPostId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1100] bg-[#F8FAFC] overflow-y-auto">
            <div className="sticky top-0 z-[1200] bg-white/80 backdrop-blur-xl p-6 border-b border-slate-100 flex items-center justify-between">
              <button onClick={() => {setSelectedPostId(null); setPostActionId(null);}} className="p-2 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"><ArrowLeft size={20} /></button>
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Venture Feed</h3>
              <div className="w-10" />
            </div>
            <div className="max-w-2xl mx-auto p-4 space-y-12 py-10 pb-40">
              {myPosts.map((post) => {
                const hasUserLiked = post.likedBy?.includes(auth.currentUser?.uid);
                return (
                  <div key={post.id} ref={el => postRefs.current[post.id] = el} className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl relative">
                    {isOwnProfile && (
                      <button onClick={() => setPostActionId(postActionId === post.id ? null : post.id)} className="absolute top-8 right-8 text-slate-300 hover:text-black z-10"><MoreVertical size={20}/></button>
                    )}
                    <AnimatePresence>
                      {postActionId === post.id && (
                        <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={() => handleDeletePost(post.id)} className="absolute top-20 right-8 bg-white border border-slate-100 shadow-2xl rounded-2xl px-6 py-4 text-rose-500 text-[10px] font-black uppercase flex items-center gap-2 z-20"><Trash2 size={14}/> Terminate Signal</motion.button>
                      )}
                    </AnimatePresence>
                    <div className="p-8 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-black overflow-hidden flex items-center justify-center">
                        {data.logo ? <img src={data.logo} className="w-full h-full object-cover" /> : <div className="text-white font-black">{data.startupName?.[0]}</div>}
                      </div>
                      <div><h4 className="text-sm font-black uppercase text-slate-900">{data.startupName}</h4><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Network Transmission</p></div>
                    </div>
                    <div className="px-10 pb-8 text-xl text-slate-700 font-serif italic leading-relaxed">"{post.content}"</div>
                    {post.mediaUrl && <div className="px-6 pb-6"><img src={post.mediaUrl} className="w-full rounded-[2.5rem] aspect-square object-cover" alt="" /></div>}
                    <div className="p-10 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex gap-12 text-slate-400">
                          <button onClick={() => handleLike(post)} className={`flex items-center gap-2 transition-all ${hasUserLiked ? 'text-rose-500 scale-110' : 'hover:text-rose-500'}`}><Heart size={26} fill={hasUserLiked ? "currentColor" : "none"} /><span className="font-black text-xs">{post.likes || 0}</span></button>
                          <button className="flex items-center gap-2"><MessageSquare size={26} /><span className="font-black text-xs">{post.commentsCount || 0}</span></button>
                       </div>
                       <button onClick={() => setSharePost(post)} className="p-4 bg-slate-50 rounded-full hover:bg-amber-500 hover:text-white transition-all"><Share2 size={22} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ARCHITECT OVERLAY & SHARE MODAL (REMAINS UNCHANGED) */}
      <AnimatePresence>
        {selectedArchitect && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 30 }} className="fixed inset-0 z-[1000] bg-white overflow-y-auto">
             <div className="sticky top-0 z-50 p-6 flex justify-between items-center bg-white/80 backdrop-blur-md">
              <button onClick={() => setSelectedArchitect(null)} className="p-3 bg-slate-100 rounded-full hover:bg-black hover:text-white transition-all"><ArrowLeft size={24}/></button>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Architect Dossier</h3>
              <div className="w-12" />
            </div>
            <div className="max-w-2xl mx-auto px-4 pt-4 pb-40 space-y-8 text-center">
              <section className="relative aspect-[4/5] w-full rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-white">
                <img src={selectedArchitect.photo} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10 right-10 p-8 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/20">
                  <h2 className="text-5xl font-black italic uppercase text-white tracking-tighter leading-none">{selectedArchitect.name}</h2>
                </div>
              </section>
              <section className="bg-white rounded-[3rem] p-12 border border-slate-100 space-y-4">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-amber-50 rounded-2xl border border-amber-100"><ShieldCheck className="text-amber-600" size={18} /><span className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">{selectedArchitect.role}</span></div>
                <p className="text-2xl text-slate-700 font-serif italic leading-relaxed pt-4">"{selectedArchitect.bio}"</p>
              </section>
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

const EditInput = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{label}</label>
    <input className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none focus:border-amber-600 shadow-sm transition-all" value={value || ""} onChange={onChange} />
  </div>
);

const NavIcon = ({ icon, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-amber-600 scale-125' : 'text-slate-300 hover:text-slate-600'}`}>
    {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
    {active && <motion.div layoutId="navDot" className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1" />}
  </button>
);

export default StartupProfile;