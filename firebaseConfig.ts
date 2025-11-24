import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración real proporcionada por el usuario
export const firebaseConfig = {
  apiKey: "AIzaSyDSKPR_uIe8C_4ZqcenGaOZEYB15O1Z_8M",
  authDomain: "studio-693417992-5c607.firebaseapp.com",
  projectId: "studio-693417992-5c607",
  storageBucket: "studio-693417992-5c607.firebasestorage.app",
  messagingSenderId: "297942551929",
  appId: "1:297942551929:web:30f2561f11b14aa66e33a8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);