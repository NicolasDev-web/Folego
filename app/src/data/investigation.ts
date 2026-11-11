export type TerritoryMacroCode = "CE" | "NE" | "BR";
export type ClientType = "PF" | "PJ" | "TOTAL";

export type ScrSliceMetrics = {
  period: string;
  methodology_version: "sdd-scr-v2-pre2025" | "sdd-scr-v2-pos2025";
  carteira_ativa_brl: number;
  carteira_ativa_real_brl: number;
  carteira_inadimplida_brl: number;
  carteira_vencida15_brl: number;
  vencido_15_90_brl: number;
  ativo_problematico_brl: number;
  inad90_pct: number | null;
  inad90_status: "observado" | "indisponivel";
  vencido15_pct: number | null;
  ativo_problematico_pct: number | null;
  operacoes_visiveis: number;
  linhas_op_suprimidas: number;
  saldo_operacao_brl: number | null;
  saldo_operacao_real_brl: number | null;
  saldo_operacao_status: "observado" | "parcial" | "suprimido" | "indisponivel";
  participacao_pct: number | null;
};

export type MethodologyBreak = {
  period: string;
  source_id: string;
  affected_metric: string;
  version_before: string;
  version_after: string;
  description: string;
};

export type ContractObservation = {
  indicator_id: string;
  metric_id: string;
  territory_id: string;
  territory_name: string;
  territory_level: string;
  period: string;
  value: number | null;
  unit: string;
  status: "observado" | "parcial" | "suprimido" | "indisponivel" | "nao_aplicavel";
  source_id: string;
  source_url: string;
  universe: string;
  aggregation_rule: string;
  version: string;
  methodology_version: string;
  comparable_with: string[];
  note: string | null;
};

export type StateMacroSeriesFile = {
  schema_version: string;
  generated_at: string;
  reference_ipca_period: string;
  methodology_breaks: MethodologyBreak[];
  series: Record<TerritoryMacroCode, Record<ClientType, ScrSliceMetrics[]>>;
  comprometimento_renda_pf_br: Record<string, number>;
  sgs_reference_br: {
    saldo_pf_br_milhoes_20541: Record<string, number>;
    inadimplencia_pf_br_pct_21084: Record<string, number>;
  };
  ipca_monthly_index: Record<string, number>;
  observations: ContractObservation[];
};

export type ModalitySlice = ScrSliceMetrics & {
  modalidade: string;
};

export type PorteSlice = ScrSliceMetrics & {
  porte: string;
};

export type OcupacaoSlice = ScrSliceMetrics & {
  ocupacao: string;
};

export type SubRegiaoModalidade = {
  modalidade: string;
  carteira_valor_fonte: number;
  vencido15_valor_fonte: number;
  vencido15_pct: number | null;
  operacoes_visiveis: number | null;
};

export type SubRegiaoItem = {
  sub_regiao: string;
  label: string;
  territory_level: "sub_regiao";
  cliente: "PF" | "PJ";
  carteira_valor_fonte: number;
  vencido15_valor_fonte: number;
  vencido15_pct: number | null;
  operacoes_visiveis: number;
  status: "parcial" | "indisponivel";
  modalidades: SubRegiaoModalidade[];
};

export type CreditPeriodProfile = {
  modalidades: Record<TerritoryMacroCode, Record<"PF" | "PJ", ModalitySlice[]>>;
  porte_pf: Record<TerritoryMacroCode, PorteSlice[]>;
  ocupacao_pf: Record<TerritoryMacroCode, OcupacaoSlice[]>;
  origem_pf: Record<TerritoryMacroCode, Record<string, unknown>>;
};

export type CreditProfilesFile = {
  schema_version: string;
  generated_at: string;
  reference_ipca_period: string;
  available_periods: string[];
  profiles_by_period: Record<string, CreditPeriodProfile>;
  sub_regiao_ce: {
    territory_level: "sub_regiao";
    methodology_note: string;
    series_by_period: Record<string, SubRegiaoItem[]>;
  };
  observations: ContractObservation[];
};

export type PnadDesocupacaoPoint = {
  taxa_desocupacao_pct: number | null;
  cv_pct: number | null;
};

export type PnadRendimentoPoint = {
  rendimento_habitual_nominal_brl: number | null;
  cv_nominal_pct: number | null;
  rendimento_habitual_real_brl: number | null;
  cv_real_pct: number | null;
};

export type PnadTerritorySeries<T> = {
  id: string;
  name: string;
  series: Record<string, T>;
};

export type CagedPeriodEntry = {
  estoque?: number | null;
  admissoes: number;
  desligamentos: number;
  saldo: number;
  variacao_relativa_pct?: number | null;
};

export type SurveyPoint = {
  period: string;
  territory_id: string;
  territory_name: string;
  territory_level: string;
  source_id: string;
  source_url: string;
  status: "observado" | "indisponivel";
  familias_endividadas_pct: number | null;
  familias_atraso_pct: number | null;
  source_page?: number;
  nao_terao_condicoes_pagar_pct: number | null;
  comprometimento_medio_renda_pct?: number | null;
  tempo_medio_atraso_dias?: number | null;
  tempo_medio_comprometimento_meses?: number | null;
  note?: string;
};

export type LaborAndSurveysFile = {
  schema_version: string;
  generated_at: string;
  pnad_continua: {
    desocupacao_trimestral: Record<string, PnadTerritorySeries<PnadDesocupacaoPoint>>;
    rendimento_habitual_trimestral: Record<string, PnadTerritorySeries<PnadRendimentoPoint>>;
  };
  novo_caged_adjusted: {
    competence_range: string;
    reconciliation: Record<string, unknown>;
    macro_series: Record<
      TerritoryMacroCode,
      {
        id: string;
        name: string;
        series: Record<string, CagedPeriodEntry>;
      }
    >;
    municipalities_summary: Record<string, unknown>;
  };
  surveys: {
    peic_nacional_br: Record<string, SurveyPoint>;
    ipdc_fortaleza_capital: Record<string, SurveyPoint>;
  };
  observations: ContractObservation[];
};
