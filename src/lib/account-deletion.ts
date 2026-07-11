// Exclusão de conta (zona de perigo). Segurança em camadas:
//  1. Toda referência usa o uid do usuário AUTENTICADO (auth.currentUser) —
//     nunca um id vindo de parâmetro; é impossível apontar para outra conta.
//  2. As regras do Firestore só permitem escrever/apagar em users/{uid} quando
//     request.auth.uid == uid — mesmo um bug aqui não alcançaria terceiros.
//  3. Reautenticação obrigatória antes de apagar (senha ou popup do Google).
//  4. O e-mail entra em signupCooldowns com prazo — recriar a conta na hora é
//     bloqueado no cadastro (evita ciclos de cria/apaga).
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as limitTo,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

/** Horas até o mesmo e-mail poder criar conta de novo. */
export const SIGNUP_COOLDOWN_HOURS = 24;

/** Subcoleções do usuário apagadas na exclusão — mantenha em dia se nascerem
 * novas coleções. */
const USER_SUBCOLLECTIONS = [
  "timeEntries",
  "actionTypes",
  "businessAreas",
  "activeTimer",
  "activityLog",
] as const;

const BATCH_SIZE = 300;

/** Apaga todos os docs de uma subcoleção do PRÓPRIO usuário, em lotes. */
async function wipeSubcollection(uid: string, name: string): Promise<void> {
  const ref = collection(db, "users", uid, name);
  // Loop até esvaziar: cada volta lê um lote e apaga em batch.
  for (;;) {
    const snapshot = await getDocs(query(ref, limitTo(BATCH_SIZE)));
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();
    if (snapshot.size < BATCH_SIZE) return;
  }
}

/**
 * Exclui a conta do usuário LOGADO e todos os seus dados. Irreversível.
 * @param password senha atual — obrigatória para contas e-mail/senha
 *   (contas Google reautenticam via popup).
 */
export async function deleteOwnAccount(password?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Nenhuma sessão ativa.");
  const uid = user.uid;
  const email = user.email?.toLowerCase() ?? null;

  // 1. Reautentica ANTES de tocar em qualquer dado — exigência do Firebase
  //    para deleteUser e a nossa garantia de que é o dono mesmo pedindo.
  const usesPassword = user.providerData.some((p) => p.providerId === "password");
  if (usesPassword) {
    if (!password) throw new Error("Informe sua senha atual para confirmar.");
    if (!user.email) throw new Error("Conta sem e-mail — contate o suporte.");
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, password)
    );
  } else {
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
  }

  // 2. Registra o cooldown de recadastro enquanto ainda há sessão.
  if (email) {
    await setDoc(doc(db, "signupCooldowns", email), {
      until: Timestamp.fromMillis(Date.now() + SIGNUP_COOLDOWN_HOURS * 3_600_000),
      createdAt: serverTimestamp(),
    });
  }

  // 3. Apaga as subcoleções e o doc do perfil — sempre sob o uid autenticado.
  for (const name of USER_SUBCOLLECTIONS) {
    await wipeSubcollection(uid, name);
  }
  await deleteDoc(doc(db, "users", uid));

  // 4. Por último, a conta de autenticação (encerra a sessão sozinho).
  await deleteUser(user);
}
