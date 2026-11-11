import type { Observation } from "../types/observation";

type MetricCardProps = {
  eyebrow: string;
  title: string;
  formattedValue: string;
  unitLabel: string;
  periodLabel: string;
  sourceLabel: string;
  universeLabel: string;
  status?: Observation["status"];
  comparisonNote?: string;
  highlight?: boolean;
};

const statusMap: Record<
  Observation["status"],
  { label: string; tone: "available" | "partial" | "missing" }
> = {
  observado: { label: "Observado", tone: "available" },
  parcial: { label: "Parcial", tone: "partial" },
  suprimido: { label: "Suprimido", tone: "missing" },
  indisponivel: { label: "Indisponível", tone: "missing" },
  nao_aplicavel: { label: "Não aplicável", tone: "missing" },
};

export function MetricCard({
  eyebrow,
  title,
  formattedValue,
  unitLabel,
  periodLabel,
  sourceLabel,
  universeLabel,
  status = "observado",
  comparisonNote,
  highlight = false,
}: MetricCardProps) {
  const badge = statusMap[status];

  return (
    <article className={`metric-card ${highlight ? "is-highlight" : ""}`}>
      <header className="metric-card-header">
        <span className="metric-eyebrow">{eyebrow}</span>
        {status !== "observado" && (
          <span className={`status-chip status-${badge.tone}`}>{badge.label}</span>
        )}
      </header>
      <h3 className="metric-card-title">{title}</h3>
      <p className="metric-card-value">{formattedValue}</p>
      <p className="metric-card-unit">
        {unitLabel} · <strong>{periodLabel}</strong>
      </p>
      {comparisonNote ? (
        <p className="metric-card-comparison">{comparisonNote}</p>
      ) : null}
      <footer className="metric-card-footer">
        <span>Fonte: {sourceLabel}</span>
        <small>{universeLabel}</small>
      </footer>
    </article>
  );
}
