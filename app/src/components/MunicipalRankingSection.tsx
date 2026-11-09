import { useMemo, useState } from "react";
import type { Municipality } from "../data/municipalities";
import {
  MUNICIPAL_METRIC_LIST,
  rankMunicipalities,
  type MunicipalMetricId,
  type RankingDirection,
} from "../lib/municipalComparisonAndRanking";

type MunicipalRankingSectionProps = {
  municipalities: Municipality[];
  selected: Municipality;
  onSelectMunicipality: (slug: string) => void;
};

export function MunicipalRankingSection({
  municipalities,
  selected,
  onSelectMunicipality,
}: MunicipalRankingSectionProps) {
  const [metricId, setMetricId] = useState<MunicipalMetricId>("income_pc_median_2022");
  const [direction, setDirection] = useState<RankingDirection>("desc");
  const [onlyPilot, setOnlyPilot] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const ranking = useMemo(
    () => rankMunicipalities(municipalities, metricId, direction),
    [municipalities, metricId, direction],
  );

  const selectedEntry = useMemo(() => {
    if (!ranking.eligible) return null;
    return (
      ranking.entries.find((entry) => entry.municipality.id === selected.id) ?? null
    );
  }, [ranking, selected.id]);

  const selectedExclusion = useMemo(() => {
    return (
      ranking.excludedMunicipalities.find(
        (item) => item.municipality.id === selected.id,
      ) ?? null
    );
  }, [ranking.excludedMunicipalities, selected.id]);

  const visibleEntries = useMemo(() => {
    if (!ranking.eligible) return [];
    const filtered = onlyPilot
      ? ranking.entries.filter((entry) => entry.municipality.pilot)
      : ranking.entries;
    if (showAll || onlyPilot) {
      return filtered;
    }
    return filtered.slice(0, 15);
  }, [ranking, onlyPilot, showAll]);

  return (
    <section
      className="municipal-ranking-section"
      aria-labelledby="ranking-heading"
    >
      <header className="section-header-block">
        <div>
          <p className="section-marker">Ranking municipal · Apenas medidas elegíveis</p>
          <h2 id="ranking-heading">Ordenação dos municípios por indicador observado</h2>
          <p className="section-lead">
            A ordenação só é habilitada para indicadores observados diretamente na escala
            municipal. Valores ausentes (<code>null</code>) são separados do ranking numérico e
            empates recebem a mesma posição competitiva.
          </p>
        </div>

        <div className="ranking-summary-counts" aria-live="polite">
          <div>
            <span>Incluídos no ranking</span>
            <strong>{ranking.includedCount} municípios</strong>
          </div>
          <div>
            <span>Excluídos por ausência (null)</span>
            <strong>{ranking.excludedCount} municípios</strong>
          </div>
          {ranking.eligible ? (
            <div>
              <span>Posições empatadas</span>
              <strong>{ranking.tiedMunicipalitiesCount} municípios</strong>
            </div>
          ) : null}
        </div>
      </header>

      <div className="ranking-controls-bar">
        <div
          className="ranking-metric-tabs"
          role="group"
          aria-label="Selecionar indicador do ranking"
        >
          {MUNICIPAL_METRIC_LIST.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={metricId === item.id}
              className={`ranking-tab-button ${
                !item.eligibleForRanking ? "is-ineligible-tab" : ""
              }`}
              onClick={() => setMetricId(item.id)}
            >
              <span>{item.shortLabel}</span>
              <small>
                {item.eligibleForRanking ? `Elegível · ${item.period}` : "Bloqueado"}
              </small>
            </button>
          ))}
        </div>

        {ranking.eligible ? (
          <div className="ranking-secondary-controls">
            <div className="ranking-direction-group" role="group" aria-label="Direção da ordenação">
              <button
                type="button"
                aria-pressed={direction === "desc"}
                onClick={() => setDirection("desc")}
              >
                Maior para menor
              </button>
              <button
                type="button"
                aria-pressed={direction === "asc"}
                onClick={() => setDirection("asc")}
              >
                Menor para maior
              </button>
            </div>

            <label className="ranking-pilot-toggle">
              <input
                type="checkbox"
                checked={onlyPilot}
                onChange={(event) => setOnlyPilot(event.target.checked)}
              />
              <span>Apenas as 8 cidades-piloto</span>
            </label>
          </div>
        ) : null}
      </div>

      {!ranking.eligible ? (
        <article className="ranking-ineligible-banner" role="status">
          <div className="ineligible-header">
            <span className="status-chip status-missing">Inelegível para ranking</span>
            <h3>{ranking.metric.label}</h3>
          </div>
          <p>{ranking.reason}</p>
          <dl className="ineligible-meta-grid">
            <div>
              <dt>Escala de divulgação oficial</dt>
              <dd>Unidade da Federação (Ceará) e sub-regiões BCB sem vínculo municipal</dd>
            </div>
            <div>
              <dt>Regra editorial aplicada</dt>
              <dd>Proibido atribuir ou ranquear municípios por proxy estadual ou regional</dd>
            </div>
            <div>
              <dt>Municípios ranqueados</dt>
              <dd>0 de {ranking.totalMunicipalities} municípios</dd>
            </div>
          </dl>
        </article>
      ) : (
        <>
          <div className="ranking-selected-callout" aria-live="polite">
            <div>
              <span className="callout-eyebrow">Posição do município selecionado no mapa</span>
              <h3>{selected.name}</h3>
              <p>
                {ranking.metric.label} · {ranking.metric.sourceLabel}
              </p>
            </div>
            {selectedEntry ? (
              <div className="callout-rank-box">
                <strong className="callout-rank-number">
                  {selectedEntry.tied ? `=${selectedEntry.rank}º` : `${selectedEntry.rank}º`}
                </strong>
                <span>
                  de {ranking.includedCount} municípios com dado válido ·{" "}
                  <strong>{selectedEntry.formattedValue}</strong>
                  {selectedEntry.tied ? " (empate de valor)" : ""}
                </span>
              </div>
            ) : (
              <div className="callout-rank-box is-excluded">
                <strong>Fora do ranking numérico (null)</strong>
                <span>
                  {selectedExclusion?.reason ??
                    "Sem observação válida neste período."}
                </span>
              </div>
            )}
          </div>

          <div className="ranking-table-container">
            <table className="ranking-table">
              <caption>
                Ranking municipal de {ranking.metric.label} ({ranking.metric.period}) —{" "}
                {ranking.includedCount} municípios incluídos e {ranking.excludedCount} sem
                observação no período
              </caption>
              <thead>
                <tr>
                  <th scope="col">Posição</th>
                  <th scope="col">Município</th>
                  <th scope="col">Região de planejamento</th>
                  <th scope="col">{ranking.metric.label}</th>
                  <th scope="col">Ação</th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((entry) => {
                  const isCurrent = entry.municipality.id === selected.id;
                  return (
                    <tr
                      key={entry.municipality.id}
                      className={isCurrent ? "is-selected-row" : undefined}
                    >
                      <td className="rank-position-cell">
                        <strong>
                          {entry.tied ? `=${entry.rank}º` : `${entry.rank}º`}
                        </strong>
                        {entry.tied ? (
                          <span className="tie-badge" title="Valor idêntico a outro município">
                            Empate
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <div className="rank-city-name">
                          <strong>{entry.municipality.name}</strong>
                          {entry.municipality.pilot ? (
                            <span className="pilot-tag">Piloto</span>
                          ) : null}
                        </div>
                      </td>
                      <td>{entry.municipality.region}</td>
                      <td className="rank-value-cell">{entry.formattedValue}</td>
                      <td>
                        <button
                          type="button"
                          className="rank-select-button"
                          aria-pressed={isCurrent}
                          onClick={() => onSelectMunicipality(entry.municipality.slug)}
                        >
                          {isCurrent ? "Selecionado" : "Ver no mapa"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!onlyPilot && ranking.entries.length > 15 ? (
            <div className="ranking-pagination-bar">
              <p>
                Exibindo <strong>{visibleEntries.length}</strong> de{" "}
                <strong>{ranking.includedCount}</strong> municípios com observação válida.
              </p>
              <button
                type="button"
                className="ranking-expand-button"
                onClick={() => setShowAll((prev) => !prev)}
              >
                {showAll
                  ? "Mostrar apenas os 15 primeiros"
                  : `Mostrar todos os ${ranking.includedCount} municípios`}
              </button>
            </div>
          ) : null}

          {ranking.excludedCount > 0 ? (
            <aside
              className="ranking-excluded-panel"
              aria-label="Municípios excluídos do ranking por ausência de dado"
            >
              <div className="excluded-panel-header">
                <h3>
                  Municípios sem observação no período ({ranking.excludedCount} de{" "}
                  {ranking.totalMunicipalities})
                </h3>
                <span className="status-chip status-missing">Valor nulo (null)</span>
              </div>
              <p>
                Estes municípios não tiveram observação positiva para{" "}
                <strong>{ranking.metric.label}</strong> no período ({ranking.metric.period}) e
                por regra metodológica não recebem valor zero nem posição numérica artificial:
              </p>
              <ul className="excluded-city-list">
                {ranking.excludedMunicipalities.map((item) => (
                  <li key={item.municipality.id}>
                    <button
                      type="button"
                      onClick={() => onSelectMunicipality(item.municipality.slug)}
                    >
                      <strong>{item.municipality.name}</strong>
                      <span>{item.municipality.region} · Sem observação (null)</span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </>
      )}
    </section>
  );
}
