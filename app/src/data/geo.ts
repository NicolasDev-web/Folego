export type Position = [number, number];

export type PolygonGeometry = {
  type: "Polygon";
  coordinates: Position[][];
};

export type MultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: Position[][][];
};

export type MunicipalityGeometry = PolygonGeometry | MultiPolygonGeometry;

export type MunicipalityGeoFeature = {
  type: "Feature";
  properties: {
    codarea: string;
  };
  geometry: MunicipalityGeometry;
};

export type MunicipalityGeoCollection = {
  type: "FeatureCollection";
  features: MunicipalityGeoFeature[];
};

export type GeoBounds = {
  minLongitude: number;
  minLatitude: number;
  maxLongitude: number;
  maxLatitude: number;
};

function polygons(geometry: MunicipalityGeometry): Position[][][] {
  return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}

export function getGeoBounds(collection: MunicipalityGeoCollection): GeoBounds {
  const longitudes: number[] = [];
  const latitudes: number[] = [];

  for (const feature of collection.features) {
    for (const polygon of polygons(feature.geometry)) {
      for (const ring of polygon) {
        for (const [longitude, latitude] of ring) {
          longitudes.push(longitude);
          latitudes.push(latitude);
        }
      }
    }
  }

  if (longitudes.length === 0 || latitudes.length === 0) {
    throw new Error("A malha municipal não contém coordenadas.");
  }

  return {
    minLongitude: Math.min(...longitudes),
    minLatitude: Math.min(...latitudes),
    maxLongitude: Math.max(...longitudes),
    maxLatitude: Math.max(...latitudes),
  };
}

function format(value: number): string {
  return value.toFixed(2).replace(/\.00$/, "");
}

export function geometryToPath(
  geometry: MunicipalityGeometry,
  bounds: GeoBounds,
  width = 640,
  height = 620,
  padding = 24,
): string {
  const longitudeSpan = bounds.maxLongitude - bounds.minLongitude;
  const latitudeSpan = bounds.maxLatitude - bounds.minLatitude;
  const scale = Math.min(
    (width - padding * 2) / longitudeSpan,
    (height - padding * 2) / latitudeSpan,
  );
  const projectedWidth = longitudeSpan * scale;
  const projectedHeight = latitudeSpan * scale;
  const offsetX = (width - projectedWidth) / 2;
  const offsetY = (height - projectedHeight) / 2;

  return polygons(geometry)
    .map((polygon) =>
      polygon
        .map((ring) =>
          ring
            .map(([longitude, latitude], index) => {
              const x = offsetX + (longitude - bounds.minLongitude) * scale;
              const y = offsetY + (bounds.maxLatitude - latitude) * scale;
              return `${index === 0 ? "M" : "L"}${format(x)} ${format(y)}`;
            })
            .join(" ") + " Z",
        )
        .join(" "),
    )
    .join(" ");
}

