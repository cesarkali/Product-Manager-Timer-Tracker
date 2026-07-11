// Changelog do PMTT mostrado no diálogo "Novidades". Ao lançar uma versão:
//  1. Adicione uma entrada NO TOPO do array (mais recente primeiro);
//  2. Atualize APP_VERSION para a mesma versão da entrada nova.
// Usuários com lastSeenChangelogVersion diferente de APP_VERSION veem o badge
// pulsando na sidebar até abrirem o diálogo.

export const APP_VERSION = "1.2.0";

/** Extensão do Chrome publicada na Web Store. */
export const EXTENSION_STORE_URL =
  "https://chromewebstore.google.com/detail/honniaakfdobdmepkhoobbamggpbconf";

export interface ChangelogHighlight {
  title: string;
  description: string;
}

export interface ChangelogEntry {
  version: string;
  /** Data de lançamento, "AAAA-MM-DD". */
  date: string;
  title: string;
  highlights: ChangelogHighlight[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.2.0",
    date: "2026-07-11",
    title: "Contas abertas, temas e histórico de atividade",
    highlights: [
      {
        title: "Crie sua conta",
        description:
          "Cadastro aberto por e-mail/senha ou Google, com recuperação de senha e uma tela de login repaginada.",
      },
      {
        title: "Temas completos",
        description:
          "Oito temas em Configurações → Preferências — fundo, cards e destaques inteiros mudam de cor.",
      },
      {
        title: "Atividade e restauração",
        description:
          "Nova aba Atividade com o histórico de criações, edições e exclusões — e botão para restaurar o que foi excluído por engano.",
      },
      {
        title: "Links genéricos",
        description:
          "Tasks vinculadas agora aceitam link de qualquer ferramenta, além de Jira e Movidesk.",
      },
      {
        title: "Zona de perigo",
        description:
          "Exclusão de conta com confirmação dupla, apagando todos os seus dados de forma permanente.",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-07-11",
    title: "Boas-vindas, extensão e visual novo",
    highlights: [
      {
        title: "Wizard de boas-vindas",
        description:
          "Primeiro acesso agora tem um tour guiado: cronômetro, categorias, áreas, registros e dashboard — com aceite dos termos de uso.",
      },
      {
        title: "Extensão do Chrome",
        description:
          "Controle o timer direto do navegador: atalhos 1–9, tasks do Movidesk/Jira e sugestões de categoria por domínio.",
      },
      {
        title: "Notificações mais educadas",
        description:
          "As sugestões de categoria não interrompem quem já está cronometrando e podem ser silenciadas por um dia.",
      },
      {
        title: "Categorias padrão sob demanda",
        description:
          "Contas novas não recebem mais categorias automáticas (nem duplicadas!) — você escolhe se quer o kit padrão no wizard ou em Configurações.",
      },
      {
        title: "Visual repaginado",
        description: "Identidade violeta do PMTT em todo o app, com mais cor, brilho e animação.",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-06-01",
    title: "Lançamento do PMTT",
    highlights: [
      {
        title: "Cronômetro por categoria",
        description: "Registre seu tempo em categorias com cores, ícones e atalhos de teclado.",
      },
      {
        title: "Dashboard executivo",
        description:
          "Gráficos de tempo por categoria e área, heatmap de horários, ritmo de trabalho e exportação para PDF.",
      },
      {
        title: "Registros editáveis",
        description: "Lançamentos manuais e edição completa do histórico, com tasks vinculadas.",
      },
    ],
  },
];
