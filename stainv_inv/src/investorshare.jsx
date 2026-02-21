import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from './firebase';
import { 
  collection, query, addDoc, serverTimestamp, 
  where, onSnapshot, doc, getDoc 
} from 'firebase/firestore';
import { X, Send, Check, Search, Globe, ShieldCheck, Share2 } from 'lucide-react';

const InvestorShare = ({ isOpen, onClose, postData }) => {
  const [connections, setConnections] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isOpen || !auth.currentUser) return;

    // 1. LISTEN TO CONNECTIONS IN REAL-TIME
    const q = query(
      collection(db, "connections"),
      where("users", "array-contains", auth.currentUser.uid),
      where("status", "==", "connected")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoading(true);
      try {
        const fullProfiles = [];

        for (const docSync of snapshot.docs) {
          const partnerId = docSync.data().users.find(id => id !== auth.currentUser.uid);
          
          // 2. CROSS-COLLECTION PROFILE FETCH
          let pSnap = await getDoc(doc(db, "investors", partnerId));
          if (!pSnap.exists()) pSnap = await getDoc(doc(db, "startups", partnerId));
          
          if (pSnap.exists()) {
            const pData = pSnap.data();
            fullProfiles.push({
              id: partnerId,
              fullName: pData.fullName || pData.startupName || "Authorized Member",
              profilePhotoURL: pData.profilePhotoURL || pData.logo || "",
              type: pData.investorType || pData.sector || "Strategic Partner"
            });
          }
        }
        setConnections(fullProfiles);
      } catch (error) {
        console.error("Profile Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Registry connection error (Check Security Rules):", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const transmitIntel = async () => {
    if (selectedUsers.length === 0 || !postData || !auth.currentUser) return;

    try {
      const sharePromises = selectedUsers.map(async (userId) => {
        const chatId = [auth.currentUser.uid, userId].sort().join("_");
        const messagesRef = collection(db, "chats", chatId, "messages");

        // CRITICAL FIX: Ensure mediaUrl and mediaType are passed to the chat
        await addDoc(messagesRef, {
          type: "shared_post",
          text: postData.content || "Strategic Intel Shared",
          mediaUrl: postData.mediaUrl || null, // Shared Photo/Video URL
          mediaType: postData.mediaType || "image", 
          senderId: auth.currentUser.uid,
          senderName: "Member",
          createdAt: serverTimestamp(),
          postId: postData.id,
          isSharedTransmission: true
        });
      });

      await Promise.all(sharePromises);
      setSelectedUsers([]);
      onClose();
    } catch (error) {
      console.error("Transmission failure:", error);
      alert("Transmission failed. Please check network connection.");
    }
  };

  const filteredConnections = connections.filter(c => 
    c.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
            className="bg-white w-full max-w-md rounded-[3.5rem] overflow-hidden flex flex-col h-[75vh] shadow-2xl"
          >
            {/* HEADER */}
            <div className="p-8 border-b border-black/5 flex justify-between items-center bg-[#fcfcfc]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                    <Share2 size={14} className="text-amber-600" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600">Broadcast Protocol</h3>
                </div>
                <p className="text-xs font-bold text-black/30 uppercase tracking-widest text-black">Select Recipients</p>
              </div>
              <button onClick={onClose} className="p-3 bg-black/5 rounded-full hover:bg-black/10 transition-all">
                <X size={18}/>
              </button>
            </div>

            {/* SEARCH */}
            <div className="px-6 py-4 bg-white border-b border-black/5">
                <div className="relative group">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-amber-600 transition-colors" />
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Registry..." 
                        className="w-full bg-black/5 rounded-2xl py-4 pl-12 pr-4 outline-none text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-1 ring-amber-500/20 transition-all border border-transparent focus:border-black/5 text-black"
                        style={{ color: '#000000' }}
                    />
                </div>
            </div>

            {/* LIST */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-black">Decrypting Registry</p>
                </div>
              ) : filteredConnections.length > 0 ? (
                filteredConnections.map(user => (
                  <motion.div 
                    key={user.id} 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`p-4 rounded-[1.5rem] border transition-all duration-300 cursor-pointer flex items-center justify-between ${
                      selectedUsers.includes(user.id) 
                      ? "bg-amber-50 border-amber-200 shadow-md shadow-amber-600/5" 
                      : "bg-white border-black/5 hover:border-black/10 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center text-xs font-black uppercase overflow-hidden border border-black/5">
                          {user.profilePhotoURL ? (
                            <img src={user.profilePhotoURL} className="w-full h-full object-cover" alt="" />
                          ) : user.fullName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight text-black">{user.fullName}</p>
                        <p className="text-[8px] font-bold text-black/30 uppercase tracking-widest">{user.type}</p>
                      </div>
                    </div>
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedUsers.includes(user.id) 
                      ? "bg-black border-black text-white" 
                      : "border-black/10 text-transparent"
                    }`}>
                      <Check size={12} strokeWidth={4} />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                    <Globe size={40} strokeWidth={1} className="mb-4 text-black" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black">Registry Empty</p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="p-8 bg-white border-t border-black/5">
              <button 
                onClick={transmitIntel}
                disabled={selectedUsers.length === 0}
                className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.5em] text-[10px] flex items-center justify-center gap-3 hover:bg-amber-600 disabled:opacity-10 transition-all shadow-xl active:scale-95"
              >
                <Send size={16} /> Broadcast Intel ({selectedUsers.length})
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InvestorShare;