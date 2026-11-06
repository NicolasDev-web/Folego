import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CoveragePanel } from "../components/CoveragePanel";
import { MunicipalitySearch } from "../components/MunicipalitySearch";
import { useMunicipalities } from "../data/useMunicipalities";

export function CitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const municipalState = useMunicipalities();
  const selectedSlug = searchParams.get("cidade");
  const selected = useMemo(
    () =>
      municipalState.municipalities.find(
        (municipality) => municipality.slug === selectedSlug,
      ) ?? municipalState.municipalities[0],
    [municipalState.municipalities, selectedSlug],
  );

  return (
    <main id="conteudo" className="cities-page">
      <header className="page-intro">
        <p className="section-marker">Explorador municipal · protótipo</p>
        <h1>O que já podemos dizer sobre sua cidade?</h1>
        <p>
          A população do Censo 2022 já está validada por código IBGE. A dívida local continua
          indisponível até existir uma fonte direta que passe pelo portão metodológico.
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
        <div className="city-workspace">
          <MunicipalitySearch
            municipalities={municipalState.municipalities}
            selectedId={selected.id}
            onSelect={(municipality) => {
              const next = new URLSearchParams(searchParams);
              next.set("cidade", municipality.slug);
              setSearchParams(next);
            }}
          />
          <CoveragePanel municipality={selected} />
        </div>
      ) : null}
    </main>
  );
}

