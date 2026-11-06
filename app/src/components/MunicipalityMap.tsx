import { useId, useMemo } from "react";
import type { MunicipalityGeoCollection } from "../data/geo";
import { geometryToPath, getGeoBounds } from "../data/geo";
import type { Municipality } from "../data/municipalities";

type MunicipalityMapProps = {
  collection: MunicipalityGeoCollection;
  municipalities: Municipality[];
  selected: Municipality;
  onSelect: (municipality: Municipality) => void;
};

export function MunicipalityMap({
  collection,
  municipalities,
  selected,
  onSelect,
}: MunicipalityMapProps) {
  const titleId = useId();
  const descriptionId = useId();
  const municipalityById = useMemo(
    () => new Map(municipalities.map((municipality) => [municipality.id, municipality])),
    [municipalities],
  );
  const bounds = useMemo(() => getGeoBounds(collection), [collection]);
  const features = useMemo(
    () =>
      collection.features.map((feature) => ({
        id: feature.properties.codarea,
        path: geometryToPath(feature.geometry, bounds),
      })),
    [bounds, collection.features],
  );

  return (
    <figure className="municipality-map-panel" aria-labelledby={titleId}>
      <header className="map-heading">
        <div>
          <p className="place-kicker">Onde fica no Ceará</p>
          <h2 id={titleId}>{selected.name}</h2>
        </div>
        <p>{selected.region}</p>
      </header>

      <div className="map-canvas">
        <svg
          viewBox="0 0 640 620"
          role="img"
          aria-labelledby={`${titleId} ${descriptionId}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <desc id={descriptionId}>
            Mapa do Ceará dividido em 184 municípios. {selected.name} está destacado. A seleção
            também pode ser alterada pela lista de cidades.
          </desc>
          {features.map((feature) => {
            const municipality = municipalityById.get(feature.id);
            const isSelected = feature.id === selected.id;
            return (
              <path
                key={feature.id}
                d={feature.path}
                className={isSelected ? "map-shape is-selected" : "map-shape"}
                fillRule="evenodd"
                onClick={municipality ? () => onSelect(municipality) : undefined}
              >
                <title>{municipality?.name ?? `Município ${feature.id}`}</title>
              </path>
            );
          })}
        </svg>
        <div className="map-selected-label" aria-live="polite">
          <span>Município selecionado</span>
          <strong>{selected.name}</strong>
        </div>
      </div>

      <div className="map-legend" aria-label="Legenda do mapa">
        <span><i className="legend-selected" /> Selecionado</span>
        <span><i className="legend-boundary" /> Outros municípios</span>
      </div>
      <figcaption>
        Malha municipal do IBGE em qualidade mínima para contexto visual. O mapa não representa
        intensidade de dívida.{" "}
        <a
          href="https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html"
        >
          Consultar a fonte
        </a>
      </figcaption>
    </figure>
  );
}

