import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Added for future Pitch Deck uploads

const firebaseConfig = {
  apiKey: "AIzaSyBlPu5f-kzIdSXeRZj3xcwLCa45NtEy8T8",
  authDomain: "stainvreal.firebaseapp.com",
  projectId: "stainvreal",
  storageBucket: "stainvreal.firebasestorage.app",
  messagingSenderId: "417820265625",
  appId: "1:417820265625:web:29df964d6810b3275c3c08",
  measurementId: "G-5SMR6YJL2K"
};

// 1. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2. Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // For files like PDF pitch decks

// 3. Set Persistence immediately
// Note: We don't necessarily need the .then() block unless you're debugging, 
// as Firebase handles the queuing of auth requests automatically.
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Auth Persistence Error:", err.message);
});

// 4. Export services
export { auth, db, storage };