export type ObservationStatus =
  | "observado"
  | "parcial"
  | "suprimido"
  | "indisponivel"
  | "nao_aplicavel";

export type TerritoryLevel =
  | "BR"
  | "UF"
  | "municipio"
  | "sub_regiao"
  | "capital_pesquisa";

export interface Observation {
  source_id: string;
  metric_id: string;
  territory_id: string;
  territory_level: TerritoryLevel;
  period: string;
  unit: string;
  value: number | null;
  status: ObservationStatus;
  universe: string;
  methodology_version: string;
  source_url?: string;
  notes?: string[];
}

