from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pandas as pd
import pytest
from jsonschema import Draft202012Validator

from pipeline.extract.http_client import ROOT, sha256_bytes
from pipeline.transform.indicators import (
    build_observation,
    compute_inad90_pct,
    compute_participacao_modalidade_pct,
    compute_saldo_operacao,
    compute_vencido15_sub_pct,
    compute_weighted_rate_pct,
)
from pipeline.transform.normalize import (
    SchemaNormalizationError,
    deflate_to_reference_ipca,
    normalize_ibge_municipality_code,
    normalize_period,
    normalize_scr_monetary_to_brl,
    resolve_scr_methodology_version,
    validate_required_columns,
)


def test_normalize_period_and_schema_errors() -> None:
    assert normalize_period("202608") == "2026-08"
    assert normalize_period("2026-09") == "2026-09"
    assert normalize_period("01/08/2026") == "2026-08"
    assert normalize_period("2022") == "2022"
    assert normalize_period("2026-T2") == "2026-T2"

    with pytest.raises(SchemaNormalizationError):
        normalize_period("2026/13")

    with pytest.raises(SchemaNormalizationError):
        validate_required_columns(["uf", "cliente"], ["uf", "cliente", "carteira_ativa"], "BCB-SCR")


def test_normalize_ibge_municipality_code() -> None:
    valid = {"2304400", "2312908"}
    six_map = {"230440": "2304400", "231290": "2312908"}

    assert normalize_ibge_municipality_code("2304400", valid_7digit_codes=valid) == "2304400"
    assert (
        normalize_ibge_municipality_code("231290", valid_7digit_codes=valid, six_to_seven_map=six_map)
        == "2312908"
    )

    with pytest.raises(SchemaNormalizationError):
        normalize_ibge_municipality_code("3550308", valid_7digit_codes=valid)

    with pytest.raises(SchemaNormalizationError):
        normalize_ibge_municipality_code("2399999", valid_7digit_codes=valid)


def test_monetary_deflation_and_methodology_version() -> None:
    assert normalize_scr_monetary_to_brl(None) is None
    assert normalize_scr_monetary_to_brl(1200.556) == 1200.56

    with pytest.raises(SchemaNormalizationError):
        normalize_scr_monetary_to_brl(-10.0)

    ipca = {"2020-01": 5000.0, "2026-09": 7500.0}
    assert deflate_to_reference_ipca(1000.0, "2020-01", ipca, reference_period="2026-09") == 1500.0
    assert deflate_to_reference_ipca(None, "2020-01", ipca, reference_period="2026-09") is None

    pre = resolve_scr_methodology_version("2024-12")
    pos = resolve_scr_methodology_version("2025-01")
    assert pre["version"] == "sdd-scr-v2-pre2025"
    assert pos["version"] == "sdd-scr-v2-pos2025"
    assert not pos["ativo_problematico_comparable_across_break"]


def test_indicator_formulas_and_edge_cases() -> None:
    # Ponderação por carteira vs média simples
    # Fatia A: 10 inadimplida de 100 (10%); Fatia B: 20 inadimplida de 900 (2,22%)
    # Média ponderada correta: (10 + 20) / (100 + 900) = 3,00% (e não (10+2,22)/2 = 6,11%)
    weighted, status = compute_weighted_rate_pct([(10, 100), (20, 900)])
    assert status == "observado"
    assert weighted == 3.0

    # Denominador zero e None nunca viram 0.0
    assert compute_inad90_pct(10.0, 0.0) == (None, "indisponivel")
    assert compute_inad90_pct(None, 100.0) == (None, "indisponivel")
    assert compute_participacao_modalidade_pct(50.0, 0.0) == (None, "indisponivel")

    # Regra de supressão de operações (<= 15 mascarado como -1 no SCR.data)
    assert compute_saldo_operacao(50000.0, -1) == (None, "suprimido")
    assert compute_saldo_operacao(50000.0, 0, has_suppressed_rows=True) == (None, "suprimido")
    assert compute_saldo_operacao(50000.0, 0, has_suppressed_rows=False) == (None, "indisponivel")
    assert compute_saldo_operacao(50000.0, 20) == (2500.0, "observado")

    # Sub-região postal sempre 'parcial' quando presente
    assert compute_vencido15_sub_pct(50.0, 1000.0) == (5.0, "parcial")

    # Violação de contrato: status indisponível não pode carregar número
    with pytest.raises(SchemaNormalizationError):
        build_observation(
            indicator_id="inad90_carteira",
            territory_id="2304400",
            territory_name="Fortaleza",
            territory_level="municipio",
            period="2026-08",
            value=0.0,
            unit="%",
            status="indisponivel",
            source_id="BCB-SCR",
            source_url="https://dadosabertos.bcb.gov.br",
            universe="PF",
            aggregation_rule="media_ponderada_P_div_C",
            version="sdd-scr-v2-pos2025",
        )


def test_facts_and_dimensions_separation() -> None:
    dim_t = pd.read_parquet(ROOT / "data/processed/dim_territory.parquet")
    fact_macro = pd.read_parquet(ROOT / "data/processed/fact_scr_macro.parquet")
    fact_prof = pd.read_parquet(ROOT / "data/processed/fact_scr_profiles.parquet")
    fact_sub = pd.read_parquet(ROOT / "data/processed/fact_scr_subregion.parquet")
    fact_surveys = pd.read_parquet(ROOT / "data/processed/fact_surveys.parquet")

    # 184 municípios exatos na dimensão territorial
    assert len(dim_t[dim_t["territory_level"] == "municipio"]) == 184
    assert not dim_t.duplicated(subset=["territory_id", "territory_level"]).any()

    # Nenhum TOTAL misturado com PF/PJ em fact_scr_macro
    assert set(fact_macro["cliente"].unique()) == {"PF", "PJ"}
    assert set(fact_macro["territory_level"].unique()) == {"br", "regiao", "uf"}

    # Soma das modalidades PF em 2026-09 no CE fecha com a carteira ativa PF macro sem duplicar subtotais
    ce_pf_macro_2609 = float(
        fact_macro[
            (fact_macro["period"] == "2026-09")
            & (fact_macro["territory_id"] == "CE")
            & (fact_macro["cliente"] == "PF")
        ]["carteira_ativa_brl"].iloc[0]
    )
    ce_pf_mod_sum_2609 = float(
        fact_prof[
            (fact_prof["period"] == "2026-09")
            & (fact_prof["territory_id"] == "CE")
            & (fact_prof["cliente"] == "PF")
            & (fact_prof["dimension_type"] == "modalidade")
        ]["carteira_ativa_brl"].sum()
    )
    assert abs(ce_pf_mod_sum_2609 - ce_pf_macro_2609) / ce_pf_macro_2609 < 1e-4

    # Sub-região restrita aos códigos 60..63 e status 'parcial'
    assert set(fact_sub["territory_id"].unique()) == {"60", "61", "62", "63"}
    assert set(fact_sub["territory_level"].unique()) == {"sub_regiao"}
    assert set(fact_sub["status"].unique()) == {"parcial"}

    # Pesquisa IPDC restrita a capital_pesquisa (2304400) e 2025-11 preservado como null
    ipdc_2511 = fact_surveys[
        (fact_surveys["source_id"] == "FECOMERCIO-CE-IPDC") & (fact_surveys["period"] == "2025-11")
    ].iloc[0]
    assert ipdc_2511["territory_level"] == "capital_pesquisa"
    assert pd.isna(ipdc_2511["familias_endividadas_pct"])
    assert ipdc_2511["status"] == "indisponivel"


def test_exported_public_files_and_contract_validation() -> None:
    contract_schema = json.loads((ROOT / "04_tecnico/CONTRATO_DADOS.json").read_text(encoding="utf-8"))
    validator = Draft202012Validator(contract_schema)

    for fn in ("state_macro_series.json", "credit_profiles.json", "labor_and_surveys.json"):
        pub_path = ROOT / "app/public/data" / fn
        proc_path = ROOT / "data/processed" / fn
        assert pub_path.exists(), f"Arquivo público ausente: {pub_path}"
        assert proc_path.exists(), f"Arquivo processado ausente: {proc_path}"
        assert sha256_bytes(pub_path.read_bytes()) == sha256_bytes(proc_path.read_bytes())

        payload = json.loads(pub_path.read_text(encoding="utf-8"))
        obs_list = payload.get("observations", [])
        assert len(obs_list) > 0
        for obs in obs_list:
            errors = list(validator.iter_errors(obs))
            assert not errors, f"Erro de contrato em {fn}: {errors[0].message}"

    # Verificar que municipal_context.json permanece íntegro com os 184 municípios
    muni_ctx = json.loads((ROOT / "app/public/data/municipal_context.json").read_text(encoding="utf-8"))
    assert len(muni_ctx["municipalities"]) == 184
    assert all("income_pc_mean_2022" in m and "formal_employment" in m for m in muni_ctx["municipalities"])
