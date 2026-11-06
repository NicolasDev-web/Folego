import { useId, useMemo, useState } from "react";
import { municipalities, type Municipality } from "../data/municipalities";

type MunicipalitySearchProps = {
  selectedId?: string;
  onSelect: (municipality: Municipality) => void;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function MunicipalitySearch({ selectedId, onSelect }: MunicipalitySearchProps) {
  const [query, setQuery] = useState("");
  const inputId = useId();

  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    if (!normalizedQuery) return municipalities;
    return municipalities.filter((municipality) =>
      normalize(municipality.name).includes(normalizedQuery),
    );
  }, [query]);

  return (
    <section className="search-panel" aria-labelledby={`${inputId}-title`}>
      <div className="search-intro">
        <p className="section-marker">Piloto de navegação</p>
        <h2 id={`${inputId}-title`}>Encontre uma cidade</h2>
        <p>
          A lista testa busca, seleção e cobertura. Ela ainda não é a base completa dos 184
          municípios.
        </p>
      </div>

      <label htmlFor={inputId}>Buscar por nome</label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ex.: Sobral"
        autoComplete="off"
      />

      <p className="search-count" role="status">
        {filtered.length} {filtered.length === 1 ? "cidade encontrada" : "cidades encontradas"}
      </p>
      <ul className="municipality-list">
        {filtered.map((municipality) => (
          <li key={municipality.id}>
            <button
              type="button"
              className={selectedId === municipality.id ? "is-selected" : undefined}
              onClick={() => onSelect(municipality)}
              aria-pressed={selectedId === municipality.id}
            >
              <span>{municipality.name}</span>
              <small>{municipality.region}</small>
            </button>
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? (
        <p className="empty-search">Esta cidade não está no piloto. Tente outro nome.</p>
      ) : null}
    </section>
  );
}

