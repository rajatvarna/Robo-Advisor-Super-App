

import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    type User as FirebaseUser
} from 'firebase/auth';
import type { User } from '../types';
import { firebaseConfig } from '../firebase.config.js';

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
};

export const createAccountWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export const signInWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}


export const signOutUser = (): Promise<void> => signOut(auth);

export const onAuthStateChangedListener = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            const user: User = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'New User',
                email: firebaseUser.email || 'no-email@example.com',
                memberSince: firebaseUser.metadata.creationTime || new Date().toISOString(),
                // In a real app, subscription status would come from a backend/database.
                subscription: 'free', 
            };
            callback(user);
        } else {
            callback(null);
        }
    });
};