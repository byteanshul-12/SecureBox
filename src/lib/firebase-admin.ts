import admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length ? getApps()[0] : initializeApp({
  projectId: firebaseConfig.projectId,
});

export const adminAuth = getAuth();
export const adminDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export default admin;
