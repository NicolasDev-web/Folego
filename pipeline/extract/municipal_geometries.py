from __future__ import annotations

import hashlib
import gzip
import json
import time
from datetime import UTC, datetime
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]
COLLECTED_AT = datetime.now(UTC).replace(microsecond=0).isoformat()
COLLECTED_DATE = COLLECTED_AT[:10]

GEOMETRY_URL = (
    "https://servicodados.ibge.gov.br/api/v3/malhas/estados/23"
    "?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio"
)


def fetch(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": "Folego/0.2 municipal-map"})
    last_error: Exception | None = None

    for attempt in range(3):
        try:
            with urlopen(request, timeout=60) as response:
                payload = response.read()
                if response.headers.get("Content-Encoding") == "gzip" or payload[:2] == b"\x1f\x8b":
                    return gzip.decompress(payload)
                return payload
        except Exception as error:
            last_error = error
            if attempt < 2:
                time.sleep(attempt + 1)

    raise RuntimeError(f"Falha ao coletar {url}") from last_error


def write_bytes(relative_path: str, payload: bytes) -> None:
    path = ROOT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)


def write_json(relative_path: str, payload: object) -> None:
    path = ROOT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    context_path = ROOT / "data/processed/municipal_context.json"
    if not context_path.exists():
        raise FileNotFoundError(
            "Execute pipeline/extract/phase00_collect.py antes da coleta de geometrias."
        )

    context = json.loads(context_path.read_text(encoding="utf-8"))
    municipality_ids = {
        municipality["id"] for municipality in context["municipalities"]
    }

    raw = fetch(GEOMETRY_URL)
    collection = json.loads(raw)
    if collection.get("type") != "FeatureCollection":
        raise ValueError("A resposta da malha não é uma FeatureCollection GeoJSON.")

    features = collection.get("features", [])
    geometry_ids = {
        str(feature.get("properties", {}).get("codarea", ""))
        for feature in features
    }

    if len(features) != 184:
        raise ValueError(f"Esperadas 184 geometrias; recebidas {len(features)}.")
    if geometry_ids != municipality_ids:
        missing = sorted(municipality_ids - geometry_ids)
        extra = sorted(geometry_ids - municipality_ids)
        raise ValueError(
            "Geocódigos incompatíveis entre cadastro e malha. "
            f"Sem geometria: {missing}; extras: {extra}."
        )

    raw_path = f"data/raw/ibge/malha_municipal_ce_minima_{COLLECTED_DATE}.geojson"
    processed_path = "data/processed/ce_municipalities_min.geojson"
    public_path = "app/public/data/ce_municipalities_min.geojson"
    write_bytes(raw_path, raw)
    write_bytes(processed_path, raw)
    write_bytes(public_path, raw)

    manifest = {
        "schema_version": "1.0.0",
        "collected_at": COLLECTED_AT,
        "source_id": "IBGE-GEO-API-V3",
        "url": GEOMETRY_URL,
        "quality": "minima",
        "territory": "Ceará",
        "intra_region": "municipio",
        "features": len(features),
        "geocode_match": True,
        "raw_path": raw_path,
        "processed_path": processed_path,
        "public_path": public_path,
        "sha256": hashlib.sha256(raw).hexdigest(),
        "bytes": len(raw),
        "note": (
            "Snapshot da geometria servida pela API na data de coleta. "
            "A qualidade mínima é adequada à visão estadual, não a medições de precisão."
        ),
    }
    write_json("metadata/municipal_geometry_manifest.json", manifest)

    print(
        json.dumps(
            {
                "features": len(features),
                "geocode_match": True,
                "sha256": manifest["sha256"],
                "public_path": public_path,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()

