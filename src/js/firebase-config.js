// Firebase SDK imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCiE1Ubpkl7Pstl_FT1CemIY7A75l6bDiM",
  authDomain: "noor-gms.firebaseapp.com",
  projectId: "noor-gms",
  storageBucket: "noor-gms.firebasestorage.app",
  messagingSenderId: "432667162160",
  appId: "1:432667162160:web:11ac49d6755d8ade3e9ff5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Expose globally for debugging
window.firebaseAuth = auth;
window.firebaseDb = db;
