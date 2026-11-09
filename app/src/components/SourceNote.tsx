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
    <aside className="source-note" aria-label={`Nota metodológica: ${sourceLabel}`}>
      <div className="source-note-main">
        <div>
          <span className="source-note-kicker">Rastreabilidade da fonte</span>
          <strong>{sourceLabel}</strong>
          <p>{limitNote}</p>
        </div>
        <a
          className="source-note-link"
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Abrir fonte oficial ↗
        </a>
      </div>
      <dl className="source-note-meta">
        <div>
          <dt>Competência</dt>
          <dd>{period}</dd>
        </div>
        <div>
          <dt>Escala territorial</dt>
          <dd>{territoryScope}</dd>
        </div>
        <div>
          <dt>Universo</dt>
          <dd>{universe}</dd>
        </div>
        {formula ? (
          <div>
            <dt>Regra / Fórmula</dt>
            <dd>
              <code>{formula}</code>
            </dd>
          </div>
        ) : null}
      </dl>
    </aside>
  );
}
