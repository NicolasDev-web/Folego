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

export function projectPosition(
  [longitude, latitude]: Position,
  bounds: GeoBounds,
  width = 640,
  height = 620,
  padding = 24,
): Position {
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

  return [
    offsetX + (longitude - bounds.minLongitude) * scale,
    offsetY + (bounds.maxLatitude - latitude) * scale,
  ];
}

export function geometryCentroid(
  geometry: MunicipalityGeometry,
  bounds: GeoBounds,
  width = 640,
  height = 620,
  padding = 24,
): Position {
  let selectedRing: Position[] = [];
  let selectedArea = -1;

  for (const polygon of polygons(geometry)) {
    const ring = polygon[0] ?? [];
    let area = 0;
    for (let index = 0; index < ring.length - 1; index += 1) {
      const [x1, y1] = projectPosition(ring[index], bounds, width, height, padding);
      const [x2, y2] = projectPosition(ring[index + 1], bounds, width, height, padding);
      area += x1 * y2 - x2 * y1;
    }
    if (Math.abs(area) > selectedArea) {
      selectedArea = Math.abs(area);
      selectedRing = ring;
    }
  }

  let twiceArea = 0;
  let centroidX = 0;
  let centroidY = 0;
  for (let index = 0; index < selectedRing.length - 1; index += 1) {
    const [x1, y1] = projectPosition(selectedRing[index], bounds, width, height, padding);
    const [x2, y2] = projectPosition(selectedRing[index + 1], bounds, width, height, padding);
    const cross = x1 * y2 - x2 * y1;
    twiceArea += cross;
    centroidX += (x1 + x2) * cross;
    centroidY += (y1 + y2) * cross;
  }

  if (Math.abs(twiceArea) < 0.0001) {
    const points = selectedRing.map((position) =>
      projectPosition(position, bounds, width, height, padding),
    );
    return [
      points.reduce((sum, point) => sum + point[0], 0) / Math.max(points.length, 1),
      points.reduce((sum, point) => sum + point[1], 0) / Math.max(points.length, 1),
    ];
  }

  return [centroidX / (3 * twiceArea), centroidY / (3 * twiceArea)];
}

export function geometryToPath(
  geometry: MunicipalityGeometry,
  bounds: GeoBounds,
  width = 640,
  height = 620,
  padding = 24,
): string {
  return polygons(geometry)
    .map((polygon) =>
      polygon
        .map((ring) =>
          ring
            .map(([longitude, latitude], index) => {
              const [x, y] = projectPosition(
                [longitude, latitude],
                bounds,
                width,
                height,
                padding,
              );
              return `${index === 0 ? "M" : "L"}${format(x)} ${format(y)}`;
            })
            .join(" ") + " Z",
        )
        .join(" "),
    )
    .join(" ");
}

