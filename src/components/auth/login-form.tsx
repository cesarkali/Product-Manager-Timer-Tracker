"use client";

// Formulário de autenticação da tela de login: entrar ou criar conta com
// e-mail/senha, entrar com Google e recuperação de senha. A criação do doc
// users/{uid} acontece no AuthProvider (upsert no primeiro login) — contas
// novas caem direto no wizard de boas-vindas.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, Mail, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TermsContent } from "@/components/legal/terms-content";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

function authErrorMessage(error: unknown): string {
  if (error instanceof Error && error.name === "SignupCooldownError") {
    return error.message;
  }
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "E-mail ou senha incorretos.";
      case "auth/email-already-in-use":
        return "Já existe uma conta com este e-mail — use a aba Entrar.";
      case "auth/weak-password":
        return "Senha fraca demais — use ao menos 6 caracteres.";
      case "auth/too-many-requests":
        return "Muitas tentativas. Tente novamente em alguns minutos.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "Login com Google cancelado.";
      case "auth/operation-not-allowed":
        return "Este método de login não está habilitado no servidor.";
    }
  }
  return "Não foi possível completar. Tente novamente.";
}

export function LoginForm() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function handleGoogle() {
    setGoogleError(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      router.push("/timer");
    } catch (error) {
      if (!(error instanceof FirebaseError && error.code === "auth/popup-closed-by-user")) {
        setGoogleError(authErrorMessage(error));
      }
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <div className="w-full">
      {/* alternância entrar/criar conta */}
      <div className="mb-6 grid grid-cols-2 rounded-xl border bg-muted/40 p-1 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setGoogleError(null);
            }}
            className={cn(
              "rounded-lg py-2 text-sm font-semibold transition-all duration-200",
              mode === m
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m === "login" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2.5 animate-in fade-in slide-in-from-bottom-2 delay-100 duration-500 fill-mode-backwards"
        onClick={() => void handleGoogle()}
        disabled={googleBusy}
      >
        {googleBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        {mode === "login" ? "Entrar com Google" : "Criar conta com Google"}
      </Button>
      {googleError && (
        <Alert variant="destructive" className="mt-3 animate-in fade-in duration-200">
          <AlertDescription>{googleError}</AlertDescription>
        </Alert>
      )}

      <div className="my-5 flex items-center gap-3 animate-in fade-in delay-200 duration-500 fill-mode-backwards">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou com e-mail</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* key remonta o form ao trocar de modo — troca o schema de validação
          sem estado velho do react-hook-form (e reanima a entrada) */}
      <div className="animate-in fade-in slide-in-from-bottom-2 delay-300 duration-500 fill-mode-backwards">
        <EmailPasswordForm key={mode} mode={mode} />
      </div>
    </div>
  );
}

function EmailPasswordForm({ mode }: { mode: Mode }) {
  const { signIn, signUp, resetPassword } = useAuth();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(mode === "signup" ? signupSchema : loginSchema) as never,
  });

  async function onSubmit(data: SignupInput | LoginInput) {
    setSubmitError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { name, email, password } = data as SignupInput;
        await signUp(name, email, password);
      } else {
        await signIn(data.email, data.password);
      }
      router.push("/timer");
    } catch (error) {
      setSubmitError(authErrorMessage(error));
    }
  }

  async function handleForgotPassword() {
    setSubmitError(null);
    setNotice(null);
    const email = getValues("email");
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setSubmitError("Preencha o e-mail acima para receber o link de redefinição.");
      return;
    }
    try {
      await resetPassword(email);
    } catch {
      // Não revela se o e-mail existe — mensagem única abaixo.
    }
    setNotice(`Se ${email} tiver conta, o link de redefinição chegará na caixa de entrada.`);
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={handleSubmit(onSubmit)}>
      {mode === "signup" && (
        <AuthField
          id="name"
          label="Nome"
          icon={<UserRound className="h-4 w-4" />}
          error={errors.name?.message}
          className="animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <input
            id="name"
            autoComplete="name"
            placeholder="Como devemos te chamar"
            className="auth-input"
            {...register("name")}
          />
        </AuthField>
      )}

      <AuthField
        id="email"
        label="E-mail"
        icon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
      >
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          className="auth-input"
          {...register("email")}
        />
      </AuthField>

      <AuthField
        id="password"
        label="Senha"
        icon={<Lock className="h-4 w-4" />}
        error={errors.password?.message}
        trailing={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      >
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "signup" ? "Mínimo de 6 caracteres" : "Sua senha"}
          className="auth-input pr-11"
          {...register("password")}
        />
      </AuthField>

      {mode === "login" && (
        <button
          type="button"
          onClick={() => void handleForgotPassword()}
          className="-mt-1 self-end text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
        >
          Esqueci minha senha
        </button>
      )}

      {submitError && (
        <Alert variant="destructive" className="animate-in fade-in duration-200">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      {notice && (
        <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
          {notice}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="mt-1">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "login"
          ? isSubmitting
            ? "Entrando..."
            : "Entrar"
          : isSubmitting
            ? "Criando conta..."
            : "Criar minha conta"}
      </Button>

      {mode === "signup" && (
        <p className="text-center text-xs text-muted-foreground">
          Ao criar a conta você fará um tour rápido e aceitará os{" "}
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            termos de uso e privacidade
          </button>
          .
        </p>
      )}

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b bg-muted/30 px-6 py-4">
            <DialogTitle>Termos de Uso e Política de Privacidade</DialogTitle>
            <DialogDescription>
              O combinado sobre a sua conta e os seus dados no PMTT.
            </DialogDescription>
          </DialogHeader>
          <div className="scrollbar-thin max-h-[65vh] overflow-y-auto px-6 py-5">
            <TermsContent />
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}

/** Campo de autenticação com identidade própria: ícone à esquerda, rótulo
 * interno em caps e um sublinhado em gradiente que cresce ao focar. */
function AuthField({
  id,
  label,
  icon,
  error,
  trailing,
  className,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  trailing?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl border bg-muted/30 transition-colors",
          "focus-within:border-primary/50 focus-within:bg-muted/50",
          error && "border-destructive/60"
        )}
      >
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-11 top-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors group-focus-within:text-primary"
        >
          {label}
        </label>
        <span className="pointer-events-none absolute left-0 top-0 flex h-full w-11 items-center justify-center text-muted-foreground transition-colors group-focus-within:text-primary">
          {icon}
        </span>
        {children}
        {trailing && <span className="absolute right-0 top-0 h-full">{trailing}</span>}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-primary via-primary/70 to-transparent transition-transform duration-300 ease-out group-focus-within:scale-x-100"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3c-1.08.72-2.45 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28V6.63H1.29a12 12 0 0 0 0 10.74l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.58 1.79l3.44-3.44A11.97 11.97 0 0 0 12 0 11.99 11.99 0 0 0 1.29 6.63l4 3.09C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}
