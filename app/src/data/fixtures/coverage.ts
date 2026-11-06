import type { Observation } from "../../types/observation";

export function municipalDebtCoverage(territoryId: string): Observation {
  return {
    source_id: "matriz-viabilidade-municipal",
    metric_id: "divida-municipal-direta",
    territory_id: territoryId,
    territory_level: "municipio",
    period: "2026-11",
    unit: "sem unidade",
    value: null,
    status: "indisponivel",
    universe: "pessoas físicas e famílias",
    methodology_version: "sdd-v1",
    source_url:
      "https://github.com/NicolasDev-web/Folego/blob/main/02_fontes/VIABILIDADE_MUNICIPAL.md",
    notes: [
      "Fixture de cobertura: não representa um resultado estatístico.",
      "A taxa municipal depende de fonte direta validada na fase de viabilidade.",
    ],
  };
}

