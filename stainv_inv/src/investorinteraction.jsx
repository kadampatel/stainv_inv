import React, { createContext, useContext } from 'react';
import { db, auth } from './firebase';
import { 
  doc, updateDoc, increment, arrayUnion, arrayRemove, 
  addDoc, collection, serverTimestamp, deleteDoc, getDoc, setDoc 
} from 'firebase/firestore';

const InteractionContext = createContext();

export const InteractionProvider = ({ children }) => {
  
  // PRIMARY FIX: Updated detection to support all Pitch data variations
  const getCollectionName = (item) => {
    if (!item) return "posts";
    if (
      item.totalRequired || 
      item.minPerInvestor || 
      item.minInvestment || 
      item.type === 'strategic_pitch' || 
      item.type === 'investment_pitch'
    ) {
      return "pitches";
    }
    return "posts";
  };

  // --- 1. CONNECTION PROTOCOL ---
  const handleConnectionAction = async (targetId, currentUserId, action, myDossier = null) => {
    if (!currentUserId || !targetId) return;
    const connectionId = currentUserId < targetId ? `${currentUserId}_${targetId}` : `${targetId}_${currentUserId}`;
    const connectionRef = doc(db, "connections", connectionId);

    try {
      if (action === "request") {
        await setDoc(connectionRef, {
          users: [currentUserId, targetId],
          status: "pending",
          senderId: currentUserId,
          recipientId: targetId,
          createdAt: serverTimestamp()
        });
        await addDoc(collection(db, "notifications"), {
          recipientId: targetId,
          senderId: currentUserId,
          senderName: myDossier?.fullName || myDossier?.startupName || "Verified User",
          senderPhoto: myDossier?.profilePhotoURL || myDossier?.logo || "",
          type: "connection_request",
          status: "unread",
          createdAt: serverTimestamp()
        });
      } 
      else if (action === "accept") await updateDoc(connectionRef, { status: "connected" });
      else if (action === "disconnect" || action === "decline") await deleteDoc(connectionRef);
    } catch (error) { console.error(`Connection Error:`, error); }
  };

  // --- 2. MASTER TOGGLE LIKE LOGIC ---
  const handleLike = async (item) => {
    const userId = auth.currentUser?.uid; 
    if (!userId || !item?.id) return;
    const collectionName = getCollectionName(item);
    const itemRef = doc(db, collectionName, item.id);
    const isLiked = item.likedBy?.includes(userId);

    try {
      await updateDoc(itemRef, {
        likes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (error) { console.error(`Like Error:`, error); }
  };

  // --- 3. FETCH LIKED USERS DETAILS ---
  const getLikedUsersData = async (likedByIds) => {
    if (!likedByIds || likedByIds.length === 0) return [];
    try {
      const userPromises = likedByIds.map(async (uid) => {
        let userDoc = await getDoc(doc(db, "investors", uid));
        if (!userDoc.exists()) userDoc = await getDoc(doc(db, "startups", uid));
        return userDoc.exists() ? { id: uid, ...userDoc.data() } : null;
      });
      const results = await Promise.all(userPromises);
      return results.filter(u => u !== null); 
    } catch (error) { return []; }
  };

  // --- 4. MASTER SUBMIT COMMENT LOGIC (UPDATED FOR DYNAMIC COLLECTIONS) ---
  const submitComment = async (itemId, text, userData, itemData = null) => {
    const currentUser = auth.currentUser;
    if (!text.trim() || !itemId || !currentUser) return;
    
    // PRIMARY FIX: Detect if we are commenting on a Post or a Pitch
    const collectionName = itemData ? getCollectionName(itemData) : "posts";
    
    try {
      const itemRef = doc(db, collectionName, itemId);
      
      const newComment = {
        id: Date.now().toString(),
        text: text.trim(),
        authorName: userData?.fullName || userData?.startupName || "Verified Member",
        authorId: currentUser.uid,
        authorPhoto: userData?.profilePhotoURL || userData?.logo || "",
        createdAt: new Date().toISOString() 
      };
      
      await updateDoc(itemRef, { 
        comments: arrayUnion(newComment),
        commentsCount: increment(1) 
      });

    } catch (error) {
      console.error("Interaction Protocol Error (Comment):", error);
      alert("Interaction failed. Node permissions restricted.");
    }
  };

  // --- 5. MASTER DELETE COMMENT LOGIC (UPDATED FOR DYNAMIC COLLECTIONS) ---
  const deleteComment = async (itemId, commentObject, itemData = null) => {
    if (!itemId || !commentObject) return;
    
    // PRIMARY FIX: Dynamic collection target
    const collectionName = itemData ? getCollectionName(itemData) : "posts";

    try {
      const itemRef = doc(db, collectionName, itemId);
      
      await updateDoc(itemRef, { 
        comments: arrayRemove(commentObject),
        commentsCount: increment(-1) 
      });
    } catch (error) {
      console.error("Interaction Protocol Error (Delete):", error);
    }
  };

  return (
    <InteractionContext.Provider value={{ 
      handleLike, 
      getLikedUsersData, 
      submitComment, 
      deleteComment,
      handleConnectionAction 
    }}>
      {children}
    </InteractionContext.Provider>
  );
};

export const useInteractions = () => {
  const context = useContext(InteractionContext);
  if (!context) throw new Error("useInteractions must be used within an InteractionProvider");
  return context;
};