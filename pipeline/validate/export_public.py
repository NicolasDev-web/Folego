from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from pipeline.extract.http_client import ROOT, sha256_bytes, write_json
from pipeline.transform.facts import TERRITORY_META
from pipeline.transform.indicators import (
    build_observation,
    compute_vencido15_sub_pct,
    derive_scr_slice_metrics,
)
from pipeline.transform.normalize import (
    SchemaNormalizationError,
    normalize_period,
)

PROFILE_SNAPSHOT_PERIODS = (
    "2019-12",
    "2020-12",
    "2021-12",
    "2022-12",
    "2023-12",
    "2024-08",
    "2024-12",
    "2025-01",
    "2025-06",
    "2025-08",
    "2025-12",
    "2026-06",
    "2026-08",
    "2026-09",
)


def load_contract_validator() -> Draft202012Validator:
    contract_path = ROOT / "04_tecnico/CONTRATO_DADOS.json"
    schema = json.loads(contract_path.read_text(encoding="utf-8"))
    return Draft202012Validator(schema)


def validate_observations_against_contract(observations: list[dict[str, Any]]) -> None:
    validator = load_contract_validator()
    for idx, obs in enumerate(observations):
        errors = list(validator.iter_errors(obs))
        if errors:
            first = errors[0]
            raise SchemaNormalizationError(
                f"Violação de CONTRATO_DADOS.json na observação #{idx} "
                f"({obs.get('indicator_id')}, {obs.get('territory_id')}, {obs.get('period')}): "
                f"{first.message}"
            )


def export_state_macro_series(
    *,
    generated_at: str,
    scr_monthly: dict[str, dict[str, Any]],
    sgs_series: dict[str, dict[str, float]],
    ipca_index_by_period: dict[str, float],
    reference_ipca_period: str = "2026-09",
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    series_by_territory: dict[str, dict[str, list[dict[str, Any]]]] = {
        "CE": {"PF": [], "PJ": [], "TOTAL": []},
        "NE": {"PF": [], "PJ": [], "TOTAL": []},
        "BR": {"PF": [], "PJ": [], "TOTAL": []},
    }
    observations: list[dict[str, Any]] = []

    for ym, month_data in sorted(scr_monthly.items()):
        period = month_data["period"]
        zip_url = month_data["zip_url"]
        for t_id in ("CE", "NE", "BR"):
            t_name, t_level, _, _ = TERRITORY_META[t_id]
            for cli in ("PF", "PJ", "TOTAL"):
                slice_d = month_data["macro"][t_id][cli]
                metrics = derive_scr_slice_metrics(
                    slice_d,
                    period=period,
                    ipca_index_by_period=ipca_index_by_period,
                    reference_ipca_period=reference_ipca_period,
                )
                series_by_territory[t_id][cli].append(metrics)

                if cli == "PF":
                    comp_with = [x for x in ("CE", "NE", "BR") if x != t_id]
                    observations.append(
                        build_observation(
                            indicator_id="carteira_pf",
                            territory_id=t_id,
                            territory_name=t_name,
                            territory_level=t_level,
                            period=period,
                            value=metrics["carteira_ativa_brl"],
                            unit="R$",
                            status="observado",
                            source_id="BCB-SCR",
                            source_url=zip_url,
                            universe="Operações de crédito de Pessoas Físicas no SFN",
                            aggregation_rule="soma_estoque_mes",
                            version=metrics["methodology_version"],
                            comparable_with=comp_with,
                            note=f"Valor real (IPCA {reference_ipca_period}): R$ {metrics['carteira_ativa_real_brl']:,.2f}",
                        )
                    )
                    observations.append(
                        build_observation(
                            indicator_id="inad90_carteira",
                            territory_id=t_id,
                            territory_name=t_name,
                            territory_level=t_level,
                            period=period,
                            value=metrics["inad90_pct"],
                            unit="%",
                            status=metrics["inad90_status"],
                            source_id="BCB-SCR",
                            source_url=zip_url,
                            universe="Operações de crédito de Pessoas Físicas no SFN",
                            aggregation_rule="media_ponderada_P_div_C",
                            version=metrics["methodology_version"],
                            comparable_with=comp_with,
                            note="Razão entre carteira inadimplida (>90 dias) e carteira ativa PF; não mede proporção de CPFs.",
                        )
                    )
                    observations.append(
                        build_observation(
                            indicator_id="saldo_operacao",
                            territory_id=t_id,
                            territory_name=t_name,
                            territory_level=t_level,
                            period=period,
                            value=metrics["saldo_operacao_brl"],
                            unit="R$/operação",
                            status=metrics["saldo_operacao_status"],
                            source_id="BCB-SCR",
                            source_url=zip_url,
                            universe="Operações de crédito de Pessoas Físicas no SFN com número de operações > 15",
                            aggregation_rule="razao_carteira_visivel_por_operacoes_visiveis",
                            version=metrics["methodology_version"],
                            comparable_with=comp_with,
                            note="Saldo médio por contrato visível; um indivíduo pode ter múltiplas operações.",
                        )
                    )

    comp_renda_map = sgs_series.get("29034", {})
    for period, val in sorted(comp_renda_map.items()):
        if period >= "2019-01":
            observations.append(
                build_observation(
                    indicator_id="comprometimento_br",
                    territory_id="BR",
                    territory_name="Brasil",
                    territory_level="br",
                    period=period,
                    value=val,
                    unit="%",
                    status="observado",
                    source_id="BCB-RENDA",
                    source_url="https://api.bcb.gov.br/dados/serie/bcdata.sgs.29034/dados?formato=json",
                    universe="Famílias com serviço de dívida no Sistema Financeiro Nacional (série sazonalmente ajustada)",
                    aggregation_rule="serie_sazonalmente_ajustada_bcb",
                    version="SGS-29034-v1",
                    comparable_with=[],
                    note="Indicador macro nacional; sem desagregação oficial por UF ou município.",
                )
            )

    validate_observations_against_contract(observations)

    payload = {
        "schema_version": "1.0.0",
        "generated_at": generated_at,
        "reference_ipca_period": reference_ipca_period,
        "methodology_breaks": [
            {
                "period": "2025-01",
                "source_id": "BCB-SCR",
                "affected_metric": "ativo_problematico_pct",
                "version_before": "sdd-scr-v2-pre2025",
                "version_after": "sdd-scr-v2-pos2025",
                "description": (
                    "A partir de janeiro de 2025, o SCR.data passou a considerar como ativo problemático "
                    "apenas operações marcadas com a característica especial 19 pelas instituições financeiras. "
                    "A série de inadimplência (> 90 dias) permanece comparável."
                ),
            }
        ],
        "series": series_by_territory,
        "comprometimento_renda_pf_br": comp_renda_map,
        "sgs_reference_br": {
            "saldo_pf_br_milhoes_20541": sgs_series.get("20541", {}),
            "inadimplencia_pf_br_pct_21084": sgs_series.get("21084", {}),
        },
        "ipca_monthly_index": ipca_index_by_period,
        "observations": observations,
    }
    return payload, observations


def export_credit_profiles(
    *,
    generated_at: str,
    scr_monthly: dict[str, dict[str, Any]],
    sub_by_ym: dict[str, list[dict[str, Any]]],
    ipca_index_by_period: dict[str, float],
    reference_ipca_period: str = "2026-09",
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    profiles_by_period: dict[str, Any] = {}
    observations: list[dict[str, Any]] = []

    for ym, month_data in sorted(scr_monthly.items()):
        period = month_data["period"]
        if period not in PROFILE_SNAPSHOT_PERIODS:
            continue
        zip_url = month_data["zip_url"]
        p_entry: dict[str, Any] = {"modalidades": {}, "porte_pf": {}, "ocupacao_pf": {}, "origem_pf": {}}

        for t_id in ("CE", "NE", "BR"):
            t_name, t_level, _, _ = TERRITORY_META[t_id]
            p_entry["modalidades"][t_id] = {}
            for cli in ("PF", "PJ"):
                u_mil = float(month_data["macro"][t_id][cli]["carteira_ativa_mil"])
                mod_list: list[dict[str, Any]] = []
                for mod_name, slice_d in month_data["modalities"][t_id].get(cli, {}).items():
                    metrics = derive_scr_slice_metrics(
                        slice_d,
                        period=period,
                        ipca_index_by_period=ipca_index_by_period,
                        reference_ipca_period=reference_ipca_period,
                        universe_carteira_mil=u_mil,
                    )
                    mod_list.append({"modalidade": mod_name, **metrics})
                    if period in ("2024-12", "2025-12", "2026-08", "2026-09") and cli == "PF":
                        observations.append(
                            build_observation(
                                indicator_id="participacao_modalidade",
                                territory_id=t_id,
                                territory_name=t_name,
                                territory_level=t_level,
                                period=period,
                                value=metrics["participacao_pct"],
                                unit="%",
                                status="observado" if metrics["participacao_pct"] is not None else "indisponivel",
                                source_id="BCB-SCR",
                                source_url=zip_url,
                                universe=f"Carteira ativa PF — Modalidade: {mod_name}",
                                aggregation_rule="razao_modalidade_por_carteira_universo",
                                version=metrics["methodology_version"],
                                comparable_with=[x for x in ("CE", "NE", "BR") if x != t_id],
                                note=f"Inadimplência (>90d) na modalidade: {metrics['inad90_pct']}%",
                            )
                        )
                p_entry["modalidades"][t_id][cli] = mod_list

            u_pf_mil = float(month_data["macro"][t_id]["PF"]["carteira_ativa_mil"])
            porte_list: list[dict[str, Any]] = []
            for prt_name, slice_d in month_data["porte_pf"].get(t_id, {}).items():
                metrics = derive_scr_slice_metrics(
                    slice_d,
                    period=period,
                    ipca_index_by_period=ipca_index_by_period,
                    reference_ipca_period=reference_ipca_period,
                    universe_carteira_mil=u_pf_mil,
                )
                porte_list.append({"porte": prt_name, **metrics})
            p_entry["porte_pf"][t_id] = porte_list

            ocp_list: list[dict[str, Any]] = []
            for ocp_name, slice_d in month_data["ocupacao_pf"].get(t_id, {}).items():
                metrics = derive_scr_slice_metrics(
                    slice_d,
                    period=period,
                    ipca_index_by_period=ipca_index_by_period,
                    reference_ipca_period=reference_ipca_period,
                    universe_carteira_mil=u_pf_mil,
                )
                ocp_list.append({"ocupacao": ocp_name, **metrics})
            p_entry["ocupacao_pf"][t_id] = ocp_list

            p_entry["origem_pf"][t_id] = month_data["origem_pf"].get(t_id, {})

        profiles_by_period[period] = p_entry

    # Sub-região postal do Ceará (BCB-SUB 60..63) — sempre territory_level="sub_regiao" e status="parcial"
    subregion_series: dict[str, list[dict[str, Any]]] = {}
    for ym, raw_rows in sorted(sub_by_ym.items()):
        period = normalize_period(ym, source_id="BCB-SUB")
        grouped: dict[tuple[str, str], dict[str, float | int]] = {}
        by_mod: dict[tuple[str, str], list[dict[str, Any]]] = {}
        for r in raw_rows:
            sub_code = str(r.get("SUB_REGIAO", "")).strip()
            cli = str(r.get("CLIENTE", "")).strip()
            mod = str(r.get("MODALIDADE", "")).strip()
            if cli not in ("PF", "PJ") or not sub_code:
                continue
            cart = float(r.get("CARTEIRA") or 0.0)
            venc15 = float(r.get("VENCIDO_ACIMA_DE_15_DIAS") or 0.0)
            ops = int(r.get("OPERACOES") or 0)
            g = grouped.setdefault((sub_code, cli), {"cart": 0.0, "venc15": 0.0, "ops": 0})
            g["cart"] = float(g["cart"]) + cart
            g["venc15"] = float(g["venc15"]) + venc15
            if ops > 0:
                g["ops"] = int(g["ops"]) + ops
            v_pct, _ = compute_vencido15_sub_pct(venc15, cart)
            by_mod.setdefault((sub_code, cli), []).append(
                {
                    "modalidade": mod,
                    "carteira_valor_fonte": round(cart, 2),
                    "vencido15_valor_fonte": round(venc15, 2),
                    "vencido15_pct": v_pct,
                    "operacoes_visiveis": ops if ops > 0 else None,
                }
            )

        period_items: list[dict[str, Any]] = []
        for (sub_code, cli), vals in sorted(grouped.items()):
            c_raw = round(float(vals["cart"]), 2)
            v_raw = round(float(vals["venc15"]), 2)
            v_pct, status = compute_vencido15_sub_pct(v_raw, c_raw)
            period_items.append(
                {
                    "sub_regiao": sub_code,
                    "label": f"Código BCB {sub_code} (prefixo CEP {sub_code}xxx)",
                    "territory_level": "sub_regiao",
                    "cliente": cli,
                    "carteira_valor_fonte": c_raw,
                    "vencido15_valor_fonte": v_raw,
                    "vencido15_pct": v_pct,
                    "operacoes_visiveis": int(vals["ops"]),
                    "status": status,
                    "modalidades": sorted(
                        by_mod.get((sub_code, cli), []),
                        key=lambda x: x["carteira_valor_fonte"],
                        reverse=True,
                    ),
                }
            )
            if cli == "PF":
                observations.append(
                    build_observation(
                        indicator_id="vencido15_sub",
                        territory_id=sub_code,
                        territory_name=f"Código BCB {sub_code}",
                        territory_level="sub_regiao",
                        period=period,
                        value=v_pct,
                        unit="%",
                        status="parcial",
                        source_id="BCB-SUB",
                        source_url=(
                            "https://olinda.bcb.gov.br/olinda/servico/scr_sub_regiao/versao/v1/odata/"
                            f"scr_sub_regiao(DataBase=@DataBase)?@DataBase={ym}&$filter=ESTADO%20eq%20%27CE%27"
                        ),
                        universe="Operações de crédito PF na sub-região postal do Ceará (2 primeiros dígitos do CEP)",
                        aggregation_rule="razao_vencido15_por_carteira_subregiao",
                        version="sdd-scr-sub-v1",
                        comparable_with=[c for c in ("60", "61", "62", "63") if c != sub_code],
                        note=(
                            "Saldo vencido > 15 dias sobre a carteira da sub-região postal; "
                            "não atribuir a municípios e não comparar com inadimplência > 90 dias."
                        ),
                    )
                )
        subregion_series[period] = period_items

    validate_observations_against_contract(observations)

    payload = {
        "schema_version": "1.0.0",
        "generated_at": generated_at,
        "reference_ipca_period": reference_ipca_period,
        "available_periods": sorted(profiles_by_period.keys()),
        "profiles_by_period": profiles_by_period,
        "sub_regiao_ce": {
            "territory_level": "sub_regiao",
            "methodology_note": (
                "Sub-regiões 60, 61, 62 e 63 definidas pelos dois primeiros dígitos do CEP de residência "
                "do cliente no Ceará. Sem tabela oficial de correspondência municipal do BCB; "
                "mantidas estritamente em bloco sub-regional separado com status 'parcial'."
            ),
            "series_by_period": subregion_series,
        },
        "observations": observations,
    }
    return payload, observations


def export_labor_and_surveys(
    *,
    generated_at: str,
    ibge_data: dict[str, Any],
    caged_data: dict[str, Any],
    surveys_data: dict[str, Any],
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    observations: list[dict[str, Any]] = []

    # Observações PEIC (Nacional - BR)
    for period, vals in sorted(surveys_data["peic_nacional"].items()):
        for ind_id, field_key, desc in (
            ("familias_endividadas", "familias_endividadas_pct", "Proporção de famílias endividadas no total de famílias pesquisadas"),
            ("familias_atraso", "familias_atraso_pct", "Proporção de famílias com contas ou dívidas em atraso no total de famílias pesquisadas"),
        ):
            val = vals.get(field_key)
            observations.append(
                build_observation(
                    indicator_id=ind_id,
                    territory_id="BR",
                    territory_name="Brasil",
                    territory_level="br",
                    period=period,
                    value=round(float(val), 2) if val is not None else None,
                    unit="%",
                    status="observado" if val is not None else "indisponivel",
                    source_id="CNC-PEIC",
                    source_url="https://portal-bucket.azureedge.net/wp-content/2026/11/SERIES_PEIC_ENVIO-3.xls",
                    universe="Total de famílias pesquisadas na PEIC Nacional (CNC)",
                    aggregation_rule="proporcao_amostral_total_familias",
                    version="PEIC-CNC-2026",
                    comparable_with=[],
                    note=desc,
                )
            )

    # Observações IPDC / Fecomércio-CE (Fortaleza - capital_pesquisa, 2304400)
    for period, vals in sorted(surveys_data["ipdc_fortaleza"].items()):
        src_url = vals.get("source_url") or "https://www.fecomercio-ce.com.br/pesquisas-e-estudos/"
        for ind_id, field_key, desc in (
            ("consumidores_endividados_ipdc", "familias_endividadas_pct", "Proporção de consumidores de Fortaleza com dívidas declaradas (IPDC/Fecomércio-CE)"),
            ("consumidores_atraso_ipdc", "familias_atraso_pct", "Proporção de consumidores de Fortaleza com contas ou dívidas em atraso (IPDC/Fecomércio-CE)"),
        ):
            val = vals.get(field_key)
            observations.append(
                build_observation(
                    indicator_id=ind_id,
                    territory_id="2304400",
                    territory_name="Fortaleza",
                    territory_level="capital_pesquisa",
                    period=period,
                    value=round(float(val), 2) if val is not None else None,
                    unit="%",
                    status="observado" if val is not None else "indisponivel",
                    source_id="FECOMERCIO-CE-IPDC",
                    source_url=src_url,
                    universe="Consumidores pesquisados em Fortaleza (capital_pesquisa)",
                    aggregation_rule="proporcao_amostral_total_consumidores",
                    version="IPDC-FECOMERCIO-CE-2026",
                    comparable_with=[],
                    note=(
                        desc + (f". Relatório retrospectivo, p. {vals['source_page']}." if vals.get("source_page") else "")
                        if val is not None
                        else "Indicador indisponível na fonte consultada para esta competência."
                    ),
                )
            )

    # Observações PNAD Contínua (4099 desocupação e 6472 rendimento real)
    pnad_desoc = ibge_data["pnad_desocupacao"]
    for t_id, t_obj in pnad_desoc.items():
        t_level = "capital_pesquisa" if t_id == "2304400" else TERRITORY_META[t_id][1]
        for period, item in sorted(t_obj["series"].items()):
            taxa = item.get("taxa_desocupacao_pct")
            cv = item.get("cv_pct")
            observations.append(
                build_observation(
                    indicator_id="taxa_desocupacao_pnad",
                    territory_id=t_id,
                    territory_name=t_obj["name"],
                    territory_level=t_level,
                    period=period,
                    value=taxa,
                    unit="%",
                    status="observado" if taxa is not None else "indisponivel",
                    source_id="IBGE-PNAD-4099",
                    source_url="https://apisidra.ibge.gov.br/values/t/4099/n1/all/n2/2/n3/23/n6/2304400/v/4099,4103/p/all",
                    universe="Pessoas de 14 anos ou mais de idade na força de trabalho (PNAD Contínua Trimestral)",
                    aggregation_rule="estimativa_amostral_trimestral",
                    version="PNAD-CONTINUA-4099",
                    comparable_with=["BR", "NE", "CE", "2304400"],
                    note=f"Coeficiente de variação (CV): {cv}%" if cv is not None else None,
                )
            )

    pnad_rend = ibge_data["pnad_rendimento"]
    for t_id, t_obj in pnad_rend.items():
        t_level = "capital_pesquisa" if t_id == "2304400" else TERRITORY_META[t_id][1]
        for period, item in sorted(t_obj["series"].items()):
            rend_real = item.get("rendimento_habitual_real_brl")
            cv_real = item.get("cv_real_pct")
            observations.append(
                build_observation(
                    indicator_id="rendimento_habitual_real_pnad",
                    territory_id=t_id,
                    territory_name=t_obj["name"],
                    territory_level=t_level,
                    period=period,
                    value=rend_real,
                    unit="R$",
                    status="observado" if rend_real is not None else "indisponivel",
                    source_id="IBGE-PNAD-6472",
                    source_url="https://apisidra.ibge.gov.br/values/t/6472/n1/all/n2/2/n3/23/n6/2304400/v/5933,5941,5929,5937/p/all",
                    universe="Pessoas de 14 anos ou mais ocupadas com rendimento de trabalho (PNAD Contínua Trimestral)",
                    aggregation_rule="estimativa_amostral_trimestral",
                    version="PNAD-CONTINUA-6472",
                    comparable_with=["BR", "NE", "CE", "2304400"],
                    note=f"Rendimento real efetivamente deflacionado pelo IBGE; CV: {cv_real}%" if cv_real is not None else None,
                )
            )

    validate_observations_against_contract(observations)

    # Resumo compacto dos 184 municípios na série ajustada do Novo Caged (2020-01..2026-08)
    caged_mun_summary: dict[str, Any] = {}
    for m_id, m_obj in sorted(caged_data["municipalities"].items()):
        s = m_obj["series"]
        caged_mun_summary[m_id] = {
            "id": m_id,
            "name": m_obj["name"],
            "latest_adjusted_period": "2026-08",
            "latest_adjusted": s.get("2026-08"),
            "ytd_2026": s.get("2026-YTD"),
            "last_12m_202509_202608": s.get("2025-09..2026-08"),
            "annual_balances": {
                str(y): sum(int((s.get(f"{y}-{m:02d}") or {}).get("saldo") or 0) for m in range(1, 13))
                for y in range(2020, 2026)
            },
        }

    payload = {
        "schema_version": "1.0.0",
        "generated_at": generated_at,
        "pnad_continua": {
            "desocupacao_trimestral": pnad_desoc,
            "rendimento_habitual_trimestral": pnad_rend,
        },
        "novo_caged_adjusted": {
            "competence_range": "2020-01..2026-08",
            "reconciliation": caged_data["reconciliation"],
            "macro_series": caged_data["macro"],
            "municipalities_summary": caged_mun_summary,
        },
        "surveys": {
            "peic_nacional_br": surveys_data["peic_nacional"],
            "ipdc_fortaleza_capital": surveys_data["ipdc_fortaleza"],
        },
        "observations": observations,
    }
    return payload, observations


def write_coverage_matrix_full() -> dict[str, Any]:
    base_matrix_path = ROOT / "data/processed/coverage_matrix.csv"
    base_rows: list[dict[str, str]] = []
    if base_matrix_path.exists():
        with base_matrix_path.open("r", encoding="utf-8", newline="") as f:
            base_rows = list(csv.DictReader(f))

    extra_rows = [
        {
            "territory_id": "CE",
            "territory_name": "Ceará",
            "territory_level": "uf",
            "indicator_id": "carteira_pf",
            "period": "2019-08..2026-09",
            "status": "observado",
            "source_id": "BCB-SCR",
            "note": "Saldo da carteira ativa PF em Reais (nominal e deflacionado por IPCA).",
        },
        {
            "territory_id": "CE",
            "territory_name": "Ceará",
            "territory_level": "uf",
            "indicator_id": "inad90_carteira",
            "period": "2019-08..2026-09",
            "status": "observado",
            "source_id": "BCB-SCR",
            "note": "Inadimplência > 90 dias ponderada pela carteira ativa.",
        },
        {
            "territory_id": "CE",
            "territory_name": "Ceará",
            "territory_level": "uf",
            "indicator_id": "saldo_operacao",
            "period": "2019-08..2026-09",
            "status": "observado",
            "source_id": "BCB-SCR",
            "note": "R$/operação calculado sobre linhas com numero_de_operacoes > 15.",
        },
        {
            "territory_id": "CE",
            "territory_name": "Ceará",
            "territory_level": "uf",
            "indicator_id": "participacao_modalidade",
            "period": "2019-12..2026-09",
            "status": "observado",
            "source_id": "BCB-SCR",
            "note": "Participação percentual de cada modalidade no total da carteira.",
        },
        {
            "territory_id": "NE",
            "territory_name": "Nordeste",
            "territory_level": "regiao",
            "indicator_id": "inad90_carteira",
            "period": "2019-08..2026-09",
            "status": "observado",
            "source_id": "BCB-SCR",
            "note": "Agregado regional dos 9 estados do Nordeste ponderado pela carteira.",
        },
        {
            "territory_id": "BR",
            "territory_name": "Brasil",
            "territory_level": "br",
            "indicator_id": "inad90_carteira",
            "period": "2019-08..2026-09",
            "status": "observado",
            "source_id": "BCB-SCR",
            "note": "Agregado nacional ponderado pela carteira.",
        },
        {
            "territory_id": "BR",
            "territory_name": "Brasil",
            "territory_level": "br",
            "indicator_id": "comprometimento_br",
            "period": "2019-01..2026-08",
            "status": "observado",
            "source_id": "BCB-RENDA",
            "note": "Série SGS 29034 de comprometimento de renda das famílias no SFN.",
        },
        {
            "territory_id": "BR",
            "territory_name": "Brasil",
            "territory_level": "br",
            "indicator_id": "familias_endividadas",
            "period": "2025-08..2026-10",
            "status": "observado",
            "source_id": "CNC-PEIC",
            "note": "Proporção de famílias endividadas na PEIC Nacional.",
        },
        {
            "territory_id": "2304400",
            "territory_name": "Fortaleza",
            "territory_level": "capital_pesquisa",
            "indicator_id": "consumidores_endividados_ipdc",
            "period": "2025-04..2026-10",
            "status": "observado",
            "source_id": "FECOMERCIO-CE-IPDC",
            "note": "Pesquisa com consumidores em Fortaleza; 2025-11 recuperado da tabela histórica do relatório de janeiro de 2026.",
        },
        {
            "territory_id": "2304400",
            "territory_name": "Fortaleza",
            "territory_level": "capital_pesquisa",
            "indicator_id": "consumidores_endividados_ipdc",
            "period": "2025-11",
            "status": "observado",
            "source_id": "FECOMERCIO-CE-IPDC",
            "note": "Tabela histórica oficial da Fecomércio-CE, relatório de janeiro de 2026, página 4.",
        },
    ]

    full_path = ROOT / "data/processed/coverage_matrix_full.csv"
    fieldnames = [
        "territory_id",
        "territory_name",
        "territory_level",
        "indicator_id",
        "period",
        "status",
        "source_id",
        "note",
    ]
    all_rows = [*base_rows, *extra_rows]
    with full_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    return {
        "path": full_path.relative_to(ROOT).as_posix(),
        "rows": len(all_rows),
        "sha256": sha256_bytes(full_path.read_bytes()),
    }
