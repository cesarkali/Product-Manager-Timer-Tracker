// Login por e-mail/senha — a mesma conta do PMTT web. Usado no popup e na
// página de opções.
import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth/web-extension";
import { auth } from "../lib/firebase";

function loginErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha inválidos.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/too-many-requests":
      return "Muitas tentativas — aguarde um pouco e tente de novo.";
    case "auth/network-request-failed":
      return "Sem conexão com o Firebase. Verifique a internet.";
    default:
      return `Não foi possível entrar (${code}).`;
  }
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err ? String(err.code) : "desconhecido";
      setError(loginErrorMessage(code));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="pmtt-login" onSubmit={handleSubmit}>
      <p className="pmtt-login-hint">Entre com a mesma conta do PMTT.</p>
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
        <span>Senha</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {error ? <p className="pmtt-error">{error}</p> : null}
      <button type="submit" className="pmtt-btn pmtt-btn-primary" disabled={submitting}>
        {submitting ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
