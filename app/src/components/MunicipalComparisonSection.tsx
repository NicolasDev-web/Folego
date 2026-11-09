import { useId } from "react";
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

export function MunicipalComparisonSection({
  municipalities,
  selected,
  comparisonSlugs,
  onUpdateComparison,
  onSelectPrimary,
}: MunicipalComparisonSectionProps) {
  const selectId = useId();
  const model = buildMunicipalComparison(municipalities, [
    selected.slug,
    ...comparisonSlugs,
  ]);
  const activeSlugs = new Set(model.selectedMunicipalities.map((m) => m.slug));
  const extraMunicipalities = model.selectedMunicipalities.slice(1);

  const pilotMunicipalities = PILOT_CITY_SLUGS.map((slug) =>
    municipalities.find((m) => m.slug === slug),
  ).filter((m): m is Municipality => Boolean(m));

  function handleAddSlug(slug: string) {
    if (!slug || activeSlugs.has(slug) || !model.canAddMore) {
      return;
    }
    const currentExtras = extraMunicipalities.map((m) => m.slug);
    onUpdateComparison([...currentExtras, slug]);
  }

  function handleRemoveSlug(slug: string) {
    const currentExtras = extraMunicipalities
      .map((m) => m.slug)
      .filter((item) => item !== slug);
    onUpdateComparison(currentExtras);
  }

  function handleClearExtras() {
    onUpdateComparison([]);
  }

  return (
    <section
      className="municipal-comparison-section"
      aria-labelledby="comparison-heading"
    >
      <header className="section-header-block">
        <div>
          <p className="section-marker">Comparação controlada · Até 3 municípios</p>
          <h2 id="comparison-heading">Comparar municípios lado a lado</h2>
          <p className="section-lead">
            Compare até três municípios apenas quando período, unidade e universo forem
            estritamente compatíveis. A dívida municipal direta permanece bloqueada até
            existir fonte pública validada por código IBGE.
          </p>
        </div>
        <div className="comparison-counter" aria-live="polite">
          <span>Cidades na comparação</span>
          <strong>
            {model.selectedMunicipalities.length} de {MAX_COMPARISON_CITIES}
          </strong>
        </div>
      </header>

      <div className="comparison-controls-bar">
        <div className="comparison-selected-chips" aria-label="Municípios selecionados para comparação">
          {model.selectedMunicipalities.map((city, index) => (
            <div
              key={city.id}
              className={`comparison-city-pill ${index === 0 ? "is-primary" : ""}`}
            >
              <div>
                <small>{index === 0 ? "Foco no mapa" : `Comparação ${index + 1}`}</small>
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
            </div>
          ))}
        </div>

        <div className="comparison-picker-group">
          <div className="comparison-select-field">
            <label htmlFor={selectId}>
              {model.canAddMore
                ? "Adicionar município (184 disponíveis)"
                : "Limite de 3 municípios atingido"}
            </label>
            <select
              id={selectId}
              value=""
              disabled={!model.canAddMore}
              onChange={(event) => handleAddSlug(event.target.value)}
            >
              <option value="">
                {model.canAddMore
                  ? "Selecione uma cidade para comparar..."
                  : "Remova uma cidade para adicionar outra"}
              </option>
              {municipalities.map((city) => (
                <option
                  key={city.id}
                  value={city.slug}
                  disabled={activeSlugs.has(city.slug)}
                >
                  {city.name} ({city.region})
                </option>
              ))}
            </select>
          </div>

          {extraMunicipalities.length > 0 ? (
            <button
              type="button"
              className="comparison-clear-button"
              onClick={handleClearExtras}
            >
              Limpar comparação
            </button>
          ) : null}
        </div>

        <div className="pilot-quick-bar" aria-label="Cidades-piloto do Ceará">
          <span className="pilot-bar-label">Recorte piloto (8 polos regionais):</span>
          <div className="pilot-buttons-wrap">
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
                    if (isSelectedPrimary) {
                      return;
                    }
                    if (isInComparison) {
                      handleRemoveSlug(pilotCity.slug);
                    } else if (model.canAddMore) {
                      handleAddSlug(pilotCity.slug);
                    }
                  }}
                  title={
                    isSelectedPrimary
                      ? `${pilotCity.name} já é o município principal selecionado`
                      : isInComparison
                        ? `Remover ${pilotCity.name} da comparação`
                        : `Adicionar ${pilotCity.name} à comparação`
                  }
                >
                  {pilotCity.name}
                  {isSelectedPrimary
                    ? " (foco)"
                    : isInComparison
                      ? " ✓"
                      : " +"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="comparison-table-container">
        <table className="comparison-table">
          <caption>
            Comparação de indicadores municipais com verificação de período, unidade e
            universo
          </caption>
          <thead>
            <tr>
              <th scope="col">Indicador, período e fonte</th>
              {model.selectedMunicipalities.map((city, idx) => (
                <th key={city.id} scope="col">
                  <div className="th-city-header">
                    <span>{idx === 0 ? "Município em foco" : `Município ${idx + 1}`}</span>
                    <strong>{city.name}</strong>
                    <small>{city.region}</small>
                    {idx > 0 ? (
                      <button
                        type="button"
                        className="th-focus-link"
                        onClick={() => onSelectPrimary(city.slug)}
                      >
                        Destacar no mapa
                      </button>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row) => (
              <tr
                key={row.metric.id}
                className={row.compatible ? "row-compatible" : "row-incompatible"}
              >
                <th scope="row">
                  <div className="metric-meta-cell">
                    <div className="metric-title-line">
                      <strong>{row.metric.label}</strong>
                      <span
                        className={`status-chip ${
                          row.compatible ? "status-available" : "status-missing"
                        }`}
                      >
                        {row.compatible ? `Período ${row.metric.period}` : "Indisponível"}
                      </span>
                    </div>
                    <p>{row.metric.sourceLabel}</p>
                    <small>{row.compatibilityNote}</small>
                  </div>
                </th>
                {row.cells.map((cell) => (
                  <td
                    key={`${row.metric.id}-${cell.municipalitySlug}`}
                    data-city={cell.municipalityName}
                    className={`cell-status-${cell.status}`}
                  >
                    <strong className="comparison-cell-value">{cell.formatted}</strong>
                    {cell.detailNote ? (
                      <span className="comparison-cell-note">{cell.detailNote}</span>
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
