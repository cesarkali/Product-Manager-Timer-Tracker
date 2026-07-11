// Autenticação da extensão — a mesma conta do PMTT web. Entra ou cria conta
// por e-mail/senha e recupera senha. Contas Google: o popup de OAuth não roda
// dentro de extensão, então oferecemos o atalho para entrar pelo PMTT web
// (uma vez logado lá, basta usar o mesmo e-mail/senha aqui se cadastrar um).
import { useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth/web-extension";
import { auth } from "../lib/firebase";
import { PMTT_APP_URL } from "../lib/settings";

type Mode = "login" | "signup";

function authErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha inválidos.";
    case "auth/email-already-in-use":
      return "Já existe uma conta com este e-mail — use a aba Entrar.";
    case "auth/weak-password":
      return "Senha fraca demais — use ao menos 6 caracteres.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/too-many-requests":
      return "Muitas tentativas — aguarde um pouco e tente de novo.";
    case "auth/network-request-failed":
      return "Sem conexão com o Firebase. Verifique a internet.";
    default:
      return `Não foi possível completar (${code}).`;
  }
}

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err ? String(err.code) : "desconhecido";
      setError(authErrorMessage(code));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setError(null);
    setNotice(null);
    const trimmed = email.trim();
    if (!/\S+@\S+\.\S+/.test(trimmed)) {
      setError("Preencha o e-mail acima para receber o link de redefinição.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, trimmed);
    } catch {
      // Mensagem única — não revela se o e-mail existe.
    }
    setNotice(`Se ${trimmed} tiver conta, o link de redefinição chegará no e-mail.`);
  }

  return (
    <form className="pmtt-login" onSubmit={handleSubmit}>
      <div className="pmtt-login-tabs">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            className={`pmtt-login-tab${mode === m ? " is-active" : ""}`}
            onClick={() => switchMode(m)}
          >
            {m === "login" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      <p className="pmtt-login-hint">
        {mode === "login"
          ? "A mesma conta do PMTT web."
          : "A conta vale no PMTT web e na extensão."}
      </p>

      {mode === "signup" ? (
        <label className="pmtt-field pmtt-login-appear">
          <span>Nome</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Como devemos te chamar"
            required
          />
        </label>
      ) : null}

      <label className="pmtt-field">
        <span>E-mail</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          autoFocus
        />
      </label>

      <label className="pmtt-field">
        <span className="pmtt-login-password-row">
          Senha
          {mode === "login" ? (
            <button type="button" className="pmtt-login-link" onClick={() => void handleForgotPassword()}>
              Esqueci minha senha
            </button>
          ) : null}
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "signup" ? "Mínimo de 6 caracteres" : undefined}
          required
        />
      </label>

      {error ? <p className="pmtt-error pmtt-login-appear">{error}</p> : null}
      {notice ? <p className="pmtt-notice pmtt-login-appear">{notice}</p> : null}

      <button type="submit" className="pmtt-btn pmtt-btn-primary" disabled={submitting}>
        {submitting
          ? mode === "login"
            ? "Entrando…"
            : "Criando conta…"
          : mode === "login"
            ? "Entrar"
            : "Criar minha conta"}
      </button>

      <p className="pmtt-login-footer">
        Conta Google?{" "}
        <a
          href={`${PMTT_APP_URL}/settings?tab=preferencias`}
          target="_blank"
          rel="noreferrer"
        >
          No PMTT web → Configurações → Preferências
        </a>
        , defina uma senha de acesso e entre aqui com e-mail + essa senha.
      </p>
    </form>
  );
}
