from __future__ import annotations

import json
from decimal import Decimal

import pytest

from pipeline.extract.http_client import ROOT
from pipeline.extract.population_debt import aggregate


def row(**changes):
    return {"uf": "CE", "cliente": "PF", "data_base": "2026-09-30",
            "porte": "Mais de 1 a 2 salários-mínimos", "cnae_ocupacao": "MEI",
            "modalidade": "Empréstimos", "submodalidade": "Crédito pessoal",
            "carteira_ativa": "100,00", "carteira_inadimplencia": "10,00", **changes}


def test_weights_money_not_rows_or_rates_and_filters_population():
    result = aggregate([row(), row(carteira_ativa="900,00", carteira_inadimplencia="0,00"),
                        row(uf="SP"), row(cliente="PJ")])
    assert result["total"] == {"balance_brl": 1000, "late_brl": 10, "source_rows": 2, "late_pct": 1}
    assert result["cross"][0]["income"] == "Mais de 1 a 2 salários mínimos"


@pytest.mark.parametrize("changes", [{"carteira_ativa": "-1"}, {"carteira_inadimplencia": "101"},
                                     {"carteira_ativa": "NaN"}, {"data_base": "2026-08-31"}, {"porte": "nova faixa"}])
def test_rejects_invalid_source_values(changes):
    with pytest.raises(ValueError):
        aggregate([row(**changes)])


def test_zero_balance_remains_unavailable():
    assert aggregate([row(carteira_ativa="0", carteira_inadimplencia="0")])["total"]["late_pct"] is None


def test_published_cross_and_products_reconcile_exactly_to_cents():
    public = ROOT / "app/public/data/population_debt.json"
    assert public.read_bytes() == (ROOT / "data/processed/population_debt.json").read_bytes()
    data = json.loads(public.read_text(encoding="utf-8"))
    credit = data["credit"]
    assert len(credit["cross"]) == 72
    assert len({(r["income"], r["occupation"]) for r in credit["cross"]}) == 72
    assert credit["total"]["source_rows"] == 6217
    assert credit["total"]["balance_brl"] == 120144136163.43
    for grouping in ("cross", "products"):
        for field in ("balance_brl", "late_brl"):
            assert sum(Decimal(str(r[field])) for r in credit[grouping]) == Decimal(str(credit["total"][field]))
        assert sum(r["source_rows"] for r in credit[grouping]) == credit["total"]["source_rows"]
        for r in credit[grouping]:
            if r["balance_brl"]:
                assert r["late_pct"] == pytest.approx(100 * r["late_brl"] / r["balance_brl"])
    assert data["survey"]["territory"] == "Fortaleza"
    assert data["survey"]["period"] == "2026-10"
    assert data["registry"]["state_adults_negative_pct"] == 52.79
    assert data["registry"]["br_adults_negative_pct"] == 51.32
    assert data["registry"]["source_pages"] == [6, 7]
