import { describe, expect, it } from "vitest";
import rawContextData from "../../public/data/municipal_context.json";
import type { MunicipalContextFile, Municipality } from "../data/municipalities";
import {
  buildMunicipalComparison,
  MAX_COMPARISON_CITIES,
  PILOT_CITY_SLUGS,
  rankMunicipalities,
} from "./municipalComparisonAndRanking";

const contextData = rawContextData as unknown as MunicipalContextFile;
const allMunicipalities: Municipality[] = contextData.municipalities;

describe("municipalComparisonAndRanking", () => {
  it("shows the corrected salary sample and warns about few eligible admissions", () => {
    const model = buildMunicipalComparison(allMunicipalities, ["croata", "ipueiras"]);
    const salaryRow = model.rows.find((row) => row.metric.id === "admission_salary_202609");
    const croata = salaryRow?.cells.find((cell) => cell.municipalityName === "Croatá");
    expect(croata?.value).toBe(1633);
    expect(croata?.detailNote).toContain("2 admissões elegíveis");
    expect(croata?.detailNote).toContain("poucas admissões");
    expect(salaryRow?.metric.universe).toContain("sem vínculos intermitentes");
  });

  it("validates the 8 pilot municipalities and 184 total municipalities in municipal_context.json", () => {
    expect(allMunicipalities).toHaveLength(184);
    const pilots = allMunicipalities.filter((m) => m.pilot).map((m) => m.slug).sort();
    expect(pilots).toEqual([...PILOT_CITY_SLUGS].sort());
  });

  it("limits comparison to at most 3 unique valid municipalities and includes explicit debt unavailability", () => {
    const model = buildMunicipalComparison(allMunicipalities, [
      "fortaleza",
      "sobral",
      "juazeiro-do-norte",
      "caucaia",
      "fortaleza",
      "municipio-inexistente",
    ]);

    expect(model.selectedMunicipalities).toHaveLength(MAX_COMPARISON_CITIES);
    expect(model.selectedMunicipalities.map((m) => m.slug)).toEqual([
      "fortaleza",
      "sobral",
      "juazeiro-do-norte",
    ]);
    expect(model.canAddMore).toBe(false);

    const debtRow = model.rows.find((row) => row.metric.id === "divida_municipal_direta");
    expect(debtRow).toBeDefined();
    expect(debtRow?.compatible).toBe(false);
    expect(debtRow?.cells.every((cell) => cell.value === null)).toBe(true);
    expect(debtRow?.cells.every((cell) => cell.status === "indisponivel")).toBe(true);
  });

  it("preserves null values in comparison without converting them to zero", () => {
    const model = buildMunicipalComparison(allMunicipalities, ["fortaleza", "baixio"]);
    const salaryRow = model.rows.find((row) => row.metric.id === "admission_salary_202609");
    expect(salaryRow).toBeDefined();

    const fortalezaCell = salaryRow?.cells.find((c) => c.municipalitySlug === "fortaleza");
    const baixioCell = salaryRow?.cells.find((c) => c.municipalitySlug === "baixio");

    expect(fortalezaCell?.value).toBeGreaterThan(0);
    expect(fortalezaCell?.status).toBe("observado");
    expect(baixioCell?.value).toBeNull();
    expect(baixioCell?.status).toBe("sem_observacao");
    expect(baixioCell?.formatted).toContain("null");
  });

  it("excludes municipalities with null values from numeric ranking and reports exact counts", () => {
    const ranking = rankMunicipalities(allMunicipalities, "admission_salary_202609", "desc");
    expect(ranking.eligible).toBe(true);
    if (!ranking.eligible) return;

    expect(ranking.totalMunicipalities).toBe(184);
    expect(ranking.excludedCount).toBe(7);
    expect(ranking.includedCount).toBe(177);
    expect(ranking.entries).toHaveLength(177);
    expect(ranking.excludedMunicipalities.map((e) => e.municipality.slug)).toContain("baixio");
    expect(ranking.entries.some((e) => e.municipality.slug === "baixio")).toBe(false);
  });

  it("assigns identical competition rank positions for ties and sorts tied cities alphabetically", () => {
    const ranking = rankMunicipalities(allMunicipalities, "income_pc_median_2022", "desc");
    expect(ranking.eligible).toBe(true);
    if (!ranking.eligible) return;

    expect(ranking.includedCount).toBe(184);
    expect(ranking.excludedCount).toBe(0);
    expect(ranking.tiedMunicipalitiesCount).toBeGreaterThan(0);

    for (let i = 1; i < ranking.entries.length; i += 1) {
      const prev = ranking.entries[i - 1];
      const curr = ranking.entries[i];
      if (curr.value === prev.value) {
        expect(curr.rank).toBe(prev.rank);
        expect(curr.tied).toBe(true);
        expect(prev.tied).toBe(true);
        expect(
          prev.municipality.name.localeCompare(curr.municipality.name, "pt-BR"),
        ).toBeLessThanOrEqual(0);
      } else {
        expect(curr.rank).toBe(i + 1);
      }
    }
  });

  it("blocks ranking by direct municipal debt with an explicit methodological explanation", () => {
    const ranking = rankMunicipalities(allMunicipalities, "divida_municipal_direta", "desc");
    expect(ranking.eligible).toBe(false);
    expect(ranking.includedCount).toBe(0);
    expect(ranking.excludedCount).toBe(184);
    expect(ranking.entries).toHaveLength(0);
    if (!ranking.eligible) {
      expect(ranking.reason).toContain("SCR.data");
    }
  });
});
