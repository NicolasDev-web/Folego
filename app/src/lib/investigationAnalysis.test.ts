import { describe, expect, it } from "vitest";
import rawProfiles from "../../public/data/credit_profiles.json";
import rawLabor from "../../public/data/labor_and_surveys.json";
import rawMacro from "../../public/data/state_macro_series.json";
import type {
  CreditProfilesFile,
  LaborAndSurveysFile,
  StateMacroSeriesFile,
} from "../data/investigation";
import {
  buildIncomeBracketProfile,
  buildMacroPanoramaComparison,
  buildModalitiesComparison,
  buildSurveyComparisonRows,
  observationsToCsv,
  splitSeriesAround2025Break,
} from "./investigationAnalysis";

const macroFile = rawMacro as unknown as StateMacroSeriesFile;
const profilesFile = rawProfiles as unknown as CreditProfilesFile;
const laborFile = rawLabor as unknown as LaborAndSurveysFile;

describe("investigationAnalysis (Phase 03 & Phase 05)", () => {
  it("aligns CE, NE, and BR on common competence 2026-09 with exact shares and national income commitment", () => {
    const panorama = buildMacroPanoramaComparison(macroFile, "2026-09", "real");
    expect(panorama.period).toBe("2026-09");
    expect(panorama.territories).toHaveLength(3);

    const [ce, ne, br] = panorama.territories;
    expect(ce.territoryId).toBe("CE");
    expect(ne.territoryId).toBe("NE");
    expect(br.territoryId).toBe("BR");

    expect(ce.inad90Pct).toBeCloseTo(6.2, 2);
    expect(ne.inad90Pct).toBeCloseTo(7.04, 2);
    expect(br.inad90Pct).toBeCloseTo(6.17, 2);

    expect(panorama.ceShareOfNePct).toBeCloseTo(15.44, 1);
    expect(panorama.ceShareOfBrPct).toBeCloseTo(2.51, 1);
    expect(panorama.nationalIncomeCommitment.period).toBe("2026-08");
    expect(panorama.nationalIncomeCommitment.valuePct).toBeCloseTo(28.99, 2);
  });

  it("analyzes PF modalities and separates share shift from real growth", () => {
    const rows = buildModalitiesComparison(profilesFile, "CE", "2026-09");
    expect(rows.length).toBeGreaterThanOrEqual(5);
    expect(rows[0].modalidade).toBe("Empréstimos");
    expect(rows[0].current.participacao_pct).toBeGreaterThan(40);
    expect(rows[0].shareDeltaPp).not.toBeNull();
    expect(rows[0].realGrowthPct).not.toBeNull();
  });

  it("orders PF income brackets in minimum wages and includes the composition/SM warning", () => {
    const profile = buildIncomeBracketProfile(profilesFile, "CE", "2026-09");
    expect(profile.brackets.length).toBeGreaterThanOrEqual(7);
    expect(profile.brackets[0].porte).toBe("Sem rendimento");
    expect(profile.methodologyWarning).toContain("salário mínimo nominal");
  });

  it("splits SCR series around the 2025-01 methodological break without mixing pre/post versions", () => {
    const split = splitSeriesAround2025Break(macroFile.series.CE.PF);
    expect(split.allPoints).toHaveLength(33);
    expect(split.pre2025Points.every((p) => p.period < "2025-01")).toBe(true);
    expect(split.pos2025Points.every((p) => p.period >= "2025-01")).toBe(true);
    expect(split.pre2025Points.length + split.pos2025Points.length).toBe(33);
  });

  it("preserves the 2025-11 null gap in IPDC Fortaleza without interpolating or converting to zero", () => {
    const surveys = buildSurveyComparisonRows(laborFile);
    expect(surveys.missingIpdcPeriods).toContain("2025-11");
    const nov2025 = surveys.ipdcPoints.find((p) => p.period === "2025-11");
    expect(nov2025?.status).toBe("indisponivel");
    expect(nov2025?.familias_endividadas_pct).toBeNull();
  });

  it("exports contract observations to CSV with full methodological headers and null preservation", () => {
    const csv = observationsToCsv(laborFile.observations.slice(0, 20));
    expect(csv.startsWith("\uFEFFindicator_id,metric_id,territory_id")).toBe(true);
    expect(csv).toContain("CNC-PEIC");
  });
});
