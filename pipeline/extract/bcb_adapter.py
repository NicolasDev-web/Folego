from __future__ import annotations

import hashlib
import json
import struct
import tempfile
import zlib
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

import duckdb

from pipeline.extract.http_client import (
    ROOT,
    fetch_bytes,
    fetch_cached_bytes,
    fetch_odata_paginated,
    sha256_bytes,
    write_json,
)

NE_UFS = ("AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE")

EXPECTED_SCR_HEADER = (
    "data_base;uf;segmento;cliente;cnae_ocupacao;porte;modalidade;submodalidade;"
    "origem;indexador;numero_de_operacoes;a_vencer_ate_90_dias;"
    "a_vencer_de_91_ate_360_dias;a_vencer_de_361_ate_1080_dias;"
    "a_vencer_de_1081_ate_1800_dias;a_vencer_de_1801_ate_5400_dias;"
    "a_vencer_acima_de_5400_dias;carteira_a_vencer;vencido_de_15_ate_90_dias;"
    "vencido_acima_de_90_dias;carteira_vencida;carteira_ativa;"
    "carteira_inadimplencia;ativo_problematico"
)

# Competências extraídas integralmente do SCR.data:
# - Agosto e Dezembro de 2019 a 2024 (12 competências históricas, alinhadas ao BCB-SUB e fechamentos anuais)
# - Todas as 21 competências mensais de 2025-01 a 2026-09 (cobrindo a quebra metodológica de jan/2025 e toda a série recente)
DEFAULT_SCR_COMPETENCES = [
    "201908",
    "201912",
    "202008",
    "202012",
    "202108",
    "202112",
    "202208",
    "202212",
    "202308",
    "202312",
    "202408",
    "202412",
    "202501",
    "202502",
    "202503",
    "202504",
    "202505",
    "202506",
    "202507",
    "202508",
    "202509",
    "202510",
    "202511",
    "202512",
    "202601",
    "202602",
    "202603",
    "202604",
    "202605",
    "202606",
    "202607",
    "202608",
    "202609",
]

BCB_SUB_COMPETENCES = [
    "201908",
    "202008",
    "202108",
    "202208",
    "202308",
    "202408",
    "202508",
    "202512",
    "202606",
    "202608",
]

SGS_SERIES = {
    "29034": {
        "key": "comprometimento_renda_pf_br",
        "name": "Comprometimento de renda das famílias com o serviço da dívida (SFN) - Com ajuste sazonal",
        "unit": "%",
        "url": "https://api.bcb.gov.br/dados/serie/bcdata.sgs.29034/dados?formato=json",
    },
    "20541": {
        "key": "saldo_carteira_pf_br_milhoes",
        "name": "Saldo da carteira de crédito com recursos livres e direcionados - Pessoas físicas (BR)",
        "unit": "R$ milhões",
        "url": "https://api.bcb.gov.br/dados/serie/bcdata.sgs.20541/dados?formato=json",
    },
    "21084": {
        "key": "inadimplencia_pf_br_pct",
        "name": "Taxa de inadimplência da carteira de crédito - Pessoas físicas (BR)",
        "unit": "%",
        "url": "https://api.bcb.gov.br/dados/serie/bcdata.sgs.21084/dados?formato=json",
    },
}


def methodology_version_for_ym(ym: str) -> str:
    return "sdd-scr-v2-pos2025" if ym >= "202501" else "sdd-scr-v2-pre2025"


def format_ym(ym: str) -> str:
    return f"{ym[:4]}-{ym[4:6]}"


def list_scr_zip_entries(year: int) -> dict[str, dict[str, Any]]:
    url = f"https://www.bcb.gov.br/pda/desig/scrdata_{year}.zip"
    from urllib.request import Request, urlopen

    req_head = Request(url, method="HEAD", headers={"User-Agent": "Folego/0.2 phase02-pipeline"})
    with urlopen(req_head, timeout=45) as resp:
        total_size = int(resp.headers["Content-Length"])

    tail_size = min(65536, total_size)
    tail = fetch_bytes(
        url,
        timeout=45,
        headers={"Range": f"bytes={total_size - tail_size}-{total_size - 1}"},
        decompress_gzip=False,
    )
    eocd_pos = tail.rfind(b"PK\x05\x06")
    if eocd_pos < 0:
        raise ValueError(f"EOCD ZIP não encontrado em {url}")
    _, _, _, _, total_entries, cd_size, cd_offset, _ = struct.unpack("<4s4H2LH", tail[eocd_pos : eocd_pos + 22])
    cd_start_in_tail = tail_size - (total_size - cd_offset)
    cd = tail[cd_start_in_tail : cd_start_in_tail + cd_size]

    entries: dict[str, dict[str, Any]] = {}
    pos = 0
    for _ in range(total_entries):
        (
            _,
            _,
            _,
            _,
            method,
            _,
            _,
            crc,
            comp_size,
            uncomp_size,
            fn_len,
            extra_len,
            comm_len,
            _,
            _,
            _,
            lfh_offset,
        ) = struct.unpack("<4s6H3L5H2L", cd[pos : pos + 46])
        fn = cd[pos + 46 : pos + 46 + fn_len].decode("utf-8")
        if fn.startswith("scrdata_") and fn.endswith(".csv"):
            ym = fn[8:14]
            entries[ym] = {
                "ym": ym,
                "period": format_ym(ym),
                "year": year,
                "zip_url": url,
                "zip_total_bytes": total_size,
                "filename": fn,
                "compression_method": method,
                "crc32": f"{crc:08x}",
                "compressed_bytes": comp_size,
                "uncompressed_bytes": uncomp_size,
                "lfh_offset": lfh_offset,
                "methodology_version": methodology_version_for_ym(ym),
            }
        pos += 46 + fn_len + extra_len + comm_len
    return entries


def aggregate_scr_csv_bytes(ym: str, csv_bytes: bytes, entry_meta: dict[str, Any]) -> dict[str, Any]:
    first_newline = csv_bytes.find(b"\n")
    first_line = csv_bytes[:first_newline].decode("utf-8-sig").strip()
    if first_line != EXPECTED_SCR_HEADER:
        raise ValueError(
            f"Mudança de esquema detectada em scrdata_{ym}.csv! "
            f"Esperado: {EXPECTED_SCR_HEADER!r} | Obtido: {first_line!r}"
        )

    sha256_hex = sha256_bytes(csv_bytes)

    with tempfile.NamedTemporaryFile(suffix=f"_{ym}.csv", delete=False) as tmp:
        tmp.write(csv_bytes)
        tmp_path = Path(tmp.name)

    try:
        con = duckdb.connect()
        csv_path_sql = tmp_path.as_posix()
        ne_tuple_sql = "(" + ", ".join(f"'{u}'" for u in NE_UFS) + ")"

        base_cte = f"""
        WITH raw_rows AS (
            SELECT
                uf,
                cliente,
                modalidade,
                porte,
                cnae_ocupacao,
                origem,
                indexador,
                TRY_CAST(numero_de_operacoes AS BIGINT) AS ops,
                CAST(carteira_ativa AS DOUBLE) AS carteira_ativa,
                CAST(carteira_vencida AS DOUBLE) AS carteira_vencida,
                CAST(vencido_de_15_ate_90_dias AS DOUBLE) AS vencido_15_90,
                CAST(carteira_inadimplencia AS DOUBLE) AS carteira_inadimplencia,
                CAST(ativo_problematico AS DOUBLE) AS ativo_problematico,
                CAST(carteira_a_vencer AS DOUBLE) AS carteira_a_vencer
            FROM read_csv(
                '{csv_path_sql}',
                delim=';',
                decimal_separator=',',
                header=true,
                encoding='utf-8'
            )
        ),
        expanded_geo AS (
            SELECT 'BR' AS territory_id, * FROM raw_rows
            UNION ALL
            SELECT 'NE' AS territory_id, * FROM raw_rows WHERE uf IN {ne_tuple_sql}
            UNION ALL
            SELECT 'CE' AS territory_id, * FROM raw_rows WHERE uf = 'CE'
        )
        """

        macro_rows = con.execute(
            base_cte
            + """
            SELECT
                territory_id,
                cliente,
                ROUND(SUM(carteira_ativa), 2) AS carteira_ativa_mil,
                ROUND(SUM(carteira_vencida), 2) AS carteira_vencida_mil,
                ROUND(SUM(vencido_15_90), 2) AS vencido_15_90_mil,
                ROUND(SUM(carteira_inadimplencia), 2) AS carteira_inadimplida_mil,
                ROUND(SUM(ativo_problematico), 2) AS ativo_problematico_mil,
                ROUND(SUM(carteira_a_vencer), 2) AS carteira_a_vencer_mil,
                CAST(SUM(CASE WHEN ops > 0 THEN ops ELSE 0 END) AS BIGINT) AS operacoes_visiveis,
                ROUND(SUM(CASE WHEN ops > 0 THEN carteira_ativa ELSE 0 END), 2) AS carteira_ativa_op_visiveis_mil,
                CAST(COUNT(*) AS BIGINT) AS linhas_total,
                CAST(SUM(CASE WHEN ops <= 0 THEN 1 ELSE 0 END) AS BIGINT) AS linhas_op_suprimidas
            FROM expanded_geo
            GROUP BY territory_id, cliente
            ORDER BY territory_id, cliente
            """
        ).fetchall()

        modality_rows = con.execute(
            base_cte
            + """
            SELECT
                territory_id,
                cliente,
                modalidade,
                ROUND(SUM(carteira_ativa), 2) AS carteira_ativa_mil,
                ROUND(SUM(carteira_vencida), 2) AS carteira_vencida_mil,
                ROUND(SUM(vencido_15_90), 2) AS vencido_15_90_mil,
                ROUND(SUM(carteira_inadimplencia), 2) AS carteira_inadimplida_mil,
                ROUND(SUM(ativo_problematico), 2) AS ativo_problematico_mil,
                CAST(SUM(CASE WHEN ops > 0 THEN ops ELSE 0 END) AS BIGINT) AS operacoes_visiveis,
                ROUND(SUM(CASE WHEN ops > 0 THEN carteira_ativa ELSE 0 END), 2) AS carteira_ativa_op_visiveis_mil,
                CAST(COUNT(*) AS BIGINT) AS linhas_total,
                CAST(SUM(CASE WHEN ops <= 0 THEN 1 ELSE 0 END) AS BIGINT) AS linhas_op_suprimidas
            FROM expanded_geo
            GROUP BY territory_id, cliente, modalidade
            ORDER BY territory_id, cliente, carteira_ativa_mil DESC
            """
        ).fetchall()

        porte_rows = con.execute(
            base_cte
            + """
            SELECT
                territory_id,
                porte,
                ROUND(SUM(carteira_ativa), 2) AS carteira_ativa_mil,
                ROUND(SUM(carteira_vencida), 2) AS carteira_vencida_mil,
                ROUND(SUM(vencido_15_90), 2) AS vencido_15_90_mil,
                ROUND(SUM(carteira_inadimplencia), 2) AS carteira_inadimplida_mil,
                ROUND(SUM(ativo_problematico), 2) AS ativo_problematico_mil,
                CAST(SUM(CASE WHEN ops > 0 THEN ops ELSE 0 END) AS BIGINT) AS operacoes_visiveis,
                ROUND(SUM(CASE WHEN ops > 0 THEN carteira_ativa ELSE 0 END), 2) AS carteira_ativa_op_visiveis_mil,
                CAST(COUNT(*) AS BIGINT) AS linhas_total,
                CAST(SUM(CASE WHEN ops <= 0 THEN 1 ELSE 0 END) AS BIGINT) AS linhas_op_suprimidas
            FROM expanded_geo
            WHERE cliente = 'PF'
            GROUP BY territory_id, porte
            ORDER BY territory_id, carteira_ativa_mil DESC
            """
        ).fetchall()

        ocupacao_rows = con.execute(
            base_cte
            + """
            SELECT
                territory_id,
                cnae_ocupacao,
                ROUND(SUM(carteira_ativa), 2) AS carteira_ativa_mil,
                ROUND(SUM(carteira_vencida), 2) AS carteira_vencida_mil,
                ROUND(SUM(vencido_15_90), 2) AS vencido_15_90_mil,
                ROUND(SUM(carteira_inadimplencia), 2) AS carteira_inadimplida_mil,
                ROUND(SUM(ativo_problematico), 2) AS ativo_problematico_mil,
                CAST(SUM(CASE WHEN ops > 0 THEN ops ELSE 0 END) AS BIGINT) AS operacoes_visiveis,
                ROUND(SUM(CASE WHEN ops > 0 THEN carteira_ativa ELSE 0 END), 2) AS carteira_ativa_op_visiveis_mil,
                CAST(COUNT(*) AS BIGINT) AS linhas_total,
                CAST(SUM(CASE WHEN ops <= 0 THEN 1 ELSE 0 END) AS BIGINT) AS linhas_op_suprimidas
            FROM expanded_geo
            WHERE cliente = 'PF'
            GROUP BY territory_id, cnae_ocupacao
            ORDER BY territory_id, carteira_ativa_mil DESC
            """
        ).fetchall()

        origem_rows = con.execute(
            base_cte
            + """
            SELECT
                territory_id,
                origem,
                ROUND(SUM(carteira_ativa), 2) AS carteira_ativa_mil,
                ROUND(SUM(carteira_vencida), 2) AS carteira_vencida_mil,
                ROUND(SUM(carteira_inadimplencia), 2) AS carteira_inadimplida_mil,
                ROUND(SUM(ativo_problematico), 2) AS ativo_problematico_mil,
                CAST(SUM(CASE WHEN ops > 0 THEN ops ELSE 0 END) AS BIGINT) AS operacoes_visiveis,
                ROUND(SUM(CASE WHEN ops > 0 THEN carteira_ativa ELSE 0 END), 2) AS carteira_ativa_op_visiveis_mil
            FROM expanded_geo
            WHERE cliente = 'PF'
            GROUP BY territory_id, origem
            ORDER BY territory_id, carteira_ativa_mil DESC
            """
        ).fetchall()

        con.close()
    finally:
        tmp_path.unlink(missing_ok=True)

    def pack_metric_row(r: tuple[Any, ...], start_idx: int) -> dict[str, Any]:
        return {
            "carteira_ativa_mil": float(r[start_idx]),
            "carteira_vencida_mil": float(r[start_idx + 1]),
            "vencido_15_90_mil": float(r[start_idx + 2]),
            "carteira_inadimplida_mil": float(r[start_idx + 3]),
            "ativo_problematico_mil": float(r[start_idx + 4]),
            "operacoes_visiveis": int(r[start_idx + 5]),
            "carteira_ativa_op_visiveis_mil": float(r[start_idx + 6]),
            "linhas_total": int(r[start_idx + 7]),
            "linhas_op_suprimidas": int(r[start_idx + 8]),
        }

    macro: dict[str, dict[str, Any]] = {}
    for r in macro_rows:
        t_id, cli = str(r[0]), str(r[1])
        macro.setdefault(t_id, {})[cli] = {
            "carteira_ativa_mil": float(r[2]),
            "carteira_vencida_mil": float(r[3]),
            "vencido_15_90_mil": float(r[4]),
            "carteira_inadimplida_mil": float(r[5]),
            "ativo_problematico_mil": float(r[6]),
            "carteira_a_vencer_mil": float(r[7]),
            "operacoes_visiveis": int(r[8]),
            "carteira_ativa_op_visiveis_mil": float(r[9]),
            "linhas_total": int(r[10]),
            "linhas_op_suprimidas": int(r[11]),
        }

    # Adicionar TOTAL (PF + PJ) por território
    for t_id, cli_map in macro.items():
        if "PF" in cli_map and "PJ" in cli_map:
            pf, pj = cli_map["PF"], cli_map["PJ"]
            cli_map["TOTAL"] = {
                k: round(pf[k] + pj[k], 2) if isinstance(pf[k], float) else int(pf[k] + pj[k])
                for k in pf.keys()
            }

    modalities: dict[str, dict[str, dict[str, Any]]] = {}
    for r in modality_rows:
        t_id, cli, mod = str(r[0]), str(r[1]), str(r[2])
        modalities.setdefault(t_id, {}).setdefault(cli, {})[mod] = pack_metric_row(r, 3)

    porte_pf: dict[str, dict[str, Any]] = {}
    for r in porte_rows:
        t_id, prt = str(r[0]), str(r[1])
        porte_pf.setdefault(t_id, {})[prt] = pack_metric_row(r, 2)

    ocupacao_pf: dict[str, dict[str, Any]] = {}
    for r in ocupacao_rows:
        t_id, ocp = str(r[0]), str(r[1])
        ocupacao_pf.setdefault(t_id, {})[ocp] = pack_metric_row(r, 2)

    origem_pf: dict[str, dict[str, Any]] = {}
    for r in origem_rows:
        t_id, orig = str(r[0]), str(r[1])
        origem_pf.setdefault(t_id, {})[orig] = {
            "carteira_ativa_mil": float(r[2]),
            "carteira_vencida_mil": float(r[3]),
            "carteira_inadimplida_mil": float(r[4]),
            "ativo_problematico_mil": float(r[5]),
            "operacoes_visiveis": int(r[6]),
            "carteira_ativa_op_visiveis_mil": float(r[7]),
        }

    return {
        "ym": ym,
        "period": format_ym(ym),
        "methodology_version": methodology_version_for_ym(ym),
        "sha256": sha256_hex,
        "uncompressed_bytes": len(csv_bytes),
        "compressed_bytes": entry_meta["compressed_bytes"],
        "crc32": entry_meta["crc32"],
        "zip_url": entry_meta["zip_url"],
        "macro": macro,
        "modalities": modalities,
        "porte_pf": porte_pf,
        "ocupacao_pf": ocupacao_pf,
        "origem_pf": origem_pf,
    }


def fetch_and_aggregate_scr_month(entry_meta: dict[str, Any]) -> dict[str, Any]:
    ym = entry_meta["ym"]
    cache_path = ROOT / f"data/raw/cache/scr_monthly/scrdata_{ym}.json"
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    if cache_path.exists() and cache_path.stat().st_size > 0:
        cached = json.loads(cache_path.read_text(encoding="utf-8"))
        if cached.get("crc32") == entry_meta["crc32"] and "macro" in cached:
            return cached

    lfh_offset = int(entry_meta["lfh_offset"])
    comp_size = int(entry_meta["compressed_bytes"])
    end_byte = lfh_offset + 128 + comp_size
    raw_range = fetch_bytes(
        entry_meta["zip_url"],
        timeout=90,
        headers={"Range": f"bytes={lfh_offset}-{end_byte}"},
        decompress_gzip=False,
    )
    _, _, _, _, _, _, _, _, _, fn_len, extra_len = struct.unpack("<4s5H3L2H", raw_range[:30])
    data_start = 30 + fn_len + extra_len
    comp_bytes = raw_range[data_start : data_start + comp_size]
    csv_bytes = zlib.decompress(comp_bytes, -zlib.MAX_WBITS)
    if len(csv_bytes) != int(entry_meta["uncompressed_bytes"]):
        raise ValueError(
            f"Tamanho descompactado divergente em scrdata_{ym}.csv: "
            f"{len(csv_bytes)} vs {entry_meta['uncompressed_bytes']}"
        )

    agg = aggregate_scr_csv_bytes(ym, csv_bytes, entry_meta)
    cache_path.write_text(json.dumps(agg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return agg


def collect_sgs_series(collected_date: str) -> tuple[dict[str, dict[str, float]], list[dict[str, Any]]]:
    series_out: dict[str, dict[str, float]] = {}
    raw_files: list[dict[str, Any]] = []

    for code, info in SGS_SERIES.items():
        rel_path = f"data/raw/bcb/sgs_{code}_{info['key']}_{collected_date}.json"
        raw_bytes, meta = fetch_cached_bytes(info["url"], rel_path, timeout=45)
        parsed = json.loads(raw_bytes.decode("utf-8"))
        if not isinstance(parsed, list) or not parsed:
            raise ValueError(f"Série SGS {code} vazia ou inválida.")
        monthly_map: dict[str, float] = {}
        for item in parsed:
            dt_str = str(item.get("data", "")).strip()
            val_str = str(item.get("valor", "")).strip()
            if len(dt_str) == 10 and val_str:
                # formato DD/MM/AAAA -> AAAA-MM
                period = f"{dt_str[6:10]}-{dt_str[3:5]}"
                if period >= "2018-01":
                    monthly_map[period] = float(val_str)
        series_out[code] = monthly_map
        raw_files.append(
            {
                "source_id": "BCB-RENDA" if code == "29034" else f"BCB-SGS-{code}",
                "url": info["url"],
                "competence": f"{min(monthly_map.keys())}..{max(monthly_map.keys())}",
                "rows": len(parsed),
                "unit": info["unit"],
                "geography": "BR",
                "license": "Dados Abertos BCB",
                "version": f"SGS {code} ({info['name']})",
                **meta,
            }
        )
    return series_out, raw_files


def collect_bcb_sub_series(collected_date: str) -> tuple[dict[str, list[dict[str, Any]]], dict[str, Any]]:
    rel_path = f"data/raw/bcb/scr_sub_regiao_ce_series_{collected_date}.json"
    target = ROOT / rel_path
    if target.exists() and target.stat().st_size > 0:
        by_ym = json.loads(target.read_text(encoding="utf-8"))
    else:
        by_ym = {}
        for ym in BCB_SUB_COMPETENCES:
            base_url = (
                "https://olinda.bcb.gov.br/olinda/servico/scr_sub_regiao/versao/v1/odata/"
                f"scr_sub_regiao(DataBase=@DataBase)?@DataBase={ym}"
            )
            rows = fetch_odata_paginated(base_url, filter_expr="ESTADO eq 'CE'", page_size=1000, timeout=60)
            if not rows:
                raise ValueError(f"BCB-SUB retornou 0 linhas para CE na competência {ym}")
            by_ym[ym] = rows
        write_json(rel_path, by_ym)

    payload_bytes = target.read_bytes()
    total_rows = sum(len(v) for v in by_ym.values())
    meta = {
        "source_id": "BCB-SUB",
        "url": (
            "https://olinda.bcb.gov.br/olinda/servico/scr_sub_regiao/versao/v1/odata/"
            "scr_sub_regiao(DataBase=@DataBase)?$filter=ESTADO%20eq%20%27CE%27"
        ),
        "competence": f"{format_ym(min(by_ym.keys()))}..{format_ym(max(by_ym.keys()))}",
        "rows": total_rows,
        "unit": "Edm.Decimal (escala não declarada no $metadata Olinda; razão de ~1:1000 frente ao R$ do SCR.data; percentual vencido >15d invariante)",
        "geography": "CE por sub-região postal (2 primeiros dígitos do CEP: 60, 61, 62, 63)",
        "license": "Dados Abertos BCB",
        "version": "Olinda scr_sub_regiao v1",
        "path": rel_path,
        "sha256": sha256_bytes(payload_bytes),
        "bytes": len(payload_bytes),
    }
    return by_ym, meta


def collect_bcb_all(
    collected_date: str = "2026-11-06",
    scr_competences: list[str] | None = None,
) -> dict[str, Any]:
    target_competences = scr_competences or DEFAULT_SCR_COMPETENCES
    sgs_series, sgs_raw_files = collect_sgs_series(collected_date)
    sub_by_ym, sub_meta = collect_bcb_sub_series(collected_date)

    # Listar todos os 93 arquivos mensais no diretório central dos ZIPs de 2019 a 2026
    all_zip_entries: dict[str, dict[str, Any]] = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        fut_to_year = {pool.submit(list_scr_zip_entries, y): y for y in range(2019, 2027)}
        for fut in as_completed(fut_to_year):
            all_zip_entries.update(fut.result())

    missing_ym = [ym for ym in target_competences if ym not in all_zip_entries]
    if missing_ym:
        raise ValueError(f"Competências SCR.data ausentes nos arquivos ZIP do BCB: {missing_ym}")

    scr_monthly: dict[str, dict[str, Any]] = {}
    with ThreadPoolExecutor(max_workers=6) as pool:
        fut_to_ym = {
            pool.submit(fetch_and_aggregate_scr_month, all_zip_entries[ym]): ym
            for ym in target_competences
        }
        for idx, fut in enumerate(as_completed(fut_to_ym), 1):
            ym = fut_to_ym[fut]
            scr_monthly[ym] = fut.result()
            print(f"[BCB-SCR] ({idx}/{len(target_competences)}) {ym} concluído", flush=True)

    scr_ordered = {ym: scr_monthly[ym] for ym in sorted(scr_monthly.keys())}

    # Reconciliação entre BCB-SUB (sub-regiões 60..63 no CE) e BCB-SCR (UF=CE)
    reconciliation_sub_vs_scr: dict[str, Any] = {}
    for ym, sub_rows in sorted(sub_by_ym.items()):
        if ym not in scr_ordered:
            continue
        scr_ce = scr_ordered[ym]["macro"]["CE"]
        ym_rec: dict[str, Any] = {}
        for cli in ("PF", "PJ"):
            cli_rows = [r for r in sub_rows if r.get("CLIENTE") == cli]
            sub_cart_raw = round(sum(float(r.get("CARTEIRA") or 0.0) for r in cli_rows), 2)
            sub_venc15_raw = round(sum(float(r.get("VENCIDO_ACIMA_DE_15_DIAS") or 0.0) for r in cli_rows), 2)
            sub_venc15_pct = round((sub_venc15_raw / sub_cart_raw) * 100.0, 4) if sub_cart_raw else 0.0
            scr_cart_brl = round(float(scr_ce[cli]["carteira_ativa_mil"]), 2)
            scr_venc15_brl = round(float(scr_ce[cli]["carteira_vencida_mil"]), 2)
            scr_venc15_pct = round((scr_venc15_brl / scr_cart_brl) * 100.0, 4) if scr_cart_brl else 0.0
            ym_rec[cli] = {
                "sub_carteira_raw": sub_cart_raw,
                "scr_carteira_ativa_brl": scr_cart_brl,
                "ratio_scr_brl_to_sub_raw": round(scr_cart_brl / sub_cart_raw, 2) if sub_cart_raw else None,
                "sub_vencido15_pct": sub_venc15_pct,
                "scr_vencido15_pct": scr_venc15_pct,
                "diff_vencido15_pp": round(sub_venc15_pct - scr_venc15_pct, 4),
            }
        reconciliation_sub_vs_scr[format_ym(ym)] = ym_rec

    scr_summary_rel = f"data/raw/bcb/scr_data_ce_ne_br_{collected_date}.json"
    scr_summary_payload = {
        "collected_at": collected_date,
        "available_zip_entries_count": len(all_zip_entries),
        "available_zip_period_range": f"{format_ym(min(all_zip_entries))}..{format_ym(max(all_zip_entries))}",
        "extracted_competences_count": len(scr_ordered),
        "reconciliation_sub_vs_scr_ce": reconciliation_sub_vs_scr,
        "monthly": scr_ordered,
    }
    scr_summary_path = write_json(scr_summary_rel, scr_summary_payload)
    scr_summary_bytes = scr_summary_path.read_bytes()

    hashes_manifest_rel = "metadata/scr_data_monthly_hashes.json"
    write_json(
        hashes_manifest_rel,
        {
            "generated_at": collected_date,
            "total_zip_catalog_months": len(all_zip_entries),
            "extracted_months_count": len(scr_ordered),
            "extracted_months": {
                ym: {
                    "period": item["period"],
                    "sha256": item["sha256"],
                    "crc32": item["crc32"],
                    "compressed_bytes": item["compressed_bytes"],
                    "uncompressed_bytes": item["uncompressed_bytes"],
                    "methodology_version": item["methodology_version"],
                    "zip_url": item["zip_url"],
                }
                for ym, item in scr_ordered.items()
            },
            "all_catalog_entries": all_zip_entries,
        },
    )

    scr_meta = {
        "source_id": "BCB-SCR",
        "url": "https://www.bcb.gov.br/pda/desig/scrdata_{2019..2026}.zip",
        "competence": f"{format_ym(min(scr_ordered))}..{format_ym(max(scr_ordered))}",
        "rows": len(scr_ordered),
        "unit": "R$ (Reais para saldos de carteira, validado contra SGS 20541) e quantidade de contratos (numero_de_operacoes; <=15 mascarado como -1)",
        "geography": "BR, NE e CE",
        "license": "Dados Abertos BCB / SCR.data",
        "version": "SCR.data Metodologia v2 (pré e pós-jan/2025)",
        "path": scr_summary_rel,
        "sha256": sha256_bytes(scr_summary_bytes),
        "bytes": len(scr_summary_bytes),
        "hashes_manifest": hashes_manifest_rel,
    }

    return {
        "sgs": sgs_series,
        "sub_by_ym": sub_by_ym,
        "scr_monthly": scr_ordered,
        "reconciliation_sub_vs_scr": reconciliation_sub_vs_scr,
        "raw_files": [*sgs_raw_files, sub_meta, scr_meta],
    }
