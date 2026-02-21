import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { db, auth } from './firebase'; 
import { 
  doc, onSnapshot, collection, query, where, orderBy, 
  setDoc, addDoc, serverTimestamp, deleteDoc, getDoc, getDocs
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Briefcase, ShieldCheck, Zap, Star, Heart, Share2,
  MessageSquare, UserPlus, UserMinus, Clock, Check, Eye, X, ChevronRight, Users
} from 'lucide-react';

import { useInteractions } from './investorinteraction';
import InvestorShare from './InvestorShare';

const InvestorPublicProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); 
  const [investorData, setInvestorData] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("none");
  const [myDossier, setMyDossier] = useState(null);

  // SOCIAL & MUTUAL STATES
  const [counts, setCounts] = useState({ investors: 0, startups: 0, posts: 0 });
  const [mutualConnections, setMutualConnections] = useState([]);

  // EXPLORER STATES
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const postRefs = useRef({});

  const { handleLike } = useInteractions();
  const isOwnProfile = auth.currentUser?.uid === id;

  useEffect(() => {
    if (!id) return;

    // 1. Target Profile Listener
    const unsubProfile = onSnapshot(doc(db, "investors", id), (snap) => {
      if (snap.exists()) {
        setInvestorData(snap.data());
        setLoading(false); 
      } else {
        getDoc(doc(db, "startups", id)).then(sSnap => {
          if(sSnap.exists()) {
            setInvestorData(sSnap.data());
            setLoading(false);
          } else { navigate('/investor-home'); }
        });
      }
    });

    // 2. Post Timeline Listener & Count
    const qPosts = query(collection(db, "posts"), where("authorId", "==", id), orderBy("createdAt", "desc"));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      setMyPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCounts(prev => ({ ...prev, posts: snap.size }));
    }, (err) => console.log("Waiting for index..."));

    // 3. Mutual Connections & Global Count Discovery
    const resolveSocialProofs = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // FETCH MUTUALS: Compare my connected IDs with target profile connected IDs
      const myConnsQuery = query(collection(db, "connections"), where("status", "==", "connected"), where("users", "array-contains", currentUser.uid));
      const targetConnsQuery = query(collection(db, "connections"), where("status", "==", "connected"), where("users", "array-contains", id));

      const [mySnap, targetSnap] = await Promise.all([getDocs(myConnsQuery), getDocs(targetConnsQuery)]);

      const mySet = new Set(mySnap.docs.map(d => d.data().users.find(u => u !== currentUser.uid)));
      const targetSet = new Set(targetSnap.docs.map(d => d.data().users.find(u => u !== id)));

      const mutualIds = [...mySet].filter(uid => targetSet.has(uid));
      
      if (mutualIds.length > 0) {
        const mutualData = await Promise.all(mutualIds.slice(0, 3).map(async (mId) => {
          const mSnap = await getDoc(doc(db, "investors", mId));
          return mSnap.exists() ? { id: mId, ...mSnap.data() } : null;
        }));
        setMutualConnections(mutualData.filter(m => m !== null));
      }
    };
    resolveSocialProofs();

    // 4. Connection Status & Global Stats Sync
    const qConnections = query(collection(db, "connections"), where("status", "==", "connected"), where("users", "array-contains", id));
    const unsubConnStats = onSnapshot(qConnections, async (snap) => {
      let invCount = 0; let startCount = 0;
      const rolePromises = snap.docs.map(async (conDoc) => {
        const otherId = conDoc.data().users.find(uid => uid !== id);
        const invCheck = await getDoc(doc(db, "investors", otherId));
        if (invCheck.exists()) invCount++; else startCount++;
      });
      await Promise.all(rolePromises);
      setCounts(prev => ({ ...prev, investors: invCount, startups: startCount }));
    });

    // 5. Individual Connection (Viewer vs Profile)
    if (auth.currentUser && !isOwnProfile) {
      const myId = auth.currentUser.uid;
      const connectionId = myId < id ? `${myId}_${id}` : `${id}_${myId}`;
      onSnapshot(doc(db, "connections", connectionId), (snap) => {
        setConnectionStatus(snap.exists() ? snap.data().status : "none");
      });
    }

    // 6. Fetch Viewer's Own Data
    if (auth.currentUser) {
      getDoc(doc(db, "investors", auth.currentUser.uid)).then(snap => {
        if (snap.exists()) setMyDossier(snap.data());
        else getDoc(doc(db, "startups", auth.currentUser.uid)).then(s => setMyDossier(s.data()));
      });
    }

    return () => { unsubProfile(); unsubPosts(); unsubConnStats(); };
  }, [id, navigate, isOwnProfile]);

  useEffect(() => {
    if (selectedPostId && postRefs.current[selectedPostId]) {
      setTimeout(() => {
        postRefs.current[selectedPostId].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [selectedPostId]);

  const handleConnectionAction = async () => {
    const myId = auth.currentUser?.uid;
    if (!myId || !id || actionLoading) return;
    setActionLoading(true);
    const connectionId = myId < id ? `${myId}_${id}` : `${id}_${myId}`;
    try {
      if (connectionStatus === "none") {
        await setDoc(doc(db, "connections", connectionId), { status: "pending", senderId: myId, recipientId: id, users: [myId, id], createdAt: serverTimestamp() });
        await addDoc(collection(db, "notifications"), {
          recipientId: id, senderId: myId, senderName: myDossier?.fullName || myDossier?.startupName || "Verified User",
          senderPhoto: myDossier?.profilePhotoURL || myDossier?.logo || "", type: "connection_request", createdAt: serverTimestamp(), status: "unread"
        });
      } else { await deleteDoc(doc(db, "connections", connectionId)); }
    } catch (e) { console.error(e); } finally { setActionLoading(false); }
  };

  const openChat = () => {
    const chatId = [auth.currentUser.uid, id].sort().join("_");
    navigate(`/chat/${chatId}`, { state: { recipientName: investorData.fullName || investorData.startupName } });
  };

  const handleShareProfile = () => {
    const shareUrl = `${window.location.origin}/${investorData?.startupName ? 'startup-details' : 'profile'}/${id}`;
    if (navigator.share) { navigator.share({ title: investorData?.fullName || investorData?.startupName, url: shareUrl }).catch(console.error); }
    else { navigator.clipboard.writeText(shareUrl); alert("Authenticated Profile Link Copied"); }
  };

  const StatItem = ({ label, count }) => (
    <div className="flex flex-col items-center">
      <span className="text-xl font-black text-slate-900 tracking-tighter">{count}</span>
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
    </div>
  );

  if (loading) return <div className="min-h-screen bg-white flex flex-col items-center justify-center"><div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" /><p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">Syncing Dossier</p></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-40 font-sans relative antialiased selection:bg-amber-100">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-black"><ArrowLeft size={20} /></button>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Dossier</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleShareProfile} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-amber-600 transition-all"><Share2 size={20} /></button>
          <img src="/stainvrb.png" alt="Logo" className="h-25 object-contain" />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-8 space-y-8">
        <section className="relative aspect-[4/5] w-full bg-slate-200 rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden group">
          {investorData?.profilePhotoURL || investorData?.logo ? (
            <img src={investorData.profilePhotoURL || investorData.logo} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" alt="Profile" />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center font-serif italic text-slate-200 text-9xl uppercase">{(investorData?.fullName || investorData?.startupName)?.[0]}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-70" />
          <div className="absolute bottom-10 left-10 right-10 p-8 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/20">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-2">{investorData?.investorType || investorData?.industry || "Venture Entity"}</p>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">{investorData?.fullName || investorData?.startupName}</h2>
          </div>
        </section>

        {/* MUTUAL CONNECTIONS BOX */}
        {mutualConnections.length > 0 && (
          <div className="flex items-center justify-between px-8 py-4 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {mutualConnections.map((m, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-black overflow-hidden shadow-sm">
                    <img src={m.profilePhotoURL || m.logo} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-tight">
                Known via {mutualConnections[0].fullName || mutualConnections[0].startupName} {mutualConnections.length > 1 && `+${mutualConnections.length - 1} others`}
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

        {!isOwnProfile && (
          <div className="flex flex-col md:flex-row gap-3">
            {connectionStatus === 'connected' ? (
              <>
                <div className="flex-1 py-5 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-3 bg-amber-50 text-amber-700 border border-amber-100"><Check size={16}/> Connected</div>
                <button onClick={openChat} className="flex-1 py-5 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-3 bg-black text-white shadow-xl hover:bg-amber-600 transition-all active:scale-95"><MessageSquare size={16}/> Message</button>
                <button onClick={handleConnectionAction} className="p-5 rounded-[2rem] bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-slate-200 flex items-center justify-center"><UserMinus size={18} /></button>
              </>
            ) : (
              <button onClick={handleConnectionAction} disabled={actionLoading} className={`flex-1 py-5 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 ${connectionStatus === 'pending' ? "bg-slate-100 text-slate-400 border border-slate-200" : "bg-black text-white hover:bg-amber-600"}`}>
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : connectionStatus === 'pending' ? <><Clock size={16}/> Requested</> : <><Zap size={16}/> Connect Protocol</>}
              </button>
            )}
          </div>
        )}

        <section className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm space-y-8">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 text-[9px] font-black uppercase text-slate-500 tracking-widest"><MapPin size={12} className="text-amber-600"/> {investorData?.country || "Global"}</div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full border border-amber-100 text-[9px] font-black uppercase tracking-widest"><Star size={12} /> {investorData?.firmName || investorData?.tagline || "Verified Entity"}</div>
            <div className="flex items-center gap-2 px-4 py-2 bg-black rounded-full text-[9px] font-black uppercase text-white shadow-lg tracking-widest"><Zap size={10} className="text-amber-500" fill="currentColor" /> {investorData?.experienceRole || investorData?.stage || "Authorized"}</div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300">Executive Narrative</h4>
            <p className="text-2xl text-slate-800 font-serif italic leading-relaxed">"{investorData?.bio || investorData?.description || "thesis restricted."}"</p>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-3 pb-20">
          {myPosts.map(post => (
            <div key={post.id} onClick={() => setSelectedPostId(post.id)} className="relative aspect-square bg-white border border-slate-200 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group shadow-sm cursor-pointer">
               {post.mediaUrl ? <img src={post.mediaUrl} className="w-full h-full object-cover" alt="Post" /> : <div className="p-4 flex items-center justify-center h-full bg-slate-50 text-center text-[8px] text-slate-400 font-bold italic">"{post.content.substring(0, 30)}..."</div>}
               <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><Eye size={20} className="text-white" /></div>
            </div>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {selectedPostId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1100] bg-[#F8FAFC] overflow-y-auto antialiased">
            <div className="sticky top-0 z-[1200] bg-white/80 backdrop-blur-xl p-6 border-b border-slate-100 flex items-center justify-between">
              <button onClick={() => setSelectedPostId(null)} className="p-2 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"><ArrowLeft size={20} /></button>
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Dossier Timeline</h3>
              <div className="w-10" />
            </div>
            <div className="max-w-2xl mx-auto p-4 space-y-12 py-10 pb-40">
              {myPosts.map((post) => (
                <div key={post.id} ref={el => postRefs.current[post.id] = el} className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl transition-all">
                  <div className="p-8 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-black overflow-hidden flex items-center justify-center">
                      {investorData?.profilePhotoURL || investorData?.logo ? <img src={investorData.profilePhotoURL || investorData.logo} className="w-full h-full object-cover" /> : <div className="text-white font-black">{(investorData?.fullName || investorData?.startupName)?.[0]}</div>}
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase text-slate-900">{investorData?.fullName || investorData?.startupName}</h4>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Network Transmission</p>
                    </div>
                  </div>
                  <div className="px-10 pb-8 text-xl text-slate-700 font-serif italic leading-relaxed">"{post.content}"</div>
                  {post.mediaUrl && <div className="px-6 pb-6"><img src={post.mediaUrl} className="w-full rounded-[2.5rem] aspect-square object-cover shadow-inner" alt="post" /></div>}
                  <div className="p-10 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex gap-12 text-slate-400">
                      <button onClick={() => handleLike(post)} className={`flex items-center gap-2 transition-all ${post.likedBy?.includes(auth.currentUser?.uid) ? 'text-rose-500 scale-110' : 'hover:text-rose-500'}`}><Heart size={26} fill={post.likedBy?.includes(auth.currentUser?.uid) ? "currentColor" : "none"} /><span className="font-black text-xs">{post.likes || 0}</span></button>
                      <button className="flex items-center gap-2 hover:text-indigo-600 transition-all"><MessageSquare size={26} /><span className="font-black text-xs">{post.commentsCount || 0}</span></button>
                    </div>
                    <button onClick={() => setSharePost(post)} className="p-4 bg-slate-50 rounded-full hover:bg-amber-500 hover:text-white transition-all shadow-sm"><Share2 size={22} /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <InvestorShare isOpen={!!sharePost} onClose={() => setSharePost(null)} postData={sharePost} />
    </div>
  );
};

export default InvestorPublicProfile;