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
    label: "População residente",
    shortLabel: "População (2022)",
    period: "2022",
    sourceLabel: "Censo Demográfico 2022 · IBGE",
    sourceUrl:
      "https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N6[N3[23]]",
    unit: "pessoas",
    unitLabel: "habitantes",
    universe: "População residente recenseada no município",
    territoryScale: "municipio",
    eligibleForRanking: true,
    getValue: (municipality) => municipality.population_2022,
  },
  income_pc_median_2022: {
    id: "income_pc_median_2022",
    label: "Renda domiciliar per capita mediana",
    shortLabel: "Renda mediana (2022)",
    period: "2022",
    sourceLabel: "Censo Demográfico 2022 · IBGE (SIDRA 10295)",
    sourceUrl: "https://sidra.ibge.gov.br/tabela/10295",
    unit: "BRL",
    unitLabel: "R$ nominais de 2022",
    universe: "Domicílios particulares permanentes no município",
    territoryScale: "municipio",
    eligibleForRanking: true,
    getValue: (municipality) => municipality.income_pc_median_2022,
  },
  income_pc_mean_2022: {
    id: "income_pc_mean_2022",
    label: "Renda domiciliar per capita média",
    shortLabel: "Renda média (2022)",
    period: "2022",
    sourceLabel: "Censo Demográfico 2022 · IBGE (SIDRA 10295)",
    sourceUrl: "https://sidra.ibge.gov.br/tabela/10295",
    unit: "BRL",
    unitLabel: "R$ nominais de 2022",
    universe: "Domicílios particulares permanentes no município",
    territoryScale: "municipio",
    eligibleForRanking: true,
    getValue: (municipality) => municipality.income_pc_mean_2022,
  },
  employment_balance_202609: {
    id: "employment_balance_202609",
    label: "Saldo do emprego formal",
    shortLabel: "Saldo de emprego (set/2026)",
    period: "2026-09",
    sourceLabel: "Novo Caged · MTE",
    sourceUrl:
      "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/novo-caged/2026/setembro/pagina-inicial",
    unit: "vinculos",
    unitLabel: "postos formais no mês",
    universe: "Vínculos celetistas declarados no município em setembro de 2026",
    territoryScale: "municipio",
    eligibleForRanking: true,
    getValue: (municipality) => municipality.formal_employment.balance,
  },
  admission_salary_202609: {
    id: "admission_salary_202609",
    label: "Salário médio nominal de admissão",
    shortLabel: "Salário de admissão (set/2026)",
    period: "2026-09",
    sourceLabel: "Novo Caged · MTE (microdados de movimentação)",
    sourceUrl:
      "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/novo-caged/2026/setembro/pagina-inicial",
    unit: "BRL",
    unitLabel: "R$ nominais de set/2026",
    universe: "Admissões formais com salário positivo válido no mês",
    territoryScale: "municipio",
    eligibleForRanking: true,
    getValue: (municipality) => municipality.formal_employment.average_admission_salary,
  },
  divida_municipal_direta: {
    id: "divida_municipal_direta",
    label: "Dívida e inadimplência municipal direta",
    shortLabel: "Dívida municipal (inelegível)",
    period: "Não disponível",
    sourceLabel: "BCB · SCR.data (restrito à escala estadual)",
    sourceUrl: "https://dadosabertos.bcb.gov.br/",
    unit: "indisponivel",
    unitLabel: "Indisponível na escala municipal",
    universe: "Sistema de Informações de Créditos (SCR) — publicado apenas por UF e sub-região BCB",
    territoryScale: "uf_indisponivel_no_municipio",
    eligibleForRanking: false,
    ineligibilityReason:
      "Nenhuma fonte pública direta passou pelos seis critérios de viabilidade na escala municipal. O SCR.data é divulgado apenas por UF e os códigos sub-regionais 60–63 do Banco Central não possuem tabela oficial de correspondência com os 184 municípios do IBGE.",
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
      text: "Indisponível na escala municipal",
      status: "indisponivel",
    };
  }

  if (value === null) {
    return {
      text: "Sem observação no período (null)",
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
      ? `Mesmo período (${metric.period}), mesma unidade (${metric.unitLabel}) e mesmo universo (${metric.universe}).`
      : metric.ineligibilityReason ?? "Indicador indisponível para comparação municipal.";

    const cells: ComparisonCell[] = selectedMunicipalities.map((municipality) => {
      const value = metric.getValue(municipality);
      const formattedObj = formatMunicipalMetricValue(metric.id, value);
      let detailNote: string | undefined;

      if (metric.id === "employment_balance_202609") {
        detailNote = `${integerFormatter.format(municipality.formal_employment.admissions)} admissões · ${integerFormatter.format(municipality.formal_employment.dismissals)} desligamentos`;
      } else if (metric.id === "admission_salary_202609") {
        detailNote =
          value === null
            ? "0 admissões com salário positivo informado em set/2026"
            : `${integerFormatter.format(municipality.formal_employment.salary_observations)} admissões com salário válido`;
      } else if (metric.id === "divida_municipal_direta") {
        detailNote = "Escala municipal sem fonte direta validada";
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
      "Este indicador não possui cobertura municipal observada para ordenação.";
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
        reason: "Sem observação válida no período (valor nulo na fonte oficial; nunca convertido em zero).",
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
