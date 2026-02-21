import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase'; 
import { 
  collection, onSnapshot, query, doc, getDoc, 
  updateDoc, increment
} from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Home, Search, PlusSquare, MessageCircle, User, 
  Heart, MessageSquare as MessageIcon, Share2, Rocket, X, Send, Trash2, Zap, BarChart3, ArrowLeft, Eye, MapPin
} from 'lucide-react';

import { useInteractions } from './investorinteraction';
import InvestorPost from './investorpost'; 
import InvestorShare from './InvestorShare';

// --- STRATEGIC PITCH CARD (Full Page Snap View) ---
const StrategicPitchCard = ({ pitch, onNavigate }) => {
  const minInv = pitch.minInvestment || pitch.minPerInvestor || 0;
  const pitchVisual = pitch.bgPhoto || pitch.mediaUrl;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col snap-start shrink-0 py-4"
      onClick={() => onNavigate(pitch.authorId)}
    >
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full hover:border-amber-400 transition-all cursor-pointer">
        {/* Visual Header - Slightly reduced height to fit text */}
        <div className="relative h-2/5 w-full bg-slate-100">
          {pitchVisual ? (
            <img src={pitchVisual} className="w-full h-full object-cover" alt="Pitch Banner" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 font-black uppercase tracking-[0.4em] text-[8px]">Registry Visual Restricted</div>
          )}
          {/* Startup Identity Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 pr-4 rounded-xl shadow-xl border border-white/50">
            <div className="w-8 h-8 bg-black rounded-lg overflow-hidden flex items-center justify-center p-1">
              {pitch.authorLogo ? <img src={pitch.authorLogo} className="w-full h-full object-contain" /> : <Rocket size={14} className="text-amber-500" />}
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-tighter text-slate-900 leading-none">{pitch.authorName}</p>
              <p className="text-[6px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">Verified Node</p>
            </div>
          </div>
        </div>

        {/* Narrative Section - Compacted spacing */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter leading-none mb-2">{pitch.headline}</h3>
              <div className="flex items-center gap-2 text-indigo-600 font-black text-[9px] uppercase tracking-[0.2em]">
                <MapPin size={12} /> {pitch.location}
              </div>
            </div>
            
            <p className="text-sm text-slate-600 italic leading-relaxed font-serif line-clamp-3">
              "{pitch.description}"
            </p>

            {/* Strategic Roadmap */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
              {pitch.bulletPoints?.slice(0, 2).map((bp, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <p className="text-[10px] font-bold text-slate-800 truncate">{bp}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Financial Registry */}
            <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
              <div>
                <p className="text-xl font-black text-slate-900 tracking-tighter">₹{pitch.totalRequired?.toLocaleString('en-IN')}</p>
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Required</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-slate-900 tracking-tighter">₹{minInv.toLocaleString('en-IN')}</p>
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Min Entry</p>
              </div>
            </div>

            <button className="w-full py-4 bg-black text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.4em] hover:bg-indigo-600 transition-all active:scale-[0.98]">
              Open Dossier
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- VIEW TRACKER COMPONENT ---
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
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Zap size={8} className="text-amber-500" fill="currentColor"/> Verified Intel</p>
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
        <button onClick={() => onComment(post.id)} className="flex items-center gap-2 hover:text-indigo-600 transition-all text-indigo-500/60">
          <MessageIcon size={20} />
          <span className="text-xs font-black">{post.comments?.length || 0}</span>
        </button>
        <button onClick={() => openMetrics(post)} className="flex items-center gap-2 hover:text-amber-600 transition-all">
          <BarChart3 size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Stats</span>
        </button>
        <button onClick={() => onShareClick(post)} className="ml-auto p-2 hover:bg-slate-50 rounded-full hover:text-amber-600 transition-colors">
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
};

const InvestorHome = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [pitches, setPitches] = useState([]); 
  const [posts, setPosts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [investorData, setInvestorData] = useState(null);
  const [isPostTerminalOpen, setIsPostTerminalOpen] = useState(false);

  const { handleLike, submitComment } = useInteractions();
  const [sharePost, setSharePost] = useState(null); 
  const [commentingPostId, setCommentingPostId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [viewingMetrics, setViewingMetrics] = useState(null);
  const [likersDetails, setLikersDetails] = useState([]);
  const [fetchingMetrics, setFetchingMetrics] = useState(false);

  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let docSnap = await getDoc(doc(db, "investors", user.uid));
        if (!docSnap.exists()) docSnap = await getDoc(doc(db, "startups", user.uid));
        if (docSnap.exists()) setInvestorData({ id: user.uid, ...docSnap.data() });
      } else { navigate('/'); }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    
    // POSTS STREAM
    const unsubPosts = onSnapshot(collection(db, "posts"), (snapshot) => {
      const allPosts = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        comments: Array.isArray(d.data().comments) ? d.data().comments : []
      }));
      const sorted = allPosts
        .filter(p => p.type !== 'strategic_pitch')
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPosts(sorted);
      setLoading(false);
    });

    // PITCHES STREAM
    const unsubPitches = onSnapshot(collection(db, "pitches"), (snap) => {
      const pitchData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sortedPitches = pitchData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPitches(sortedPitches);
    });

    return () => { unsubPosts(); unsubPitches(); };
  }, []);

  const handleRecordView = async (postId) => {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { views: increment(1) });
    } catch (err) { console.error("Impression error:", err); }
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
      } catch (e) { console.error("Stats failure:", e); }
    }
    setLikersDetails(details);
    setFetchingMetrics(false);
  };

  const activeCommentPost = posts.find(p => p.id === commentingPostId);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !commentingPostId) return;
    try {
      await submitComment(commentingPostId, newComment, investorData, activeCommentPost);
      setNewComment("");
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (err) { console.error(err); }
  };

  const handleTabChange = (label) => {
    if (label === 'profile') navigate('/investor-profile');
    else if (label === 'post') setIsPostTerminalOpen(true);
    else if (label === 'messages') navigate('/chat/hub');
    else setActiveTab(label);
  };

  if (loading) return <div className="min-h-screen bg-white flex flex-col items-center justify-center"><div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" /><p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600">Initializing Intel</p></div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-20 font-sans antialiased relative overflow-hidden">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <img src="/stainvrb.png" alt="STAINV" className="h-25 md:h-12 object-contain" />
        <div onClick={() => navigate('/search')} className="bg-slate-100 p-2.5 rounded-full cursor-pointer text-slate-400 hover:bg-black hover:text-white transition-all"><Search size={20} /></div>
      </nav>

      {/* Main Container with Snap Scrolling */}
      <main className={`max-w-xl mx-auto px-4 ${activeTab === 'startups' ? 'h-[calc(100vh-140px)] overflow-y-auto snap-y snap-mandatory no-scrollbar' : 'pt-6 h-auto overflow-y-visible'}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
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
            <motion.div key="startups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
              {pitches.length > 0 ? pitches.map(p => (
                <StrategicPitchCard 
                  key={p.id} 
                  pitch={p} 
                  onNavigate={(id) => navigate(`/startup-details/${id}`)} 
                />
              )) : (
                <div className="py-20 text-center opacity-20 h-full flex flex-col justify-center">
                    <Rocket size={48} className="mx-auto mb-4"/>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Strategic Registry Recovered</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* NAVIGATION BAR */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[400px] bg-white/90 backdrop-blur-2xl border border-slate-200 px-8 py-4 rounded-[32px] flex justify-between items-center z-50 shadow-2xl">
        <NavIcon icon={<Home />} label="home" active={activeTab} onClick={handleTabChange} />
        <NavIcon icon={<Rocket />} label="startups" active={activeTab} onClick={handleTabChange} />
        <NavIcon icon={<PlusSquare />} label="post" active={activeTab} onClick={handleTabChange} />
        <NavIcon icon={<MessageIcon />} label="messages" active={activeTab} onClick={handleTabChange} />
        <NavIcon icon={<User />} label="profile" active={activeTab} onClick={handleTabChange} />
      </nav>

      {/* MODALS */}
      <AnimatePresence>
        {activeCommentPost && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 z-[1000] bg-white flex flex-col">
            <nav className="p-6 flex items-center gap-6 border-b border-slate-100 sticky top-0 bg-white">
              <button onClick={() => setCommentingPostId(null)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-black transition-all"><ArrowLeft size={20}/></button>
              <h3 className="text-xs font-black uppercase tracking-[0.3em]">Intel Registry</h3>
            </nav>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeCommentPost.comments.map((c, idx) => (
                <div key={idx} className="flex gap-4 items-start bg-slate-50 p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center text-[10px] font-black uppercase">{c.authorName?.[0]}</div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">{c.authorName}</p>
                    <p className="text-sm font-bold text-slate-800">{c.text}</p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
            <div className="p-6 border-t border-slate-100 bg-white shadow-2xl">
              <form onSubmit={handleCommentSubmit} className="flex gap-3">
                <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add insight..." className="flex-1 bg-slate-50 rounded-2xl px-5 py-4 text-xs font-bold outline-none border border-slate-100 focus:border-amber-500 transition-all" />
                <button type="submit" className="bg-black text-white p-4 rounded-2xl"><Send size={18}/></button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPostTerminalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="w-full max-w-xl relative">
              <button onClick={() => setIsPostTerminalOpen(false)} className="absolute -top-12 right-0 p-3 text-white"><X size={24} /></button>
              <InvestorPost userProfile={investorData} onComplete={() => setIsPostTerminalOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <InvestorShare isOpen={!!sharePost} onClose={() => setSharePost(null)} postData={sharePost} />
    </div>
  );
};

const NavIcon = ({ icon, label, active, onClick }) => (
  <button onClick={() => onClick(label)} className={`flex flex-col items-center gap-1 transition-all ${active === label ? 'text-amber-600 scale-125' : 'text-slate-300 hover:text-slate-600'}`}>
    {React.cloneElement(icon, { size: 24, strokeWidth: active === label ? 2.5 : 2 })}
    {active === label && <motion.div layoutId="navDot" className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1" />}
  </button>
);

export default InvestorHome;