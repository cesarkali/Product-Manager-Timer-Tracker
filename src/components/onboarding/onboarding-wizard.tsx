"use client";

// Tour de boas-vindas do primeiro acesso. Em vez de um card único no meio da
// tela, os passos do meio são BALÕES ancorados nos elementos reais da UI
// (spotlight escurece o resto), ensinando cada função onde ela mora. Abre
// quando users/{uid} não tem `onboardingCompletedAt` e termina com o aceite
// obrigatório dos Termos de Uso/Privacidade — que podem ser lidos na íntegra
// sem sair do wizard.
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  FileText,
  Keyboard,
  LayoutGrid,
  Link2,
  ListChecks,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
  Timer,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserFlags } from "@/hooks/use-user-flags";
import { useActionTypes } from "@/hooks/use-action-types";
import { useBusinessAreas } from "@/hooks/use-business-areas";
import { DEFAULT_ACTION_TYPES } from "@/lib/default-action-types";
import { DEFAULT_BUSINESS_AREAS } from "@/lib/default-business-areas";
import { categoryColor } from "@/lib/palette";
import { TermsContent } from "@/components/legal/terms-content";
import { cn } from "@/lib/utils";

// ─── roteiro do tour ─────────────────────────────────────────────────────────

interface TourStep {
  id: string;
  /** Sem selector = card centralizado; com selector = balão ancorado. */
  selector?: string;
  /** Rota onde o alvo existe — o tour navega antes de procurar. */
  route?: string;
  placement?: "right" | "bottom" | "top";
}

const STEPS: TourStep[] = [
  { id: "welcome" },
  { id: "nav", selector: '[data-tour="nav"]', placement: "right" },
  { id: "timer", selector: '[data-tour="timer-card"]', route: "/timer", placement: "bottom" },
  { id: "categories", selector: '[data-tour="categories"]', route: "/timer", placement: "top" },
  { id: "timeline", selector: '[data-tour="day-timeline"]', route: "/timer", placement: "bottom" },
  { id: "manual-entry", selector: '[data-tour="manual-entry"]', route: "/entries", placement: "bottom" },
  { id: "entries-table", selector: '[data-tour="entries-table"]', route: "/entries", placement: "top" },
  { id: "dashboard", selector: '[data-tour="dashboard-header"]', route: "/dashboard", placement: "bottom" },
  { id: "settings", selector: '[data-tour="settings-tabs"]', route: "/settings", placement: "bottom" },
  { id: "whats-new", selector: '[data-tour="whats-new"]', placement: "right" },
  { id: "terms" },
];

const BALLOON_WIDTH = 380;
const SPOT_PADDING = 8;
const GAP = 16;

export function OnboardingWizard() {
  const { loading, needsOnboarding, completeOnboarding } = useUserFlags();
  const router = useRouter();
  const pathname = usePathname();
  const [stepIndex, setStepIndex] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const step = STEPS[stepIndex];

  // Reabrir o tour (botão "Rever tour") deve começar do zero — o componente
  // fica montado no layout, então o estado do passo sobrevive à conclusão.
  useEffect(() => {
    if (needsOnboarding) {
      setStepIndex(0);
      setTermsAccepted(false);
    }
  }, [needsOnboarding]);

  // Navega até a rota do passo antes de procurar o alvo.
  useEffect(() => {
    if (!needsOnboarding) return;
    if (step?.route && pathname !== step.route) router.push(step.route);
  }, [step, pathname, router, needsOnboarding]);

  const { rect, missing } = useAnchorRect(
    needsOnboarding && step?.selector ? step.selector : null,
    step?.route ? pathname === step.route : true
  );

  if (loading || !needsOnboarding) return null;

  const isLast = stepIndex === STEPS.length - 1;
  const anchored = Boolean(step.selector) && rect != null && !missing;

  async function finish() {
    if (!termsAccepted || finishing) return;
    setFinishing(true);
    try {
      await completeOnboarding();
    } finally {
      setFinishing(false);
    }
  }

  const controls = (
    <div className="mt-4 flex items-center justify-between gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setStepIndex((s) => Math.max(0, s - 1))}
        disabled={stepIndex === 0 || finishing}
        className={cn("px-2", stepIndex === 0 && "invisible")}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === stepIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
      {isLast ? (
        <Button size="sm" onClick={() => void finish()} disabled={!termsAccepted || finishing}>
          {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Começar
        </Button>
      ) : (
        <Button size="sm" onClick={() => setStepIndex((s) => Math.min(STEPS.length - 1, s + 1))}>
          Avançar
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const body = (
    <>
      <StepBody
        id={step.id}
        termsAccepted={termsAccepted}
        onTermsAcceptedChange={setTermsAccepted}
      />
      {controls}
    </>
  );

  // Pular vai direto ao passo dos termos — o aceite é obrigatório, então o
  // atalho não pode contornar o último passo.
  const onSkip = isLast ? undefined : () => setStepIndex(STEPS.length - 1);

  return (
    <div className="fixed inset-0 z-50">
      {anchored && rect ? (
        <AnchoredBalloon
          key={step.id}
          rect={rect}
          placement={step.placement ?? "bottom"}
          stepLabel={`${stepIndex + 1} / ${STEPS.length}`}
          onSkip={onSkip}
        >
          {body}
        </AnchoredBalloon>
      ) : (
        <CenteredCard
          key={step.id}
          stepLabel={`${stepIndex + 1} / ${STEPS.length}`}
          onSkip={onSkip}
        >
          {body}
        </CenteredCard>
      )}
    </div>
  );
}

// ─── ancoragem: encontra o alvo, acompanha scroll/resize ─────────────────────

function useAnchorRect(selector: string | null, routeReady: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setRect(null);
    setMissing(false);
    if (!selector || !routeReady) return;

    let cancelled = false;
    let element: Element | null = null;
    let tries = 0;

    const measure = () => {
      if (!cancelled && element?.isConnected) setRect(element.getBoundingClientRect());
    };

    // A página alvo pode estar montando (rota recém-navegada) — insiste ~3s.
    const locate = () => {
      if (cancelled) return;
      element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ block: "center", behavior: "smooth" });
        // Mede já e continua medindo durante o scroll suave.
        measure();
      } else if (++tries < 20) {
        setTimeout(locate, 150);
      } else {
        setMissing(true); // fallback: card centralizado (ex.: sidebar no mobile)
      }
    };
    locate();

    const interval = setInterval(measure, 200);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [selector, routeReady]);

  return { rect, missing };
}

// ─── molduras: balão ancorado e card central ─────────────────────────────────

function AnchoredBalloon({
  rect,
  placement,
  stepLabel,
  onSkip,
  children,
}: {
  rect: DOMRect;
  placement: "right" | "bottom" | "top";
  stepLabel: string;
  onSkip?: () => void;
  children: React.ReactNode;
}) {
  const balloonRef = useRef<HTMLDivElement>(null);
  // Altura real do balão (medida após o render) — sem ela a posição vertical
  // era chutada e a seta podia apontar para o nada em janelas baixas.
  const [measuredHeight, setMeasuredHeight] = useState(300);

  useEffect(() => {
    const el = balloonRef.current;
    if (!el) return;
    const measure = () => setMeasuredHeight(el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children]);

  const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const width = Math.min(BALLOON_WIDTH, vw - 32);
  const height = measuredHeight;

  const spot = {
    left: rect.left - SPOT_PADDING,
    top: rect.top - SPOT_PADDING,
    width: rect.width + SPOT_PADDING * 2,
    height: rect.height + SPOT_PADDING * 2,
  };
  const spotCenterX = spot.left + spot.width / 2;
  const spotCenterY = spot.top + spot.height / 2;

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, Math.max(min, max)));

  // Decide o lado efetivo com a altura real em mãos (cai para o lado oposto
  // quando não cabe) e ancora a SETA no centro do alvo, não num offset fixo.
  let side: "right" | "bottom" | "top" = placement;
  if (side === "right" && spot.left + spot.width + GAP + width >= vw) side = "bottom";
  if (side === "top" && spot.top - GAP - height < 16) side = "bottom";
  if (side === "bottom" && spot.top + spot.height + GAP + height > vh - 16 && spot.top - GAP - height >= 16) {
    side = "top";
  }

  let left: number;
  let top: number;
  let arrowStyle: React.CSSProperties;
  let arrowBorder: string;

  if (side === "right") {
    left = spot.left + spot.width + GAP;
    top = clamp(spotCenterY - height / 2, 16, vh - height - 16);
    arrowStyle = { left: -6, top: clamp(spotCenterY - top - 6, 14, height - 26) };
    arrowBorder = "border-b border-l";
  } else if (side === "top") {
    left = clamp(spotCenterX - width / 2, 16, vw - width - 16);
    top = Math.max(16, spot.top - GAP - height);
    arrowStyle = { bottom: -6, left: clamp(spotCenterX - left - 6, 14, width - 26) };
    arrowBorder = "border-b border-r";
  } else {
    left = clamp(spotCenterX - width / 2, 16, vw - width - 16);
    top = clamp(spot.top + spot.height + GAP, 16, vh - height - 16);
    arrowStyle = { top: -6, left: clamp(spotCenterX - left - 6, 14, width - 26) };
    arrowBorder = "border-l border-t";
  }

  return (
    <>
      {/* bloqueia interação com a página durante o tour */}
      <div className="absolute inset-0" />
      {/* spotlight: o box-shadow gigante escurece tudo ao redor do recorte */}
      <div
        className="pointer-events-none absolute rounded-2xl transition-all duration-300 ease-out"
        style={{
          ...spot,
          boxShadow:
            "0 0 0 3px color-mix(in oklch, var(--primary) 65%, transparent), 0 0 24px color-mix(in oklch, var(--primary) 35%, transparent), 0 0 0 9999px oklch(0.09 0.02 282 / 0.7)",
        }}
      />
      <div
        ref={balloonRef}
        className="scrollbar-thin absolute z-10 overflow-y-auto rounded-2xl border bg-card p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        style={{ left, top, width, maxHeight: vh - 32 }}
      >
        <span
          aria-hidden
          className={cn("absolute h-3 w-3 rotate-45 border-border bg-card", arrowBorder)}
          style={arrowStyle}
        />
        <StepLabelBadge label={stepLabel} onSkip={onSkip} />
        {children}
      </div>
    </>
  );
}

function CenteredCard({
  stepLabel,
  onSkip,
  children,
}: {
  stepLabel: string;
  onSkip?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(45% 40% at 75% 10%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 70%)," +
            "radial-gradient(40% 45% at 15% 90%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 70%)",
        }}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-y-auto rounded-3xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-400 sm:p-8">
        <StepLabelBadge label={stepLabel} onSkip={onSkip} />
        {children}
      </div>
    </div>
  );
}

function StepLabelBadge({ label, onSkip }: { label: string; onSkip?: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest text-primary uppercase">
        <Sparkles className="h-3.5 w-3.5" />
        Tour do PMTT
      </span>
      <span className="flex items-center gap-2.5">
        <span className="text-xs text-muted-foreground tabular-nums">{label}</span>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            Pular tour
          </button>
        )}
      </span>
    </div>
  );
}

// ─── conteúdo dos passos ─────────────────────────────────────────────────────

function StepBody({
  id,
  termsAccepted,
  onTermsAcceptedChange,
}: {
  id: string;
  termsAccepted: boolean;
  onTermsAcceptedChange: (v: boolean) => void;
}) {
  switch (id) {
    case "welcome":
      return <StepWelcome />;
    case "nav":
      return (
        <StepText title="Navegação" icon={<LayoutGrid className="h-4 w-4" />}>
          Tudo mora aqui: <strong>Hoje</strong> é o cronômetro, <strong>Registros</strong> é o
          histórico editável, <strong>Dashboard</strong> mostra os gráficos e{" "}
          <strong>Configurações</strong> guarda categorias, áreas e preferências.
        </StepText>
      );
    case "timer":
      return (
        <StepText title="O cronômetro" icon={<Timer className="h-4 w-4" />}>
          O coração do PMTT. Com um timer rodando, este card mostra o tempo decorrido e os campos
          do registro: <strong>descrição</strong> (“o que você está fazendo?”),{" "}
          <strong>tasks vinculadas</strong> (links de Jira, Movidesk ou qualquer ferramenta, com
          story points) e{" "}
          <strong>comentários</strong>. Dá para <strong>pausar</strong> (almoço, interrupção),{" "}
          <strong>parar</strong> (grava o registro) ou ajustar a hora de início se esqueceu de
          apertar o play.
        </StepText>
      );
    case "categories":
      return <StepCategories />;
    case "timeline":
      return (
        <StepText title="Linha do dia" icon={<BarChart3 className="h-4 w-4" />}>
          Seu dia desenhado em blocos coloridos, um por registro. Os espaços vazios são{" "}
          <strong>lacunas clicáveis</strong>: clicou, abre o lançamento manual já preenchido com o
          horário do buraco — perfeito para registrar aquilo que passou batido.
        </StepText>
      );
    case "manual-entry":
      return (
        <StepText title="Lançamento manual" icon={<ListChecks className="h-4 w-4" />}>
          Esqueceu de cronometrar? Registre aqui depois: escolha a{" "}
          <strong>categoria</strong>, a <strong>data</strong> (pode ser retroativa), os{" "}
          <strong>horários de início e fim</strong>, e opcionalmente descrição, tasks e
          comentários — o registro entra no histórico igual aos do cronômetro.
        </StepText>
      );
    case "entries-table":
      return (
        <StepText title="Histórico de registros" icon={<ListChecks className="h-4 w-4" />}>
          Todos os seus lançamentos no período do filtro lá em cima (hoje, 7 dias, mês…). Cada
          linha pode ser <strong>editada</strong> (horários, categoria, descrição, tasks),{" "}
          <strong>excluída</strong> ou marcada como <strong>"task criada"</strong> — nada é
          imutável, o histórico é seu.
        </StepText>
      );
    case "dashboard":
      return (
        <StepText title="Dashboard" icon={<BarChart3 className="h-4 w-4" />}>
          A evidência do seu trabalho: total do período, tempo por <strong>categoria</strong> e
          por <strong>área</strong>, heatmap de horários e ritmo de trabalho. Ajuste o{" "}
          <strong>filtro de período</strong> aqui em cima e use{" "}
          <strong>Exportar / imprimir</strong> para gerar um relatório em PDF pronto para mandar
          para a gestão.
        </StepText>
      );
    case "settings":
      return (
        <StepText title="Configurações" icon={<LayoutGrid className="h-4 w-4" />}>
          Três abas: <strong>Categorias</strong> (criar, editar cor/ícone, definir atalhos 1–9,
          arquivar sem perder histórico), <strong>Áreas</strong> (os agrupamentos dos relatórios)
          e <strong>Preferências</strong> (expediente, lembrete "cadê o cronômetro?" e refazer
          este tour quando quiser).
        </StepText>
      );
    case "whats-new":
      return (
        <StepText title="Novidades" icon={<Sparkles className="h-4 w-4" />}>
          Quando o PMTT ganhar recursos novos, este botão acende com um ponto pulsante. Clique para
          ver o que mudou em cada versão.
        </StepText>
      );
    case "terms":
      return <StepTerms accepted={termsAccepted} onAcceptedChange={onTermsAcceptedChange} />;
    default:
      return null;
  }
}

function StepText({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-base font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        {title}
      </h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function StepWelcome() {
  return (
    <div>
      <div className="mb-5 flex items-center justify-center py-2">
        <span className="relative flex h-18 w-18 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/60 p-5 shadow-lg shadow-primary/25 animate-in zoom-in-50 duration-500">
          <Timer className="h-9 w-9 text-primary-foreground" />
          <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow animate-in zoom-in-0 delay-300 duration-300 fill-mode-backwards">
            <Play className="h-3 w-3 fill-current" />
          </span>
        </span>
      </div>
      <h2 className="text-center text-xl font-bold tracking-tight sm:text-2xl">
        Seu tempo conta uma história. <span className="text-primary">Vamos registrá-la.</span>
      </h2>
      <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
        O PMTT registra onde o seu tempo de trabalho realmente vai — inclusive o trabalho invisível
        que ninguém vê, mas toma o dia inteiro. Nas próximas telas, vamos apontar cada função no
        lugar onde ela vive. Leva menos de um minuto.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1">
          <Keyboard className="h-3.5 w-3.5" /> Atalhos 1–9
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1">
          <Link2 className="h-3.5 w-3.5" /> Tasks & links
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1">
          <BarChart3 className="h-3.5 w-3.5" /> Dashboard executivo
        </span>
      </div>
    </div>
  );
}

function StepCategories() {
  const { restoreDefaultActionTypes, actionTypes, loading: typesLoading } = useActionTypes();
  const { restoreDefaultBusinessAreas } = useBusinessAreas();
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const hasCategories = actionTypes.length > 0;

  async function seedDefaults() {
    if (seeding) return;
    setSeeding(true);
    try {
      await restoreDefaultActionTypes();
      await restoreDefaultBusinessAreas();
      setSeeded(true);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div>
      <StepText title="Categorias" icon={<ListChecks className="h-4 w-4" />}>
        As atividades que você cronometra. Cada uma tem <strong>nome</strong>,{" "}
        <strong>ícone</strong>, <strong>cor</strong>, <strong>atalho 1–9</strong> opcional e uma{" "}
        <strong>área</strong> (Suporte, Produto…) que agrupa os relatórios. Clicar numa categoria
        inicia o timer; com um rodando, troca e registra o anterior. Gerencie tudo em Configurações.
      </StepText>

      <div className="mt-3 rounded-xl border border-dashed bg-muted/30 p-3">
        {seeded || (hasCategories && !typesLoading) ? (
          <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300">
            <Check className="h-4 w-4 shrink-0" />
            {seeded
              ? "Kit padrão criado! Ajuste em Configurações → Categorias."
              : `Você já tem ${actionTypes.length} categoria(s).`}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <p className="text-xs text-muted-foreground">
              Comece do zero ou gere o kit padrão ({DEFAULT_ACTION_TYPES.length} categorias +{" "}
              {DEFAULT_BUSINESS_AREAS.length} áreas, tudo editável):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_ACTION_TYPES.slice(0, 3).map((t) => (
                <span
                  key={t.name}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-[11px]"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: categoryColor(t.colorTag) }}
                  />
                  {t.name.length > 20 ? `${t.name.slice(0, 20)}…` : t.name}
                </span>
              ))}
              <span className="inline-flex items-center rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                +{DEFAULT_ACTION_TYPES.length - 3}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="self-start"
              onClick={() => void seedDefaults()}
              disabled={seeding}
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Criar kit padrão
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepTerms({
  accepted,
  onAcceptedChange,
}: {
  accepted: boolean;
  onAcceptedChange: (value: boolean) => void;
}) {
  const [reading, setReading] = useState(false);

  return (
    <div>
      <StepText title="Termos de uso e privacidade" icon={<ShieldCheck className="h-4 w-4" />}>
        O combinado sobre os seus dados, sem letra miúda: coletamos apenas o seu e-mail de login e
        os registros de tempo que você mesmo cria — nada de rastreamento nem venda de dados. Tudo
        fica no Firebase (Google Cloud), acessível só pela sua conta.
      </StepText>

      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => setReading(true)}
      >
        <FileText className="h-4 w-4" />
        Ler os termos completos
      </Button>

      <label
        className={cn(
          "mt-3 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
          accepted ? "border-primary bg-primary/5" : "hover:border-muted-foreground/40"
        )}
      >
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAcceptedChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
        />
        <span className="text-[13px] leading-relaxed">
          Li e aceito os <strong>Termos de Uso</strong> e a{" "}
          <strong>Política de Privacidade</strong> do PMTT.
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Obrigatório para usar a plataforma. O aceite fica registrado com data e hora.
          </span>
        </span>
      </label>

      {reading && <TermsReader onClose={() => setReading(false)} />}
    </div>
  );
}

/** Leitor dos termos por cima do wizard — o conteúdo completo renderizado no
 * próprio tema, sem sair do fluxo nem abrir guias. */
function TermsReader({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            Termos de Uso e Política de Privacidade
          </span>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">
          <TermsContent />
        </div>
        <div className="border-t bg-muted/30 px-5 py-3">
          <Button size="sm" onClick={onClose}>
            <Check className="h-4 w-4" />
            Terminei de ler
          </Button>
        </div>
      </div>
    </div>
  );
}
