// Grade de categorias — espelha a do cronômetro do app (cor da paleta, ícone
// e atalho numérico). Clicar inicia/troca a categoria.
import { CategoryIcon } from "@/lib/icons";
import { categoryColor } from "@/lib/palette";
import type { ActionType } from "@/lib/types";

export function CategoryGrid({
  actionTypes,
  currentActionTypeId,
  onSelect,
  disabled,
}: {
  actionTypes: ActionType[];
  currentActionTypeId?: string | null;
  onSelect: (actionType: ActionType) => void;
  disabled?: boolean;
}) {
  if (actionTypes.length === 0) {
    return <p className="pmtt-muted">Nenhuma categoria — crie no PMTT em Configurações.</p>;
  }
  return (
    <div className="pmtt-grid">
      {actionTypes.map((actionType) => {
        const color = categoryColor(actionType.colorTag);
        const isCurrent = actionType.id === currentActionTypeId;
        return (
          <button
            key={actionType.id}
            type="button"
            className={`pmtt-grid-item${isCurrent ? " is-current" : ""}`}
            style={{ borderColor: isCurrent ? color : undefined }}
            onClick={() => onSelect(actionType)}
            disabled={disabled || isCurrent}
            title={isCurrent ? "Categoria atual" : `Iniciar "${actionType.name}"`}
          >
            <span className="pmtt-grid-icon" style={{ color }}>
              <CategoryIcon icon={actionType.icon} width={16} height={16} />
            </span>
            <span className="pmtt-grid-name">{actionType.name}</span>
            {actionType.shortcutKey ? (
              <span className="pmtt-grid-key">{actionType.shortcutKey}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
