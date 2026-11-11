import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Municipality } from "../data/municipalities";

type MunicipalitySearchProps = {
  municipalities: Municipality[];
  selectedId?: string;
  onSelect: (municipality: Municipality) => void;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function MunicipalitySearch({
  municipalities,
  selectedId,
  onSelect,
}: MunicipalitySearchProps) {
  const selected = municipalities.find((municipality) => municipality.id === selectedId);
  const [query, setQuery] = useState(selected?.name ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) setQuery(selected.name);
  }, [selected]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const suggestions = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    const matches = normalizedQuery
      ? municipalities.filter((municipality) =>
          normalize(municipality.name).includes(normalizedQuery),
        )
      : municipalities;
    return matches.slice(0, 8);
  }, [municipalities, query]);

  function choose(municipality: Municipality) {
    setQuery(municipality.name);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(municipality);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const activeSuggestion = suggestions[activeIndex >= 0 ? activeIndex : 0];
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && isOpen && activeSuggestion) {
      event.preventDefault();
      choose(activeSuggestion);
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setQuery(selected?.name ?? "");
    }
  }

  return (
    <div className="municipality-searchbar" ref={rootRef}>
      <div className="search-field">
        <label htmlFor={inputId}>Buscar cidade</label>
        <div className="search-input-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            id={inputId}
            type="search"
            role="combobox"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
              setIsOpen(true);
            }}
            onFocus={(event) => {
              event.currentTarget.select();
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Digite o nome da cidade"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-activedescendant={
              isOpen && activeIndex >= 0 && suggestions[activeIndex]
                ? `${listId}-${suggestions[activeIndex].id}`
                : undefined
            }
          />
        </div>
        {isOpen ? (
          <ul id={listId} className="search-suggestions" role="listbox">
            {suggestions.map((municipality, index) => (
              <li
                key={municipality.id}
                role="presentation"
              >
                <button
                  id={`${listId}-${municipality.id}`}
                  type="button"
                  role="option"
                  aria-selected={municipality.id === selectedId}
                  className={index === activeIndex ? "is-active" : undefined}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(municipality)}
                >
                  <span>{municipality.name}</span>
                  <small>{municipality.region}</small>
                </button>
              </li>
            ))}
            {suggestions.length === 0 ? (
              <li className="empty-suggestion">Nenhuma cidade encontrada. Tente outro nome.</li>
            ) : null}
          </ul>
        ) : null}
      </div>
      <p><strong>184</strong> municípios disponíveis</p>
    </div>
  );
}

