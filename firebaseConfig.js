import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAopDKbp7CvkBxXbbvIdyFMYQ9Ed60xmwk",
  authDomain: "konnektsocial-1014b.firebaseapp.com",
  projectId: "konnektsocial-1014b",
  storageBucket: "konnektsocial-1014b.firebasestorage.app",
  messagingSenderId: "717591170610",
  appId: "1:717591170610:web:b0116da94a1c7b3ed2362b",
  measurementId: "G-NLER8TXQNZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);