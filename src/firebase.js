import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDS74Scpz68h_TFoq6mUtEo131dkNf7QLI",
  authDomain: "bunksafe-36c3d.firebaseapp.com",
  projectId: "bunksafe-36c3d",
  storageBucket: "bunksafe-36c3d.firebasestorage.app",
  messagingSenderId: "573793685790",
  appId: "1:573793685790:web:faa1ba3eac05b4b817f90f",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

// ✅ Persist login (important)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Persistence set to LOCAL");
  })
  .catch((error) => {
    console.error("Persistence error:", error);
  });

const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, db };