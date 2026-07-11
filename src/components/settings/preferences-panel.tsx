"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellRing,
  Check,
  ExternalLink,
  GraduationCap,
  KeyRound,
  Palette,
  Puzzle,
  RotateCcw,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeOfDayPicker, type TimeOfDay } from "@/components/shared/time-of-day-picker";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useUserFlags } from "@/hooks/use-user-flags";
import {
  CORNER_OPTIONS,
  DENSITY_OPTIONS,
  SKINS,
  useCorners,
  useDensity,
  useSkin,
  type LayoutOption,
} from "@/hooks/use-skin";
import { DangerZoneCard } from "@/components/settings/danger-zone-card";
import { EXTENSION_STORE_URL } from "@/lib/changelog";
import { fireTimerReminder } from "@/hooks/use-timer-reminder";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSetPassword } from "@/hooks/use-set-password";
import { Input } from "@/components/ui/input";

const REMINDER_MINUTE_OPTIONS = [10, 15, 20, 30, 45, 60];

/** dom..sáb, na ordem do getDay(). */
const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const WEEKDAY_NAMES = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

function parseHourMinute(value: string): TimeOfDay {
  const [h, m] = value.split(":").map(Number);
  return { hours: Number.isFinite(h) ? h : 0, minutes: Number.isFinite(m) ? m : 0, seconds: 0 };
}

function toHourMinute(time: TimeOfDay): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(time.hours)}:${pad(time.minutes)}`;
}

export function PreferencesPanel() {
  const router = useRouter();
  const { prefs, loading, updatePreferences } = useUserPreferences();
  const { resetOnboarding } = useUserFlags();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(
    () => (typeof Notification !== "undefined" ? Notification.permission : null)
  );

  async function handleToggleReminder(enabled: boolean) {
    if (enabled && typeof Notification !== "undefined" && Notification.permission === "default") {
      // Pede a permissão só no momento em que o lembrete é ativado.
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
    await updatePreferences({ reminderEnabled: enabled });
    toast.success(enabled ? "Lembrete ativado." : "Lembrete desativado.");
  }

  /** Dispara um exemplo do aviso na hora, ignorando expediente/ociosidade —
   * força a notificação do navegador mesmo com a aba visível. */
  async function handleTestReminder() {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
    fireTimerReminder({
      idleMinutes: prefs.reminderMinutes,
      forceNotification: true,
      onGoToToday: () => router.push("/timer"),
    });
  }

  function toggleWorkDay(day: number) {
    const next = prefs.workDays.includes(day)
      ? prefs.workDays.filter((d) => d !== day)
      : [...prefs.workDays, day].sort((a, b) => a - b);
    if (next.length === 0) {
      toast.error("Mantenha ao menos um dia útil.");
      return;
    }
    void updatePreferences({ workDays: next });
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="h-4 w-4 text-muted-foreground" />
          Lembrete de cronômetro
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="reminder-enabled">
              Avisar quando não houver cronômetro rodando
            </Label>
            <p className="text-xs text-muted-foreground">
              Dentro do seu expediente, se nenhum cronômetro estiver rodando pelo tempo
              configurado, você recebe um aviso no app e uma notificação do navegador.
            </p>
          </div>
          <Switch
            id="reminder-enabled"
            checked={prefs.reminderEnabled}
            onCheckedChange={(checked) => void handleToggleReminder(Boolean(checked))}
          />
        </div>

        {prefs.reminderEnabled && notificationPermission === "denied" && (
          <p className="rounded-md border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400">
            A permissão de notificação foi negada no navegador — os avisos aparecerão só
            dentro do app. Para reativar, ajuste as permissões do site no navegador.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Avisar após</Label>
            <Select
              value={String(prefs.reminderMinutes)}
              onValueChange={(value) =>
                void updatePreferences({ reminderMinutes: Number(value) })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>{(value: string | null) => `${value ?? 15} min parado`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {REMINDER_MINUTE_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {minutes} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Início do expediente</Label>
            <TimeOfDayPicker
              value={parseHourMinute(prefs.workStart)}
              onChange={(time) => void updatePreferences({ workStart: toHourMinute(time) })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Fim do expediente</Label>
            <TimeOfDayPicker
              value={parseHourMinute(prefs.workEnd)}
              onChange={(time) => void updatePreferences({ workEnd: toHourMinute(time) })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Dias úteis</Label>
          <div className="flex gap-1.5">
            {WEEKDAY_LABELS.map((label, day) => {
              const active = prefs.workDays.includes(day);
              return (
                <Button
                  key={day}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => toggleWorkDay(day)}
                  aria-pressed={active}
                  aria-label={WEEKDAY_NAMES[day]}
                  title={WEEKDAY_NAMES[day]}
                  className={cn("h-9 w-9 p-0 font-semibold", !active && "text-muted-foreground")}
                >
                  {label}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            O expediente também define a faixa da linha do dia na tela Hoje.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          <div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => void handleTestReminder()}
            >
              <Send className="h-3.5 w-3.5" />
              Testar aviso agora
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Dispara um exemplo do aviso no app e da notificação do navegador (se permitida),
            mesmo com a aba visível — não depende do lembrete estar ativado.
          </p>
          <p className="text-xs text-muted-foreground">
            Limite do navegador: a notificação funciona com a aba do PMTT aberta (mesmo em
            segundo plano) — com a aba fechada, nenhum aviso é enviado.
          </p>
        </div>
      </CardContent>
    </Card>

    <SkinPickerCard />

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          Tour de boas-vindas
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => void resetOnboarding()}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Refazer o tour
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Reabre o passo a passo do primeiro acesso, com os balões apontando cada função na
          tela. Seu aceite dos termos continua registrado.
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Puzzle className="h-4 w-4 text-muted-foreground" />
          Extensão do Chrome
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => window.open(EXTENSION_STORE_URL, "_blank", "noreferrer")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Instalar da Chrome Web Store
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          O PMTT Timer no navegador: cronômetro no ícone da barra, atalhos 1–9, captura de
          tickets pela URL e sugestões de categoria por domínio — com a mesma conta daqui.
        </p>
      </CardContent>
    </Card>

    <ExtensionPasswordCard />

    <DangerZoneCard />
    </div>
  );
}

/** Permite que usuários com conta Google definam (ou atualizem) uma senha
 * de e-mail para entrar na extensão Chrome, que não suporta OAuth popup. */
function ExtensionPasswordCard() {
  const { user } = useAuth();
  const { hasPassword, setPassword, loading } = useSetPassword();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Só mostra o card se o usuário estiver logado com Google
  const isGoogleOnly =
    user?.providerData.length === 1 &&
    user.providerData[0]?.providerId === "google.com";

  if (!user || (!isGoogleOnly && !hasPassword)) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    setSuccess(false);
    if (newPassword.length < 6) {
      setLocalError("Use ao menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("As senhas não coincidem.");
      return;
    }
    try {
      await setPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
      toast.success("Senha definida — entre na extensão com e-mail + essa senha.");
    } catch {
      // erro já tratado pelo hook, setLocalError via error do hook não necessário aqui
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          Acesso pela extensão do Chrome
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {hasPassword ? (
          <>
            <p className="rounded-md border border-emerald-500/25 bg-emerald-500/5 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              ✓ Senha já definida — entre na extensão com seu e-mail e essa senha.
            </p>
            <p className="text-xs text-muted-foreground">
              Para trocar a senha, preencha os campos abaixo.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sua conta usa login com Google. Para entrar na extensão Chrome — que
            não suporta o popup do Google —, defina uma senha de acesso. Ela ficará
            vinculada a esta mesma conta; seus dados não mudam.
          </p>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ext-new-password">
                {hasPassword ? "Nova senha" : "Senha de acesso"}
              </Label>
              <Input
                id="ext-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ext-confirm-password">Confirmar senha</Label>
              <Input
                id="ext-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            </div>
          </div>

          {localError && (
            <p className="text-xs text-destructive">{localError}</p>
          )}
          {success && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Senha atualizada com sucesso.
            </p>
          )}

          <div>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !newPassword || !confirmPassword}
              className="gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {hasPassword ? "Atualizar senha" : "Definir senha"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/** Aparência: tema completo (fundo + superfícies + destaque), densidade do
 * layout e raio dos cantos — tudo salvo por dispositivo em localStorage. */
function SkinPickerCard() {
  const [skin, setSkin] = useSkin();
  const [density, setDensity] = useDensity();
  const [corners, setCorners] = useCorners();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="h-4 w-4 text-muted-foreground" />
          Aparência
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <Label>Tema</Label>
          <p className="text-xs text-muted-foreground">
            Fundo, cards, sidebar e destaques inteiros mudam com o tema — incluindo dois temas
            claros.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {SKINS.map((option) => {
              const active = option.id === skin;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSkin(option.id)}
                  aria-pressed={active}
                  title={option.label}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all",
                    active
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "hover:border-muted-foreground/40"
                  )}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 shadow-inner transition-transform group-hover:scale-110"
                    style={{ backgroundColor: option.swatch }}
                  >
                    {active && (
                      <Check
                        className={cn(
                          "h-4 w-4 drop-shadow",
                          option.light ? "text-black/70" : "text-white"
                        )}
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <SegmentedControl
            label="Densidade"
            hint="Compacto encolhe fontes e espaçamentos do app inteiro."
            options={DENSITY_OPTIONS}
            value={density}
            onChange={setDensity}
          />
          <SegmentedControl
            label="Cantos"
            hint="O raio de arredondamento de cards, botões e campos."
            options={CORNER_OPTIONS}
            value={corners}
            onChange={setCorners}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SegmentedControl({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  options: LayoutOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="grid auto-cols-fr grid-flow-col rounded-lg border bg-muted/40 p-1">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={option.id === value}
            className={cn(
              "rounded-md py-1.5 text-xs font-semibold transition-all",
              option.id === value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
