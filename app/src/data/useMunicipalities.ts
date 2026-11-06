import { useEffect, useState } from "react";
import type { Municipality, MunicipalContextFile } from "./municipalities";

type MunicipalitiesState =
  | { status: "loading"; municipalities: Municipality[]; error: null }
  | { status: "ready"; municipalities: Municipality[]; error: null }
  | { status: "error"; municipalities: Municipality[]; error: string };

export function useMunicipalities(): MunicipalitiesState {
  const [state, setState] = useState<MunicipalitiesState>({
    status: "loading",
    municipalities: [],
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/data/municipal_context.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`A base municipal respondeu com status ${response.status}.`);
        }
        return response.json() as Promise<MunicipalContextFile>;
      })
      .then((payload) => {
        const pilot = payload.municipalities.filter((municipality) => municipality.pilot);
        if (pilot.length !== 8) {
          throw new Error("O piloto municipal não contém as oito cidades esperadas.");
        }
        setState({ status: "ready", municipalities: pilot, error: null });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          status: "error",
          municipalities: [],
          error: error instanceof Error ? error.message : "Não foi possível carregar a base municipal.",
        });
      });

    return () => controller.abort();
  }, []);

  return state;
}
