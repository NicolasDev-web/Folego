import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CoveragePanel } from "../components/CoveragePanel";
import { MunicipalComparisonSection } from "../components/MunicipalComparisonSection";
import { MunicipalityMap } from "../components/MunicipalityMap";
import { MunicipalitySearch } from "../components/MunicipalitySearch";
import { MunicipalRankingSection } from "../components/MunicipalRankingSection";
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
      ) ??
      municipalState.municipalities.find(
        (municipality) => municipality.slug === "fortaleza",
      ),
    [municipalState.municipalities, selectedSlug],
  );

  const comparisonSlugs = useMemo(() => {
    const rawParam = searchParams.get("comparar");
    if (rawParam === "none") {
      return [];
    }
    if (rawParam !== null) {
      return rawParam
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
    }
    const primarySlug = selected?.slug ?? "fortaleza";
    const defaults = ["fortaleza", "caucaia", "sobral"].filter(
      (slug) => slug !== primarySlug,
    );
    return defaults.slice(0, 2);
  }, [searchParams, selected?.slug]);

  function selectMunicipality(slug: string) {
    const next = new URLSearchParams(searchParams);
    next.set("cidade", slug);
    setSearchParams(next, { preventScrollReset: true });
  }

  function updateComparisonSlugs(nextSlugs: string[]) {
    const next = new URLSearchParams(searchParams);
    if (nextSlugs.length === 0) {
      next.set("comparar", "none");
    } else {
      next.set("comparar", nextSlugs.join(","));
    }
    setSearchParams(next, { preventScrollReset: true });
  }

  return (
    <main id="conteudo" className="cities-page">
      <header className="page-intro">
        <p className="section-marker">184 cidades do Ceará</p>
        <h1>Conheça sua cidade</h1>
        <p>
          Busque uma cidade ou escolha no mapa para ver quantas pessoas moram lá, a renda por pessoa e como mudou o emprego com carteira assinada.
        </p>
      </header>

      {municipalState.status === "loading" ? (
        <section className="data-state" aria-live="polite">
          <h2>Carregando as cidades</h2>
        </section>
      ) : null}

      {municipalState.status === "error" ? (
        <section className="data-state data-state-error" role="alert">
          <h2>Os dados das cidades não carregaram</h2>
          <p>Atualize a página para tentar de novo.</p>
        </section>
      ) : null}

      {municipalState.status === "ready" && selected ? (
        <>
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
                      ? "O mapa não carregou"
                      : "Carregando o mapa do Ceará"}
                  </h2>
                  <p>
                    {geometryState.status === "error"
                      ? "Você pode escolher uma cidade pela busca."
                      : "Em instantes, você poderá escolher uma cidade no mapa."}
                  </p>
                </section>
              )}
              <CoveragePanel municipality={selected} />
            </div>
          </section>

          <MunicipalComparisonSection
            municipalities={municipalState.municipalities}
            selected={selected}
            comparisonSlugs={comparisonSlugs}
            onUpdateComparison={updateComparisonSlugs}
            onSelectPrimary={selectMunicipality}
          />

          <MunicipalRankingSection
            municipalities={municipalState.municipalities}
            selected={selected}
            onSelectMunicipality={selectMunicipality}
          />
        </>
      ) : null}
    </main>
  );
}
