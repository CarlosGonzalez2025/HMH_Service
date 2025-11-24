
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Helper to get env vars safely (supports Vite import.meta.env and standard process.env)
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[key];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
    // @ts-ignore
    return process.env[key];
  }
  return '';
};

// Configuración segura mediante Variables de Entorno
// Asegúrate de crear un archivo .env en la raíz del proyecto con estas claves
export const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || getEnv('REACT_APP_FIREBASE_API_KEY') || "AIzaSyDSKPR_uIe8C_4ZqcenGaOZEYB15O1Z_8M",
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || getEnv('REACT_APP_FIREBASE_AUTH_DOMAIN') || "studio-693417992-5c607.firebaseapp.com",
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || getEnv('REACT_APP_FIREBASE_PROJECT_ID') || "studio-693417992-5c607",
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || getEnv('REACT_APP_FIREBASE_STORAGE_BUCKET') || "studio-693417992-5c607.firebasestorage.app",
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || getEnv('REACT_APP_FIREBASE_MESSAGING_SENDER_ID') || "297942551929",
  appId: getEnv('VITE_FIREBASE_APP_ID') || getEnv('REACT_APP_FIREBASE_APP_ID') || "1:297942551929:web:30f2561f11b14aa66e33a8"
};

// Validación de seguridad para desarrollo
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("AIzaSyDSKPR_uIe8C_4ZqcenGaOZEYB15O1Z_8M")) {
    console.warn("⚠️ ADVERTENCIA DE SEGURIDAD: Usando credenciales hardcodeadas o por defecto. Configura tu archivo .env para producción.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
