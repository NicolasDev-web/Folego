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


def aggregate(rows):
    cross = defaultdict(lambda: [Decimal(0), Decimal(0), 0])
    products = defaultdict(lambda: [Decimal(0), Decimal(0), 0])
    for row in rows:
        if row["uf"] != "CE" or row["cliente"] != "PF":
            continue
        if row["data_base"][:7] != "2026-09":
            raise ValueError("Expected the single reference month 2026-09")
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, required=True)
    args = parser.parse_args()
    payload = args.csv.read_bytes()
    result = aggregate(csv.DictReader(io.StringIO(payload.decode("utf-8-sig")), delimiter=";"))
    result.update({"period": "2026-09", "territory": "Ceará", "unit": "BRL nominal",
                   "source_url": "https://www.bcb.gov.br/pda/desig/scrdata_2026.zip",
                   "methodology_url": "https://www.bcb.gov.br/pda/desig/metodologia_versao2.pdf",
                   "file": args.csv.name, "sha256": hashlib.sha256(payload).hexdigest(),
                   "filter": "uf = CE AND cliente = PF; GROUP BY porte, cnae_ocupacao",
                   "rate_formula": "100 * SUM(carteira_inadimplencia) / SUM(carteira_ativa)"})
    survey = json.loads((ROOT / "data/raw/surveys/ipdc_population_2026-10.json").read_text(encoding="utf-8"))
    registry = json.loads((ROOT / "data/raw/surveys/serasa_population_2026-10.json").read_text(encoding="utf-8"))
    output = {"schema_version": "1.0.0", "registry": registry, "survey": survey, "credit": result}
    for directory in ("data/processed", "app/public/data"):
        (ROOT / directory / "population_debt.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"sha256": result["sha256"], "total": result["total"], "combinations": len(result["cross"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
