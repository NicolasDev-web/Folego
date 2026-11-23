import { describe, expect, it } from "vitest";
import data from "../../public/data/population_debt.json";
import { balanceShare, occupationComparison } from "./populationDebt";

describe("population credit comparison", () => {
  it("compares the same income, with money alongside rates, and exposes all groups on request", () => {
    const income = "Mais de 1 a 2 salários mínimos";
    const rows = occupationComparison(data.credit.cross, income, false);
    expect(rows).toHaveLength(4);
    expect(rows.every((row) => row.income === income)).toBe(true);
    expect(rows[0].occupation).toBe("MEI");
    expect(rows[0].late_pct).toBeCloseTo(8.581529, 5);
    expect(rows[0].balance_brl).toBe(360579775.3);
    const all = occupationComparison(data.credit.cross, income, true);
    expect(all).toHaveLength(8);
    expect(all.some((row) => row.occupation === "Outros")).toBe(true);
    expect(all.find((row) => row.occupation === "Empresário")?.late_pct).toBeCloseTo(8.376, 3);
  });

  it("uses the selected bracket and keeps no income distinct from missing income", () => {
    const low = occupationComparison(data.credit.cross, "Até 1 salário mínimo", false);
    expect(low[0].occupation).toBe("MEI");
    expect(low[0].late_pct).toBeCloseTo(11.06, 2);
    expect(occupationComparison(data.credit.cross, "Sem rendimento", true)).toHaveLength(8);
    expect(occupationComparison(data.credit.cross, "Indisponível", true)).toHaveLength(8);
    expect(occupationComparison(data.credit.cross, "sem dados", true)).toEqual([]);
  });

  it("discloses the substantial other category with a balance-weighted statewide share", () => {
    expect(balanceShare(data.credit.cross, "Outros")).toBeCloseTo(38.7512, 3);
    expect(balanceShare([], "Outros")).toBeNull();
  });
});
