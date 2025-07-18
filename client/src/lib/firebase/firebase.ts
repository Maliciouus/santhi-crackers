import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './config';

// Only initialize Firebase in the browser
const firebaseApp = typeof window !== 'undefined' ? initializeApp(firebaseConfig) : null;

export { firebaseApp };
