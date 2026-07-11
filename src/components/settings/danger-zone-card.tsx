"use client";

// Zona de perigo: exclusão da PRÓPRIA conta. Confirmação em duas camadas
// (digitar EXCLUIR + senha atual para contas e-mail/senha; popup do Google
// para contas Google) antes de chamar deleteOwnAccount — que só opera sobre
// o uid autenticado e é barrado pelas regras do Firestore para qualquer
// outra conta.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { deleteOwnAccount, SIGNUP_COOLDOWN_HOURS } from "@/lib/account-deletion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CONFIRM_WORD = "EXCLUIR";

function deletionErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Senha incorreta.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "Reautenticação com Google cancelada.";
      case "auth/too-many-requests":
        return "Muitas tentativas. Aguarde alguns minutos.";
    }
  }
  return error instanceof Error ? error.message : "Não foi possível excluir a conta.";
}

export function DangerZoneCard() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usesPassword = user?.providerData.some((p) => p.providerId === "password") ?? false;
  const confirmed = confirmText.trim().toUpperCase() === CONFIRM_WORD;
  const ready = confirmed && (!usesPassword || password.length > 0);

  function reset() {
    setConfirmText("");
    setPassword("");
    setError(null);
  }

  async function handleDelete() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteOwnAccount(usesPassword ? password : undefined);
      router.replace("/login");
    } catch (err) {
      setError(deletionErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Zona de perigo
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              reset();
              setOpen(true);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir minha conta
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Apaga permanentemente a sua conta e todos os seus dados: registros, categorias, áreas,
          preferências e histórico de atividade. Não afeta nenhuma outra conta. Exporte seus
          relatórios antes, se quiser guardá-los.
        </p>

        <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4.5 w-4.5" />
                Excluir conta permanentemente
              </DialogTitle>
              <DialogDescription>
                Esta ação é <strong>irreversível</strong>. Todos os seus registros de tempo,
                categorias, áreas e o histórico de atividade serão apagados. O e-mail{" "}
                <strong>{user?.email}</strong> só poderá criar uma nova conta depois de{" "}
                {SIGNUP_COOLDOWN_HOURS} horas.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-word">
                  Digite <strong>{CONFIRM_WORD}</strong> para confirmar
                </Label>
                <Input
                  id="confirm-word"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRM_WORD}
                  autoComplete="off"
                />
              </div>

              {usesPassword ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirm-password">Sua senha atual</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Conta Google: uma janela de confirmação do Google será aberta para validar que é
                  você.
                </p>
              )}

              {error && (
                <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  disabled={!ready || busy}
                  onClick={() => void handleDelete()}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Excluir tudo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
