import { describe, expect, it } from "vitest";
import type { Observation } from "../types/observation";
import { describeObservation, validateObservation } from "./observation";

const unavailable: Observation = {
  source_id: "coverage-matrix",
  metric_id: "municipal-debt",
  territory_id: "sobral",
  territory_level: "municipio",
  period: "2026-11",
  unit: "sem unidade",
  value: null,
  status: "indisponivel",
  universe: "pessoas físicas e famílias",
  methodology_version: "sdd-v1",
};

describe("observation adapter", () => {
  it("preserves absence instead of converting it to zero", () => {
    expect(validateObservation(unavailable).value).toBeNull();
    expect(describeObservation(unavailable).label).toBe("Não disponível");
  });

  it("rejects a numeric value marked as unavailable", () => {
    expect(() => validateObservation({ ...unavailable, value: 0 })).toThrow(
      "exige valor nulo",
    );
  });
});

