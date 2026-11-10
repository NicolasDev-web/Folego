from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pipeline.extract.bcb_adapter import collect_bcb_all
from pipeline.extract.http_client import ROOT, sha256_bytes, write_json
from pipeline.extract.ibge_adapter import collect_ibge_all
from pipeline.extract.mte_caged_adapter import collect_mte_caged
from pipeline.extract.surveys_adapter import collect_surveys
from pipeline.transform.facts import save_facts_and_dimensions
from pipeline.validate.export_public import (
    export_credit_profiles,
    export_labor_and_surveys,
    export_state_macro_series,
    write_coverage_matrix_full,
)


def validate_collected_date(value: str) -> str:
    try:
        parsed = date.fromisoformat(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("Use a data no formato AAAA-MM-DD.") from error
    return parsed.isoformat()


def run_phase02(collected_date: str | None = None) -> dict[str, Any]:
    collected_date = collected_date or datetime.now(UTC).date().isoformat()
    generated_at = datetime.now(UTC).replace(microsecond=0).isoformat()
    context_path = ROOT / "data/processed/municipal_context.json"
    if not context_path.exists():
        raise FileNotFoundError("data/processed/municipal_context.json não encontrado.")
    municipal_context = json.loads(context_path.read_text(encoding="utf-8"))

    print("[Phase 02] 1/6 Coletando e validando IBGE (Censo Renda, IPCA, PNAD Contínua)...", flush=True)
    ibge_res = collect_ibge_all(collected_date)

    print("[Phase 02] 2/6 Coletando e reconciliando MTE Novo Caged (série com ajustes 2020-2026)...", flush=True)
    caged_res = collect_mte_caged(collected_date)

    print("[Phase 02] 3/6 Coletando e validando pesquisas PEIC/CNC e IPDC/Fecomércio-CE...", flush=True)
    surveys_res = collect_surveys(collected_date)

    print("[Phase 02] 4/6 Coletando e agregando BCB (SCR.data 2019-2026, BCB-SUB e SGS)...", flush=True)
    bcb_res = collect_bcb_all(collected_date)

    print("[Phase 02] 5/6 Construindo dimensões e tabelas fato separadas...", flush=True)
    facts_res = save_facts_and_dimensions(
        municipal_context=municipal_context,
        scr_monthly=bcb_res["scr_monthly"],
        sub_by_ym=bcb_res["sub_by_ym"],
        ipca_index_by_period=ibge_res["ipca"],
        caged_data=caged_res,
        surveys_data=surveys_res,
    )

    print("[Phase 02] 6/6Calculando indicadores, validando CONTRATO_DADOS.json e exportando JSONs...", flush=True)
    macro_payload, macro_obs = export_state_macro_series(
        generated_at=generated_at,
        scr_monthly=bcb_res["scr_monthly"],
        sgs_series=bcb_res["sgs"],
        ipca_index_by_period=ibge_res["ipca"],
    )
    profiles_payload, profiles_obs = export_credit_profiles(
        generated_at=generated_at,
        scr_monthly=bcb_res["scr_monthly"],
        sub_by_ym=bcb_res["sub_by_ym"],
        ipca_index_by_period=ibge_res["ipca"],
    )
    labor_payload, labor_obs = export_labor_and_surveys(
        generated_at=generated_at,
        ibge_data=ibge_res,
        caged_data=caged_res,
        surveys_data=surveys_res,
    )

    exported_files: dict[str, Any] = {}
    for filename, payload in (
        ("state_macro_series.json", macro_payload),
        ("credit_profiles.json", profiles_payload),
        ("labor_and_surveys.json", labor_payload),
    ):
        for folder in ("data/processed", "app/public/data"):
            rel = f"{folder}/{filename}"
            path = write_json(rel, payload)
            b = path.read_bytes()
            exported_files[rel] = {
                "path": rel,
                "bytes": len(b),
                "sha256": sha256_bytes(b),
            }

    cov_meta = write_coverage_matrix_full()

    manifest = {
        "phase": "02_dados",
        "generated_at": generated_at,
        "collected_date": collected_date,
        "contract_validated_observations_count": len(macro_obs) + len(profiles_obs) + len(labor_obs),
        "raw_files": [
            *ibge_res["raw_files"],
            *caged_res["raw_files"],
            *surveys_res["raw_files"],
            *bcb_res["raw_files"],
        ],
        "processed_tables": facts_res["saved_meta"],
        "coverage_matrix_full": cov_meta,
        "exported_public_files": exported_files,
        "reconciliations": {
            "bcb_sub_vs_scr_ce_latest": bcb_res["reconciliation_sub_vs_scr"].get("2026-08"),
            "caged_adjusted_flows_exact_match_all_80_months": caged_res["reconciliation"][
                "flows_exact_match_all_80_months"
            ],
            "caged_adjusted_stocks_exact_match_from_2022_09": caged_res["reconciliation"][
                "stocks_exact_match_from_2022_09"
            ],
        },
    }
    write_json("metadata/phase02_manifest.json", manifest)
    print(
        f"[Phase 02] Concluído! {manifest['contract_validated_observations_count']} observações validadas.",
        flush=True,
    )
    return manifest


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(
        description="Coleta, valida e exporta os pacotes públicos da Fase 02.",
    )
    parser.add_argument(
        "--collected-date",
        type=validate_collected_date,
        help="Data da coleta no formato AAAA-MM-DD. O padrão é a data UTC atual.",
    )
    arguments = parser.parse_args()
    run_phase02(arguments.collected_date)
