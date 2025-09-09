import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import type { AuthService } from './interfaces';
import type { User, AuthCredentials, AuthResult, AuthError } from '../../types';
import { firebaseConfig } from './firebase-config';

/**
 * Firebase implementation of the AuthService interface
 */
export class FirebaseAuthService implements AuthService {
  private app;
  private auth;
  private initialized = false;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Firebase is initialized on import, but we can add any additional setup here
    this.initialized = true;
  }

  private mapFirebaseUser(firebaseUser: FirebaseUser | null): User | null {
    if (!firebaseUser) return null;
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL
    };
  }

  private mapFirebaseError(error: any): AuthError {
    return {
      code: error.code || 'unknown',
      message: error.message || 'An unknown error occurred'
    };
  }

  async signUp(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        credentials.email, 
        credentials.password
      );
      
      return {
        user: this.mapFirebaseUser(userCredential.user),
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: this.mapFirebaseError(error)
      };
    }
  }

  async signIn(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth, 
        credentials.email, 
        credentials.password
      );
      
      return {
        user: this.mapFirebaseUser(userCredential.user),
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: this.mapFirebaseError(error)
      };
    }
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.auth);
  }

  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        unsubscribe();
        resolve(this.mapFirebaseUser(user));
      });
    });
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, (firebaseUser) => {
      callback(this.mapFirebaseUser(firebaseUser));
    });
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    await firebaseSendPasswordResetEmail(this.auth, email);
  }
}