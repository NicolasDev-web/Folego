from __future__ import annotations

import datetime
import json
from typing import Any

import python_calamine

from pipeline.extract.http_client import ROOT, fetch_cached_bytes, sha256_bytes, write_json

PEIC_CNC_XLS_202610_URL = "https://portal-bucket.azureedge.net/wp-content/2026/10/SERIES_PEIC_ENVIO-2.xls"
PEIC_CNC_XLS_202611_URL = "https://portal-bucket.azureedge.net/wp-content/2026/11/SERIES_PEIC_ENVIO-3.xls"
PEIC_CNC_PORTAL_URL = "https://portaldocomercio.org.br/economia/peic-pesquisa-de-endividamento-e-inadimplencia-do-consumidor/"

IPDC_FECOMERCIO_WP_API_URL = "https://www.fecomercio-ce.com.br/wp-json/wp/v2/posts?search=endividamento&per_page=20"
IPDC_FECOMERCIO_PORTAL_URL = "https://www.fecomercio-ce.com.br/pesquisas-e-estudos/"

PEIC_ROW_MAP = {
    "Familias Endividadas (% do total de famílias)": ("familias_endividadas_pct", "pct_total_familias", 100.0),
    "Familias com dívidas em atraso (% do total de famílias)": ("familias_atraso_pct", "pct_total_familias", 100.0),
    "Não terão condição de pagar dívidas em atraso (% do total de famílias)": (
        "nao_terao_condicao_pagar_pct",
        "pct_total_familias",
        100.0,
    ),
    "Cartão de crédito": ("tipo_cartao_credito_pct_endividados", "pct_familias_endividadas", 100.0),
    "Cheque especial": ("tipo_cheque_especial_pct_endividados", "pct_familias_endividadas", 100.0),
    "Cheque pré-datado": ("tipo_cheque_predatado_pct_endividados", "pct_familias_endividadas", 100.0),
    "Crédito consignado": ("tipo_credito_consignado_pct_endividados", "pct_familias_endividadas", 100.0),
    "Crédito pessoal": ("tipo_credito_pessoal_pct_endividados", "pct_familias_endividadas", 100.0),
    "Carnês": ("tipo_carnes_pct_endividados", "pct_familias_endividadas", 100.0),
    "Financiamento de carro": ("tipo_financiamento_carro_pct_endividados", "pct_familias_endividadas", 100.0),
    "Financiamento de casa": ("tipo_financiamento_casa_pct_endividados", "pct_familias_endividadas", 100.0),
    "Outras dívidas": ("tipo_outras_dividas_pct_endividados", "pct_familias_endividadas", 100.0),
    "Tempo médio de pagamento em atraso, entre as famílias com conta/dívidas em atraso (em dias)": (
        "tempo_medio_atraso_dias",
        "dias_entre_familias_em_atraso",
        1.0,
    ),
    "Tempo médio de comprometimento com dívida (em meses)": (
        "tempo_medio_comprometimento_meses",
        "meses_entre_endividados",
        1.0,
    ),
    "Parcela média da renda comprometida com dívida (% da renda)": (
        "parcela_renda_comprometida_pct",
        "pct_renda_entre_endividados",
        100.0,
    ),
}

# Extração assistida e auditada dos boletins oficiais mensais do IPDC / Fecomércio-CE
# (Fortaleza - capital_pesquisa, código IBGE 2304400).
# Cada registro preserva o link oficial do boletim, data de publicação e denominador.
IPDC_FORTALEZA_AUDITED_SERIES: dict[str, dict[str, Any]] = {
    "2025-04": {
        "familias_endividadas_pct": 71.4,
        "familias_atraso_pct": 18.6,
        "nao_terao_condicao_pagar_pct": 9.7,
        "parcela_renda_comprometida_pct": 45.2,
        "divida_media_brl": 1798.0,
        "tempo_medio_atraso_dias": 74.0,
        "tipo_cartao_credito_pct_endividados": 80.1,
        "tipo_financiamento_bancario_pct_endividados": 16.9,
        "tipo_credito_pessoal_pct_endividados": 10.7,
        "tipo_carnes_pct_endividados": 4.9,
        "release_date": "2025-04-11",
        "source_url": "https://www.fecomercio-ce.com.br/blog/pesquisa-ipdc-inadimplencia-cai-em-abril-entre-consumidores-de-fortaleza/",
        "extraction_mode": "boletim_direto",
    },
    "2025-05": {
        "familias_endividadas_pct": 70.6,
        "familias_atraso_pct": 23.6,
        "nao_terao_condicao_pagar_pct": 9.2,
        "parcela_renda_comprometida_pct": 43.7,
        "divida_media_brl": 1849.0,
        "tempo_medio_atraso_dias": 63.0,
        "tipo_cartao_credito_pct_endividados": 79.4,
        "tipo_financiamento_bancario_pct_endividados": 14.5,
        "tipo_credito_pessoal_pct_endividados": 15.2,
        "tipo_carnes_pct_endividados": 5.2,
        "release_date": "2025-05-26",
        "source_url": "https://www.fecomercio-ce.com.br/blog/endividamento-tem-leve-queda-em-fortaleza-aponta-fecomercio-ce/",
        "extraction_mode": "boletim_direto",
    },
    "2025-06": {
        "familias_endividadas_pct": 71.7,
        "familias_atraso_pct": 20.7,
        "nao_terao_condicao_pagar_pct": 10.1,
        "parcela_renda_comprometida_pct": None,
        "divida_media_brl": None,
        "tempo_medio_atraso_dias": None,
        "tipo_cartao_credito_pct_endividados": None,
        "tipo_financiamento_bancario_pct_endividados": None,
        "tipo_credito_pessoal_pct_endividados": None,
        "tipo_carnes_pct_endividados": None,
        "release_date": "2025-07-17",
        "source_url": "https://www.fecomercio-ce.com.br/blog/fecomercio-aponta-queda-de-61-no-endividamento-do-consumidor-em-fortaleza-em-julho/",
        "extraction_mode": "referencia_retroativa_no_boletim_seguinte",
    },
    "2025-07": {
        "familias_endividadas_pct": 65.6,
        "familias_atraso_pct": 22.6,
        "nao_terao_condicao_pagar_pct": 11.8,
        "parcela_renda_comprometida_pct": 44.1,
        "divida_media_brl": 1926.0,
        "tempo_medio_atraso_dias": 74.0,
        "tipo_cartao_credito_pct_endividados": 78.7,
        "tipo_financiamento_bancario_pct_endividados": 16.4,
        "tipo_credito_pessoal_pct_endividados": 11.8,
        "tipo_carnes_pct_endividados": 5.1,
        "release_date": "2025-07-17",
        "source_url": "https://www.fecomercio-ce.com.br/blog/fecomercio-aponta-queda-de-61-no-endividamento-do-consumidor-em-fortaleza-em-julho/",
        "extraction_mode": "boletim_direto",
    },
    "2025-08": {
        "familias_endividadas_pct": 73.0,
        "familias_atraso_pct": 20.6,
        "nao_terao_condicao_pagar_pct": 10.2,
        "parcela_renda_comprometida_pct": 44.2,
        "divida_media_brl": None,
        "tempo_medio_atraso_dias": None,
        "tipo_cartao_credito_pct_endividados": None,
        "tipo_financiamento_bancario_pct_endividados": None,
        "tipo_credito_pessoal_pct_endividados": None,
        "tipo_carnes_pct_endividados": None,
        "release_date": "2025-09-26",
        "source_url": "https://www.fecomercio-ce.com.br/blog/b-r-o-bros-meses-de-consumo-em-alta-no-ceara/",
        "extraction_mode": "boletim_direto_e_retroativo",
    },
    "2025-09": {
        "familias_endividadas_pct": 68.7,
        "familias_atraso_pct": 21.0,
        "nao_terao_condicao_pagar_pct": 9.3,
        "parcela_renda_comprometida_pct": 38.1,
        "divida_media_brl": 1831.0,
        "tempo_medio_atraso_dias": 72.0,
        "tipo_cartao_credito_pct_endividados": 77.0,
        "tipo_financiamento_bancario_pct_endividados": 16.7,
        "tipo_credito_pessoal_pct_endividados": 9.0,
        "tipo_carnes_pct_endividados": 4.1,
        "release_date": "2025-09-23",
        "source_url": "https://www.fecomercio-ce.com.br/blog/pesquisa-de-endividamento-da-fecomercio-aponta-recuperacao-do-poder-de-compra-do-consumidor/",
        "extraction_mode": "boletim_direto",
    },
    "2025-10": {
        "familias_endividadas_pct": 70.6,
        "familias_atraso_pct": 17.8,
        "nao_terao_condicao_pagar_pct": 9.1,
        "parcela_renda_comprometida_pct": 41.1,
        "divida_media_brl": 1748.0,
        "tempo_medio_atraso_dias": 75.0,
        "tipo_cartao_credito_pct_endividados": 78.4,
        "tipo_financiamento_bancario_pct_endividados": None,
        "tipo_credito_pessoal_pct_endividados": None,
        "tipo_carnes_pct_endividados": None,
        "release_date": "2025-10-23",
        "source_url": "https://www.fecomercio-ce.com.br/blog/inadimplencia-do-consumidor-em-fortaleza-recua-e-abre-espaco-para-o-consumo-de-fim-de-ano/",
        "extraction_mode": "boletim_direto",
    },
    "2025-11": {
        "familias_endividadas_pct": None,
        "familias_atraso_pct": None,
        "nao_terao_condicao_pagar_pct": None,
        "parcela_renda_comprometida_pct": None,
        "divida_media_brl": None,
        "tempo_medio_atraso_dias": None,
        "tipo_cartao_credito_pct_endividados": None,
        "tipo_financiamento_bancario_pct_endividados": None,
        "tipo_credito_pessoal_pct_endividados": None,
        "tipo_carnes_pct_endividados": None,
        "release_date": None,
        "source_url": None,
        "extraction_mode": "indisponivel_sem_boletim_publicado",
    },
    "2025-12": {
        "familias_endividadas_pct": 69.6,
        "familias_atraso_pct": 19.2,
        "nao_terao_condicao_pagar_pct": 8.2,
        "parcela_renda_comprometida_pct": 44.7,
        "divida_media_brl": None,
        "tempo_medio_atraso_dias": None,
        "tipo_cartao_credito_pct_endividados": None,
        "tipo_financiamento_bancario_pct_endividados": None,
        "tipo_credito_pessoal_pct_endividados": None,
        "tipo_carnes_pct_endividados": None,
        "release_date": "2026-01-19",
        "source_url": "https://www.fecomercio-ce.com.br/blog/ano-comeca-com-queda-do-endividamento-em-fortaleza/",
        "extraction_mode": "referencia_retroativa_no_boletim_seguinte",
    },
    "2026-01": {
        "familias_endividadas_pct": 67.6,
        "familias_atraso_pct": 19.6,
        "nao_terao_condicao_pagar_pct": 9.7,
        "parcela_renda_comprometida_pct": 34.5,
        "divida_media_brl": 1749.0,
        "tempo_medio_atraso_dias": 77.0,
        "tipo_cartao_credito_pct_endividados": 72.5,
        "tipo_financiamento_bancario_pct_endividados": 13.0,
        "tipo_credito_pessoal_pct_endividados": 8.8,
        "tipo_carnes_pct_endividados": 4.2,
        "release_date": "2026-01-19",
        "source_url": "https://www.fecomercio-ce.com.br/blog/ano-comeca-com-queda-do-endividamento-em-fortaleza/",
        "extraction_mode": "boletim_direto",
    },
    "2026-02": {
        "familias_endividadas_pct": 68.5,
        "familias_atraso_pct": 19.9,
        "nao_terao_condicao_pagar_pct": 8.6,
        "parcela_renda_comprometida_pct": 42.2,
        "divida_media_brl": 1937.0,
        "tempo_medio_atraso_dias": 70.0,
        "tipo_cartao_credito_pct_endividados": 83.6,
        "tipo_financiamento_bancario_pct_endividados": 14.9,
        "tipo_credito_pessoal_pct_endividados": 9.2,
        "tipo_carnes_pct_endividados": 3.5,
        "release_date": "2026-03-03",
        "source_url": "https://www.fecomercio-ce.com.br/blog/fecomercio-divulga-dados-do-endividamento-dos-consumidores-de-fortaleza-para-o-mes-de-fevereiro/",
        "extraction_mode": "boletim_direto",
    },
    "2026-03": {
        "familias_endividadas_pct": 71.5,
        "familias_atraso_pct": 19.9,
        "nao_terao_condicao_pagar_pct": 10.0,
        "parcela_renda_comprometida_pct": 41.9,
        "divida_media_brl": 1898.0,
        "tempo_medio_atraso_dias": 70.0,
        "tipo_cartao_credito_pct_endividados": 76.9,
        "tipo_financiamento_bancario_pct_endividados": 18.4,
        "tipo_credito_pessoal_pct_endividados": 12.6,
        "tipo_carnes_pct_endividados": 3.1,
        "release_date": "2026-03-18",
        "source_url": "https://www.fecomercio-ce.com.br/blog/pesquisa-endividamento-do-consumidor-mostra-estabilidade-nos-ultimos-doze-meses/",
        "extraction_mode": "boletim_direto",
    },
    "2026-04": {
        "familias_endividadas_pct": 71.4,
        "familias_atraso_pct": 22.2,
        "nao_terao_condicao_pagar_pct": 10.6,
        "parcela_renda_comprometida_pct": 42.8,
        "divida_media_brl": 1910.0,
        "tempo_medio_atraso_dias": 75.0,
        "tipo_cartao_credito_pct_endividados": 79.5,
        "tipo_financiamento_bancario_pct_endividados": 15.3,
        "tipo_credito_pessoal_pct_endividados": 12.1,
        "tipo_carnes_pct_endividados": 3.0,
        "release_date": "2026-04-15",
        "source_url": "https://www.fecomercio-ce.com.br/blog/pesquisa-fecomercio-endividamento-se-mantem-estavel-em-fortaleza/",
        "extraction_mode": "boletim_direto",
    },
    "2026-05": {
        "familias_endividadas_pct": 72.4,
        "familias_atraso_pct": 20.3,
        "nao_terao_condicao_pagar_pct": 9.8,
        "parcela_renda_comprometida_pct": 42.5,
        "divida_media_brl": 1872.0,
        "tempo_medio_atraso_dias": 75.0,
        "tipo_cartao_credito_pct_endividados": 80.9,
        "tipo_financiamento_bancario_pct_endividados": 16.0,
        "tipo_credito_pessoal_pct_endividados": 10.8,
        "tipo_carnes_pct_endividados": 3.7,
        "release_date": "2026-05-22",
        "source_url": "https://www.fecomercio-ce.com.br/blog/pesquisa-fecomercio-endividamento-segue-estavel-em-fortaleza/",
        "extraction_mode": "boletim_direto",
    },
    "2026-06": {
        "familias_endividadas_pct": 69.1,
        "familias_atraso_pct": 17.3,
        "nao_terao_condicao_pagar_pct": 8.1,
        "parcela_renda_comprometida_pct": 40.7,
        "divida_media_brl": 1899.0,
        "tempo_medio_atraso_dias": 76.0,
        "tipo_cartao_credito_pct_endividados": 85.2,
        "tipo_financiamento_bancario_pct_endividados": 15.7,
        "tipo_credito_pessoal_pct_endividados": 9.7,
        "tipo_carnes_pct_endividados": 5.0,
        "release_date": "2026-06-17",
        "source_url": "https://www.fecomercio-ce.com.br/blog/pesquisa-fecomercio-qualidade-do-credito-melhora-e-endividamento-recua-em-fortaleza/",
        "extraction_mode": "boletim_direto",
    },
    "2026-07": {
        "familias_endividadas_pct": 69.6,
        "familias_atraso_pct": 16.8,
        "nao_terao_condicao_pagar_pct": 8.7,
        "parcela_renda_comprometida_pct": 41.0,
        "divida_media_brl": 1851.0,
        "tempo_medio_atraso_dias": 73.0,
        "tipo_cartao_credito_pct_endividados": 82.4,
        "tipo_financiamento_bancario_pct_endividados": 15.2,
        "tipo_credito_pessoal_pct_endividados": 10.1,
        "tipo_carnes_pct_endividados": 3.1,
        "release_date": "2026-07-22",
        "source_url": "https://www.fecomercio-ce.com.br/blog/pesquisa-fecomercio-contas-em-atraso-atingem-menor-nivel-dos-ultimos-cinco-anos-em-fortaleza/",
        "extraction_mode": "boletim_direto",
    },
    "2026-08": {
        "familias_endividadas_pct": 67.8,
        "familias_atraso_pct": 16.5,
        "nao_terao_condicao_pagar_pct": 8.5,
        "parcela_renda_comprometida_pct": 41.8,
        "divida_media_brl": 1887.0,
        "tempo_medio_atraso_dias": 76.0,
        "tipo_cartao_credito_pct_endividados": 82.6,
        "tipo_financiamento_bancario_pct_endividados": None,
        "tipo_credito_pessoal_pct_endividados": None,
        "tipo_carnes_pct_endividados": None,
        "release_date": "2026-08-20",
        "source_url": "https://www.fecomercio-ce.com.br/blog/endividamento-do-consumidor-de-fortaleza-cai-ao-menor-nivel-em-12-meses/",
        "extraction_mode": "boletim_direto",
    },
    "2026-09": {
        "familias_endividadas_pct": 67.8,
        "familias_atraso_pct": 17.8,
        "nao_terao_condicao_pagar_pct": 8.8,
        "parcela_renda_comprometida_pct": 40.8,
        "divida_media_brl": 1914.0,
        "tempo_medio_atraso_dias": 78.0,
        "tipo_cartao_credito_pct_endividados": 82.9,
        "tipo_financiamento_bancario_pct_endividados": None,
        "tipo_credito_pessoal_pct_endividados": None,
        "tipo_carnes_pct_endividados": None,
        "release_date": "2026-09-21",
        "source_url": "https://www.fecomercio-ce.com.br/blog/endividamento-se-mantem-no-menor-patamar-dos-ultimos-12-meses/",
        "extraction_mode": "boletim_direto",
    },
    "2026-10": {
        "familias_endividadas_pct": 65.5,
        "familias_atraso_pct": 16.8,
        "nao_terao_condicao_pagar_pct": 7.4,
        "parcela_renda_comprometida_pct": 41.8,
        "divida_media_brl": 1736.0,
        "tempo_medio_atraso_dias": 67.0,
        "tipo_cartao_credito_pct_endividados": 80.4,
        "tipo_financiamento_bancario_pct_endividados": 14.5,
        "tipo_credito_pessoal_pct_endividados": 7.4,
        "tipo_carnes_pct_endividados": 2.9,
        "release_date": "2026-10-22",
        "source_url": "https://www.fecomercio-ce.com.br/blog/pesquisa-ipdc-endividamento-cai-ao-menor-nivel-desde-a-pandemia/",
        "extraction_mode": "boletim_direto",
    },
}


def parse_peic_sheet(xls_rel_path: str) -> dict[str, dict[str, float]]:
    wb = python_calamine.CalamineWorkbook.from_path(str(ROOT / xls_rel_path))
    if "PEIC" not in wb.sheet_names:
        raise ValueError(f"Aba 'PEIC' não encontrada em {xls_rel_path}: {wb.sheet_names}")
    rows = wb.get_sheet_by_name("PEIC").to_python()
    if not rows or len(rows) < 19:
        raise ValueError(f"Planilha PEIC com linhas insuficientes em {xls_rel_path}")

    header = rows[0]
    col_to_period: dict[int, str] = {}
    for col_idx in range(1, len(header)):
        val = header[col_idx]
        if isinstance(val, datetime.date):
            col_to_period[col_idx] = f"{val.year:04d}-{val.month:02d}"
        elif isinstance(val, str) and len(val.strip()) >= 7:
            col_to_period[col_idx] = val.strip()[:7]

    if not col_to_period:
        raise ValueError(f"Nenhuma competência mensal encontrada no cabeçalho de {xls_rel_path}")

    by_period: dict[str, dict[str, float]] = {p: {} for p in col_to_period.values()}

    for row in rows[1:]:
        if not row:
            continue
        label = str(row[0]).strip()
        if label not in PEIC_ROW_MAP:
            continue
        metric_key, _, scale = PEIC_ROW_MAP[label]
        for col_idx, period in col_to_period.items():
            if col_idx >= len(row) or row[col_idx] in (None, ""):
                continue
            by_period[period][metric_key] = round(float(row[col_idx]) * scale, 4)

    return by_period


def collect_surveys(collected_date: str = "2026-11-06") -> dict[str, Any]:
    xls2_rel = f"data/raw/surveys/peic_cnc_202610_{collected_date}.xls"
    xls3_rel = f"data/raw/surveys/peic_cnc_202611_{collected_date}.xls"
    ipdc_rel = f"data/raw/surveys/ipdc_fecomercio_posts_{collected_date}.json"

    _, meta_xls2 = fetch_cached_bytes(PEIC_CNC_XLS_202610_URL, xls2_rel, decompress_gzip=False)
    _, meta_xls3 = fetch_cached_bytes(PEIC_CNC_XLS_202611_URL, xls3_rel, decompress_gzip=False)
    ipdc_bytes, meta_ipdc = fetch_cached_bytes(IPDC_FECOMERCIO_WP_API_URL, ipdc_rel, decompress_gzip=True)

    peic_oct = parse_peic_sheet(xls2_rel)
    peic_nov = parse_peic_sheet(xls3_rel)

    # Verificar consistência dos meses sobrepostos (2025-10 a 2026-09)
    overlapping = sorted(set(peic_oct.keys()) & set(peic_nov.keys()))
    if not overlapping:
        raise ValueError("Nenhuma competência sobreposta entre as planilhas PEIC de out/2026 e nov/2026.")
    for p in overlapping:
        for k, v_oct in peic_oct[p].items():
            v_nov = peic_nov[p].get(k)
            if v_nov is None or abs(v_oct - v_nov) > 1e-3:
                raise ValueError(f"Divergência entre planilhas PEIC em {p} ({k}): {v_oct} vs {v_nov}")

    peic_merged: dict[str, dict[str, Any]] = {}
    all_peic_periods = sorted(set(peic_oct.keys()) | set(peic_nov.keys()))
    for p in all_peic_periods:
        source_file = xls3_rel if p in peic_nov else xls2_rel
        peic_merged[p] = {
            **peic_oct.get(p, {}),
            **peic_nov.get(p, {}),
            "source_file": source_file,
        }

    # Verificar que todos os links auditados do IPDC constam nos posts coletados da Fecomércio-CE
    ipdc_posts = json.loads(ipdc_bytes.decode("utf-8"))
    collected_links = {str(post.get("link", "")).rstrip("/") for post in ipdc_posts}
    for period, entry in IPDC_FORTALEZA_AUDITED_SERIES.items():
        src_url = entry.get("source_url")
        if src_url and src_url.rstrip("/") not in collected_links:
            raise ValueError(
                f"URL auditada do IPDC ({period}: {src_url}) não encontrada no payload bruto {ipdc_rel}."
            )

    consolidated_rel = f"data/raw/surveys/surveys_peic_ipdc_{collected_date}.json"
    consolidated_payload = {
        "collected_at": collected_date,
        "denominators": {
            "familias_endividadas_pct": "% do total de famílias pesquisadas",
            "familias_atraso_pct": "% do total de famílias pesquisadas",
            "nao_terao_condicao_pagar_pct": "% do total de famílias pesquisadas (inadimplência potencial no IPDC)",
            "parcela_renda_comprometida_pct": "% da renda familiar mensal entre as famílias endividadas",
            "tipo_*_pct_endividados": "% das famílias endividadas (múltipla resposta; soma > 100%)",
        },
        "peic_nacional": {
            "territory_id": "BR",
            "territory_name": "Brasil",
            "territory_level": "br",
            "source_id": "CNC-PEIC",
            "series": peic_merged,
        },
        "ipdc_fortaleza": {
            "territory_id": "2304400",
            "territory_name": "Fortaleza",
            "territory_level": "capital_pesquisa",
            "source_id": "FECOMERCIO-CE-IPDC",
            "methodology_note": (
                "Pesquisa amostral de percepção e orçamento familiar restrita ao município de Fortaleza "
                "(capital_pesquisa). Nunca deve ser atribuída ao Ceará como UF ou aos outros 183 municípios. "
                "A competência 2025-11 permanece null (indisponível) por ausência de boletim mensal publicado."
            ),
            "series": IPDC_FORTALEZA_AUDITED_SERIES,
        },
    }
    consolidated_path = write_json(consolidated_rel, consolidated_payload)
    consolidated_sha256 = sha256_bytes(consolidated_path.read_bytes())

    raw_files = [
        {
            "source_id": "CNC-PEIC",
            "url": PEIC_CNC_XLS_202610_URL,
            "portal_url": PEIC_CNC_PORTAL_URL,
            "competence": "2025-08..2026-09",
            "rows": len(peic_oct),
            "unit": "Proporção (0..1 convertida para %) e dias/meses",
            "geography": "BR (Pesquisa Nacional PEIC - CNC)",
            "license": "Divulgação pública CNC / Portal do Comércio",
            "version": "PEIC CNC - Outubro/2026 (SERIES_PEIC_ENVIO-2.xls)",
            **meta_xls2,
        },
        {
            "source_id": "CNC-PEIC",
            "url": PEIC_CNC_XLS_202611_URL,
            "portal_url": PEIC_CNC_PORTAL_URL,
            "competence": "2025-10..2026-10",
            "rows": len(peic_nov),
            "unit": "Proporção (0..1 convertida para %) e dias/meses",
            "geography": "BR (Pesquisa Nacional PEIC - CNC)",
            "license": "Divulgação pública CNC / Portal do Comércio",
            "version": "PEIC CNC - Novembro/2026 (SERIES_PEIC_ENVIO-3.xls)",
            **meta_xls3,
        },
        {
            "source_id": "FECOMERCIO-CE-IPDC",
            "url": IPDC_FECOMERCIO_WP_API_URL,
            "portal_url": IPDC_FECOMERCIO_PORTAL_URL,
            "competence": "2025-04..2026-10 (2025-11 indisponível)",
            "rows": len(ipdc_posts),
            "unit": "% do total de famílias, % dos endividados, R$ e dias",
            "geography": "Fortaleza (capital_pesquisa - 2304400)",
            "license": "Divulgação pública Sistema Fecomércio-CE / IPDC",
            "version": "Boletins Mensais Pesquisa do Endividamento do Consumidor em Fortaleza",
            **meta_ipdc,
            "consolidated_path": consolidated_rel,
            "consolidated_sha256": consolidated_sha256,
        },
    ]

    return {
        "peic_nacional": peic_merged,
        "ipdc_fortaleza": IPDC_FORTALEZA_AUDITED_SERIES,
        "raw_files": raw_files,
    }
