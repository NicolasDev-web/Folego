import { describe, expect, it } from "vitest";
import {
  geometryCentroid,
  geometryToPath,
  getGeoBounds,
  projectPosition,
  type MunicipalityGeoCollection,
} from "./geo";

const collection: MunicipalityGeoCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { codarea: "1" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [2, 0],
            [2, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      },
    },
  ],
};

describe("municipal geometry", () => {
  it("calculates the shared geographic bounds", () => {
    expect(getGeoBounds(collection)).toEqual({
      minLongitude: 0,
      minLatitude: 0,
      maxLongitude: 2,
      maxLatitude: 1,
    });
  });

  it("projects a polygon into a closed SVG path", () => {
    const path = geometryToPath(collection.features[0].geometry, getGeoBounds(collection), 240, 140, 20);
    expect(path).toBe("M20 120 L220 120 L220 20 L20 20 L20 120 Z");
  });

  it("uses the same projection for points and polygon centroids", () => {
    const bounds = getGeoBounds(collection);
    expect(projectPosition([0, 0], bounds, 240, 140, 20)).toEqual([20, 120]);
    expect(geometryCentroid(collection.features[0].geometry, bounds, 240, 140, 20)).toEqual([
      120,
      70,
    ]);
  });
});

