
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
// IMPORTANTE: Debes crear un archivo .env.local en la raíz del proyecto con las claves de Firebase
// Ver .env.example para referencia
export const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || getEnv('REACT_APP_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || getEnv('REACT_APP_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || getEnv('REACT_APP_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || getEnv('REACT_APP_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || getEnv('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID') || getEnv('REACT_APP_FIREBASE_APP_ID')
};

// Validación de seguridad - Falla si no están configuradas las variables de entorno
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error(
    '🔥 ERROR DE CONFIGURACIÓN: Variables de entorno de Firebase no configuradas.\n' +
    'Crea un archivo .env.local basado en .env.example y configura tus credenciales de Firebase.\n' +
    'Ver: https://firebase.google.com/docs/web/setup'
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
