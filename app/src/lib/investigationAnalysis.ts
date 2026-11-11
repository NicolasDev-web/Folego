import type {
  ContractObservation,
  CreditProfilesFile,
  LaborAndSurveysFile,
  ModalitySlice,
  PorteSlice,
  ScrSliceMetrics,
  StateMacroSeriesFile,
  SurveyPoint,
  TerritoryMacroCode,
} from "../data/investigation";

export type ValueMode = "real" | "nominal";
export const CREDIT_REFERENCE_PERIOD = "2026-09";

const PORTE_ORDER = [
  "Sem rendimento",
  "Até 1 salário mínimo",
  "Mais de 1 a 2 salários mínimos",
  "Mais de 2 a 3 salários mínimos",
  "Mais de 3 a 5 salários mínimos",
  "Mais de 5 a 10 salários mínimos",
  "Mais de 10 a 20 salários mínimos",
  "Acima de 20 salários mínimos",
  "Indisponível",
];

function normalizePorteKey(label: string): number {
  const clean = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (clean.includes("sem rendimento")) return 0;
  if (clean.includes("ate 1 ")) return 1;
  if (clean.includes("1 a 2")) return 2;
  if (clean.includes("2 a 3")) return 3;
  if (clean.includes("3 a 5")) return 4;
  if (clean.includes("5 a 10")) return 5;
  if (clean.includes("10 a 20")) return 6;
  if (clean.includes("acima de 20")) return 7;
  return 8;
}

export type MacroTerritorySnapshot = {
  territoryId: TerritoryMacroCode;
  territoryName: string;
  territoryScope: string;
  period: string;
  carteiraAtivaBrl: number;
  carteiraInadimplidaBrl: number;
  vencido15a90Brl: number;
  inad90Pct: number | null;
  vencido15Pct: number | null;
  ativoProblematicoPct: number | null;
  saldoOperacaoBrl: number | null;
  operacoesVisiveis: number;
  linhasSuprimidas: number;
  ceSharePct: number | null;
  methodologyVersion: string;
};

export function buildMacroPanoramaComparison(
  macroFile: StateMacroSeriesFile,
  period = CREDIT_REFERENCE_PERIOD,
  valueMode: ValueMode = "real",
): {
  period: string;
  valueMode: ValueMode;
  referenceIpcaPeriod: string;
  territories: MacroTerritorySnapshot[];
  ceShareOfNePct: number;
  ceShareOfBrPct: number;
  nationalIncomeCommitment: {
    period: string;
    valuePct: number | null;
  };
} {
  const meta: Record<TerritoryMacroCode, { name: string; scope: string }> = {
    CE: { name: "Ceará", scope: "Unidade da Federação (UF)" },
    NE: { name: "Nordeste", scope: "Região (9 UFs)" },
    BR: { name: "Brasil", scope: "Nacional (27 UFs)" },
  };

  const findPoint = (t: TerritoryMacroCode): ScrSliceMetrics => {
    const list = macroFile.series[t].PF;
    const point = list.find((item) => item.period === period);
    if (!point) throw new Error(`Crédito PF indisponível para ${t} em ${period}.`);
    return point;
  };

  const cePoint = findPoint("CE");
  const nePoint = findPoint("NE");
  const brPoint = findPoint("BR");

  const getCarteira = (p: ScrSliceMetrics) =>
    valueMode === "real" ? p.carteira_ativa_real_brl : p.carteira_ativa_brl;
  const getSaldoOp = (p: ScrSliceMetrics) =>
    valueMode === "real" ? p.saldo_operacao_real_brl : p.saldo_operacao_brl;

  const ceCarteira = getCarteira(cePoint);
  const neCarteira = getCarteira(nePoint);
  const brCarteira = getCarteira(brPoint);

  const ceShareOfNePct = Number(((ceCarteira / neCarteira) * 100).toFixed(2));
  const ceShareOfBrPct = Number(((ceCarteira / brCarteira) * 100).toFixed(2));

  const territories: MacroTerritorySnapshot[] = (["CE", "NE", "BR"] as const).map(
    (tId) => {
      const p = findPoint(tId);
      const cart = getCarteira(p);
      return {
        territoryId: tId,
        territoryName: meta[tId].name,
        territoryScope: meta[tId].scope,
        period: p.period,
        carteiraAtivaBrl: cart,
        carteiraInadimplidaBrl: p.carteira_inadimplida_brl,
        vencido15a90Brl: p.vencido_15_90_brl,
        inad90Pct: p.inad90_pct,
        vencido15Pct: p.vencido15_pct,
        ativoProblematicoPct: p.ativo_problematico_pct,
        saldoOperacaoBrl: getSaldoOp(p),
        operacoesVisiveis: p.operacoes_visiveis,
        linhasSuprimidas: p.linhas_op_suprimidas,
        ceSharePct:
          tId === "CE"
            ? 100
            : tId === "NE"
              ? ceShareOfNePct
              : ceShareOfBrPct,
        methodologyVersion: p.methodology_version,
      };
    },
  );

  const compEntries = Object.entries(macroFile.comprometimento_renda_pf_br).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  const lastComp = compEntries.at(-1);

  return {
    period: cePoint.period,
    valueMode,
    referenceIpcaPeriod: macroFile.reference_ipca_period,
    territories,
    ceShareOfNePct,
    ceShareOfBrPct,
    nationalIncomeCommitment: {
      period: lastComp?.[0] ?? "Não disponível",
      valuePct: lastComp?.[1] ?? null,
    },
  };
}

export type ModalityShiftRow = {
  modalidade: string;
  current: ModalitySlice;
  baseline2019: ModalitySlice | null;
  shareDeltaPp: number | null;
  realGrowthPct: number | null;
};

export function buildModalitiesComparison(
  profilesFile: CreditProfilesFile,
  territoryId: TerritoryMacroCode = "CE",
  period = "2026-09",
): ModalityShiftRow[] {
  const currentProfile = profilesFile.profiles_by_period[period];
  const baseProfile = profilesFile.profiles_by_period["2019-12"];

  const currentList = currentProfile?.modalidades[territoryId]?.PF ?? [];
  const baseList = baseProfile?.modalidades[territoryId]?.PF ?? [];
  const baseByMod = new Map(baseList.map((item) => [item.modalidade, item]));

  return [...currentList]
    .sort((a, b) => b.carteira_ativa_brl - a.carteira_ativa_brl)
    .map((curr) => {
      const base = baseByMod.get(curr.modalidade) ?? null;
      const shareDeltaPp =
        base && curr.participacao_pct !== null && base.participacao_pct !== null
          ? Number((curr.participacao_pct - base.participacao_pct).toFixed(2))
          : null;
      const realGrowthPct =
        base && base.carteira_ativa_real_brl > 0
          ? Number(
              (
                ((curr.carteira_ativa_real_brl - base.carteira_ativa_real_brl) /
                  base.carteira_ativa_real_brl) *
                100
              ).toFixed(1),
            )
          : null;
      return {
        modalidade: curr.modalidade,
        current: curr,
        baseline2019: base,
        shareDeltaPp,
        realGrowthPct,
      };
    });
}

export function buildIncomeBracketProfile(
  profilesFile: CreditProfilesFile,
  territoryId: TerritoryMacroCode = "CE",
  period = "2026-09",
): {
  period: string;
  territoryId: TerritoryMacroCode;
  brackets: PorteSlice[];
  orderedCanonicalLabels: string[];
  methodologyWarning: string;
} {
  const currentProfile = profilesFile.profiles_by_period[period];
  const rawBrackets = currentProfile?.porte_pf[territoryId] ?? [];

  const brackets = [...rawBrackets].sort(
    (a, b) => normalizePorteKey(a.porte) - normalizePorteKey(b.porte),
  );

  return {
    period,
    territoryId,
    brackets,
    orderedCanonicalLabels: PORTE_ORDER,
    methodologyWarning:
      "As faixas de porte no SCR.data são expressas em múltiplos do salário mínimo nominal vigente em cada data-base. Variações ao longo do tempo refletem simultaneamente mudanças de composição, reajustes do salário mínimo e evolução real das operações.",
  };
}

export function splitSeriesAround2025Break(series: ScrSliceMetrics[]): {
  allPoints: ScrSliceMetrics[];
  pre2025Points: ScrSliceMetrics[];
  pos2025Points: ScrSliceMetrics[];
  breakPeriod: string;
} {
  const sorted = [...series].sort((a, b) => a.period.localeCompare(b.period));
  const pre2025Points = sorted.filter(
    (item) => item.methodology_version === "sdd-scr-v2-pre2025" || item.period < "2025-01",
  );
  const pos2025Points = sorted.filter(
    (item) => item.methodology_version === "sdd-scr-v2-pos2025" && item.period >= "2025-01",
  );

  return {
    allPoints: sorted,
    pre2025Points,
    pos2025Points,
    breakPeriod: "2025-01",
  };
}

export function buildSurveyComparisonRows(
  laborFile: LaborAndSurveysFile,
): {
  peicPoints: SurveyPoint[];
  ipdcPoints: SurveyPoint[];
  missingIpdcPeriods: string[];
} {
  const peicPoints: SurveyPoint[] = Object.entries(laborFile.surveys.peic_nacional_br)
    .map(([period, item]) => ({
      ...item,
      period,
      status:
        item.familias_endividadas_pct === null
          ? ("indisponivel" as const)
          : ("observado" as const),
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
  const ipdcPoints: SurveyPoint[] = Object.entries(
    laborFile.surveys.ipdc_fortaleza_capital,
  )
    .map(([period, item]) => ({
      ...item,
      period,
      status:
        item.familias_endividadas_pct === null
          ? ("indisponivel" as const)
          : ("observado" as const),
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
  const missingIpdcPeriods = ipdcPoints
    .filter(
      (item) =>
        item.status === "indisponivel" || item.familias_endividadas_pct === null,
    )
    .map((item) => item.period);

  return {
    peicPoints,
    ipdcPoints,
    missingIpdcPeriods,
  };
}

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function observationsToCsv(observations: ContractObservation[]): string {
  const headers = [
    "indicator_id",
    "metric_id",
    "territory_id",
    "territory_name",
    "territory_level",
    "period",
    "value",
    "unit",
    "status",
    "source_id",
    "source_url",
    "universe",
    "aggregation_rule",
    "methodology_version",
    "comparable_with",
    "note",
  ];

  const lines = [
    headers.join(","),
    ...observations.map((obs) =>
      [
        escapeCsvCell(obs.indicator_id),
        escapeCsvCell(obs.metric_id),
        escapeCsvCell(obs.territory_id),
        escapeCsvCell(obs.territory_name),
        escapeCsvCell(obs.territory_level),
        escapeCsvCell(obs.period),
        obs.value === null ? "null" : escapeCsvCell(obs.value),
        escapeCsvCell(obs.unit),
        escapeCsvCell(obs.status),
        escapeCsvCell(obs.source_id),
        escapeCsvCell(obs.source_url),
        escapeCsvCell(obs.universe),
        escapeCsvCell(obs.aggregation_rule),
        escapeCsvCell(obs.methodology_version),
        escapeCsvCell(obs.comparable_with.join("|")),
        escapeCsvCell(obs.note),
      ].join(","),
    ),
  ];

  return `\uFEFF${lines.join("\n")}`;
}
