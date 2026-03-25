import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB2hCxFiapbCFN2JtB2Qfc9ScdLHw4D48k",
  authDomain: "resonate-hackathon.firebaseapp.com",
  projectId: "resonate-hackathon",
  storageBucket: "resonate-hackathon.firebasestorage.app",
  messagingSenderId: "816217422154",
  appId: "1:816217422154:web:dd95af6f5f1193b2ca69b3"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
