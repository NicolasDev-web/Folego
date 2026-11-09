import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CoveragePanel } from "../components/CoveragePanel";
import { MunicipalityMap } from "../components/MunicipalityMap";
import { MunicipalitySearch } from "../components/MunicipalitySearch";
import { useMunicipalGeometry } from "../data/useMunicipalGeometry";
import { useMunicipalities } from "../data/useMunicipalities";

export function CitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const municipalState = useMunicipalities();
  const geometryState = useMunicipalGeometry();
  const selectedSlug = searchParams.get("cidade");
  const selected = useMemo(
    () =>
      municipalState.municipalities.find(
        (municipality) => municipality.slug === selectedSlug,
      ) ?? municipalState.municipalities.find((municipality) => municipality.slug === "fortaleza"),
    [municipalState.municipalities, selectedSlug],
  );

  function selectMunicipality(slug: string) {
    const next = new URLSearchParams(searchParams);
    next.set("cidade", slug);
    setSearchParams(next, { preventScrollReset: true });
  }

  return (
    <main id="conteudo" className="cities-page">
      <header className="page-intro">
        <p className="section-marker">Explorador municipal · 184 municípios</p>
        <h1>O que já podemos dizer sobre sua cidade?</h1>
        <p>
          População, renda domiciliar e emprego formal já estão validados por código IBGE. A dívida
          local continua indisponível até existir uma fonte direta que passe pelo portão metodológico.
        </p>
      </header>

      {municipalState.status === "loading" ? (
        <section className="data-state" aria-live="polite">
          <h2>Carregando a base municipal</h2>
          <p>Conferindo códigos e contexto do IBGE.</p>
        </section>
      ) : null}

      {municipalState.status === "error" ? (
        <section className="data-state data-state-error" role="alert">
          <h2>A base municipal não carregou</h2>
          <p>{municipalState.error}</p>
        </section>
      ) : null}

      {municipalState.status === "ready" && selected ? (
        <section className="municipal-explorer" aria-label="Explorador dos municípios do Ceará">
          <MunicipalitySearch
            municipalities={municipalState.municipalities}
            selectedId={selected.id}
            onSelect={(municipality) => selectMunicipality(municipality.slug)}
          />
          <div className="explorer-body">
            {geometryState.status === "ready" ? (
              <MunicipalityMap
                collection={geometryState.collection}
                municipalities={municipalState.municipalities}
                selected={selected}
                onSelect={(municipality) => selectMunicipality(municipality.slug)}
              />
            ) : (
              <section
                className={
                  geometryState.status === "error"
                    ? "map-state map-state-error"
                    : "map-state"
                }
                aria-live="polite"
              >
                <h2>
                  {geometryState.status === "error"
                    ? "A malha municipal não carregou"
                    : "Carregando o mapa do Ceará"}
                </h2>
                <p>
                  {geometryState.status === "error"
                    ? geometryState.error
                    : "Conferindo as 184 geometrias oficiais do IBGE."}
                </p>
              </section>
            )}
            <CoveragePanel municipality={selected} />
          </div>
        </section>
      ) : null}
    </main>
  );
}

