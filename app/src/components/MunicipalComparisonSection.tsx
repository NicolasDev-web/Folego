import { useId, type CSSProperties } from "react";
import type { Municipality } from "../data/municipalities";
import {
  buildMunicipalComparison,
  MAX_COMPARISON_CITIES,
  PILOT_CITY_SLUGS,
} from "../lib/municipalComparisonAndRanking";

type MunicipalComparisonSectionProps = {
  municipalities: Municipality[];
  selected: Municipality;
  comparisonSlugs: string[];
  onUpdateComparison: (nextExtraSlugs: string[]) => void;
  onSelectPrimary: (slug: string) => void;
};

const comparisonColors = ["#174440", "#b94d32", "#4f796f"];

function cityStyle(index: number) {
  return { "--comparison-city": comparisonColors[index] } as CSSProperties;
}

function valueBarStyle(value: number | null, maxAbsoluteValue: number, index: number) {
  const size = value === null ? 0 : Math.max(3, (Math.abs(value) / maxAbsoluteValue) * 100);
  return {
    "--comparison-city": comparisonColors[index],
    "--comparison-bar-size": `${size}%`,
  } as CSSProperties;
}

export function MunicipalComparisonSection({
  municipalities,
  selected,
  comparisonSlugs,
  onUpdateComparison,
  onSelectPrimary,
}: MunicipalComparisonSectionProps) {
  const selectId = useId();
  const model = buildMunicipalComparison(municipalities, [selected.slug, ...comparisonSlugs]);
  const activeSlugs = new Set(model.selectedMunicipalities.map((municipality) => municipality.slug));
  const extraMunicipalities = model.selectedMunicipalities.slice(1);
  const pilotMunicipalities = PILOT_CITY_SLUGS.map((slug) =>
    municipalities.find((municipality) => municipality.slug === slug),
  ).filter((municipality): municipality is Municipality => Boolean(municipality));

  function handleAddSlug(slug: string) {
    if (!slug || activeSlugs.has(slug) || !model.canAddMore) return;
    onUpdateComparison([...extraMunicipalities.map((municipality) => municipality.slug), slug]);
  }

  function handleRemoveSlug(slug: string) {
    onUpdateComparison(
      extraMunicipalities
        .map((municipality) => municipality.slug)
        .filter((item) => item !== slug),
    );
  }

  return (
    <section className="municipal-comparison-section" aria-labelledby="comparison-heading">
      <header className="comparison-intro">
        <div>
          <p className="section-marker">Comparação municipal · mesma régua</p>
          <h2 id="comparison-heading">Cidades na mesma régua</h2>
          <p className="section-lead">
            Escolha até três cidades. Cada linha usa o mesmo período, unidade e universo.
          </p>
        </div>
        <p className="comparison-counter" aria-live="polite">
          <strong>{model.selectedMunicipalities.length}</strong>
          <span>de {MAX_COMPARISON_CITIES} cidades</span>
        </p>
      </header>

      <div className="comparison-workbench">
        <div className="comparison-city-rail" aria-label="Municípios selecionados para comparação">
          {model.selectedMunicipalities.map((city, index) => (
            <article
              key={city.id}
              className={`comparison-city-card ${index === 0 ? "is-primary" : ""}`}
              style={cityStyle(index)}
            >
              <span className="comparison-city-number" aria-hidden="true">{index + 1}</span>
              <div>
                <small>{index === 0 ? "Cidade no mapa" : "Cidade comparada"}</small>
                <strong>{city.name}</strong>
                <span>{city.region}</span>
              </div>
              {index > 0 ? (
                <button
                  type="button"
                  className="pill-remove-button"
                  onClick={() => handleRemoveSlug(city.slug)}
                  aria-label={`Remover ${city.name} da comparação`}
                >
                  Remover
                </button>
              ) : null}
            </article>
          ))}
        </div>

        <div className="comparison-actions">
          <div className="comparison-select-field">
            <label htmlFor={selectId}>
              {model.canAddMore ? "Adicionar outra cidade" : "As três cidades estão selecionadas"}
            </label>
            <select
              id={selectId}
              value=""
              disabled={!model.canAddMore}
              onChange={(event) => handleAddSlug(event.target.value)}
            >
              <option value="">
                {model.canAddMore ? "Busque entre os 184 municípios" : "Remova uma cidade para trocar"}
              </option>
              {municipalities.map((city) => (
                <option key={city.id} value={city.slug} disabled={activeSlugs.has(city.slug)}>
                  {city.name} · {city.region}
                </option>
              ))}
            </select>
          </div>

          {extraMunicipalities.length > 0 ? (
            <button
              type="button"
              className="comparison-clear-button"
              onClick={() => onUpdateComparison([])}
            >
              Manter só {selected.name}
            </button>
          ) : null}
        </div>

        <details className="comparison-suggestions">
          <summary>Sugestões rápidas de cidades</summary>
          <div className="pilot-buttons-wrap" aria-label="Cidades-polo do Ceará">
            {pilotMunicipalities.map((pilotCity) => {
              const isSelectedPrimary = pilotCity.slug === selected.slug;
              const isInComparison = activeSlugs.has(pilotCity.slug);
              return (
                <button
                  key={pilotCity.id}
                  type="button"
                  className={`pilot-chip-button ${isInComparison ? "is-active" : ""}`}
                  disabled={!isInComparison && !model.canAddMore}
                  onClick={() => {
                    if (isSelectedPrimary) return;
                    if (isInComparison) handleRemoveSlug(pilotCity.slug);
                    else if (model.canAddMore) handleAddSlug(pilotCity.slug);
                  }}
                >
                  {pilotCity.name}{isSelectedPrimary ? " · mapa" : isInComparison ? " ✓" : " +"}
                </button>
              );
            })}
          </div>
        </details>
      </div>

      <div className="comparison-table-container">
        <table className="comparison-table">
          <caption>Valores municipais comparáveis, com fonte e período visíveis</caption>
          <thead>
            <tr>
              <th scope="col">Indicador</th>
              {model.selectedMunicipalities.map((city, index) => (
                <th key={city.id} scope="col" style={cityStyle(index)}>
                  <div className="th-city-header">
                    <i aria-hidden="true" />
                    <strong>{city.name}</strong>
                    <small>{city.region}</small>
                    {index > 0 ? (
                      <button
                        type="button"
                        className="th-focus-link"
                        onClick={() => onSelectPrimary(city.slug)}
                      >
                        Mostrar no mapa
                      </button>
                    ) : (
                      <span>Em foco no mapa</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row) => {
              const maxAbsoluteValue = Math.max(
                ...row.cells.map((cell) => Math.abs(cell.value ?? 0)),
                1,
              );
              return (
                <tr key={row.metric.id} className={row.compatible ? "row-compatible" : "row-incompatible"}>
                  <th scope="row">
                    <div className="metric-meta-cell">
                      <div className="metric-title-line">
                        <strong>{row.metric.label}</strong>
                        <span className={`status-chip ${row.compatible ? "status-available" : "status-missing"}`}>
                          {row.compatible ? row.metric.period : "Sem dado municipal"}
                        </span>
                      </div>
                      <a href={row.metric.sourceUrl} target="_blank" rel="noreferrer">
                        {row.metric.sourceLabel}
                      </a>
                      {row.compatible ? (
                        <details>
                          <summary>Escopo comparável</summary>
                          <small>{row.compatibilityNote}</small>
                        </details>
                      ) : null}
                    </div>
                  </th>

                  {row.compatible ? row.cells.map((cell, index) => (
                    <td
                      key={`${row.metric.id}-${cell.municipalitySlug}`}
                      data-city={cell.municipalityName}
                      className={`cell-status-${cell.status}`}
                      style={cityStyle(index)}
                    >
                      <strong className="comparison-cell-value">{cell.formatted}</strong>
                      {cell.value !== null ? (
                        <span
                          className={`comparison-value-bar ${cell.value < 0 ? "is-negative" : ""}`}
                          style={valueBarStyle(cell.value, maxAbsoluteValue, index)}
                          aria-hidden="true"
                        ><i /></span>
                      ) : null}
                      {cell.detailNote ? <span className="comparison-cell-note">{cell.detailNote}</span> : null}
                    </td>
                  )) : (
                    <td colSpan={model.selectedMunicipalities.length} className="comparison-unavailable-cell">
                      <strong>Ainda não existe uma fonte municipal validada.</strong>
                      <p>{row.compatibilityNote}</p>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
