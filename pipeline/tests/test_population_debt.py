from __future__ import annotations

import json
from decimal import Decimal

import pytest

from pipeline.extract.http_client import ROOT
from pipeline.extract.population_debt import aggregate, population_package


def row(**changes):
    return {"uf": "CE", "cliente": "PF", "data_base": "2026-09-30",
            "porte": "Mais de 1 a 2 salários-mínimos", "cnae_ocupacao": "MEI",
            "modalidade": "Empréstimos", "submodalidade": "Crédito pessoal",
            "carteira_ativa": "100,00", "carteira_inadimplencia": "10,00", **changes}


def test_weights_money_not_rows_or_rates_and_filters_population():
    result = aggregate([row(), row(carteira_ativa="900,00", carteira_inadimplencia="0,00"),
                        row(uf="SP"), row(cliente="PJ")], "2026-09")
    assert result["total"] == {"balance_brl": 1000, "late_brl": 10, "source_rows": 2, "late_pct": 1}
    assert result["cross"][0]["income"] == "Mais de 1 a 2 salários mínimos"


@pytest.mark.parametrize("changes", [{"carteira_ativa": "-1"}, {"carteira_inadimplencia": "101"},
                                     {"carteira_ativa": "NaN"}, {"data_base": "2026-08-31"}, {"porte": "nova faixa"}])
def test_rejects_invalid_source_values(changes):
    with pytest.raises(ValueError):
        aggregate([row(**changes)], "2026-09")


def test_zero_balance_remains_unavailable():
    assert aggregate([row(carteira_ativa="0", carteira_inadimplencia="0")], "2026-09")["total"]["late_pct"] is None


def test_published_cross_and_products_reconcile_exactly_to_cents():
    public = ROOT / "app/public/data/population_debt.json"
    assert public.read_bytes() == (ROOT / "data/processed/population_debt.json").read_bytes()
    data = json.loads(public.read_text(encoding="utf-8"))
    credit = data["credit"]
    assert len(credit["cross"]) == len({(r["income"], r["occupation"]) for r in credit["cross"]})
    assert credit["total"]["balance_brl"] > 0
    assert credit["total"]["source_rows"] >= len(credit["cross"])
    for grouping in ("cross", "products"):
        for field in ("balance_brl", "late_brl"):
            assert sum(Decimal(str(r[field])) for r in credit[grouping]) == Decimal(str(credit["total"][field]))
        assert sum(r["source_rows"] for r in credit[grouping]) == credit["total"]["source_rows"]
        for r in credit[grouping]:
            if r["balance_brl"]:
                assert r["late_pct"] == pytest.approx(100 * r["late_brl"] / r["balance_brl"])
    assert data["survey"]["territory"] == "Fortaleza"
    assert data["registry"]["territory"] == "Ceará"
    assert data["registry"]["source_pages"]
    assert data["households"]["budget_debt_share_pct"] is None
    assert data["households"]["needs_foregone_to_pay_debt_pct"] is None

def test_same_scr_vintage_in_every_published_credit_view():
    def read(path):
        return json.loads((ROOT / path).read_text(encoding="utf-8"))
    package = read("app/public/data/population_debt.json")
    credit = package["credit"]
    ym = credit["period"].replace("-", "")
    manifest = read("metadata/phase02_manifest.json")
    ref = next(i for i in manifest["raw_files"] if i["source_id"] == "BCB-SCR")
    month = read(ref["path"])["monthly"][ym]
    assert package == population_package(credit, month)
    assert read("metadata/scr_data_monthly_hashes.json")["extracted_months"][ym]["sha256"] == credit["sha256"]
    macro = next(row for row in read("app/public/data/state_macro_series.json")["series"]["CE"]["PF"]
                 if row["period"] == credit["period"])
    assert macro["carteira_ativa_brl"] == credit["total"]["balance_brl"]
    assert macro["carteira_inadimplida_brl"] == credit["total"]["late_brl"]
    with pytest.raises(ValueError, match="mesmo arquivo"):
        population_package(dict(credit, sha256="mismatched"), month)


def test_ipdc_only_withholds_disputed_indicators():
    data = json.loads((ROOT / "app/public/data/labor_and_surveys.json").read_text(encoding="utf-8"))
    series = data["surveys"]["ipdc_fortaleza_capital"]
    for period in ("2025-05", "2025-06"):
        entry = series[period]
        for field, item in entry["comparison"].items():
            assert entry[field] == (None if item["status"] == "em_revisao" else item["historical"])
        disputed = [o for o in data["observations"] if o["source_id"] == "FECOMERCIO-CE-IPDC"
                    and o["period"] == period]
        assert len(disputed) == 2
        assert all(o["value"] is None and o["status"] == "indisponivel" for o in disputed)
    assert series["2025-05"]["nao_terao_condicao_pagar_pct"] == 9.2
    assert series["2025-06"]["parcela_renda_comprometida_pct"] == 43.3
