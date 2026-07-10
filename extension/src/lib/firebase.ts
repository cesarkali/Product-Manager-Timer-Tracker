// Mesmo projeto Firebase do PMTT web — os valores NEXT_PUBLIC_* são injetados
// pelo esbuild (extension/build.mjs) a partir do .env da raiz do repositório,
// então a extensão sempre aponta para o mesmo ambiente que o app.
//
// O entry point "firebase/auth/web-extension" é a variante oficial do Firebase
// Auth para extensões MV3: persiste a sessão no IndexedDB da própria extensão
// (compartilhado entre popup, options e service worker) e não depende de
// popups/redirects — login por e-mail/senha funciona normalmente.
import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth/web-extension";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

export const db = getFirestore(firebaseApp);
