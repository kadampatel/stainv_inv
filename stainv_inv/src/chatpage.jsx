import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, where, doc, getDoc, updateDoc, deleteDoc, writeBatch, getDocs 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Send, ShieldCheck, Clock, Search,
  ChevronRight, MessageCircle, Zap,
  Home, Rocket, PlusSquare, User, Trash2, Edit3, Check, Paperclip, Share2, X, Image as ImageIcon, Film, FileText, Maximize2
} from 'lucide-react';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [recipientData, setRecipientData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // UI States
  const [hubSearch, setHubSearch] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null); // NEW: Internal Viewer State
  const scrollRef = useRef();

  // 1. DATA SYNC & IDENTITY DETECTION
  useEffect(() => {
    let isMounted = true;
    const user = auth.currentUser;
    if (!user) return;

    const fetchData = async () => {
      let mySnap = await getDoc(doc(db, "startups", user.uid));
      let IAmAStartup = mySnap.exists();
      if (!IAmAStartup) mySnap = await getDoc(doc(db, "investors", user.uid));
      if (isMounted && mySnap.exists()) setUserData({ ...mySnap.data(), isStartupUser: IAmAStartup });

      if (chatId && chatId !== "hub") {
        const partnerId = chatId.split('_').find(id => id !== user.uid);
        const startupSnap = await getDoc(doc(db, "startups", partnerId));
        if (startupSnap.exists() && isMounted) {
            setRecipientData({ id: partnerId, isStartup: true, ...startupSnap.data() });
        } else {
            const investorSnap = await getDoc(doc(db, "investors", partnerId));
            if (investorSnap.exists() && isMounted) {
                setRecipientData({ id: partnerId, isStartup: false, ...investorSnap.data() });
            }
        }
      }

      const q = query(collection(db, "connections"), where("users", "array-contains", user.uid), where("status", "==", "connected"));
      return onSnapshot(q, async (snapshot) => {
        const connList = [];
        for (const d of snapshot.docs) {
          const partnerId = d.data().users.find(id => id !== user.uid);
          let pSnap = await getDoc(doc(db, "startups", partnerId));
          let isPStartup = pSnap.exists();
          if (!isPStartup) pSnap = await getDoc(doc(db, "investors", partnerId));
          if (pSnap.exists()) {
            const p = pSnap.data();
            connList.push({ id: partnerId, name: p.startupName || p.fullName, photo: p.logo || p.profilePhotoURL, type: p.stage || p.investorType, isStartup: isPStartup });
          }
        }
        if (isMounted) { setConnections(connList); setLoading(false); }
      });
    };
    fetchData();
    return () => { isMounted = false; };
  }, [chatId]);

  // 2. MESSAGE STREAM
  useEffect(() => {
    if (!chatId || chatId === "hub") return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [chatId]);

  // 3. NAVIGATION
  const handleHeaderClick = () => {
    if (!recipientData) return;
    navigate(recipientData.isStartup ? `/startup-details/${recipientData.id}` : `/profile/${recipientData.id}`);
  };

  // 4. ACTIONS
  const uploadFile = async (file) => {
    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "STAINVreal");
    try {
      const resp = await fetch(`https://api.cloudinary.com/v1_1/dpirxq5op/auto/upload`, { method: "POST", body: data });
      const res = await resp.json();
      let fileType = file.type.includes('video') ? 'video' : 'image';
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: file.name, senderId: auth.currentUser.uid, createdAt: serverTimestamp(), mediaUrl: res.secure_url, mediaType: fileType
      });
    } catch (err) { console.error(err); } finally { setIsUploading(false); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;
    if (editingMessage) {
      await updateDoc(doc(db, "chats", chatId, "messages", editingMessage.id), { text: newMessage, isEdited: true });
      setEditingMessage(null);
    } else {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: newMessage, senderId: auth.currentUser.uid, senderName: userData?.startupName || userData?.fullName || "Member", createdAt: serverTimestamp(),
      });
    }
    setNewMessage("");
  };

  const galleryItems = useMemo(() => messages.filter(m => m.mediaUrl), [messages]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  // VIEW: HUB
  if (!chatId || chatId === "hub") {
    return (
      <div className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-32 font-sans">
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
          <img src="/stainvrb.png" alt="STAINV" className="h-8 md:h-10 object-contain" />
          <ShieldCheck className="text-amber-600" size={18} />
        </nav>
        <div className="p-6 relative max-w-2xl mx-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={hubSearch} onChange={(e) => setHubSearch(e.target.value)} placeholder="Search connections..." className="w-full bg-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none text-sm font-bold text-black" />
          </div>
        </div>
        <main className="max-w-2xl mx-auto p-6 space-y-4">
          {connections.filter(c => c.name?.toLowerCase().includes(hubSearch.toLowerCase())).map(c => (
            <div key={c.id} className="p-5 bg-white border border-slate-200 rounded-[2.5rem] flex items-center justify-between hover:border-amber-500 transition-all cursor-pointer shadow-sm group">
              <div className="flex items-center gap-4 flex-1" onClick={() => navigate(`/chat/${[auth.currentUser.uid, c.id].sort().join("_")}`)}>
                <div className="w-14 h-14 bg-black rounded-2xl overflow-hidden flex items-center justify-center text-white font-black">{c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : c.name?.[0]}</div>
                <div><h3 className="font-black text-sm uppercase text-slate-900">{c.name}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.type}</p></div>
              </div>
            </div>
          ))}
        </main>
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-[450px] bg-white/80 backdrop-blur-2xl border border-slate-200 px-8 py-5 rounded-[32px] flex justify-between items-center z-50 shadow-2xl">
          <NavIcon icon={<Home />} onClick={() => navigate(userData?.isStartupUser ? '/startup-home' : '/investor-home')} />
          <NavIcon icon={<Rocket />} onClick={() => navigate(userData?.isStartupUser ? '/startup-pitch-terminal' : '/investor-home', {state: {activeTab: 'startups'}}) } />
          <NavIcon icon={<PlusSquare />} onClick={() => navigate(userData?.isStartupUser ? '/startup-profile' : '/investor-home', { state: { activeTab: 'home', triggerPost: true } })} />
          <NavIcon icon={<MessageCircle />} active={true} />
          <NavIcon icon={<User />} onClick={() => navigate(userData?.isStartupUser ? '/startup-profile' : '/investor-profile')} />
        </nav>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col font-sans overflow-hidden antialiased">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 p-5 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/chat/hub')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 active:scale-90"><ArrowLeft size={20}/></button>
          <div onClick={handleHeaderClick} className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-all">
            <div className="h-10 w-10 rounded-2xl bg-black text-white flex items-center justify-center font-black overflow-hidden border border-black/10">
              {recipientData?.logo || recipientData?.profilePhotoURL ? <img src={recipientData.logo || recipientData.profilePhotoURL} className="w-full h-full object-cover" /> : 'A'}
            </div>
            <div>
              <p className="text-sm font-black uppercase text-slate-900 group-hover:text-amber-600">{recipientData?.startupName || recipientData?.fullName || "Secure Node"}</p>
              <div className="flex items-center gap-1 text-amber-600"><ShieldCheck size={10}/><span className="text-[8px] font-black uppercase tracking-widest">Authorized Link</span></div>
            </div>
          </div>
        </div>
        <button onClick={() => setShowGallery(true)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-amber-600 rounded-xl transition-all border border-slate-100 active:scale-95"><ImageIcon size={20} /></button>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-[#F8FAFC]">
        {messages.map((m) => {
          const isMe = m.senderId === auth.currentUser?.uid;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%] md:max-w-[60%] flex flex-col items-end">
                <div onClick={() => isMe && setSelectedMessageId(selectedMessageId === m.id ? null : m.id)} className={`p-4 rounded-[1.8rem] shadow-sm relative overflow-hidden transition-all ${isMe ? "bg-black text-white rounded-tr-none shadow-black/20" : "bg-white border border-slate-200 text-slate-900 rounded-tl-none"}`}>
                  {m.mediaUrl && (
                    <div onClick={(e) => { e.stopPropagation(); setSelectedMedia(m); }} className="mb-3 rounded-xl overflow-hidden bg-slate-100 border border-black/5 cursor-zoom-in group relative">
                      {m.mediaType === 'video' ? <video src={m.mediaUrl} className="w-full h-full" /> : <img src={m.mediaUrl} className="w-full max-h-64 object-cover" />}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Maximize2 className="text-white" size={24}/></div>
                    </div>
                  )}
                  <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                </div>
                {selectedMessageId === m.id && isMe && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => {setEditingMessage(m); setNewMessage(m.text); setSelectedMessageId(null);}} className="p-2 bg-slate-900 text-white rounded-full active:scale-90"><Edit3 size={12}/></button>
                    <button onClick={() => { if(window.confirm("Purge thread?")) deleteDoc(doc(db, "chats", chatId, "messages", m.id)); }} className="p-2 bg-rose-600 text-white rounded-full active:scale-90"><Trash2 size={12}/></button>
                  </div>
                )}
                <span className="text-[8px] font-black mt-1 text-slate-400 px-2">{m.createdAt ? new Date(m.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}</span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </main>

      <footer className="p-6 bg-white border-t border-slate-100">
        <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-[2rem] p-1.5 focus-within:bg-white transition-all shadow-sm">
          <label className="p-2 hover:bg-slate-200 rounded-full cursor-pointer text-slate-500 transition-colors"><Paperclip size={20} /><input type="file" className="hidden" onChange={(e) => uploadFile(e.target.files[0])} disabled={isUploading} /></label>
          <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={editingMessage ? "Edit transmission..." : "Type strategic message..."} className="flex-1 bg-transparent px-3 py-2 outline-none text-black font-black" />
          <button type="submit" disabled={!newMessage.trim() || isUploading} className="bg-black text-white p-3.5 rounded-full hover:bg-amber-600 active:scale-95 transition-all shadow-lg">{isUploading ? <Clock size={18} className="animate-spin" /> : editingMessage ? <Check size={18}/> : <Send size={18} />}</button>
        </form>
      </footer>

      {/* INTERNAL MEDIA VIEWER (PREVENTS OPENING NEW TABS) */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-black/95 flex flex-col items-center justify-center p-4">
            <button onClick={() => setSelectedMedia(null)} className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[2001]"><X size={32} /></button>
            <div className="max-w-full max-h-[85vh] relative flex items-center justify-center">
              {selectedMedia.mediaType === 'video' ? (
                <video src={selectedMedia.mediaUrl} controls autoPlay className="max-w-full max-h-full rounded-2xl shadow-2xl" />
              ) : (
                <img src={selectedMedia.mediaUrl} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" alt="Full" />
              )}
            </div>
            <p className="mt-8 text-white/50 font-black uppercase text-[10px] tracking-widest">{selectedMedia.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INTEL DOSSIER (GALLERY OVERLAY) */}
      <AnimatePresence>
        {showGallery && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[1000] bg-white flex flex-col antialiased">
            <nav className="p-6 flex justify-between items-center border-b border-slate-100">
              <div className="flex items-center gap-3"><ImageIcon className="text-amber-600" size={20} /><h3 className="text-xs font-black uppercase tracking-[0.3em]">Intel Dossier</h3></div>
              <button onClick={() => setShowGallery(false)} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-black transition-all"><X size={20} /></button>
            </nav>
            <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {galleryItems.map((item, idx) => (
                  <div key={idx} onClick={() => { setSelectedMedia(item); setShowGallery(false); }} className="aspect-square bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm group relative cursor-pointer">
                    {item.mediaType === 'video' ? (
                      <div className="w-full h-full relative"><video src={item.mediaUrl} className="w-full h-full object-cover opacity-60" /><div className="absolute inset-0 flex items-center justify-center text-slate-900"><Film size={24} /></div></div>
                    ) : (
                      <img src={item.mediaUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Gallery" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Zap size={20} className="text-white" fill="currentColor" /></div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavIcon = ({ icon, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-amber-600 scale-125' : 'text-slate-300 hover:text-slate-600'}`}>
    {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
    {active && <motion.div layoutId="navDot" className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1" />}
  </button>
);

export default ChatPage;