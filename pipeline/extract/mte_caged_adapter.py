from __future__ import annotations

import hashlib
import json
from typing import Any

import python_calamine

from pipeline.extract.http_client import ROOT, fetch_cached_bytes, write_json

MTE_CAGED_202608_DRIVE_ID = "1LFiRd5cYqCLbBv7udPWtus6h4cF3GaA0"
MTE_CAGED_202608_URL = (
    f"https://drive.usercontent.google.com/download?id={MTE_CAGED_202608_DRIVE_ID}"
    "&export=download&confirm=t"
)
MTE_PORTAL_URL = (
    "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/"
    "programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/novo-caged/2026/agosto"
)

PT_MONTHS = {
    "janeiro": "01",
    "fevereiro": "02",
    "março": "03",
    "marco": "03",
    "abril": "04",
    "maio": "05",
    "junho": "06",
    "julho": "07",
    "agosto": "08",
    "setembro": "09",
    "outubro": "10",
    "novembro": "11",
    "dezembro": "12",
}


def parse_period_label(raw_label: str) -> str | None:
    cleaned = raw_label.strip()
    if not cleaned:
        return None
    if "/" in cleaned and not cleaned.lower().startswith(("acumulado", "últimos", "ultimos")):
        parts = cleaned.split("/")
        if len(parts) == 2:
            m_name = parts[0].strip().lower()
            year = parts[1].strip()[:4]
            if m_name in PT_MONTHS and year.isdigit():
                return f"{year}-{PT_MONTHS[m_name]}"
    low = cleaned.lower()
    if low.startswith("acumulado do ano"):
        return "2026-YTD"
    if low.startswith(("últimos 12 meses", "ultimos 12 meses")):
        return "2025-09..2026-08"
    return None


def build_column_groups(row_periods: list[Any], row_metrics: list[Any], start_col: int) -> dict[str, dict[str, int]]:
    groups: dict[str, dict[str, int]] = {}
    current_period: str | None = None
    max_cols = max(len(row_periods), len(row_metrics))

    for col in range(start_col, max_cols):
        p_raw = str(row_periods[col]).strip() if col < len(row_periods) and row_periods[col] is not None else ""
        if p_raw:
            current_period = parse_period_label(p_raw)
        if not current_period:
            continue
        m_raw = str(row_metrics[col]).strip().lower() if col < len(row_metrics) and row_metrics[col] is not None else ""
        if not m_raw:
            continue

        metric_key: str | None = None
        if m_raw.startswith("estoque"):
            metric_key = "estoque"
        elif m_raw.startswith("admiss"):
            metric_key = "admissoes"
        elif m_raw.startswith("deslig"):
            metric_key = "desligamentos"
        elif m_raw.startswith("saldo"):
            metric_key = "saldo"
        elif m_raw.startswith("varia"):
            metric_key = "variacao_relativa_pct"

        if metric_key:
            groups.setdefault(current_period, {})[metric_key] = col

    return groups


def extract_row_series(row: list[Any], col_groups: dict[str, dict[str, int]]) -> dict[str, dict[str, float | int | None]]:
    out: dict[str, dict[str, float | int | None]] = {}
    for period, cols in col_groups.items():
        entry: dict[str, float | int | None] = {}
        for key, idx in cols.items():
            val = row[idx] if idx < len(row) else None
            if val is None or str(val).strip() in ("", "-", "..."):
                entry[key] = None
            elif key == "variacao_relativa_pct":
                entry[key] = round(float(val), 6)
            else:
                entry[key] = int(round(float(val)))
        out[period] = entry
    return out


def collect_mte_caged(collected_date: str = "2026-11-06") -> dict[str, Any]:
    context_path = ROOT / "data/processed/municipal_context.json"
    if not context_path.exists():
        raise FileNotFoundError("Execute phase00_collect.py antes de collect_mte_caged.")
    context = json.loads(context_path.read_text(encoding="utf-8"))
    ibge6_to_id = {str(m["id"])[:6]: str(m["id"]) for m in context["municipalities"]}
    ibge_id_to_name = {str(m["id"]): str(m["name"]) for m in context["municipalities"]}
    if len(ibge6_to_id) != 184:
        raise ValueError("Os prefixos IBGE de 6 dígitos não são únicos para os 184 municípios.")

    _, xlsx_meta = fetch_cached_bytes(
        MTE_CAGED_202608_URL,
        "data/raw/cache/3-tabelas_202608.xlsx",
        timeout=120,
        decompress_gzip=False,
    )

    wb = python_calamine.CalamineWorkbook.from_path(str(ROOT / "data/raw/cache/3-tabelas_202608.xlsx"))
    for required_sheet in ("Tabela 7.1", "Tabela 8.1"):
        if required_sheet not in wb.sheet_names:
            raise ValueError(f"Planilha obrigatória '{required_sheet}' ausente no arquivo do Novo Caged.")

    # Parse Tabela 7.1 (Macro: Brasil, Nordeste, Ceará - Série com ajustes)
    rows_71 = wb.get_sheet_by_name("Tabela 7.1").to_python()
    groups_71 = build_column_groups(rows_71[3], rows_71[4], start_col=1)
    if "2020-01" not in groups_71 or "2026-08" not in groups_71:
        raise ValueError("Tabela 7.1 do Novo Caged não contém a janela esperada (2020-01 a 2026-08).")

    macro_targets = {"Brasil": "BR", "Nordeste": "NE", "Ceará": "CE"}
    macro_series: dict[str, dict[str, dict[str, float | int | None]]] = {}
    for row in rows_71[5:]:
        if not row or row[0] is None:
            continue
        label = str(row[0]).strip()
        if label in macro_targets:
            macro_series[macro_targets[label]] = extract_row_series(row, groups_71)

    if set(macro_series.keys()) != {"BR", "NE", "CE"}:
        raise ValueError(f"Recortes macro incompletos na Tabela 7.1: {list(macro_series.keys())}")

    # Parse Tabela 8.1 (Municípios - Série com ajustes)
    rows_81 = wb.get_sheet_by_name("Tabela 8.1").to_python()
    groups_81 = build_column_groups(rows_81[3], rows_81[4], start_col=3)
    if "2020-01" not in groups_81 or "2026-08" not in groups_81:
        raise ValueError("Tabela 8.1 do Novo Caged não contém a janela esperada (2020-01 a 2026-08).")

    muni_series: dict[str, dict[str, Any]] = {}
    for row in rows_81[5:]:
        if not row or len(row) < 3 or str(row[0]).strip() != "CE":
            continue
        code6 = str(int(float(row[1])))
        if code6 not in ibge6_to_id:
            raise ValueError(f"Código municipal Caged {code6} ({row[2]}) sem correspondência IBGE no Ceará.")
        muni_id = ibge6_to_id[code6]
        muni_series[muni_id] = {
            "territory_id": muni_id,
            "caged_code_6": code6,
            "name": ibge_id_to_name[muni_id],
            "series": extract_row_series(row, groups_81),
        }

    if len(muni_series) != 184:
        raise ValueError(f"Esperados 184 municípios do Ceará na Tabela 8.1; encontrados {len(muni_series)}.")

    # Reconcile sum of 184 municipalities against Ceará state row in Tabela 7.1:
    # - Flows (admissoes, desligamentos, saldo) must match 100% across all 80 months (2020-01..2026-08).
    # - Stocks (estoque) match 100% from 2022-09..2026-08; in 2020-01..2022-08 MTE footnote **** applies:
    #   "Em municípios com baixos estoques de emprego formal, podem aparecer estoques negativos.
    #    Nesses casos os estoques são zerados mas considerados para os totais."
    monthly_periods = sorted(p for p in groups_81 if len(p) == 7 and p[4] == "-")
    stock_footnote_Adjustments: dict[str, int] = {}
    for period in monthly_periods:
        ce_macro = macro_series["CE"][period]
        for field in ("admissoes", "desligamentos", "saldo"):
            muni_sum = sum(int(m["series"][period][field] or 0) for m in muni_series.values())
            macro_val = int(ce_macro[field] or 0)
            if muni_sum != macro_val:
                raise ValueError(
                    f"Divergência de reconciliação Caged CE em {period} ({field}): "
                    f"soma 184 municípios={muni_sum} vs Tabela 7.1={macro_val}."
                )
        muni_stock = sum(int(m["series"][period]["estoque"] or 0) for m in muni_series.values())
        macro_stock = int(ce_macro["estoque"] or 0)
        if muni_stock != macro_stock:
            if period >= "2022-09":
                raise ValueError(
                    f"Divergência inesperada de estoque Caged CE em {period}: "
                    f"soma={muni_stock} vs Tabela 7.1={macro_stock}."
                )
            stock_footnote_Adjustments[period] = muni_stock - macro_stock

    raw_extract_path = f"data/raw/mte/novo_caged_ce_202608_{collected_date}.json"
    raw_extract_payload = {
        "source_id": "MTE-NOVO-CAGED",
        "portal_url": MTE_PORTAL_URL,
        "download_url": MTE_CAGED_202608_URL,
        "xlsx_sha256": xlsx_meta["sha256"],
        "xlsx_bytes": xlsx_meta["bytes"],
        "series_type": "Série com ajustes (Tabelas 7.1 e 8.1)",
        "period_start": monthly_periods[0],
        "period_end": monthly_periods[-1],
        "reconciliation": {
            "flows_exact_match_all_80_months": True,
            "stocks_exact_match_from_2022_09": True,
            "mte_footnote_zeroed_negative_stocks_2020_2022": stock_footnote_Adjustments,
        },
        "macro": macro_series,
        "municipalities": muni_series,
    }
    extract_file = write_json(raw_extract_path, raw_extract_payload)
    extract_bytes = extract_file.read_bytes()

    return {
        "monthly_periods": monthly_periods,
        "macro": macro_series,
        "municipalities": muni_series,
        "reconciliation": raw_extract_payload["reconciliation"],
        "raw_files": [
            {
                "source_id": "MTE-NOVO-CAGED",
                "url": MTE_CAGED_202608_URL,
                "portal_url": MTE_PORTAL_URL,
                "competence": "2020-01..2026-08",
                "rows": 184 + 3,
                "unit": "Vínculos formais (estoque, admissões, desligamentos e saldos)",
                "geography": "BR, NE, CE e 184 municípios do Ceará",
                "license": "Dados Abertos MTE / PDA",
                "version": "Novo Caged - Série com ajustes até agosto/2026",
                "path": raw_extract_path,
                "sha256": hashlib.sha256(extract_bytes).hexdigest(),
                "bytes": len(extract_bytes),
                "upstream_xlsx_sha256": xlsx_meta["sha256"],
                "upstream_xlsx_bytes": xlsx_meta["bytes"],
            }
        ],
    }
