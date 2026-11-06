export type Municipality = {
  id: string;
  slug: string;
  name: string;
  region: string;
  population_2022: number;
  pilot: boolean;
};

export type MunicipalContextFile = {
  schema_version: string;
  generated_at: string;
  sources: Array<{
    source_id: string;
    label: string;
    url: string;
    period?: string;
    metric?: string;
    unit?: string;
  }>;
  municipalities: Municipality[];
};

