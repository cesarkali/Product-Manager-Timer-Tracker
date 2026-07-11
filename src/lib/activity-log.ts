// Log de atividade do usuário: cada criação, edição e exclusão de registro,
// categoria ou área vira um doc em users/{uid}/activityLog. Exclusões guardam
// o snapshot completo do doc apagado — é ele que permite restaurar com o MESMO
// id (preservando vínculos, ex.: timeEntries → actionTypeId).
//
// As escritas de log são deliberadamente fire-and-forget (via voidLog): um log
// que falhe nunca pode impedir a operação principal do usuário.
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type Firestore,
  type Timestamp,
} from "firebase/firestore";

export type ActivityAction = "create" | "update" | "delete" | "restore";
export type ActivityEntity = "timeEntry" | "actionType" | "businessArea";

export interface ActivityLogEntry {
  id: string;
  action: ActivityAction;
  entity: ActivityEntity;
  /** Id do doc afetado na coleção original. */
  entityId: string;
  /** Descrição humana curta (nome da categoria, categoria+data do registro…). */
  label: string;
  /** Detalhe opcional do que mudou numa edição. */
  detail?: string | null;
  at: Timestamp;
  /** Dados completos no momento da exclusão — presente só em action="delete". */
  snapshot?: DocumentData | null;
  /** Preenchido quando uma exclusão foi restaurada (esconde o botão). */
  restoredAt?: Timestamp | null;
}

export const ENTITY_COLLECTIONS: Record<ActivityEntity, string> = {
  timeEntry: "timeEntries",
  actionType: "actionTypes",
  businessArea: "businessAreas",
};

export const ENTITY_LABELS: Record<ActivityEntity, string> = {
  timeEntry: "Registro",
  actionType: "Categoria",
  businessArea: "Área",
};

export interface LogInput {
  action: ActivityAction;
  entity: ActivityEntity;
  entityId: string;
  label: string;
  detail?: string;
  snapshot?: DocumentData;
}

export async function logActivity(db: Firestore, uid: string, input: LogInput): Promise<void> {
  await addDoc(collection(db, "users", uid, "activityLog"), {
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    label: input.label,
    detail: input.detail ?? null,
    snapshot: input.snapshot ?? null,
    restoredAt: null,
    at: serverTimestamp(),
  });
}

/** Versão fire-and-forget: erros de log nunca quebram a operação principal. */
export function voidLog(db: Firestore, uid: string, input: LogInput): void {
  void logActivity(db, uid, input).catch(() => undefined);
}

/** Remove o campo `id` (que vive no doc id, não nos dados) antes de guardar
 * um item do estado React como snapshot. */
export function stripId<T extends { id?: string }>(item: T): DocumentData {
  const { id: _id, ...rest } = item;
  return rest;
}

/**
 * Restaura um doc excluído a partir do log: recria com o MESMO id e os mesmos
 * dados, marca o log como restaurado e registra a restauração. Só funciona em
 * logs de exclusão com snapshot — o botão da UI já garante isso.
 */
export async function restoreFromLog(
  db: Firestore,
  uid: string,
  log: ActivityLogEntry
): Promise<void> {
  if (log.action !== "delete" || !log.snapshot) {
    throw new Error("Este item não tem dados para restaurar.");
  }
  const collectionName = ENTITY_COLLECTIONS[log.entity];
  await setDoc(doc(db, "users", uid, collectionName, log.entityId), log.snapshot);
  await updateDoc(doc(db, "users", uid, "activityLog", log.id), {
    restoredAt: serverTimestamp(),
  });
  voidLog(db, uid, {
    action: "restore",
    entity: log.entity,
    entityId: log.entityId,
    label: log.label,
  });
}
