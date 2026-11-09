from __future__ import annotations

import json
from typing import Any

from pipeline.extract.http_client import ROOT, fetch_cached_bytes

# Censo 2022 - Rendimento nominal mensal domiciliar per capita (médio=13431, mediano=13534, moradores=13604)
# Classificações: 2[6794] (Sexo=Total), 86[95251] (Cor ou raça=Total), 58[95253] (Grupo de idade=Total)
CENSO_INCOME_URL = (
    "https://servicodados.ibge.gov.br/api/v3/agregados/10295/periodos/2022/"
    "variaveis/13604|13431|13534"
    "?localidades=N1[1]|N2[2]|N3[23]|N6[N3[23]]"
    "&classificacao=2[6794]|86[95251]|58[95253]"
)

# IPCA - Número-índice mensal (dez/1993 = 100), variável 2266
IPCA_INDEX_URL = (
    "https://servicodados.ibge.gov.br/api/v3/agregados/1737/"
    "periodos/201801-202609/variaveis/2266?localidades=N1[1]"
)

# PNAD Contínua Trimestral - Taxa de desocupação (4099) e CV (4103)
PNAD_UNEMPLOYMENT_URL = (
    "https://servicodados.ibge.gov.br/api/v3/agregados/4099/"
    "periodos/201901-202603/variaveis/4099|4103"
    "?localidades=N1[1]|N2[2]|N3[23]|N6[2304400]"
)

# PNAD Contínua Trimestral - Rendimento médio mensal real (5933, CV 5941) e nominal (5929, CV 5937)
PNAD_INCOME_URL = (
    "https://servicodados.ibge.gov.br/api/v3/agregados/6472/"
    "periodos/201901-202603/variaveis/5933|5941|5929|5937"
    "?localidades=N1[1]|N2[2]|N3[23]|N6[2304400]"
)


def parse_sidra_series(payload_bytes: bytes) -> dict[str, dict[str, dict[str, str]]]:
    """
    Returns {variable_id: {locality_id: {period: raw_str_value}}}
    """
    data = json.loads(payload_bytes.decode("utf-8"))
    if not isinstance(data, list) or not data:
        raise ValueError("Resposta SIDRA vazia ou fora do formato esperado (lista de variáveis).")

    result: dict[str, dict[str, dict[str, str]]] = {}
    for var_item in data:
        var_id = str(var_item.get("id", ""))
        resultados = var_item.get("resultados", [])
        if not resultados:
            raise ValueError(f"Variável SIDRA {var_id} sem bloco 'resultados'.")
        series_list = resultados[0].get("series", [])
        loc_map: dict[str, dict[str, str]] = {}
        for item in series_list:
            loc_id = str(item.get("localidade", {}).get("id", ""))
            serie = item.get("serie", {})
            if loc_id and isinstance(serie, dict):
                loc_map[loc_id] = {str(k): str(v) for k, v in serie.items()}
        result[var_id] = loc_map
    return result


def collect_ibge_phase02(collected_date: str = "2026-11-06") -> dict[str, Any]:
    context_path = ROOT / "data/processed/municipal_context.json"
    if not context_path.exists():
        raise FileNotFoundError("Execute phase00_collect.py antes de collect_ibge_phase02.")
    context = json.loads(context_path.read_text(encoding="utf-8"))
    expected_muni_ids = {str(m["id"]) for m in context["municipalities"]}

    # 1. Censo 2022 Renda Domiciliar Per Capita (Tabela 10295)
    censo_bytes, censo_meta = fetch_cached_bytes(
        CENSO_INCOME_URL,
        f"data/raw/ibge/renda_censo_2022_ce_{collected_date}.json",
    )
    censo_parsed = parse_sidra_series(censo_bytes)
    for required_var in ("13604", "13431", "13534"):
        if required_var not in censo_parsed:
            raise ValueError(f"Variável {required_var} ausente na resposta da tabela SIDRA 10295.")

    muni_mean = {
        loc_id: float(vals["2022"])
        for loc_id, vals in censo_parsed["13431"].items()
        if loc_id in expected_muni_ids
    }
    muni_median = {
        loc_id: float(vals["2022"])
        for loc_id, vals in censo_parsed["13534"].items()
        if loc_id in expected_muni_ids
    }
    muni_residents = {
        loc_id: int(vals["2022"])
        for loc_id, vals in censo_parsed["13604"].items()
        if loc_id in expected_muni_ids
    }

    if set(muni_mean.keys()) != expected_muni_ids or set(muni_median.keys()) != expected_muni_ids:
        missing = sorted(expected_muni_ids - set(muni_mean.keys()))
        raise ValueError(f"Cobertura municipal incompleta em SIDRA 10295; faltando: {missing}")

    # 2. IPCA Índice Mensal (Tabela 1737)
    ipca_bytes, ipca_meta = fetch_cached_bytes(
        IPCA_INDEX_URL,
        f"data/raw/ibge/ipca_indice_1737_{collected_date}.json",
    )
    ipca_parsed = parse_sidra_series(ipca_bytes)
    ipca_series = {
        f"{period[:4]}-{period[4:6]}": float(val)
        for period, val in ipca_parsed["2266"]["1"].items()
        if val not in ("...", "-", "X", "")
    }
    if "2019-01" not in ipca_series or "2026-09" not in ipca_series:
        raise ValueError("Série IPCA não cobre integralmente a janela 2019-01 a 2026-09.")

    # 3. PNAD Contínua Desocupação (Tabela 4099)
    pnad_unemp_bytes, pnad_unemp_meta = fetch_cached_bytes(
        PNAD_UNEMPLOYMENT_URL,
        f"data/raw/ibge/pnad_desocupacao_4099_{collected_date}.json",
    )
    pnad_unemp_parsed = parse_sidra_series(pnad_unemp_bytes)

    # 4. PNAD Contínua Rendimento (Tabela 6472)
    pnad_inc_bytes, pnad_inc_meta = fetch_cached_bytes(
        PNAD_INCOME_URL,
        f"data/raw/ibge/pnad_rendimento_6472_{collected_date}.json",
    )
    pnad_inc_parsed = parse_sidra_series(pnad_inc_bytes)

    return {
        "censo_income": {
            "mean_by_muni": muni_mean,
            "median_by_muni": muni_median,
            "residents_by_muni": muni_residents,
            "macro": {
                loc_id: {
                    "mean_2022": float(censo_parsed["13431"][loc_id]["2022"]),
                    "median_2022": float(censo_parsed["13534"][loc_id]["2022"]),
                    "residents_2022": int(censo_parsed["13604"][loc_id]["2022"]),
                }
                for loc_id in ("1", "2", "23")
                if loc_id in censo_parsed["13431"]
            },
        },
        "ipca_index": ipca_series,
        "pnad_unemployment": pnad_unemp_parsed,
        "pnad_income": pnad_inc_parsed,
        "raw_files": [
            {
                "source_id": "IBGE-SIDRA-10295",
                "competence": "2022",
                "rows": len(muni_mean) + 3,
                "unit": "R$ (média e mediana nominal mensal domiciliar per capita)",
                "geography": "BR, NE, CE e 184 municípios do Ceará",
                "license": "Domínio público / Dados Abertos IBGE",
                "version": "Censo Demográfico 2022 - Universo",
                **censo_meta,
            },
            {
                "source_id": "IBGE-SIDRA-1737",
                "competence": f"{min(ipca_series)}..{max(ipca_series)}",
                "rows": len(ipca_series),
                "unit": "Número-índice (dez/1993 = 100)",
                "geography": "BR",
                "license": "Domínio público / Dados Abertos IBGE",
                "version": "IPCA - Série histórica",
                **ipca_meta,
            },
            {
                "source_id": "IBGE-SIDRA-4099",
                "competence": "2019-T1..2026-T2",
                "rows": sum(len(v) for v in pnad_unemp_parsed.get("4099", {}).values()),
                "unit": "% (taxa de desocupação e CV)",
                "geography": "BR, NE, CE e Fortaleza",
                "license": "Domínio público / Dados Abertos IBGE",
                "version": "PNAD Contínua Trimestral",
                **pnad_unemp_meta,
            },
            {
                "source_id": "IBGE-SIDRA-6472",
                "competence": "2019-T1..2026-T2",
                "rows": sum(len(v) for v in pnad_inc_parsed.get("5933", {}).values()),
                "unit": "R$ (rendimento médio habitual real e nominal + CV)",
                "geography": "BR, NE, CE e Fortaleza",
                "license": "Domínio público / Dados Abertos IBGE",
                "version": "PNAD Contínua Trimestral",
                **pnad_inc_meta,
            },
        ],
    }


PNAD_LOC_MAP = {
    "1": ("BR", "Brasil"),
    "2": ("NE", "Nordeste"),
    "23": ("CE", "Ceará"),
    "2304400": ("2304400", "Fortaleza"),
}


def _format_pnad_quarter(raw_q: str) -> str:
    s = str(raw_q).strip()
    if len(s) == 6 and s.isdigit() and s[4:6] in ("01", "02", "03", "04"):
        return f"{s[:4]}-T{int(s[4:6])}"
    return s


def _safe_float(raw_val: str | None) -> float | None:
    if raw_val is None or str(raw_val).strip() in ("", "...", "-", "X"):
        return None
    return float(raw_val)


def collect_ibge_all(collected_date: str = "2026-11-06") -> dict[str, Any]:
    base = collect_ibge_phase02(collected_date)
    unemp_raw = base["pnad_unemployment"]
    inc_raw = base["pnad_income"]

    pnad_desocupacao: dict[str, Any] = {}
    for loc_code, (t_id, t_name) in PNAD_LOC_MAP.items():
        s_rate = unemp_raw.get("4099", {}).get(loc_code, {})
        s_cv = unemp_raw.get("4103", {}).get(loc_code, {})
        q_series: dict[str, Any] = {}
        for raw_p in sorted(set(s_rate.keys()) | set(s_cv.keys())):
            q_label = _format_pnad_quarter(raw_p)
            q_series[q_label] = {
                "taxa_desocupacao_pct": _safe_float(s_rate.get(raw_p)),
                "cv_pct": _safe_float(s_cv.get(raw_p)),
            }
        pnad_desocupacao[t_id] = {"id": t_id, "name": t_name, "series": q_series}

    pnad_rendimento: dict[str, Any] = {}
    for loc_code, (t_id, t_name) in PNAD_LOC_MAP.items():
        s_real = inc_raw.get("5933", {}).get(loc_code, {})
        s_cv_real = inc_raw.get("5941", {}).get(loc_code, {})
        s_nom = inc_raw.get("5929", {}).get(loc_code, {})
        s_cv_nom = inc_raw.get("5937", {}).get(loc_code, {})
        q_series = {}
        for raw_p in sorted(set(s_real.keys()) | set(s_nom.keys())):
            q_label = _format_pnad_quarter(raw_p)
            q_series[q_label] = {
                "rendimento_habitual_real_brl": _safe_float(s_real.get(raw_p)),
                "cv_real_pct": _safe_float(s_cv_real.get(raw_p)),
                "rendimento_habitual_nominal_brl": _safe_float(s_nom.get(raw_p)),
                "cv_nominal_pct": _safe_float(s_cv_nom.get(raw_p)),
            }
        pnad_rendimento[t_id] = {"id": t_id, "name": t_name, "series": q_series}

    return {
        **base,
        "ipca": base["ipca_index"],
        "pnad_desocupacao": pnad_desocupacao,
        "pnad_rendimento": pnad_rendimento,
    }

