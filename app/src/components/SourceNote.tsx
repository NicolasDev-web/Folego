type SourceNoteProps = {
  sourceLabel: string;
  sourceUrl: string;
  period: string;
  universe: string;
  territoryScope: string;
  formula?: string;
  limitNote: string;
};

export function SourceNote({
  sourceLabel,
  sourceUrl,
  period,
  universe,
  territoryScope,
  formula,
  limitNote,
}: SourceNoteProps) {
  return (
    <aside className="source-note" aria-label={sourceLabel}>
      <div className="source-note-main">
        <div>
          <strong>{sourceLabel}</strong>
          <p>{limitNote}</p>
        </div>
        <a
          className="source-note-link"
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Consultar fonte ↗
        </a>
      </div>
      <details>
        <summary>Ver detalhes da fonte</summary>
        <dl className="source-note-meta">
          <div>
            <dt>Quando</dt>
            <dd>{period}</dd>
          </div>
          <div>
            <dt>Onde</dt>
            <dd>{territoryScope}</dd>
          </div>
          <div>
            <dt>O que foi medido</dt>
            <dd>{universe}</dd>
          </div>
          {formula && (
            <div>
              <dt>Cálculo ou regra</dt>
              <dd>{formula}</dd>
            </div>
          )}
        </dl>
      </details>
    </aside>
  );
}
