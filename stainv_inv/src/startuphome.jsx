import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from './firebase'; 
import { 
  collection, onSnapshot, query, orderBy, doc, getDoc, 
  updateDoc, increment, arrayUnion 
} from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Home, Search, PlusSquare, MessageCircle, User, 
  Heart, MessageSquare, Share2, ChevronRight, Rocket, X, Zap, Eye, BarChart3,
  Image as ImageIcon, Send, MapPin, ArrowRight, ArrowLeft, Trash2
} from 'lucide-react';

import { useInteractions } from './investorinteraction';
import InvestorPost from './investorpost'; 
import StartupPitchTerminal from './startuppitchterminal';
import InvestorShare from './investorshare';

// --- SUB-COMPONENT FOR VIEW TRACKING & ACTIONS ---
const ViewTrackedPost = ({ post, onLike, onComment, onShare, onShareClick, openMetrics, onView }) => {
  const postRef = useRef();
  const hasCounted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasCounted.current) {
          hasCounted.current = true;
          onView(post.id);
        }
      },
      { threshold: 0.5 }
    );
    if (postRef.current) observer.observe(postRef.current);
    return () => observer.disconnect();
  }, [post.id]);

  const hasUserLiked = post.likedBy?.includes(auth.currentUser?.uid);

  return (
    <div ref={postRef} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onShare(post.authorId)}>
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white font-black overflow-hidden border border-slate-100">
            {post.authorLogo ? <img src={post.authorLogo} className="w-full h-full object-cover" alt="" /> : post.authorName?.[0]}
          </div>
          <div>
            <h4 className="font-black text-sm uppercase tracking-tighter hover:text-amber-600 transition-colors">{post.authorName}</h4>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Zap size={8} className="text-amber-500" fill="currentColor"/> Network Transmission</p>
          </div>
        </div>
      </div>
      <div className="px-6 pb-4 text-[15px] leading-relaxed text-slate-700 italic">"{post.content}"</div>
      {post.mediaUrl && (
        <div className="px-3 pb-3">
          <div className="rounded-[2.5rem] overflow-hidden border border-slate-100 aspect-square">
            {post.mediaType === 'video' ? <video src={post.mediaUrl} controls className="w-full h-full object-cover" /> : <img src={post.mediaUrl} className="w-full h-full object-cover" />}
          </div>
        </div>
      )}
      <div className="p-6 flex items-center gap-6 border-t border-slate-50 text-slate-400">
        <button onClick={() => onLike(post)} className={`flex items-center gap-2 transition-all ${hasUserLiked ? 'text-rose-500 scale-110' : 'hover:text-rose-500'}`}>
          <Heart size={20} className={hasUserLiked ? "fill-rose-500" : ""} /> 
          <span className="text-xs font-black">{post.likes || 0}</span>
        </button>
        <button onClick={() => onComment(post.id)} className="flex items-center gap-2 hover:text-indigo-600 transition-all">
          <MessageSquare size={20} />
          <span className="text-xs font-black">{post.comments?.length || 0}</span>
        </button>
        {/* INSIGHTS BUTTON RESTORED */}
        <button onClick={() => openMetrics(post)} className="flex items-center gap-2 hover:text-amber-600 transition-all">
          <BarChart3 size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Stats</span>
        </button>
        {/* SHARE BUTTON RESTORED */}
        <button onClick={() => onShareClick(post)} className="ml-auto p-2 hover:bg-slate-50 rounded-full hover:text-amber-600 transition-colors">
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
};

const StartupHome = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [pitches, setPitches] = useState([]); 
  const [posts, setPosts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [startupData, setStartupData] = useState(null); 

  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const [isFeedPostOpen, setIsFeedPostOpen] = useState(false);
  const [isPitchPostOpen, setIsPitchPostOpen] = useState(false);
  const [commentingPostId, setCommentingPostId] = useState(null);
  const [newComment, setNewComment] = useState("");

  // INSIGHTS STATES RESTORED
  const [viewingMetrics, setViewingMetrics] = useState(null);
  const [likersDetails, setLikersDetails] = useState([]);
  const [fetchingMetrics, setFetchingMetrics] = useState(false);

  const { handleLike, submitComment, deleteComment } = useInteractions();
  const [sharePost, setSharePost] = useState(null); 
  const scrollRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, "startups", user.uid));
        if (docSnap.exists()) setStartupData({ id: user.uid, ...docSnap.data() });
      } else { navigate('/login'); }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (snapshot) => {
      const allPosts = snapshot.docs.map(d => ({ 
        id: d.id, ...d.data(),
        comments: Array.isArray(d.data().comments) ? d.data().comments : [] 
      }));
      setPosts(allPosts.filter(post => post.type !== 'strategic_pitch'));
      setLoading(false);
    });

    const unsubPitches = onSnapshot(query(collection(db, "pitches"), orderBy("createdAt", "desc")), (snapshot) => {
      setPitches(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubPitches(); unsubPosts(); };
  }, []);

  const handleRecordView = async (postId) => {
    try {
      await updateDoc(doc(db, "posts", postId), { views: increment(1) });
    } catch (err) { console.error(err); }
  };

  const openMetrics = async (post) => {
    setViewingMetrics(post);
    setFetchingMetrics(true);
    const details = [];
    if (post.likedBy?.length > 0) {
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

  const activeCommentPost = posts.find(p => p.id === commentingPostId);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !commentingPostId) return;
    try {
      await submitComment(commentingPostId, newComment, startupData);
      setNewComment("");
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (err) { console.error(err); }
  };

  const handleTabChange = (label) => {
    if (label === 'post') setIsPostMenuOpen(true);
    else if (label === 'profile') navigate('/startup-profile');
    else if (label === 'messages') navigate('/chat/hub');
    else setActiveTab(label);
  };

  if (loading || !startupData) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-32 font-sans antialiased relative">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <img src="/stainvrb.png" alt="STAINV" className="h-25 object-contain" />
        <div onClick={() => navigate('/search')} className="bg-slate-100 p-2 rounded-full cursor-pointer hover:bg-black hover:text-white transition-all text-slate-400"><Search size={20} /></div>
      </nav>

      <main className="max-w-2xl mx-auto pt-6 px-4">
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {posts.map((post) => (
                <ViewTrackedPost 
                  key={post.id} 
                  post={post} 
                  onLike={handleLike} 
                  onComment={setCommentingPostId} 
                  onShare={(id) => navigate(`/profile/${id}`)}
                  onShareClick={setSharePost}
                  openMetrics={openMetrics}
                  onView={handleRecordView} 
                />
              ))}
            </motion.div>
          ) : (
            <motion.div key="startups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {pitches.map((pitch) => (
                <div key={pitch.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm group">
                  <div className="relative aspect-video overflow-hidden">
                    <img src={pitch.bgPhoto} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="p-8 space-y-6">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight mb-2">{pitch.headline}</h3>
                    <div className="grid grid-cols-2 gap-8 py-4 border-y border-slate-50">
                       <div><p className="text-[20px] font-black tracking-tighter">${pitch.totalRequired?.toLocaleString()}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Required</p></div>
                       <div><p className="text-[20px] font-black tracking-tighter">${pitch.minInvestment?.toLocaleString()}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Min per Investor</p></div>
                    </div>
                    <button onClick={() => navigate(`/startup-details/${pitch.authorId}`)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg">View Dossier <ArrowRight size={14}/></button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* INTEL REGISTRY (COMMENT OVERLAY) */}
      <AnimatePresence>
        {activeCommentPost && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 z-[1000] bg-white flex flex-col antialiased">
            <nav className="p-6 flex items-center gap-6 border-b border-slate-100 bg-white sticky top-0 z-20">
              <button onClick={() => setCommentingPostId(null)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-black transition-all"><ArrowLeft size={20}/></button>
              <div><h3 className="text-xs font-black uppercase tracking-[0.3em]">Intel Registry</h3><p className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Active Discussion</p></div>
            </nav>
            <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
              <div className="p-6 bg-white border-b border-slate-100 opacity-60"><p className="text-sm font-medium italic text-slate-600 line-clamp-2">"{activeCommentPost.content}"</p></div>
              
              {/* LIVE METRICS PREVIEW IN COMMENTS */}
              <div className="grid grid-cols-2 gap-4 p-6 border-b border-slate-100 bg-white">
                 <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm"><Eye size={18}/></div>
                    <div><p className="text-lg font-black">{activeCommentPost.views || 0}</p><p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Reach</p></div>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl text-rose-500 shadow-sm"><Heart size={18} fill="currentColor"/></div>
                    <div><p className="text-lg font-black">{activeCommentPost.likes || 0}</p><p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Trust</p></div>
                 </div>
              </div>

              <div className="p-6 space-y-4">
                {activeCommentPost.comments.map((c, idx) => {
                  const isMe = c.authorId === auth.currentUser?.uid;
                  const isPostOwner = activeCommentPost.authorId === auth.currentUser?.uid;
                  return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={`${activeCommentPost.id}-c-${idx}`} className="flex gap-4 items-start bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm">
                      <div onClick={() => { setCommentingPostId(null); navigate(`/profile/${c.authorId}`); }} className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center text-xs font-black uppercase cursor-pointer flex-shrink-0">{c.authorName?.[0] || 'A'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p onClick={() => { setCommentingPostId(null); navigate(`/profile/${c.authorId}`); }} className="text-[10px] font-black uppercase text-amber-600 tracking-widest cursor-pointer truncate">{c.authorName}</p>
                          {(isMe || isPostOwner) && <button onClick={() => deleteComment(activeCommentPost.id, c)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={14}/></button>}
                        </div>
                        <p className="text-sm text-slate-800 font-bold leading-tight break-words">{c.text}</p>
                      </div>
                    </motion.div>
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

      {/* METRICS MODAL OVERLAY */}
      <AnimatePresence>
        {viewingMetrics && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[70vh]">
              <header className="p-8 border-b border-slate-50 flex justify-between items-center bg-[#FDFDFD]">
                <div><h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600">Post Metrics</h3><p className="text-xs font-bold text-slate-400 tracking-tight">Engagement Analysis</p></div>
                <button onClick={() => setViewingMetrics(null)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-all"><X size={18}/></button>
              </header>
              <div className="grid grid-cols-2 p-8 bg-slate-50 gap-4 text-center">
                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100"><p className="text-2xl font-black italic">{viewingMetrics.views || 0}</p><p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">Reach</p></div>
                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100"><p className="text-2xl font-black italic">{viewingMetrics.likes || 0}</p><p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">Trust</p></div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 mb-4 px-2">Validated Partners</p>
                {fetchingMetrics ? (<div className="py-10 text-center animate-pulse text-[10px] font-black uppercase text-amber-600">Syncing...</div>) : likersDetails.length > 0 ? (
                  likersDetails.map(user => (
                    <div key={user.id} className="p-4 bg-white border border-slate-100 rounded-[1.5rem] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black uppercase text-[10px]">{(user.profilePhotoURL || user.logo) ? <img src={user.profilePhotoURL || user.logo} className="w-full h-full object-cover" /> : user.fullName?.[0] || user.startupName?.[0]}</div>
                      <div><p className="text-xs font-black uppercase text-slate-900">{user.fullName || user.startupName}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{user.investorType || user.industry}</p></div>
                    </div>
                  ))
                ) : (<p className="py-10 text-center text-[10px] font-black uppercase text-slate-300 tracking-widest">No Interaction Data</p>)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NAVBAR */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-[450px] bg-white/80 backdrop-blur-2xl border border-slate-200 px-8 py-5 rounded-[32px] flex justify-between items-center z-50 shadow-2xl">
        <NavIcon icon={<Home />} label="home" active={activeTab} onClick={handleTabChange} />
        <NavIcon icon={<Rocket />} label="startups" active={activeTab} onClick={handleTabChange} />
        <NavIcon icon={<PlusSquare />} label="post" active={activeTab} onClick={handleTabChange} />
        <NavIcon icon={<MessageCircle />} label="messages" active={activeTab} onClick={handleTabChange} />
        <NavIcon icon={<User />} label="profile" active={activeTab} onClick={handleTabChange} />
      </nav>

      {/* MODALS */}
      <AnimatePresence>
        {isPostMenuOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-white rounded-[3rem] p-8 relative shadow-2xl">
              <button onClick={() => setIsPostMenuOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black"><X size={20}/></button>
              <h2 className="text-xl font-black uppercase italic tracking-tight mb-8">Broadcast Type</h2>
              <div className="space-y-4">
                <button onClick={() => { setIsPostMenuOpen(false); setIsFeedPostOpen(true); }} className="w-full p-6 bg-slate-50 rounded-3xl flex items-center gap-5 hover:border-amber-500 border border-transparent transition-all group text-left">
                  <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><ImageIcon size={20}/></div>
                  <div><p className="font-black uppercase text-[10px] tracking-widest text-amber-600">Feed Update</p><p className="text-sm font-bold">Standard Post</p></div>
                </button>
                <button onClick={() => { setIsPostMenuOpen(false); setIsPitchPostOpen(true); }} className="w-full p-6 bg-amber-50 rounded-3xl flex items-center gap-5 hover:border-amber-500 border border-transparent transition-all group text-left">
                  <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Rocket size={20}/></div>
                  <div><p className="font-black uppercase text-[10px] tracking-widest text-amber-600">Strategic Pitch</p><p className="text-sm font-bold">Investment Deal</p></div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFeedPostOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="w-full max-w-xl relative">
              <button onClick={() => setIsFeedPostOpen(false)} className="absolute -top-12 right-0 p-3 text-white hover:rotate-90 transition-transform"><X size={24} /></button>
              <InvestorPost userProfile={startupData} onComplete={() => setIsFeedPostOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPitchPostOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="w-full max-w-xl relative my-auto">
              <button onClick={() => setIsPitchPostOpen(false)} className="absolute -top-12 right-0 p-3 text-white hover:rotate-90 transition-transform"><X size={24} /></button>
              <StartupPitchTerminal userProfile={startupData} onComplete={() => setIsPitchPostOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <InvestorShare isOpen={!!sharePost} onClose={() => setSharePost(null)} postData={sharePost} />
    </div>
  );
};

const NavIcon = ({ icon, label, active, onClick }) => {
  const isActive = active === label; 
  return (
    <button onClick={() => onClick(label)} className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-amber-600 scale-125' : 'text-slate-300 hover:text-slate-600'}`}>
      {React.cloneElement(icon, { size: 24, strokeWidth: isActive ? 2.5 : 2 })}
      {isActive && <motion.div layoutId="navDot" className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1" />}
    </button>
  );
};

export default StartupHome;