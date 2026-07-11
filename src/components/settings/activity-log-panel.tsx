"use client";

// Aba Atividade das Configurações: linha do tempo de criações, edições e
// exclusões (registros, categorias e áreas). Exclusões guardam o snapshot do
// doc e podem ser restauradas com um clique — o item volta com o mesmo id.
import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { History, PencilLine, Plus, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  ENTITY_LABELS,
  restoreFromLog,
  type ActivityAction,
  type ActivityLogEntry,
} from "@/lib/activity-log";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACTION_META: Record<
  ActivityAction,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  create: { label: "Criado", icon: Plus, className: "text-emerald-500 bg-emerald-500/10" },
  update: { label: "Editado", icon: PencilLine, className: "text-sky-500 bg-sky-500/10" },
  delete: { label: "Excluído", icon: Trash2, className: "text-destructive bg-destructive/10" },
  restore: { label: "Restaurado", icon: Undo2, className: "text-primary bg-primary/10" },
};

export function ActivityLogPanel() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "activityLog");
    const q = query(ref, orderBy("at", "desc"), limit(200));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ActivityLogEntry));
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  async function handleRestore(log: ActivityLogEntry) {
    if (!user || restoringId) return;
    setRestoringId(log.id);
    try {
      await restoreFromLog(db, user.uid, log);
      toast.success(`"${log.label}" restaurado.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível restaurar.");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-muted-foreground" />
          Atividade recente
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Tudo que foi criado, editado ou excluído na sua conta (últimos 200 eventos). Exclusões
          podem ser restauradas — o item volta exatamente como era.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : logs.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nada por aqui ainda — as próximas alterações aparecem nesta linha do tempo.
          </p>
        ) : (
          <ul className="flex flex-col">
            {logs.map((log) => {
              const meta = ACTION_META[log.action] ?? ACTION_META.update;
              const Icon = meta.icon;
              const canRestore = log.action === "delete" && !!log.snapshot && !log.restoredAt;
              return (
                <li
                  key={log.id}
                  className="flex items-center gap-3 border-b py-3 last:border-b-0"
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      meta.className
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={log.label}>
                      {log.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {meta.label} · {ENTITY_LABELS[log.entity] ?? log.entity}
                      {log.detail ? ` · ${log.detail}` : ""}
                      {log.restoredAt ? " · restaurado ✓" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant="outline" className="hidden font-normal text-muted-foreground sm:inline-flex">
                      {log.at
                        ? log.at.toDate().toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "agora"}
                    </Badge>
                    {canRestore && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={restoringId != null}
                        onClick={() => void handleRestore(log)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restaurar
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
