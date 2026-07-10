// Detecção do ticket/issue aberto a partir da URL da página — propositalmente
// independente do HTML do Movidesk/Jira (seletores de DOM quebram quando eles
// mudam o layout; a URL é estável). O widget sempre deixa a referência
// editável, então a detecção é uma conveniência, não uma dependência.
import type { LinkedTask } from "@/lib/types";

export interface DetectedRef {
  type: LinkedTask["type"];
  /** Número do ticket (Movidesk) ou chave da issue (Jira). */
  id: string;
  /** URL canônica usada como referência da task vinculada. */
  reference: string;
}

const MOVIDESK_PATTERNS = [
  /\/Ticket\/(?:Edit|Details)\/(\d+)/i,
  /[?&#]ticketId=(\d+)/i,
  /#\/?ticket\/(\d+)/i,
];

const JIRA_PATTERNS = [/\/browse\/([A-Z][A-Z0-9]*-\d+)/i, /[?&]selectedIssue=([A-Z][A-Z0-9]*-\d+)/i];

export function detectFromUrl(href: string): DetectedRef | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  if (url.hostname.endsWith(".movidesk.com")) {
    for (const pattern of MOVIDESK_PATTERNS) {
      const match = href.match(pattern);
      if (match) {
        return {
          type: "movidesk",
          id: match[1],
          reference: `${url.origin}/Ticket/Edit/${match[1]}`,
        };
      }
    }
    return null;
  }

  if (url.hostname.endsWith(".atlassian.net")) {
    for (const pattern of JIRA_PATTERNS) {
      const match = href.match(pattern);
      if (match) {
        const key = match[1].toUpperCase();
        return { type: "jira", id: key, reference: `${url.origin}/browse/${key}` };
      }
    }
    return null;
  }

  return null;
}
