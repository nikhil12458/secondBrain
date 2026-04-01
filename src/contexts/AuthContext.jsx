import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Track visit once per session
    const trackVisit = async () => {
      if (!sessionStorage.getItem('visitTracked')) {
        try {
          const analyticsRef = doc(db, 'analytics', 'visitors');
          await setDoc(analyticsRef, { 
            count: increment(1), 
            lastVisit: serverTimestamp() 
          }, { merge: true });
          sessionStorage.setItem('visitTracked', 'true');
        } catch (err) {
          console.error('Failed to track visit', err);
        }
      }
    };
    trackVisit();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          let data = null;
          if (!userSnap.exists()) {
            data = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
              photoURL: currentUser.photoURL || null,
              role: 'user',
              permissions: [],
              disabledFeatures: [],
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, data);
          } else {
            data = userSnap.data();
          }
          
          // If the user is the default admin, ensure they have the admin role
          if (currentUser.email === 'ektak144@gmail.com' && currentUser.emailVerified && data.role !== 'admin') {
            try {
              await updateDoc(userRef, { role: 'admin' });
              data.role = 'admin';
            } catch (adminErr) {
              console.error('Failed to auto-upgrade to admin:', adminErr);
            }
          }
          
          setUserDetails(data);
        } else {
          setUserDetails(null);
        }
        setUser(currentUser);
      } catch (error) {
        console.error('Error in onAuthStateChanged:', error);
        // Set user anyway to avoid infinite loading if Firestore fails
        setUser(currentUser);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signupWithEmail = async (email, password) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userDetails, loading, signInWithGoogle, loginWithEmail, signupWithEmail, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
