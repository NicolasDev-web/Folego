import { useEffect, useState } from "react";
import type { MunicipalityGeoCollection } from "./geo";

type MunicipalGeometryState =
  | { status: "loading"; collection: null; error: null }
  | { status: "ready"; collection: MunicipalityGeoCollection; error: null }
  | { status: "error"; collection: null; error: string };

export function useMunicipalGeometry(): MunicipalGeometryState {
  const [state, setState] = useState<MunicipalGeometryState>({
    status: "loading",
    collection: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/data/ce_municipalities_min.geojson", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`A malha municipal respondeu com status ${response.status}.`);
        }
        return response.json() as Promise<MunicipalityGeoCollection>;
      })
      .then((collection) => {
        if (collection.type !== "FeatureCollection" || collection.features.length !== 184) {
          throw new Error("A malha municipal não contém as 184 geometrias esperadas.");
        }
        setState({ status: "ready", collection, error: null });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          status: "error",
          collection: null,
          error: error instanceof Error ? error.message : "Não foi possível carregar a malha municipal.",
        });
      });

    return () => controller.abort();
  }, []);

  return state;
}

