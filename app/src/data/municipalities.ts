export type Municipality = {
  id: string;
  slug: string;
  name: string;
  region: string;
  population_2022: number;
  income_pc_mean_2022: number;
  income_pc_median_2022: number;
  formal_employment: {
    period: string;
    admissions: number;
    dismissals: number;
    balance: number;
    top_occupations: EmploymentOccupation[];
    declining_occupations: EmploymentOccupation[];
    busiest_sectors: EmploymentSector[];
    average_admission_salary: number | null;
    salary_observations: number;
    revision: string;
  };
  pilot: boolean;
};

export type EmploymentOccupation = {
  code: string;
  title: string;
  admissions: number;
  dismissals: number;
  balance: number;
};

export type EmploymentSector = EmploymentOccupation;

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
    revision?: string;
  }>;
  municipalities: Municipality[];
};

