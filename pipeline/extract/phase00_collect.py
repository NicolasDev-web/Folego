from __future__ import annotations

import csv
import gzip
import hashlib
import json
import re
import time
import unicodedata
from datetime import UTC, datetime
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]
COLLECTED_AT = datetime.now(UTC).replace(microsecond=0).isoformat()
COLLECTED_DATE = COLLECTED_AT[:10]

LOCALITIES_URL = (
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados/23/municipios"
    "?orderBy=nome"
)
POPULATION_URL = (
    "https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/"
    "variaveis/93?localidades=N6[N3[23]]"
)
BCB_SUBREGION_URL = (
    "https://olinda.bcb.gov.br/olinda/servico/scr_sub_regiao/versao/v1/odata/"
    "scr_sub_regiao(DataBase=@DataBase)?@DataBase=202608&"
    "$filter=ESTADO%20eq%20%27CE%27&$top=1000&$format=json"
)

PILOT_NAMES = {
    "Fortaleza",
    "Caucaia",
    "Maracanaú",
    "Sobral",
    "Juazeiro do Norte",
    "Crato",
    "Iguatu",
    "Quixadá",
}


def fetch(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": "Folego/0.1 phase00 research"})
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


def write_raw(relative_path: str, payload: bytes) -> dict[str, object]:
    path = ROOT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "sha256": hashlib.sha256(payload).hexdigest(),
        "bytes": len(payload),
    }


def write_json(relative_path: str, payload: object) -> None:
    path = ROOT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def immediate_region(municipality: dict[str, object]) -> str:
    region = municipality.get("regiao-imediata")
    if isinstance(region, dict) and isinstance(region.get("nome"), str):
        return region["nome"]

    microregion = municipality.get("microrregiao")
    if isinstance(microregion, dict) and isinstance(microregion.get("nome"), str):
        return microregion["nome"]

    return "Ceará"


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")


def main() -> None:
    localities_raw = fetch(LOCALITIES_URL)
    population_raw = fetch(POPULATION_URL)
    subregion_raw = fetch(BCB_SUBREGION_URL)

    localities = json.loads(localities_raw)
    population_response = json.loads(population_raw)
    subregion_response = json.loads(subregion_raw)

    population_variable = (
        population_response[0]
        if isinstance(population_response, list)
        else population_response
    )
    population_series = population_variable["resultados"][0]["series"]
    population_by_id = {
        item["localidade"]["id"]: int(item["serie"]["2022"])
        for item in population_series
    }

    locality_ids = {str(item["id"]) for item in localities}
    if len(localities) != 184:
        raise ValueError(f"Esperados 184 municípios; recebidos {len(localities)}.")
    if locality_ids != set(population_by_id):
        missing_population = sorted(locality_ids - set(population_by_id))
        extra_population = sorted(set(population_by_id) - locality_ids)
        raise ValueError(
            "Códigos incompatíveis entre Localidades e SIDRA. "
            f"Sem população: {missing_population}; extras: {extra_population}."
        )

    subregion_rows = subregion_response["value"]
    subregion_codes = sorted({row["SUB_REGIAO"] for row in subregion_rows})
    if subregion_codes != ["60", "61", "62", "63"]:
        raise ValueError(f"Códigos sub-regionais inesperados: {subregion_codes}.")

    municipalities = [
        {
            "id": str(item["id"]),
            "slug": slugify(item["nome"]),
            "name": item["nome"],
            "region": immediate_region(item),
            "population_2022": population_by_id[str(item["id"])],
            "pilot": item["nome"] in PILOT_NAMES,
        }
        for item in localities
    ]

    pilot = [item for item in municipalities if item["pilot"]]
    if len(pilot) != 8:
        raise ValueError(f"Esperados 8 municípios no piloto; recebidos {len(pilot)}.")

    raw_entries = [
        {
            "source_id": "IBGE-LOCAL",
            "url": LOCALITIES_URL,
            "rows": len(localities),
            **write_raw(
                f"data/raw/ibge/localidades_ce_{COLLECTED_DATE}.json",
                localities_raw,
            ),
        },
        {
            "source_id": "IBGE-SIDRA-4714",
            "url": POPULATION_URL,
            "rows": len(population_series),
            **write_raw(
                f"data/raw/ibge/populacao_censo_2022_ce_{COLLECTED_DATE}.json",
                population_raw,
            ),
        },
        {
            "source_id": "BCB-SUB",
            "url": BCB_SUBREGION_URL,
            "rows": len(subregion_rows),
            **write_raw(
                f"data/raw/bcb/scr_sub_regiao_ce_202608_{COLLECTED_DATE}.json",
                subregion_raw,
            ),
        },
    ]

    public_context = {
        "schema_version": "1.0.0",
        "generated_at": COLLECTED_AT,
        "sources": [
            {
                "source_id": "IBGE-LOCAL",
                "label": "IBGE — API de Localidades",
                "url": LOCALITIES_URL,
            },
            {
                "source_id": "IBGE-SIDRA-4714",
                "label": "IBGE — Censo 2022, tabela 4714",
                "url": POPULATION_URL,
                "period": "2022",
                "metric": "População residente",
                "unit": "pessoas",
            },
        ],
        "municipalities": municipalities,
    }
    write_json("data/processed/municipal_context.json", public_context)
    write_json("app/public/data/municipal_context.json", public_context)

    matrix_path = ROOT / "data/processed/coverage_matrix.csv"
    matrix_path.parent.mkdir(parents=True, exist_ok=True)
    with matrix_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "territory_id",
                "territory_name",
                "territory_level",
                "indicator_id",
                "period",
                "status",
                "source_id",
                "note",
            ],
        )
        writer.writeheader()
        for municipality in pilot:
            common = {
                "territory_id": municipality["id"],
                "territory_name": municipality["name"],
                "territory_level": "municipio",
            }
            writer.writerow({**common, "indicator_id": "populacao_censo", "period": "2022", "status": "observado", "source_id": "IBGE-SIDRA-4714", "note": "População residente; valor disponível no contexto público."})
            writer.writerow({**common, "indicator_id": "renda_censo", "period": "2022", "status": "parcial", "source_id": "CENSO", "note": "Cobertura municipal publicada; tabela e precisão ainda em validação."})
            writer.writerow({**common, "indicator_id": "emprego_saldo", "period": "2026-08", "status": "parcial", "source_id": "CAGED", "note": "Fonte municipal confirmada; extração ajustada ainda pendente."})
            writer.writerow({**common, "indicator_id": "divida_municipal_direta", "period": "", "status": "indisponivel", "source_id": "", "note": "Nenhuma fonte pública direta passou pelos seis critérios."})

        for code in subregion_codes:
            writer.writerow({
                "territory_id": code,
                "territory_name": f"Código BCB {code}",
                "territory_level": "sub_regiao",
                "indicator_id": "vencido15_sub",
                "period": "2026-08",
                "status": "parcial",
                "source_id": "BCB-SUB",
                "note": "Dados presentes; nome e correspondência territorial oficial não publicados.",
            })

    manifest = {
        "schema_version": "1.0.0",
        "collected_at": COLLECTED_AT,
        "phase": "00_viabilidade",
        "validations": {
            "ce_municipalities": len(municipalities),
            "pilot_municipalities": len(pilot),
            "population_rows": len(population_series),
            "bcb_subregion_rows_ce_202608": len(subregion_rows),
            "bcb_subregion_codes": subregion_codes,
        },
        "files": raw_entries,
    }
    write_json("metadata/phase00_manifest.json", manifest)

    print(json.dumps({
        "municipalities": len(municipalities),
        "pilot": len(pilot),
        "subregion_codes": subregion_codes,
        "manifest": "metadata/phase00_manifest.json",
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()

