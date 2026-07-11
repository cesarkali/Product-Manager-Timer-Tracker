"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  getAdditionalUserInfo,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, type Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

/** Recadastro bloqueado: a conta deste e-mail foi excluída há pouco. */
export class SignupCooldownError extends Error {
  constructor(untilMs: number) {
    const until = new Date(untilMs);
    super(
      `Este e-mail excluiu a conta recentemente. Você poderá criar uma nova a partir de ${until.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}.`
    );
    this.name = "SignupCooldownError";
  }
}

/** Contas recém-criadas passam pelo cooldown de recadastro: se o e-mail
 * excluiu uma conta há pouco, a conta nova é desfeita na hora e o cadastro
 * falha com uma mensagem explicando até quando esperar. */
async function enforceSignupCooldown(user: User): Promise<void> {
  const email = user.email?.toLowerCase();
  if (!email) return;
  const snap = await getDoc(doc(db, "signupCooldowns", email));
  if (!snap.exists()) return;
  const until = snap.data().until as Timestamp | undefined;
  if (!until || until.toMillis() <= Date.now()) return;

  // Desfaz a conta recém-criada (sessão é recente, deleteUser não pede reauth)
  // e limpa o doc de perfil que o upsert do listener pode ter criado.
  await deleteDoc(doc(db, "users", user.uid)).catch(() => undefined);
  await deleteUser(user);
  throw new SignupCooldownError(until.toMillis());
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function upsertUserProfile(user: User) {
  await setDoc(
    doc(db, "users", user.uid),
    {
      email: user.email,
      name: user.displayName ?? user.email,
      role: "pm",
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let lastUpsertedUid: string | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      // Só grava o perfil quando o uid muda (login real), não a cada
      // reavaliação do listener — evita brigar por escrita com o seed
      // de categorias, que também lê/escreve users/{uid}.
      if (firebaseUser && lastUpsertedUid !== firebaseUser.uid) {
        lastUpsertedUid = firebaseUser.uid;
        await upsertUserProfile(firebaseUser);
      }
    });
    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  /** Cria a conta com e-mail/senha e grava o nome no perfil — o listener de
   * auth roda antes do updateProfile, então regravamos o nome no doc depois. */
  async function signUp(name: string, email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await enforceSignupCooldown(credential.user);
    await updateProfile(credential.user, { displayName: name });
    await setDoc(doc(db, "users", credential.user.uid), { name }, { merge: true });
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    // O cooldown só vale para contas NOVAS — quem já tem conta entra normal.
    if (getAdditionalUserInfo(result)?.isNewUser) {
      await enforceSignupCooldown(result.user);
    }
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signInWithGoogle, resetPassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
