import type { Observation } from "../types/observation";

const nullStatuses = new Set<Observation["status"]>([
  "suprimido",
  "indisponivel",
  "nao_aplicavel",
]);

export type ObservationView = {
  label: string;
  description: string;
  tone: "available" | "partial" | "missing";
};

export function validateObservation(observation: Observation): Observation {
  if (nullStatuses.has(observation.status) && observation.value !== null) {
    throw new Error(`O estado ${observation.status} exige valor nulo.`);
  }

  if (
    (observation.status === "observado" || observation.status === "parcial") &&
    observation.value === null
  ) {
    throw new Error(`O estado ${observation.status} exige um valor observado.`);
  }

  return observation;
}

export function describeObservation(observation: Observation): ObservationView {
  validateObservation(observation);

  const descriptions: Record<Observation["status"], ObservationView> = {
    observado: {
      label: "Dado observado",
      description: "O valor passou pelas verificações previstas para este recorte.",
      tone: "available",
    },
    parcial: {
      label: "Cobertura parcial",
      description: "A fonte não cobre todo o período ou universo selecionado.",
      tone: "partial",
    },
    suprimido: {
      label: "Valor suprimido",
      description: "A fonte restringiu a divulgação e o valor não será reconstruído.",
      tone: "missing",
    },
    indisponivel: {
      label: "Não disponível",
      description: "Não há dado validado para este território e indicador.",
      tone: "missing",
    },
    nao_aplicavel: {
      label: "Não se aplica",
      description: "A medida não é compatível com este território ou universo.",
      tone: "missing",
    },
  };

  return descriptions[observation.status];
}

