import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth } from './firebase'; 
import { 
  doc, onSnapshot, query, collection, where, getDoc, getDocs 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Rocket, ShieldCheck, Zap, Heart, MessageSquare, Share2,
  MapPin, Eye, X, UserPlus, UserMinus, MessageCircle, Users
} from 'lucide-react';

import { useInteractions } from './investorinteraction';
import InvestorShare from './InvestorShare';

const StartupDetails = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contentTab, setContentTab] = useState("pitches"); 
  const [myPosts, setMyPosts] = useState([]);
  const [myPitches, setMyPitches] = useState([]);
  const [selectedArchitect, setSelectedArchitect] = useState(null); 
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null); 
  const [userData, setUserData] = useState(null);
  const postRefs = useRef({});

  // SOCIAL & MUTUAL STATES
  const [counts, setCounts] = useState({ investors: 0, startups: 0, posts: 0 });
  const [mutualConnections, setMutualConnections] = useState([]);

  const { handleLike, handleConnectionAction } = useInteractions();

  useEffect(() => {
    if (!id) return;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      // 1. IDENTITY & MUTUAL DISCOVERY HANDSHAKE
      const resolveIdentityAndMutuals = async () => {
        let userSnap = await getDoc(doc(db, "investors", user.uid));
        if (!userSnap.exists()) userSnap = await getDoc(doc(db, "startups", user.uid));
        
        if (userSnap.exists()) {
          const myData = { id: user.uid, ...userSnap.data() };
          setUserData(myData);

          // FETCH MUTUALS: Compare my connections with target startup's connections
          const myConnsQuery = query(collection(db, "connections"), where("status", "==", "connected"), where("users", "array-contains", user.uid));
          const targetConnsQuery = query(collection(db, "connections"), where("status", "==", "connected"), where("users", "array-contains", id));

          const [mySnap, targetSnap] = await Promise.all([getDocs(myConnsQuery), getDocs(targetConnsQuery)]);

          const mySet = new Set(mySnap.docs.map(d => d.data().users.find(u => u !== user.uid)));
          const targetSet = new Set(targetSnap.docs.map(d => d.data().users.find(u => u !== id)));

          const mutualIds = [...mySet].filter(uid => targetSet.has(uid));
          
          if (mutualIds.length > 0) {
            const mutualData = await Promise.all(mutualIds.slice(0, 3).map(async (mId) => {
              const mSnap = await getDoc(doc(db, "investors", mId));
              return mSnap.exists() ? { id: mId, ...mSnap.data() } : null;
            }));
            setMutualConnections(mutualData.filter(m => m !== null));
          }
        }
      };
      resolveIdentityAndMutuals();

      // 2. PROFILE DATA
      onSnapshot(doc(db, "startups", id), (snap) => {
        if (snap.exists()) setProfileData(snap.data());
        setLoading(false);
      });

      // 3. SOCIAL REGISTRY COUNTERS
      const qConnections = query(collection(db, "connections"), where("status", "==", "connected"), where("users", "array-contains", id));
      onSnapshot(qConnections, async (snap) => {
        let invCount = 0; let startCount = 0;
        const rolePromises = snap.docs.map(async (conDoc) => {
          const otherId = conDoc.data().users.find(uid => uid !== id);
          const invCheck = await getDoc(doc(db, "investors", otherId));
          if (invCheck.exists()) invCount++; else startCount++;
        });
        await Promise.all(rolePromises);
        setCounts(prev => ({ ...prev, investors: invCount, startups: startCount }));
      });

      // 4. PITCHES & POSTS
      onSnapshot(query(collection(db, "pitches"), where("authorId", "==", id)), (snap) => {
        const pitchData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMyPitches(pitchData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      });

      onSnapshot(query(collection(db, "posts"), where("authorId", "==", id)), (snap) => {
        const postsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMyPosts(postsData.filter(p => p.type !== 'strategic_pitch').sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        setCounts(prev => ({ ...prev, posts: snap.size }));
      });

      // 5. CONNECTION STATUS
      const connectionId = [user.uid, id].sort().join("_");
      onSnapshot(doc(db, "connections", connectionId), (snap) => {
        setConnectionStatus(snap.exists() ? snap.data().status : null);
      });
    });
  }, [id, navigate]);

  const StatItem = ({ label, count }) => (
    <div className="flex flex-col items-center">
      <span className="text-xl font-black text-slate-900 tracking-tighter">{count}</span>
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
    </div>
  );

  const renderActionRegistry = () => {
    const user = auth.currentUser;
    if (!user) return null;
    if (connectionStatus === "connected") return (
      <div className="flex gap-4 w-full">
        <button onClick={() => navigate(`/chat/${[user.uid, id].sort().join("_")}`)} className="flex-1 py-6 bg-black text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"><MessageCircle size={18} /> Send Message</button>
        <button onClick={() => handleConnectionAction(id, user.uid, 'disconnect')} className="p-6 bg-rose-50 text-rose-500 rounded-[2.5rem] border border-rose-100 hover:bg-rose-50 transition-all shadow-lg"><UserMinus size={20} /></button>
      </div>
    );
    if (connectionStatus === "pending") return <div className="w-full py-6 bg-slate-100 border border-slate-200 text-slate-400 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.3em] text-center italic">Signal Pending Approval</div>;
    return <button onClick={() => handleConnectionAction(id, user.uid, 'request', userData)} className="w-full py-6 bg-amber-600 text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all active:scale-95"><UserPlus size={18} /> Request Connection</button>;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  const data = profileData || { startupName: "Authorized Dossier" };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-48 font-sans relative antialiased overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-black"><ArrowLeft size={20} /></button>
          <ShieldCheck size={16} className="text-amber-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Dossier</span>
        </div>
        <img src="/stainvrb.png" alt="Logo" className="h-25 object-contain" />
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-8 space-y-10">
        <section className="relative aspect-[4/5] w-full bg-slate-200 rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
          {data.logo ? <img src={data.logo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-7xl font-black text-slate-200">{data.startupName?.[0]}</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          <div className="absolute bottom-10 left-10 right-10 p-8 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/20">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-2">{data.sector || data.industry}</p>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">{data.startupName}</h2>
          </div>
        </section>

        {/* MUTUAL CONNECTIONS INDICATOR */}
        {mutualConnections.length > 0 && (
          <div className="flex items-center justify-between px-8 py-4 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {mutualConnections.map((m, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-black overflow-hidden shadow-sm">
                    <img src={m.profilePhotoURL} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-tight">
                Connected via {mutualConnections[0].fullName} {mutualConnections.length > 1 && `+${mutualConnections.length - 1} others`}
              </p>
            </div>
            <Users size={14} className="text-indigo-400" />
          </div>
        )}

        <div className="grid grid-cols-3 py-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <StatItem label="Investors" count={counts.investors} />
          <div className="flex items-center justify-center border-x border-slate-100"><StatItem label="Startups" count={counts.startups} /></div>
          <StatItem label="Broadcasts" count={counts.posts} />
        </div>

        <section className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm space-y-8">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 text-[9px] font-black uppercase text-slate-500 tracking-widest"><Rocket size={12} className="text-amber-600" /> {data.tagline}</div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 text-[9px] font-black uppercase text-slate-500 tracking-widest"><MapPin size={12} className="text-amber-600" /> {data.city}</div>
            <div className="flex items-center gap-2 px-4 py-2 bg-black rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg"><Zap size={10} className="text-amber-500" fill="currentColor" /> {data.stage}</div>
          </div>
          <p className="text-2xl text-slate-800 font-serif italic leading-relaxed">"{data.description}"</p>
        </section>

        {/* ... (Architects, Pitches, and Timeline remain same) */}
        <div className="space-y-6 pt-6">
          <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300 px-4">The Architects</h3>
          <div className="grid grid-cols-2 gap-4">
            {data.founders?.map((founder, index) => (
              <div key={index} onClick={() => setSelectedArchitect(founder)} className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm cursor-pointer hover:border-amber-500 transition-all group">
                <div className="h-12 w-12 rounded-2xl bg-black overflow-hidden flex-shrink-0 flex items-center justify-center border border-black/10">
                   {founder.photo ? <img src={founder.photo} className="w-full h-full object-cover" /> : <div className="text-white font-black">{founder.name?.[0]}</div>}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black uppercase text-slate-900 truncate group-hover:text-amber-600">{founder.name}</p>
                  <p className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">{founder.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-10 space-y-8">
          <div className="flex justify-center gap-4 bg-slate-100/50 p-1.5 rounded-full max-w-fit mx-auto border border-slate-200">
            <button onClick={() => setContentTab("pitches")} className={`px-8 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${contentTab === 'pitches' ? 'bg-black text-white shadow-lg' : 'text-slate-400'}`}>Pitches</button>
            <button onClick={() => setContentTab("posts")} className={`px-8 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${contentTab === 'posts' ? 'bg-black text-white shadow-lg' : 'text-slate-400'}`}>Timeline</button>
          </div>

          <div className="w-full">
            {contentTab === "posts" ? (
              <div className="grid grid-cols-3 gap-3">
                {myPosts.map(post => (
                  <div key={post.id} onClick={() => setSelectedPostId(post.id)} className="aspect-square bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden cursor-pointer relative group">
                    {post.mediaUrl ? <img src={post.mediaUrl} className="w-full h-full object-cover" /> : <div className="p-4 h-full bg-slate-50 flex items-center justify-center text-[8px] text-slate-400 italic text-center">"{post.content?.substring(0,20)}..."</div>}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><Eye size={20} className="text-white"/></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-12 w-full">
                {myPitches.length > 0 ? myPitches.map(pitch => {
                  const hasLiked = pitch.likedBy?.includes(auth.currentUser?.uid);
                  const minInv = pitch.minInvestment || pitch.minPerInvestor || 0;
                  const pitchVisual = pitch.bgPhoto || pitch.mediaUrl;
                  return (
                    <div key={pitch.id} className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-xl relative group">
                       {pitchVisual ? <img src={pitchVisual} className="w-full h-64 object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt="Pitch" /> : <div className="w-full h-64 bg-slate-100 flex items-center justify-center text-slate-300 font-black uppercase text-[10px] tracking-[0.4em]">Visual Intel Restricted</div>}
                       <div className="p-10 space-y-6">
                         <div><h3 className="text-3xl font-black uppercase italic text-slate-900 leading-tight mb-2 tracking-tighter">{pitch.headline || "Strategic Asset"}</h3><div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest"><MapPin size={14} /> {pitch.location || "Verified Node"}</div></div>
                         <p className="text-lg text-slate-600 italic leading-relaxed">"{pitch.description}"</p>
                         <div className="flex justify-between items-end pt-4">
                             <div className="flex gap-10">
                                <div><p className="text-3xl font-black text-slate-900 tracking-tighter">${pitch.totalRequired?.toLocaleString() || "0"}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Required</p></div>
                                <div><p className="text-3xl font-black text-slate-900 tracking-tighter">${minInv.toLocaleString()}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min per Investor</p></div>
                             </div>
                             <div className="flex gap-4">
                                <button onClick={() => handleLike(pitch)} className={`p-5 rounded-[2rem] bg-slate-50 transition-all ${hasLiked ? 'text-rose-500 shadow-lg' : 'text-slate-400'}`}><Heart size={28} fill={hasLiked ? "currentColor" : "none"}/></button>
                                <button onClick={() => setSharePost(pitch)} className="p-5 rounded-[2rem] bg-slate-50 text-slate-400 hover:text-amber-600 transition-all shadow-sm"><Share2 size={28}/></button>
                             </div>
                         </div>
                       </div>
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center py-20 opacity-20"><Rocket size={48} className="mb-4 text-slate-300" /><p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-center px-10 leading-loose">No active pitches recovered from registry.</p></div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedArchitect && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 30 }} className="fixed inset-0 z-[1000] bg-white overflow-y-auto">
            <div className="sticky top-0 p-6 flex justify-between bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
              <button onClick={() => setSelectedArchitect(null)} className="p-3 bg-slate-100 rounded-full hover:bg-black transition-all text-slate-400"><X size={24}/></button>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Architect Dossier</h3>
              <div className="w-12" />
            </div>
            <div className="max-w-2xl mx-auto px-4 pt-4 pb-40 space-y-8 text-center">
              <section className="relative aspect-[4/5] w-full rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-white mx-auto">
                {selectedArchitect.photo ? <img src={selectedArchitect.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-black flex items-center justify-center text-7xl font-black text-white">{selectedArchitect.name?.[0]}</div>}
              </section>
              <h2 className="text-5xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">{selectedArchitect.name}</h2>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">{selectedArchitect.role}</p>
              <p className="text-2xl text-slate-700 font-serif italic leading-relaxed px-8">{selectedArchitect.bio || "Visionary leading node growth."}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] md:w-[450px] z-50">{renderActionRegistry()}</div>
      <InvestorShare isOpen={!!sharePost} onClose={() => setSharePost(null)} postData={sharePost} />
    </div>
  );
};

export default StartupDetails;