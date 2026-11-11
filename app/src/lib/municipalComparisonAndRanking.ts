import type { Municipality } from "../data/municipalities";

export const MAX_COMPARISON_CITIES = 3;

export const PILOT_CITY_SLUGS = [
  "fortaleza",
  "caucaia",
  "maracanau",
  "sobral",
  "juazeiro-do-norte",
  "crato",
  "iguatu",
  "quixada",
] as const;

export type MunicipalMetricId =
  | "population_2022"
  | "income_pc_median_2022"
  | "income_pc_mean_2022"
  | "employment_balance_202609"
  | "admission_salary_202609"
  | "divida_municipal_direta";

export type RankingDirection = "desc" | "asc";

export type MunicipalMetricDefinition = {
  id: MunicipalMetricId;
  label: string;
  shortLabel: string;
  period: string;
  sourceLabel: string;
  sourceUrl: string;
  unit: "pessoas" | "BRL" | "vinculos" | "indisponivel";
  unitLabel: string;
  universe: string;
  territoryScale: "municipio" | "uf_indisponivel_no_municipio";
  eligibleForRanking: boolean;
  ineligibilityReason?: string;
  getValue: (municipality: Municipality) => number | null;
};

export const MUNICIPAL_METRICS: Record<MunicipalMetricId, MunicipalMetricDefinition> = {
  population_2022: {
    id: "population_2022",
    label: "Número de habitantes",
    shortLabel: "Habitantes (2022)",
    period: "2022",
    sourceLabel: "Censo Demográfico 2022 · IBGE",
    sourceUrl:
      "https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N6[N3[23]]",
    unit: "pessoas",
    unitLabel: "habitantes",
    universe: "Pessoas que moravam na cidade em 2022",
    territoryScale: "municipio",
    eligibleForRanking: true,
    getValue: (municipality) => municipality.population_2022,
  },
  income_pc_median_2022: {
    id: "income_pc_median_2022",
    label: "Renda mensal por pessoa (mediana)",
    shortLabel: "Renda por pessoa, valor do meio (2022)",
    period: "2022",
    sourceLabel: "Censo Demográfico 2022 · IBGE (SIDRA 10295)",
    sourceUrl: "https://sidra.ibge.gov.br/tabela/10295",
    unit: "BRL",
    unitLabel: "R$ por mês em valores de 2022",
    universe: "Moradores de domicílios particulares permanentes",
    territoryScale: "municipio",
    eligibleForRanking: true,
    getValue: (municipality) => municipality.income_pc_median_2022,
  },
  income_pc_mean_2022: {
    id: "income_pc_mean_2022",
    label: "Renda média mensal por pessoa",
    shortLabel: "Renda média por pessoa (2022)",
    period: "2022",
    sourceLabel: "Censo Demográfico 2022 · IBGE (SIDRA 10295)",
    sourceUrl: "https://sidra.ibge.gov.br/tabela/10295",
    unit: "BRL",
    unitLabel: "R$ por mês em valores de 2022",
    universe: "Moradores de domicílios particulares permanentes",
    territoryScale: "municipio",
    eligibleForRanking: true,
    getValue: (municipality) => municipality.income_pc_mean_2022,
  },
  employment_balance_202609: {
    id: "employment_balance_202609",
    label: "Postos de trabalho ganhos ou perdidos",
    shortLabel: "Postos ganhos ou perdidos (set/2026)",
    period: "2026-09",
    sourceLabel: "Novo Caged · MTE",
    sourceUrl:
      "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/novo-caged/2026/setembro/pagina-inicial",
    unit: "vinculos",
    unitLabel: "postos formais no mês",
    universe: "Contratações menos desligamentos de empregos com carteira assinada",
    territoryScale: "municipio",
    eligibleForRanking: true,
    getValue: (municipality) => municipality.formal_employment.balance,
  },
  admission_salary_202609: {
    id: "admission_salary_202609",
    label: "Salário médio de quem foi contratado",
    shortLabel: "Salário inicial médio (set/2026)",
    period: "2026-09",
    sourceLabel: "Novo Caged · Ministério do Trabalho",
    sourceUrl:
      "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/novo-caged/2026/setembro/pagina-inicial",
    unit: "BRL",
    unitLabel: "R$ por mês em setembro de 2026",
    universe: "Admissões com salário mensalizado entre 0,3 e 150 salários mínimos, sem vínculos intermitentes",
    territoryScale: "municipio",
    eligibleForRanking: true,
    getValue: (municipality) => municipality.formal_employment.average_admission_salary,
  },
  divida_municipal_direta: {
    id: "divida_municipal_direta",
    label: "Endividamento dos moradores",
    shortLabel: "Endividamento dos moradores",
    period: "Não disponível",
    sourceLabel: "Banco Central · SCR.data",
    sourceUrl: "https://dadosabertos.bcb.gov.br/dataset/scr_data",
    unit: "indisponivel",
    unitLabel: "Sem dado por cidade",
    universe: "Dados de crédito do Banco Central para estados e regiões por CEP",
    territoryScale: "uf_indisponivel_no_municipio",
    eligibleForRanking: false,
    ineligibilityReason:
      "O SCR.data do Banco Central mostra o crédito por estado. Ainda não temos uma fonte que informe a dívida dos moradores de cada cidade.",
    getValue: () => null,
  },
};

export const MUNICIPAL_METRIC_LIST: MunicipalMetricDefinition[] = [
  MUNICIPAL_METRICS.population_2022,
  MUNICIPAL_METRICS.income_pc_median_2022,
  MUNICIPAL_METRICS.income_pc_mean_2022,
  MUNICIPAL_METRICS.employment_balance_202609,
  MUNICIPAL_METRICS.admission_salary_202609,
  MUNICIPAL_METRICS.divida_municipal_direta,
];

const integerFormatter = new Intl.NumberFormat("pt-BR");
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const roundedCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMunicipalMetricValue(
  metricId: MunicipalMetricId,
  value: number | null,
): { text: string; status: "observado" | "indisponivel" | "sem_observacao" } {
  if (metricId === "divida_municipal_direta") {
    return {
      text: "Sem dado por cidade",
      status: "indisponivel",
    };
  }

  if (value === null) {
    return {
      text: "Sem dado no período",
      status: "sem_observacao",
    };
  }

  if (metricId === "population_2022") {
    return {
      text: `${integerFormatter.format(value)} hab.`,
      status: "observado",
    };
  }

  if (metricId === "employment_balance_202609") {
    const sign = value > 0 ? "+" : "";
    return {
      text: `${sign}${integerFormatter.format(value)} postos`,
      status: "observado",
    };
  }

  if (metricId === "admission_salary_202609") {
    return {
      text: currencyFormatter.format(value),
      status: "observado",
    };
  }

  return {
    text: roundedCurrencyFormatter.format(value),
    status: "observado",
  };
}

export function normalizeComparisonSlugs(
  primarySlug: string,
  extraSlugs: string[],
  validSlugs: Set<string>,
): string[] {
  const result: string[] = [];
  if (validSlugs.has(primarySlug)) {
    result.push(primarySlug);
  }
  for (const raw of extraSlugs) {
    const slug = raw.trim().toLowerCase();
    if (!slug || !validSlugs.has(slug) || result.includes(slug)) {
      continue;
    }
    if (result.length >= MAX_COMPARISON_CITIES) {
      break;
    }
    result.push(slug);
  }
  return result;
}

export type ComparisonCell = {
  municipalitySlug: string;
  municipalityName: string;
  value: number | null;
  formatted: string;
  status: "observado" | "indisponivel" | "sem_observacao";
  detailNote?: string;
};

export type ComparisonRow = {
  metric: MunicipalMetricDefinition;
  compatible: boolean;
  compatibilityNote: string;
  cells: ComparisonCell[];
};

export type MunicipalComparisonModel = {
  selectedMunicipalities: Municipality[];
  canAddMore: boolean;
  maxCities: number;
  rows: ComparisonRow[];
};

export function buildMunicipalComparison(
  municipalities: Municipality[],
  selectedSlugs: string[],
): MunicipalComparisonModel {
  const bySlug = new Map(municipalities.map((m) => [m.slug, m]));
  const validSlugs = new Set(bySlug.keys());
  const primarySlug = selectedSlugs[0] ?? "fortaleza";
  const normalizedSlugs = normalizeComparisonSlugs(
    primarySlug,
    selectedSlugs.slice(1),
    validSlugs,
  );
  const selectedMunicipalities = normalizedSlugs
    .map((slug) => bySlug.get(slug))
    .filter((item): item is Municipality => Boolean(item));

  const rows: ComparisonRow[] = MUNICIPAL_METRIC_LIST.map((metric) => {
    const compatible = metric.eligibleForRanking;
    const compatibilityNote = compatible
      ? `${metric.universe}. Unidade: ${metric.unitLabel}.`
      : metric.ineligibilityReason ?? "Indicador indisponível para comparação municipal.";

    const cells: ComparisonCell[] = selectedMunicipalities.map((municipality) => {
      const value = metric.getValue(municipality);
      const formattedObj = formatMunicipalMetricValue(metric.id, value);
      let detailNote: string | undefined;

      if (metric.id === "employment_balance_202609") {
        detailNote = `${integerFormatter.format(municipality.formal_employment.admissions)} contratações · ${integerFormatter.format(municipality.formal_employment.dismissals)} desligamentos`;
      } else if (metric.id === "admission_salary_202609") {
        detailNote =
          value === null
            ? "Nenhum salário entrou no cálculo em setembro de 2026"
            : `${integerFormatter.format(municipality.formal_employment.salary_observations)} salários usados no cálculo${municipality.formal_employment.salary_observations < 5 ? " · com poucos salários, a média pode variar muito" : ""}`;
      } else if (metric.id === "divida_municipal_direta") {
        detailNote = "Sem dados de endividamento por cidade";
      }

      return {
        municipalitySlug: municipality.slug,
        municipalityName: municipality.name,
        value,
        formatted: formattedObj.text,
        status: formattedObj.status,
        detailNote,
      };
    });

    return {
      metric,
      compatible,
      compatibilityNote,
      cells,
    };
  });

  return {
    selectedMunicipalities,
    canAddMore: selectedMunicipalities.length < MAX_COMPARISON_CITIES,
    maxCities: MAX_COMPARISON_CITIES,
    rows,
  };
}

export type RankedMunicipalityEntry = {
  rank: number;
  tied: boolean;
  municipality: Municipality;
  value: number;
  formattedValue: string;
};

export type ExcludedMunicipalityEntry = {
  municipality: Municipality;
  reason: string;
};

export type MunicipalRankingResult =
  | {
      eligible: false;
      metric: MunicipalMetricDefinition;
      direction: RankingDirection;
      reason: string;
      totalMunicipalities: number;
      includedCount: 0;
      excludedCount: number;
      entries: [];
      excludedMunicipalities: ExcludedMunicipalityEntry[];
    }
  | {
      eligible: true;
      metric: MunicipalMetricDefinition;
      direction: RankingDirection;
      totalMunicipalities: number;
      includedCount: number;
      excludedCount: number;
      tiedMunicipalitiesCount: number;
      entries: RankedMunicipalityEntry[];
      excludedMunicipalities: ExcludedMunicipalityEntry[];
    };

export function rankMunicipalities(
  municipalities: Municipality[],
  metricId: MunicipalMetricId,
  direction: RankingDirection = "desc",
): MunicipalRankingResult {
  const metric = MUNICIPAL_METRICS[metricId];

  if (!metric.eligibleForRanking) {
    const reason =
      metric.ineligibilityReason ??
      "A lista precisa de dados por cidade para mostrar posições.";
    return {
      eligible: false,
      metric,
      direction,
      reason,
      totalMunicipalities: municipalities.length,
      includedCount: 0,
      excludedCount: municipalities.length,
      entries: [],
      excludedMunicipalities: municipalities.map((municipality) => ({
        municipality,
        reason,
      })),
    };
  }

  const validItems: Array<{ municipality: Municipality; value: number }> = [];
  const excludedMunicipalities: ExcludedMunicipalityEntry[] = [];

  for (const municipality of municipalities) {
    const rawValue = metric.getValue(municipality);
    if (rawValue === null || Number.isNaN(rawValue)) {
      excludedMunicipalities.push({
        municipality,
        reason: "A fonte não informa um valor para a cidade nesse período.",
      });
    } else {
      validItems.push({ municipality, value: rawValue });
    }
  }

  excludedMunicipalities.sort((left, right) =>
    left.municipality.name.localeCompare(right.municipality.name, "pt-BR"),
  );

  validItems.sort((left, right) => {
    const diff =
      direction === "desc" ? right.value - left.value : left.value - right.value;
    if (diff !== 0) {
      return diff;
    }
    return left.municipality.name.localeCompare(right.municipality.name, "pt-BR");
  });

  const valueFrequency = new Map<number, number>();
  for (const item of validItems) {
    valueFrequency.set(item.value, (valueFrequency.get(item.value) ?? 0) + 1);
  }

  let currentRank = 1;
  const entries: RankedMunicipalityEntry[] = validItems.map((item, index) => {
    if (index > 0 && item.value !== validItems[index - 1].value) {
      currentRank = index + 1;
    }
    const tied = (valueFrequency.get(item.value) ?? 0) > 1;
    const formatted = formatMunicipalMetricValue(metric.id, item.value).text;
    return {
      rank: currentRank,
      tied,
      municipality: item.municipality,
      value: item.value,
      formattedValue: formatted,
    };
  });

  const tiedMunicipalitiesCount = entries.filter((entry) => entry.tied).length;

  return {
    eligible: true,
    metric,
    direction,
    totalMunicipalities: municipalities.length,
    includedCount: entries.length,
    excludedCount: excludedMunicipalities.length,
    tiedMunicipalitiesCount,
    entries,
    excludedMunicipalities,
  };
}
