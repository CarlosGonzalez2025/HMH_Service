import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Tenant } from '../types';
import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // OPTIMIZATION: Try to get user by Auth UID first (Best Practice & Secure)
          // This avoids "Missing Permissions" errors on open queries.
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          let userData: User | null = null;

          if (userDocSnap.exists()) {
             userData = { ...userDocSnap.data(), id: userDocSnap.id } as User;
          } else {
             // FALLBACK: Legacy support for users created with random IDs (from old seeder)
             // This might fail if security rules are strict.
             const usersRef = collection(db, 'users');
             const q = query(usersRef, where('email', '==', firebaseUser.email));
             const querySnapshot = await getDocs(q);
             if (!querySnapshot.empty) {
                const d = querySnapshot.docs[0];
                userData = { ...d.data(), id: d.id } as User;
             }
          }

          if (userData) {
            setUser(userData);

            // 2. Fetch Tenant details if applicable
            if (userData.tenantId) {
              const tenantRef = doc(db, 'tenants', userData.tenantId);
              const tenantSnap = await getDoc(tenantRef);
              
              if (tenantSnap.exists()) {
                 const tData = tenantSnap.data();
                 // Handle Firestore Timestamp for createdAt
                 let createdAtStr = '';
                 if (tData.createdAt) {
                    if (typeof tData.createdAt === 'object' && 'seconds' in tData.createdAt) {
                        createdAtStr = new Date(tData.createdAt.seconds * 1000).toISOString().split('T')[0];
                    } else {
                        createdAtStr = tData.createdAt;
                    }
                 }
                 setTenant({ ...tData, id: tenantSnap.id, createdAt: createdAtStr } as Tenant);
              }
            } else {
              setTenant(null);
            }
          } else {
            console.warn("User authenticated but no profile found in Firestore.");
            // Optional: Create basic profile here if needed
          }

        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUser(null);
        setTenant(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password || "123456");
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      alert(`Error: ${error.message}`);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setTenant(null);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, tenant, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};