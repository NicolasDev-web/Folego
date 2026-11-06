import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CoveragePanel } from "../components/CoveragePanel";
import { MunicipalitySearch } from "../components/MunicipalitySearch";
import { municipalities } from "../data/municipalities";

export function CitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("cidade") ?? municipalities[0].id;
  const selected = useMemo(
    () => municipalities.find((municipality) => municipality.id === selectedId) ?? municipalities[0],
    [selectedId],
  );

  return (
    <main id="conteudo" className="cities-page">
      <header className="page-intro">
        <p className="section-marker">Explorador municipal · protótipo</p>
        <h1>O que já podemos dizer sobre sua cidade?</h1>
        <p>
          Por enquanto, mostramos a cobertura com honestidade. Os dados de contexto entrarão
          depois da validação das fontes e das geometrias oficiais.
        </p>
      </header>

      <div className="city-workspace">
        <MunicipalitySearch
          selectedId={selected.id}
          onSelect={(municipality) => {
            const next = new URLSearchParams(searchParams);
            next.set("cidade", municipality.id);
            setSearchParams(next);
          }}
        />
        <CoveragePanel municipality={selected} />
      </div>
    </main>
  );
}

