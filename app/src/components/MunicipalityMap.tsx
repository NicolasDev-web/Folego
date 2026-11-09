import { useEffect, useId, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import {
  geometryCentroid,
  geometryToPath,
  getGeoBounds,
  projectPosition,
  type MunicipalityGeoCollection,
  type MunicipalityGeoFeature,
  type Position,
} from "../data/geo";
import type { Municipality } from "../data/municipalities";

type MunicipalityMapProps = {
  collection: MunicipalityGeoCollection;
  municipalities: Municipality[];
  selected: Municipality;
  onSelect: (municipality: Municipality) => void;
};

type MapMode = "territory" | "employment" | "income" | "population";
type MapFeature = {
  id: string;
  feature: MunicipalityGeoFeature;
  municipality: Municipality;
  path: string;
  centroid: Position;
};
type CartogramNode = {
  id: string;
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  radius: number;
};

const WIDTH = 640;
const HEIGHT = 620;
const PADDING = 24;
const FULL_VIEWBOX = `0 0 ${WIDTH} ${HEIGHT}`;
const modes: Array<{ id: MapMode; label: string; description: string }> = [
  { id: "territory", label: "Território", description: "limites e zoom regional" },
  { id: "employment", label: "Emprego", description: "saldo em círculos proporcionais" },
  { id: "income", label: "Renda", description: "mediana por faixas de cor" },
  { id: "population", label: "População", description: "cartograma populacional" },
];
const incomeColors = ["#285b56", "#3f746d", "#6f9b87", "#a8bda2", "#e4d7a8"];
const number = new Intl.NumberFormat("pt-BR");
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function regionViewBox(features: MapFeature[], fullBounds: ReturnType<typeof getGeoBounds>) {
  if (features.length === 0) return FULL_VIEWBOX;
  const bounds = getGeoBounds({
    type: "FeatureCollection",
    features: features.map((item) => item.feature),
  });
  const [left, top] = projectPosition(
    [bounds.minLongitude, bounds.maxLatitude], fullBounds, WIDTH, HEIGHT, PADDING,
  );
  const [right, bottom] = projectPosition(
    [bounds.maxLongitude, bounds.minLatitude], fullBounds, WIDTH, HEIGHT, PADDING,
  );
  const contentWidth = Math.max(right - left, 40);
  const contentHeight = Math.max(bottom - top, 40);
  const margin = Math.max(contentWidth, contentHeight) * 0.18;
  const x = Math.max(0, left - margin);
  const y = Math.max(0, top - margin);
  const width = Math.min(WIDTH - x, contentWidth + margin * 2);
  const height = Math.min(HEIGHT - y, contentHeight + margin * 2);
  return `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)}`;
}

function layoutCartogram(features: MapFeature[]): Map<string, CartogramNode> {
  const maxPopulation = Math.max(
    ...features.map((feature) => feature.municipality.population_2022), 1,
  );
  const nodes = features.map<CartogramNode>((feature) => {
    const [x, y] = feature.centroid;
    return {
      id: feature.id,
      x,
      y,
      anchorX: x,
      anchorY: y,
      radius: 3.5 + 23 * Math.sqrt(feature.municipality.population_2022 / maxPopulation),
    };
  });

  for (let iteration = 0; iteration < 110; iteration += 1) {
    for (const node of nodes) {
      node.x += (node.anchorX - node.x) * 0.018;
      node.y += (node.anchorY - node.y) * 0.018;
    }
    for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
        const left = nodes[leftIndex];
        const right = nodes[rightIndex];
        const dx = right.x - left.x;
        const dy = right.y - left.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const minimumDistance = left.radius + right.radius + 0.8;
        if (distance >= minimumDistance) continue;
        const shift = (minimumDistance - distance) / 2;
        const unitX = dx / distance;
        const unitY = dy / distance;
        left.x -= unitX * shift;
        left.y -= unitY * shift;
        right.x += unitX * shift;
        right.y += unitY * shift;
      }
    }
    for (const node of nodes) {
      node.x = Math.min(WIDTH - node.radius - 10, Math.max(node.radius + 10, node.x));
      node.y = Math.min(HEIGHT - node.radius - 10, Math.max(node.radius + 10, node.y));
    }
  }
  return new Map(nodes.map((node) => [node.id, node]));
}

function modeDescription(mode: MapMode, selected: Municipality) {
  if (mode === "employment") {
    const balance = selected.formal_employment.balance;
    return `${selected.name}: saldo de ${balance >= 0 ? "+" : ""}${number.format(balance)} postos.`;
  }
  if (mode === "income") {
    return `${selected.name}: renda mediana de ${currency.format(selected.income_pc_median_2022)}.`;
  }
  if (mode === "population") {
    return `${selected.name}: ${number.format(selected.population_2022)} habitantes.`;
  }
  return `${selected.name} está destacado no mapa territorial.`;
}

export function MunicipalityMap({ collection, municipalities, selected, onSelect }: MunicipalityMapProps) {
  const titleId = useId();
  const descriptionId = useId();
  const regionSelectId = useId();
  const [mode, setMode] = useState<MapMode>("territory");
  const [activeRegion, setActiveRegion] = useState("");
  const municipalityById = useMemo(
    () => new Map(municipalities.map((municipality) => [municipality.id, municipality])),
    [municipalities],
  );
  const bounds = useMemo(() => getGeoBounds(collection), [collection]);
  const features = useMemo(
    () => collection.features.flatMap<MapFeature>((feature) => {
      const municipality = municipalityById.get(feature.properties.codarea);
      if (!municipality) return [];
      return [{
        id: feature.properties.codarea,
        feature,
        municipality,
        path: geometryToPath(feature.geometry, bounds, WIDTH, HEIGHT, PADDING),
        centroid: geometryCentroid(feature.geometry, bounds, WIDTH, HEIGHT, PADDING),
      }];
    }),
    [bounds, collection.features, municipalityById],
  );
  const regions = useMemo(
    () => [...new Set(municipalities.map((municipality) => municipality.region))]
      .sort((left, right) => left.localeCompare(right, "pt-BR")),
    [municipalities],
  );
  const regionFeatures = useMemo(
    () => features.filter((feature) => feature.municipality.region === activeRegion),
    [activeRegion, features],
  );
  const viewBox = mode === "territory" && activeRegion
    ? regionViewBox(regionFeatures, bounds)
    : FULL_VIEWBOX;
  const incomeThresholds = useMemo(() => {
    const values = municipalities
      .map((municipality) => municipality.income_pc_median_2022)
      .sort((left, right) => left - right);
    return [0.2, 0.4, 0.6, 0.8].map(
      (quantile) => values[Math.min(values.length - 1, Math.floor(values.length * quantile))],
    );
  }, [municipalities]);
  const incomeRange = useMemo(() => {
    const values = municipalities.map((municipality) => municipality.income_pc_median_2022);
    return [Math.min(...values), Math.max(...values)];
  }, [municipalities]);
  const maxEmploymentBalance = useMemo(
    () => Math.max(
      ...municipalities.map((municipality) => Math.abs(municipality.formal_employment.balance)), 1,
    ),
    [municipalities],
  );
  const cartogram = useMemo(() => layoutCartogram(features), [features]);

  useEffect(() => {
    if (activeRegion && selected.region !== activeRegion) setActiveRegion(selected.region);
  }, [activeRegion, selected.region]);

  const handleKey = (event: KeyboardEvent<SVGPathElement>, municipality: Municipality) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(municipality);
    }
  };

  return (
    <figure className={`municipality-map-panel map-mode-${mode}`} aria-labelledby={titleId}>
      <div className="map-toolbar">
        <h2 id={titleId}>Mapa do Ceará</h2>
        <p>{modes.find((item) => item.id === mode)?.description}</p>
      </div>

      <div className="map-view-controls">
        <div className="map-mode-switcher" role="group" aria-label="Visualização do mapa">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={mode === item.id}
              onClick={() => setMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {mode === "territory" && (
          <div className="region-zoom-control">
            <label htmlFor={regionSelectId}>Zoom regional</label>
            <select
              id={regionSelectId}
              value={activeRegion}
              onChange={(event) => setActiveRegion(event.target.value)}
            >
              <option value="">Ceará inteiro</option>
              {regions.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="map-canvas">
        <svg
          viewBox={viewBox}
          role="img"
          aria-labelledby={`${titleId} ${descriptionId}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <desc id={descriptionId}>
            Mapa do Ceará dividido em 184 municípios. {modeDescription(mode, selected)} A seleção
            também pode ser alterada pela busca de cidades.
          </desc>
          {features.map((feature) => {
            const isSelected = feature.id === selected.id;
            const incomeIndex = incomeThresholds.filter(
              (threshold) => feature.municipality.income_pc_median_2022 >= threshold,
            ).length;
            const fill = mode === "income" ? incomeColors[incomeIndex] : undefined;
            const contextClass = mode === "employment" || mode === "population" ? " is-context" : "";
            return (
              <path
                key={feature.id}
                d={feature.path}
                className={`map-shape${isSelected ? " is-selected" : ""}${contextClass}`}
                style={fill ? { fill } : undefined}
                fillRule="evenodd"
                role="button"
                tabIndex={0}
                aria-label={`Selecionar ${feature.municipality.name}`}
                onKeyDown={(event) => handleKey(event, feature.municipality)}
                onClick={() => onSelect(feature.municipality)}
              >
                <title>{feature.municipality.name}</title>
              </path>
            );
          })}

          {mode === "employment" && features.map((feature) => {
            const balance = feature.municipality.formal_employment.balance;
            if (balance === 0) return null;
            const radius = 2.5 + 22 * Math.sqrt(Math.abs(balance) / maxEmploymentBalance);
            return (
              <circle
                key={feature.id}
                className={`employment-symbol ${balance < 0 ? "is-negative" : "is-positive"}${
                  feature.id === selected.id ? " is-selected" : ""
                }`}
                cx={feature.centroid[0]}
                cy={feature.centroid[1]}
                r={radius}
                onClick={() => onSelect(feature.municipality)}
              >
                <title>
                  {feature.municipality.name}: {balance >= 0 ? "+" : ""}{number.format(balance)} postos
                </title>
              </circle>
            );
          })}

          {mode === "population" && [...features]
            .sort((left, right) => right.municipality.population_2022 - left.municipality.population_2022)
            .map((feature) => {
              const node = cartogram.get(feature.id);
              if (!node) return null;
              return (
                <circle
                  key={feature.id}
                  className={`population-symbol${feature.id === selected.id ? " is-selected" : ""}`}
                  cx={node.x}
                  cy={node.y}
                  r={node.radius}
                  onClick={() => onSelect(feature.municipality)}
                >
                  <title>
                    {feature.municipality.name}: {number.format(feature.municipality.population_2022)} habitantes
                  </title>
                </circle>
              );
            })}
        </svg>
        <div className="map-click-label" aria-live="polite">
          <span>Município selecionado</span>
          <strong>{selected.name}</strong>
        </div>
      </div>

      <div className="map-footer">
        <div className="map-legend" aria-label="Legenda do mapa">
          {mode === "territory" && (
            <>
              <span><i className="legend-selected" /> {selected.name}</span>
              <span><i className="legend-boundary" /> Outros municípios</span>
              {activeRegion && <span>{activeRegion} · {regionFeatures.length} municípios</span>}
            </>
          )}
          {mode === "employment" && (
            <>
              <span><i className="legend-employment-positive" /> Saldo positivo</span>
              <span><i className="legend-employment-negative" /> Saldo negativo</span>
              <span>Tamanho = magnitude do saldo</span>
            </>
          )}
          {mode === "income" && (
            <div className="income-map-legend">
              <span>{currency.format(incomeRange[0])}</span>
              <i style={{ "--income-gradient": incomeColors.join(", ") } as CSSProperties} />
              <span>{currency.format(incomeRange[1])}</span>
            </div>
          )}
          {mode === "population" && (
            <>
              <span><i className="legend-population-small" /> Menor população</span>
              <span><i className="legend-population-large" /> Maior população</span>
              <span>Área do círculo = população</span>
            </>
          )}
        </div>
        <figcaption>
          {mode === "territory" && "Malha municipal do IBGE · contexto territorial"}
          {mode === "employment" && "Saldo do Novo Caged · setembro de 2026"}
          {mode === "income" && "Renda mediana domiciliar per capita · Censo 2022"}
          {mode === "population" && "Cartograma: posição aproximada; área proporcional à população"}
        </figcaption>
      </div>
    </figure>
  );
}
