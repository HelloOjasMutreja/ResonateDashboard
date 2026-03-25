import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const signOutUser = async () => {
  await signOut(auth);
};

export const getCurrentUser = () => auth.currentUser;

export const listenToAuthState = (callback) =>
  onAuthStateChanged(auth, callback);
