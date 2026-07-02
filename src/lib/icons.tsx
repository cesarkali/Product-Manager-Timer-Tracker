import { createElement, type SVGProps } from "react";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FileQuestion,
  Headset,
  LifeBuoy,
  MessageCircleQuestion,
  RotateCcw,
  Rocket,
  Settings,
  Sparkles,
  Tag,
  Ticket,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  tag: Tag,
  ticket: Ticket,
  bug: Bug,
  "alert-triangle": AlertTriangle,
  "rotate-ccw": RotateCcw,
  "clipboard-check": ClipboardCheck,
  headset: Headset,
  "life-buoy": LifeBuoy,
  rocket: Rocket,
  "message-circle-question": MessageCircleQuestion,
  "file-question": FileQuestion,
  code: Code2,
  settings: Settings,
  users: Users,
  wrench: Wrench,
  sparkles: Sparkles,
  "check-circle": CheckCircle2,
};

export const ICON_KEYS = Object.keys(ICON_REGISTRY);

/** Componente estável — a resolução dinâmica do ícone acontece dentro dele,
 * evitando o padrão de "componente criado durante o render" no call site. */
export function CategoryIcon({
  icon,
  ...props
}: { icon: string | undefined } & SVGProps<SVGSVGElement>) {
  const Resolved = (icon && ICON_REGISTRY[icon]) || Tag;
  return createElement(Resolved, props);
}
