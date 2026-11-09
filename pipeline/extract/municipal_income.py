from __future__ import annotations

import csv
import gzip
import hashlib
import json
import time
from datetime import UTC, datetime
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]
COLLECTED_AT = datetime.now(UTC).replace(microsecond=0).isoformat()
COLLECTED_DATE = COLLECTED_AT[:10]

METADATA_URL = "https://servicodados.ibge.gov.br/api/v3/agregados/10295/metadados"
DATA_URL = (
    "https://servicodados.ibge.gov.br/api/v3/agregados/10295/periodos/2022/"
    "variaveis/13431%7C13534?localidades=N6%5BN3%5B23%5D%5D&"
    "classificacao=2%5B6794%5D%7C86%5B95251%5D%7C58%5B95253%5D"
)

MEAN_VARIABLE = "13431"
MEDIAN_VARIABLE = "13534"
EXPECTED_CLASSIFICATIONS = {
    "2": {"6794": "Total"},
    "86": {"95251": "Total"},
    "58": {"95253": "Total"},
}


def fetch(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": "Folego/0.3 municipal-income"})
    last_error: Exception | None = None

    for attempt in range(3):
        try:
            with urlopen(request, timeout=90) as response:
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
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def extract_values(payload: list[dict[str, object]], variable_id: str) -> dict[str, float]:
    variable = next((item for item in payload if str(item.get("id")) == variable_id), None)
    if variable is None:
        raise ValueError(f"Variável {variable_id} não retornada pelo SIDRA.")
    if variable.get("unidade") != "Reais":
        raise ValueError(f"Unidade inesperada na variável {variable_id}: {variable.get('unidade')}")

    results = variable.get("resultados")
    if not isinstance(results, list) or len(results) != 1:
        raise ValueError(f"Resultado inesperado para a variável {variable_id}.")

    classifications = results[0].get("classificacoes", [])
    observed = {
        str(item["id"]): {str(key): value for key, value in item["categoria"].items()}
        for item in classifications
    }
    if observed != EXPECTED_CLASSIFICATIONS:
        raise ValueError(
            f"Classificações inesperadas na variável {variable_id}: {observed}."
        )

    values: dict[str, float] = {}
    for series in results[0].get("series", []):
        territory_id = str(series["localidade"]["id"])
        raw_value = series["serie"].get("2022")
        try:
            values[territory_id] = float(raw_value)
        except (TypeError, ValueError) as error:
            raise ValueError(
                f"Valor ausente ou inválido em {territory_id}, variável {variable_id}: {raw_value}"
            ) from error

    return values


def main() -> None:
    context_path = ROOT / "data/processed/municipal_context.json"
    if not context_path.exists():
        raise FileNotFoundError("Execute pipeline/extract/phase00_collect.py antes desta etapa.")

    context = json.loads(context_path.read_text(encoding="utf-8"))
    municipality_ids = {item["id"] for item in context["municipalities"]}

    metadata_raw = fetch(METADATA_URL)
    data_raw = fetch(DATA_URL)
    metadata = json.loads(metadata_raw)
    payload = json.loads(data_raw)

    if metadata.get("id") != 10295 or metadata.get("periodicidade", {}).get("fim") != 2022:
        raise ValueError("Metadados incompatíveis com a tabela 10295 do Censo 2022.")

    mean_by_id = extract_values(payload, MEAN_VARIABLE)
    median_by_id = extract_values(payload, MEDIAN_VARIABLE)
    if set(mean_by_id) != municipality_ids or set(median_by_id) != municipality_ids:
        raise ValueError("A renda não cobre exatamente os 184 códigos municipais validados.")

    for municipality in context["municipalities"]:
        territory_id = municipality["id"]
        municipality["income_pc_mean_2022"] = mean_by_id[territory_id]
        municipality["income_pc_median_2022"] = median_by_id[territory_id]

    context["schema_version"] = "1.1.0"
    context["generated_at"] = COLLECTED_AT
    context["sources"] = [
        source for source in context["sources"] if source.get("source_id") != "IBGE-SIDRA-10295"
    ]
    context["sources"].append(
        {
            "source_id": "IBGE-SIDRA-10295",
            "label": "IBGE — Censo 2022, tabela 10295",
            "url": DATA_URL,
            "period": "2022",
            "metric": "Rendimento nominal mensal domiciliar per capita, médio e mediano",
            "unit": "reais",
        }
    )

    metadata_path = f"data/raw/ibge/sidra_10295_metadata_{COLLECTED_DATE}.json"
    raw_path = f"data/raw/ibge/renda_domiciliar_pc_ce_2022_{COLLECTED_DATE}.json"
    write_bytes(metadata_path, metadata_raw)
    write_bytes(raw_path, data_raw)
    write_json("data/processed/municipal_context.json", context)
    write_json("app/public/data/municipal_context.json", context)

    csv_path = ROOT / "data/processed/municipal_income_2022.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "territory_id",
                "territory_name",
                "period",
                "income_pc_mean_brl",
                "income_pc_median_brl",
                "source_id",
            ],
        )
        writer.writeheader()
        for municipality in context["municipalities"]:
            writer.writerow(
                {
                    "territory_id": municipality["id"],
                    "territory_name": municipality["name"],
                    "period": "2022",
                    "income_pc_mean_brl": f"{municipality['income_pc_mean_2022']:.2f}",
                    "income_pc_median_brl": f"{municipality['income_pc_median_2022']:.2f}",
                    "source_id": "IBGE-SIDRA-10295",
                }
            )

    coverage_path = ROOT / "data/processed/coverage_matrix.csv"
    coverage_updates = 0
    if coverage_path.exists():
        with coverage_path.open("r", encoding="utf-8", newline="") as handle:
            coverage_rows = list(csv.DictReader(handle))
        for row in coverage_rows:
            if row["indicator_id"] == "renda_censo":
                row["status"] = "observado"
                row["source_id"] = "IBGE-SIDRA-10295"
                row["note"] = "Média e mediana nominais mensais domiciliares per capita validadas."
                coverage_updates += 1
        with coverage_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=coverage_rows[0].keys())
            writer.writeheader()
            writer.writerows(coverage_rows)

    manifest = {
        "schema_version": "1.0.0",
        "collected_at": COLLECTED_AT,
        "source_id": "IBGE-SIDRA-10295",
        "metadata_url": METADATA_URL,
        "data_url": DATA_URL,
        "period": "2022",
        "unit": "Reais nominais mensais",
        "classifications": EXPECTED_CLASSIFICATIONS,
        "municipalities": len(municipality_ids),
        "variables": {
            MEAN_VARIABLE: "média domiciliar per capita",
            MEDIAN_VARIABLE: "mediana domiciliar per capita",
        },
        "files": [
            {
                "path": metadata_path,
                "sha256": hashlib.sha256(metadata_raw).hexdigest(),
                "bytes": len(metadata_raw),
            },
            {
                "path": raw_path,
                "sha256": hashlib.sha256(data_raw).hexdigest(),
                "bytes": len(data_raw),
            },
        ],
        "validation": {
            "coverage_exact": True,
            "missing_values": 0,
            "classification_totals_only": True,
            "coverage_matrix_updates": coverage_updates,
        },
        "restriction": (
            "Moradores em domicílios particulares permanentes ocupados, exclusive pensionistas, "
            "empregados domésticos e parentes de empregados domésticos. Valores nominais de 2022."
        ),
    }
    write_json("metadata/municipal_income_manifest.json", manifest)

    print(
        json.dumps(
            {
                "municipalities": len(municipality_ids),
                "missing_values": 0,
                "coverage_matrix_updates": coverage_updates,
                "context_schema": context["schema_version"],
                "manifest": "metadata/municipal_income_manifest.json",
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
