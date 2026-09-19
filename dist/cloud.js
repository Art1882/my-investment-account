import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js?v=7';

let auth;
let accountRef;
let stopListening;
let statusCallback = () => {};

function configured() {
  return firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PASTE_') &&
    firebaseConfig.projectId && !firebaseConfig.projectId.startsWith('PASTE_');
}

export async function startCloud({ getLocalState, onRemoteState, onUser, onStatus }) {
  statusCallback = onStatus;
  if (!configured()) {
    onStatus('Setup needed', 'offline');
    throw new Error('Firebase configuration has not been added yet.');
  }

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  const db = getFirestore(app);
  await setPersistence(auth, browserLocalPersistence);

  onAuthStateChanged(auth, async user => {
    stopListening?.();
    stopListening = null;
    accountRef = null;
    onUser(user);
    if (!user) {
      onStatus('Sign in needed', 'offline');
      return;
    }

    accountRef = doc(db, 'accounts', user.uid);
    onStatus('Connecting…', '');
    let firstSnapshot = true;
    stopListening = onSnapshot(accountRef, async snapshot => {
      if (snapshot.exists()) {
        const remote = snapshot.data().state;
        if (remote?.holdings) onRemoteState(remote);
      } else if (firstSnapshot) {
        await saveCloud(getLocalState());
      }
      firstSnapshot = false;
      onStatus(snapshot.metadata.fromCache ? 'Saved offline' : 'Cloud saved', snapshot.metadata.fromCache ? 'offline' : 'online');
    }, error => {
      console.error(error);
      onStatus('Offline', 'offline');
    });
  });
}

export function signInCloud(email, password) {
  if (!auth) throw new Error('Firebase is not configured.');
  return signInWithEmailAndPassword(auth, email, password);
}

export function signOutCloud() {
  if (!auth) return Promise.resolve();
  return signOut(auth);
}

export async function saveCloud(state) {
  if (!accountRef) return;
  statusCallback('Saving…', '');
  await setDoc(accountRef, {
    state: JSON.parse(JSON.stringify(state)),
    updatedAt: serverTimestamp()
  }, { merge: true });
}
