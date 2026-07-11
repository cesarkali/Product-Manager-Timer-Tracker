"use client";

// Tela de login/cadastro. Painel esquerdo: a marca em cena — gradiente da
// identidade, orbes flutuando e um cronômetro fake pulsando. Painel direito:
// o formulário (entrar, criar conta, Google, recuperação de senha).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Keyboard, Link2, Play, ShieldCheck, Timer } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/timer");
    }
  }, [loading, user, router]);

  return (
    <div className="flex min-h-svh flex-1">
      {/* ── painel da marca (some no mobile) ─────────────────────────── */}
      <div className="relative hidden flex-1 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 90% at 20% 0%, color-mix(in oklch, var(--primary) 32%, transparent), transparent 60%)," +
              "radial-gradient(70% 80% at 90% 100%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 65%)," +
              "linear-gradient(160deg, oklch(0.14 0.03 285), oklch(0.1 0.02 282))",
          }}
        />
        {/* aurora girando lentamente atrás de tudo */}
        <span
          aria-hidden
          className="animate-aurora pointer-events-none absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 opacity-25"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklch, var(--primary) 45%, transparent) 70deg, transparent 160deg, color-mix(in oklch, var(--primary) 28%, transparent) 250deg, transparent 360deg)",
          }}
        />
        {/* orbes decorativas flutuando */}
        <span aria-hidden className="animate-float pointer-events-none absolute left-[12%] top-[22%] h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <span aria-hidden className="animate-float-slow pointer-events-none absolute right-[10%] top-[55%] h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-700">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
            <Timer className="h-6 w-6 text-primary-foreground" />
          </span>
          <div>
            <p className="text-lg font-bold tracking-tight text-white">PMTT</p>
            <p className="text-xs text-white/60">Product Manager Time Tracker</p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-white animate-in fade-in slide-in-from-bottom-4 duration-700 xl:text-5xl">
            O seu dia inteiro trabalhando.{" "}
            <span className="animate-shimmer bg-gradient-to-r from-[oklch(0.82_0.12_288)] via-[oklch(0.68_0.16_288)] to-[oklch(0.82_0.12_288)] bg-clip-text text-transparent">
              Agora com prova.
            </span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/65 animate-in fade-in slide-in-from-bottom-4 delay-150 duration-700 fill-mode-backwards">
            Cronometre por categoria, vincule tasks e links das suas ferramentas, e transforme o
            trabalho invisível em um dashboard que a gestão entende.
          </p>

          {/* cronômetro fake, vivo */}
          <FakeTimerChip />

          <ul className="mt-8 grid gap-2.5 text-sm text-white/70">
            {[
              { icon: Keyboard, text: "Atalhos 1–9 para trocar de categoria num toque" },
              { icon: Link2, text: "Tasks de qualquer ferramenta amarradas ao tempo gasto" },
              { icon: BarChart3, text: "Dashboard executivo com exportação em PDF" },
              { icon: ShieldCheck, text: "Seus registros, só seus — conta a conta" },
            ].map(({ icon: Icon, text }, i) => (
              <li
                key={text}
                className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
                style={{ animationDelay: `${300 + i * 120}ms`, animationDuration: "500ms" }}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[oklch(0.8_0.1_288)]">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">
          Powered by{" "}
          <a
            href="https://caliberda.com.br"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:text-white/70 hover:underline"
          >
            caliberda.com.br
          </a>{" "}
          ·{" "}
          <a
            href="https://instagram.com/cesar.kali"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:text-white/70 hover:underline"
          >
            @cesar.kali
          </a>{" "}
          ·{" "}
          <a href="/privacidade" className="underline-offset-2 hover:text-white/70 hover:underline">
            Privacidade
          </a>
        </p>
      </div>

      {/* ── painel do formulário ──────────────────────────────────────── */}
      <div className="relative flex flex-1 items-center justify-center p-6 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50 lg:hidden"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 70%)",
          }}
        />
        <div className="relative w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* marca compacta no mobile */}
          <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/25">
              <Timer className="h-6 w-6 text-primary-foreground" />
            </span>
            <p className="text-lg font-bold tracking-tight">PMTT</p>
            <p className="text-center text-xs text-muted-foreground">
              Registro de tempo e evidência de trabalho
            </p>
          </div>

          <div className="mb-6 hidden lg:block">
            <h2 className="text-2xl font-bold tracking-tight">Que bom te ver por aqui</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Entre na sua conta ou crie uma nova — leva menos de um minuto.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}

/** Cronômetro decorativo do painel da marca: conta de verdade, para a tela
 * parecer viva — puro teatro, nada é gravado. */
function FakeTimerChip() {
  const [seconds, setSeconds] = useState(4 * 3600 + 23 * 60 + 8);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const clock = `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds / 60) % 60))}:${pad(seconds % 60)}`;

  return (
    <div className="mt-7 inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 backdrop-blur animate-in fade-in zoom-in-95 delay-200 duration-700 fill-mode-backwards">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/25 text-[oklch(0.82_0.1_288)]">
        <Play className="h-4 w-4 fill-current" />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70" />
        </span>
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
          Desenvolvendo produtos
        </p>
        <p className="font-mono text-xl font-bold tabular-nums text-white">{clock}</p>
      </div>
    </div>
  );
}
