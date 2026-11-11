import { useEffect, useState } from "react";
import { CREDIT_REFERENCE_PERIOD } from "../lib/investigationAnalysis";
import type {
  CreditProfilesFile,
  LaborAndSurveysFile,
  StateMacroSeriesFile,
} from "./investigation";

export type InvestigationDataState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | {
      status: "ready";
      macro: StateMacroSeriesFile;
      profiles: CreditProfilesFile;
      labor: LaborAndSurveysFile;
    };

let cachedPayload: {
  macro: StateMacroSeriesFile;
  profiles: CreditProfilesFile;
  labor: LaborAndSurveysFile;
} | null = null;

export function useInvestigationData(): InvestigationDataState {
  const [state, setState] = useState<InvestigationDataState>(() =>
    cachedPayload ? { status: "ready", ...cachedPayload } : { status: "loading" },
  );

  useEffect(() => {
    if (cachedPayload) {
      return;
    }
    let active = true;

    async function loadAll() {
      try {
        const [macroRes, profilesRes, laborRes] = await Promise.all([
          fetch("/data/state_macro_series.json"),
          fetch("/data/credit_profiles.json"),
          fetch("/data/labor_and_surveys.json"),
        ]);

        if (!macroRes.ok || !profilesRes.ok || !laborRes.ok) {
          throw new Error(
            "Não foi possível carregar os pacotes públicos validados de crédito, trabalho e percepção.",
          );
        }

        const [macro, profiles, labor] = (await Promise.all([
          macroRes.json(),
          profilesRes.json(),
          laborRes.json(),
        ])) as [StateMacroSeriesFile, CreditProfilesFile, LaborAndSurveysFile];

        const completePeriod = (["CE", "NE", "BR"] as const).every((territory) =>
          macro.series[territory]?.PF?.some((point) => point.period === CREDIT_REFERENCE_PERIOD),
        );
        if (!completePeriod) {
          throw new Error(`A comparação de crédito está indisponível em ${CREDIT_REFERENCE_PERIOD}.`);
        }
        cachedPayload = { macro, profiles, labor };
        if (active) {
          setState({ status: "ready", macro, profiles, labor });
        }
      } catch (err) {
        if (active) {
          setState({
            status: "error",
            error:
              err instanceof Error
                ? err.message
                : "Erro inesperado ao carregar as séries investigativas.",
          });
        }
      }
    }

    void loadAll();
    return () => {
      active = false;
    };
  }, []);

  return state;
}
