import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  getIdToken: () => Promise<string | null>;
  login: (email: string, pass: string) => Promise<UserProfile | null>;
  loginWithGoogle: () => Promise<UserProfile | null>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: { name?: string; profileImage?: string }) => Promise<void>;
  clearError: () => void;
  getUserInitials: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to map Firebase error codes to user-friendly messages
function formatFirebaseError(code: string, defaultMsg: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'The email address entered is invalid.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful login attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing authentication.';
    case 'auth/cancelled-popup-request':
      return 'Only one sign-in request can be active at a time.';
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by your browser. Please allow popups or redirect.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled in Firebase Console. Please enable it in Authentication -> Sign-in method.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address using a different sign-in method. Please sign in with your email and password.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for OAuth in Firebase Console. Please add it to Authentication -> Settings -> Authorized domains.';
    default:
      return defaultMsg;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      setLoading(false);
      return;
    }

    // Process redirect sign-in result if user was redirected for Google Sign-In
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user && db) {
          const userDocRef = doc(db, 'users', result.user.uid);
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            const displayName = result.user.displayName || result.user.email?.split('@')[0] || 'User';
            const defaultProfile: UserProfile = {
              userId: result.user.uid,
              name: displayName,
              email: result.user.email || '',
              role: 'user', // STRICTLY DEFAULT 'user'
              profileImage: result.user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            try {
              await setDoc(userDocRef, defaultProfile);
              setUserProfile(defaultProfile);
            } catch (writeErr) {
              console.warn('Could not create redirect user profile document:', writeErr);
            }
          }
        }
      })
      .catch((err) => {
        console.error('getRedirectResult error:', err);
        setError(formatFirebaseError(err.code, err.message || 'Google sign-in failed.'));
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser && db) {
          setUser(currentUser);
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Default user profile if document doesn't exist yet
            const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
            const defaultProfile: UserProfile = {
              userId: currentUser.uid,
              name: displayName,
              email: currentUser.email || '',
              role: 'user', // DEFAULT ROLE = USER
              profileImage: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            try {
              await setDoc(userDocRef, defaultProfile, { merge: true });
              setUserProfile(defaultProfile);
            } catch (writeErr) {
              console.warn('Could not auto-create missing user profile document:', writeErr);
              setUserProfile(defaultProfile);
            }
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (err: any) {
        console.error('Error in onAuthStateChanged profile resolution:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    return await user.getIdToken();
  };

  const loginWithGoogle = async (): Promise<UserProfile | null> => {
    if (!auth || !db) throw new Error('Firebase Auth/Firestore is not initialized');
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      let cred;
      try {
        cred = await signInWithPopup(auth, provider);
      } catch (popupErr: any) {
        if (popupErr.code === 'auth/popup-blocked') {
          console.warn('Popup blocked by browser, falling back to signInWithRedirect...');
          await signInWithRedirect(auth, provider);
          return null;
        }
        throw popupErr;
      }

      if (!cred || !cred.user) {
        return null;
      }

      const userDocRef = doc(db, 'users', cred.user.uid);
      const docSnap = await getDoc(userDocRef);

      let profile: UserProfile;
      if (docSnap.exists()) {
        // PRESERVE EXISTING PROFILE & ROLE! NEVER overwrite with 'user'
        profile = docSnap.data() as UserProfile;
      } else {
        // First-time Google user - create profile with default role 'user'
        const displayName = cred.user.displayName || cred.user.email?.split('@')[0] || 'User';
        profile = {
          userId: cred.user.uid,
          name: displayName,
          email: cred.user.email || '',
          role: 'user', // STRICTLY DEFAULT 'user'
          profileImage: cred.user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, profile);
      }

      setUser(cred.user);
      setUserProfile(profile);
      return profile;
    } catch (err: any) {
      const formatted = formatFirebaseError(err.code, err.message || 'Google sign-in failed.');
      setError(formatted);
      throw new Error(formatted);
    }
  };

  const login = async (email: string, pass: string): Promise<UserProfile | null> => {
    if (!auth || !db) throw new Error('Firebase Auth is not initialized');
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const userDocRef = doc(db, 'users', cred.user.uid);
      const docSnap = await getDoc(userDocRef);
      
      let profile: UserProfile;
      if (docSnap.exists()) {
        profile = docSnap.data() as UserProfile;
      } else {
        profile = {
          userId: cred.user.uid,
          name: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
          email: cred.user.email || email.trim(),
          role: 'user',
          profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cred.user.displayName || cred.user.uid)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        try {
          await setDoc(userDocRef, profile, { merge: true });
        } catch (e) {
          console.warn('Fallback profile creation notice:', e);
        }
      }

      setUser(cred.user);
      setUserProfile(profile);
      return profile;
    } catch (err: any) {
      const formatted = formatFirebaseError(err.code, err.message || 'Login failed.');
      setError(formatted);
      throw new Error(formatted);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    if (!auth || !db) throw new Error('Firebase Auth/Firestore is not initialized');
    setError(null);
    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
      
      // Update Firebase Auth profile display name
      if (cred.user) {
        await updateFirebaseProfile(cred.user, { displayName: trimmedName });
      }

      const newProfile: UserProfile = {
        userId: cred.user.uid,
        name: trimmedName,
        email: trimmedEmail,
        role: 'user', // Default role MUST be 'user'. Never allow client to register directly as admin!
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trimmedName)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setUser(cred.user);
      setUserProfile(newProfile);
    } catch (err: any) {
      const formatted = formatFirebaseError(err.code, err.message || 'Registration failed.');
      setError(formatted);
      throw new Error(formatted);
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error('Logout Error:', err);
    }
  };

  // Profile update: ALLOW name and profileImage, STRICTLY exclude role!
  const updateProfileData = async (data: { name?: string; profileImage?: string }) => {
    if (!user || !db || !userProfile) throw new Error('User not authenticated');

    const updateObj: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (data.name) {
      updateObj.name = data.name.trim();
      if (auth?.currentUser) {
        await updateFirebaseProfile(auth.currentUser, { displayName: data.name.trim() });
      }
    }
    if (data.profileImage) updateObj.profileImage = data.profileImage;

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, updateObj);

    setUserProfile((prev) => (prev ? { ...prev, ...updateObj } : null));
  };

  const getUserInitials = (): string => {
    const rawName = userProfile?.name || user?.displayName || user?.email || 'User';
    const parts = rawName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return rawName.slice(0, 2).toUpperCase();
  };

  const clearError = () => setError(null);

  const isAuthenticated = Boolean(user);
  const isAdmin = userProfile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        isAuthenticated,
        isAdmin,
        getIdToken,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfileData,
        clearError,
        getUserInitials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
