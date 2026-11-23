"""Export the direct income × occupation cut of SCR; never join people to Caged.

python -m pipeline.extract.population_debt --csv data/raw/cache/population/scrdata_202609.csv
The CSV comes from https://www.bcb.gov.br/pda/desig/scrdata_2026.zip.
Keep the annual archive/CSV in the ignored raw cache. No rounded-rate averages.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INCOMES = ["Sem rendimento", "Até 1 salário mínimo", "Mais de 1 a 2 salários mínimos",
           "Mais de 2 a 3 salários mínimos", "Mais de 3 a 5 salários mínimos",
           "Mais de 5 a 10 salários mínimos", "Mais de 10 a 20 salários mínimos",
           "Acima de 20 salários mínimos", "Indisponível"]


def normalize_label(value: str) -> str:
    return value.strip().replace("salários-mínimos", "salários mínimos").replace("salário-mínimo", "salário mínimo")


def aggregate(rows, period: str):
    cross = defaultdict(lambda: [Decimal(0), Decimal(0), 0])
    products = defaultdict(lambda: [Decimal(0), Decimal(0), 0])
    for row in rows:
        if row["uf"] != "CE" or row["cliente"] != "PF":
            continue
        if row["data_base"][:7] != period:
            raise ValueError(f"Expected the single reference month {period}")
        income = normalize_label(row["porte"])
        if income not in INCOMES:
            raise ValueError(f"Unexpected income label: {income}")
        balance = Decimal(row["carteira_ativa"].replace(",", "."))
        late = Decimal(row["carteira_inadimplencia"].replace(",", "."))
        if not balance.is_finite() or not late.is_finite() or not 0 <= late <= balance:
            raise ValueError("Invalid monetary amounts")
        for group in (cross[(income, row["cnae_ocupacao"])],
                      products[(row["modalidade"], row["submodalidade"])]):
            group[0] += balance
            group[1] += late
            group[2] += 1
    if not cross:
        raise ValueError("No CE PF data")

    def pack(values):
        balance, late, count = values
        return {"balance_brl": float(balance), "late_brl": float(late), "source_rows": count,
                "late_pct": float(100 * late / balance) if balance else None}

    total = [sum(v[i] for v in cross.values()) for i in range(3)]
    if any(sum(v[i] for v in products.values()) != total[i] for i in range(3)):
        raise ValueError("Products do not reconcile with income × occupation")
    return {
        "total": pack(total),
        "incomes": INCOMES,
        "cross": [{"income": income, "occupation": occupation, **pack(v)}
                  for (income, occupation), v in sorted(cross.items(), key=lambda item: (INCOMES.index(item[0][0]), item[0][1]))],
        "products": [{"modality": modality, "submodality": submodality, **pack(v)}
                     for (modality, submodality), v in sorted(products.items(), key=lambda item: -item[1][0])],
    }


def credit_from_bytes(payload: bytes, ym: str):
    period = f"{ym[:4]}-{ym[4:]}"
    rows = csv.DictReader(io.TextIOWrapper(io.BytesIO(payload), encoding="utf-8-sig"), delimiter=";")
    result = aggregate(rows, period)
    result.update({"period": period, "territory": "Ceará", "unit": "BRL nominal",
                   "source_url": f"https://www.bcb.gov.br/pda/desig/scrdata_{ym[:4]}.zip",
                   "methodology_url": "https://www.bcb.gov.br/pda/desig/metodologia_versao2.pdf",
                   "file": f"scrdata_{ym}.csv", "sha256": hashlib.sha256(payload).hexdigest(),
                   "filter": "uf = CE AND cliente = PF; GROUP BY porte, cnae_ocupacao",
                   "rate_formula": "100 * SUM(carteira_inadimplencia) / SUM(carteira_ativa)"})
    return result


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def population_package(credit, month):
    expected = month["macro"]["CE"]["PF"]
    total = credit["total"]
    if (credit["period"] != month["period"] or credit["sha256"] != month["sha256"]
            or total["balance_brl"] != expected["carteira_ativa_mil"]
            or total["late_brl"] != expected["carteira_inadimplida_mil"]):
        raise ValueError("SCR de população e histórico devem usar o mesmo arquivo e reconciliar em centavos.")
    approved = read_json("metadata/population_sources.json")
    result = {"schema_version": "1.1.0", "credit": credit,
              "households": read_json("data/raw/surveys/household_evidence_ce.json")}
    for key, prefix, territory in (("survey", "ipdc", "Fortaleza"), ("registry", "serasa", "Ceará")):
        period = approved[f"{key}_period"]
        source = read_json(f"data/raw/surveys/{prefix}_population_{period}.json")
        if source["period"] != period or source["territory"] != territory:
            raise ValueError(f"Competência ou território incorretos para {prefix}")
        if not source.get("source_url") or not source.get("universe"):
            raise ValueError(f"Fonte ou população ausente em {prefix}")
        numbers = [v for k, v in source.items() if k.endswith("_pct")]
        if key == "survey":
            numbers.extend(item["pct"] for group in ("uses", "products", "nonpayment_reasons")
                           for item in source[group])
            if not source.get("release_date"):
                raise ValueError("Data do boletim ausente")
        if not numbers or any(type(value) not in (int, float) or not 0 <= value <= 100 for value in numbers):
            raise ValueError(f"Percentual inválido em {prefix}")
        result[key] = source
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, required=True)
    args = parser.parse_args()
    match = re.fullmatch(r"scrdata_(\d{4}(?:0[1-9]|1[0-2]))\.csv", args.csv.name)
    if not match:
        parser.error("Esperado scrdata_AAAAMM.csv")
    ym = match.group(1)
    manifest = read_json("metadata/phase02_manifest.json")
    snapshot = next(item for item in manifest["raw_files"] if item["source_id"] == "BCB-SCR")
    months = read_json(snapshot["path"])["monthly"]
    if ym != max(months):
        parser.error("Use a última competência do histórico publicado.")
    output = population_package(credit_from_bytes(args.csv.read_bytes(), ym), months[ym])
    from pipeline.extract.http_client import write_json
    for directory in ("data/processed", "app/public/data"):
        write_json(f"{directory}/population_debt.json", output)


if __name__ == "__main__":
    main()
