import { useId, useMemo, useState, type CSSProperties } from "react";
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

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function barStyle(value: number, minimum: number, maximum: number) {
  const range = maximum - minimum;
  const size = range === 0 ? 100 : 6 + ((value - minimum) / range) * 94;
  return { "--ranking-bar-size": `${size}%` } as CSSProperties;
}

export function MunicipalRankingSection({
  municipalities,
  selected,
  onSelectMunicipality,
}: MunicipalRankingSectionProps) {
  const metricSelectId = useId();
  const searchId = useId();
  const [metricId, setMetricId] = useState<MunicipalMetricId>("income_pc_median_2022");
  const [direction, setDirection] = useState<RankingDirection>("desc");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const ranking = useMemo(
    () => rankMunicipalities(municipalities, metricId, direction),
    [municipalities, metricId, direction],
  );

  const selectedEntry = useMemo(() => {
    if (!ranking.eligible) return null;
    return ranking.entries.find((entry) => entry.municipality.id === selected.id) ?? null;
  }, [ranking, selected.id]);

  const selectedExclusion = useMemo(
    () => ranking.excludedMunicipalities.find((item) => item.municipality.id === selected.id) ?? null,
    [ranking.excludedMunicipalities, selected.id],
  );

  const matchingEntries = useMemo(() => {
    if (!ranking.eligible) return [];
    const normalizedQuery = normalizeText(query.trim());
    if (!normalizedQuery) return ranking.entries;
    return ranking.entries.filter((entry) =>
      normalizeText(entry.municipality.name).includes(normalizedQuery),
    );
  }, [query, ranking]);

  const visibleEntries = useMemo(() => {
    if (query.trim() || showAll) return matchingEntries;
    return matchingEntries.slice(0, 15);
  }, [matchingEntries, query, showAll]);

  const podium = ranking.eligible ? ranking.entries.slice(0, 3) : [];
  const values = ranking.eligible ? ranking.entries.map((entry) => entry.value) : [];
  const minimum = values.length > 0 ? Math.min(...values) : 0;
  const maximum = values.length > 0 ? Math.max(...values) : 1;

  function selectMetric(nextMetric: MunicipalMetricId) {
    setMetricId(nextMetric);
    setQuery("");
    setShowAll(false);
  }

  return (
    <section className="municipal-ranking-section" aria-labelledby="ranking-heading">
      <header className="ranking-intro">
        <div>
          <h2 id="ranking-heading">Em que posição está sua cidade?</h2>
          <p className="section-lead">
            Escolha o que comparar e veja onde sua cidade aparece na lista.
          </p>
        </div>

        <div className="ranking-summary-counts" aria-live="polite">
          <div>
            <strong>{ranking.includedCount}</strong>
            <span>municípios no ranking</span>
          </div>
          <div>
            <strong>{ranking.excludedCount}</strong>
            <span>sem dado no período</span>
          </div>
        </div>
      </header>

      <div className="ranking-control-deck">
        <div className="ranking-control-field">
          <label htmlFor={metricSelectId}>O que você quer comparar?</label>
          <select
            id={metricSelectId}
            value={metricId}
            onChange={(event) => selectMetric(event.target.value as MunicipalMetricId)}
          >
            {MUNICIPAL_METRIC_LIST.map((metric) => (
              <option key={metric.id} value={metric.id}>
                {metric.shortLabel}{metric.eligibleForRanking ? "" : " · indisponível"}
              </option>
            ))}
          </select>
        </div>

        {ranking.eligible ? (
          <>
            <div className="ranking-direction-control">
              <span>Ordenar por</span>
              <div className="ranking-direction-group" role="group" aria-label="Ordem dos resultados">
                <button
                  type="button"
                  aria-pressed={direction === "desc"}
                  onClick={() => setDirection("desc")}
                >
                  Maiores valores
                </button>
                <button
                  type="button"
                  aria-pressed={direction === "asc"}
                  onClick={() => setDirection("asc")}
                >
                  Menores valores
                </button>
              </div>
            </div>

            <div className="ranking-control-field ranking-search-field">
              <label htmlFor={searchId}>Buscar cidade na lista</label>
              <input
                id={searchId}
                type="search"
                value={query}
                placeholder="Ex.: Sobral"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </>
        ) : null}

        <details className="ranking-method-note">
          <summary>Como o ranking funciona</summary>
          <p>
            Cidades com o mesmo valor dividem a posição. Cidades sem dado ficam fora da lista.
          </p>
        </details>
      </div>

      {!ranking.eligible ? (
        <article className="ranking-ineligible-banner" role="status">
          <span className="status-chip status-missing">Ranking indisponível</span>
          <h3>{ranking.metric.label}</h3>
          <p>{ranking.reason}</p>
          <dl className="ineligible-meta-grid">
            <div>
              <dt>Onde há dados</dt>
              <dd>Ceará e regiões por CEP</dd>
            </div>
            <div>
              <dt>Como ver os dados</dt>
              <dd><a href="/#resumo-ceara">Ver o resumo do Ceará</a></dd>
            </div>
            <div>
              <dt>Cidades com posição</dt>
              <dd>0 de {ranking.totalMunicipalities} municípios</dd>
            </div>
          </dl>
        </article>
      ) : (
        <>
          <div className="ranking-selected-callout" aria-live="polite">
            <div>
              <span>Sua cidade no ranking</span>
              <h3>{selected.name}</h3>
              <p>{ranking.metric.label} · {ranking.metric.period}</p>
            </div>
            {selectedEntry ? (
              <div className="callout-rank-box">
                <strong className="callout-rank-number">
                  {selectedEntry.tied ? `=${selectedEntry.rank}º` : `${selectedEntry.rank}º`}
                </strong>
                <span>{selectedEntry.formattedValue}</span>
                <small>entre {ranking.includedCount} municípios</small>
              </div>
            ) : (
              <div className="callout-rank-box is-excluded">
                <strong>Sem posição neste período</strong>
                <span>{selectedExclusion?.reason ?? "Sem dado para o período."}</span>
              </div>
            )}
          </div>

          <section className="ranking-podium" aria-labelledby="ranking-podium-title">
            <div className="ranking-list-heading">
              <div>
                <p>{direction === "desc" ? "Maiores valores" : "Menores valores"}</p>
                <h3 id="ranking-podium-title">Três cidades em destaque</h3>
              </div>
              <a href={ranking.metric.sourceUrl} target="_blank" rel="noreferrer">
                Fonte: {ranking.metric.sourceLabel}
              </a>
            </div>
            <ol>
              {podium.map((entry, index) => (
                <li
                  key={entry.municipality.id}
                  className={entry.municipality.id === selected.id ? "is-current" : undefined}
                >
                  <span className="podium-rank">{entry.tied ? `=${entry.rank}` : entry.rank}</span>
                  <div>
                    <strong>{entry.municipality.name}</strong>
                    <small>{entry.municipality.region}</small>
                  </div>
                  <b>{entry.formattedValue}</b>
                  <button type="button" onClick={() => onSelectMunicipality(entry.municipality.slug)}>
                    Ver no mapa
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section className="ranking-visual-board" aria-labelledby="ranking-list-title">
            <div className="ranking-list-heading">
              <div>
                <p>{query.trim() ? "Resultado da busca" : "Lista municipal"}</p>
                <h3 id="ranking-list-title">
                  {query.trim() ? `${matchingEntries.length} resultado(s)` : "Lista de cidades"}
                </h3>
              </div>
              <span>{ranking.metric.unitLabel} · {ranking.metric.period}</span>
            </div>

            {visibleEntries.length > 0 ? (
              <ol className="ranking-visual-list">
                {visibleEntries.map((entry) => {
                  const isCurrent = entry.municipality.id === selected.id;
                  return (
                    <li key={entry.municipality.id} className={isCurrent ? "is-current" : undefined}>
                      <div className="rank-position-cell">
                        <strong>{entry.tied ? `=${entry.rank}º` : `${entry.rank}º`}</strong>
                        {entry.tied ? <span>Empate</span> : null}
                      </div>
                      <div className="rank-city-name">
                        <strong>{entry.municipality.name}</strong>
                        <small>{entry.municipality.region}</small>
                      </div>
                      <div className={`rank-bar-cell ${entry.value < 0 ? "is-negative" : ""}`}>
                        <span aria-hidden="true"><i style={barStyle(entry.value, minimum, maximum)} /></span>
                        <strong>{entry.formattedValue}</strong>
                      </div>
                      <button
                        type="button"
                        className="rank-select-button"
                        aria-pressed={isCurrent}
                        onClick={() => onSelectMunicipality(entry.municipality.slug)}
                      >
                        {isCurrent ? "No mapa" : "Ver no mapa"}
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="ranking-empty-state">
                <strong>Nenhuma cidade encontrada.</strong>
                <p>Tente outro nome de município.</p>
              </div>
            )}

            {!query.trim() && ranking.entries.length > 15 ? (
              <div className="ranking-pagination-bar">
                <p>Exibindo <strong>{visibleEntries.length}</strong> de <strong>{ranking.includedCount}</strong>.</p>
                <button
                  type="button"
                  className="ranking-expand-button"
                  onClick={() => setShowAll((current) => !current)}
                >
                  {showAll ? "Mostrar somente os 15 primeiros" : "Ver todos os municípios"}
                </button>
              </div>
            ) : null}
          </section>

          {ranking.excludedCount > 0 ? (
            <details className="ranking-excluded-panel">
              <summary>
                <span>Municípios sem dado no período</span>
                <strong>{ranking.excludedCount} municípios</strong>
              </summary>
              <p>
                Essas cidades ficam sem posição porque a fonte não informa um valor para elas.
              </p>
              <ul className="excluded-city-list">
                {ranking.excludedMunicipalities.map((item) => (
                  <li key={item.municipality.id}>
                    <button type="button" onClick={() => onSelectMunicipality(item.municipality.slug)}>
                      <strong>{item.municipality.name}</strong>
                      <span>{item.municipality.region} · Sem dado</span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </section>
  );
}
