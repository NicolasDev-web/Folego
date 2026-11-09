from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

from pipeline.extract.http_client import ROOT
from pipeline.transform.indicators import (
    compute_vencido15_sub_pct,
    derive_scr_slice_metrics,
)
from pipeline.transform.normalize import (
    SchemaNormalizationError,
    normalize_period,
    normalize_scr_monetary_to_brl,
)

TERRITORY_META = {
    "BR": ("Brasil", "br", None, False),
    "NE": ("Nordeste", "regiao", "BR", False),
    "CE": ("Ceará", "uf", "NE", False),
}


def build_dim_territory(municipal_context: dict[str, Any]) -> pd.DataFrame:
    rows: list[dict[str, Any]] = [
        {
            "territory_id": "BR",
            "territory_name": "Brasil",
            "territory_level": "br",
            "parent_territory_id": None,
            "region_name": None,
            "can_attribute_to_municipality": False,
        },
        {
            "territory_id": "NE",
            "territory_name": "Nordeste",
            "territory_level": "regiao",
            "parent_territory_id": "BR",
            "region_name": None,
            "can_attribute_to_municipality": False,
        },
        {
            "territory_id": "CE",
            "territory_name": "Ceará",
            "territory_level": "uf",
            "parent_territory_id": "NE",
            "region_name": None,
            "can_attribute_to_municipality": False,
        },
        {
            "territory_id": "2304400",
            "territory_name": "Fortaleza (Pesquisa de Capital)",
            "territory_level": "capital_pesquisa",
            "parent_territory_id": "CE",
            "region_name": "Fortaleza",
            "can_attribute_to_municipality": False,
        },
    ]

    for sub_code in ("60", "61", "62", "63"):
        rows.append(
            {
                "territory_id": sub_code,
                "territory_name": f"Código BCB {sub_code}",
                "territory_level": "sub_regiao",
                "parent_territory_id": "CE",
                "region_name": None,
                "can_attribute_to_municipality": False,
            }
        )

    seen_mun_ids: set[str] = set()
    for mun in municipal_context["municipalities"]:
        m_id = str(mun["id"])
        if m_id in seen_mun_ids:
            raise SchemaNormalizationError(f"Município duplicado em dim_territory: {m_id}")
        seen_mun_ids.add(m_id)
        rows.append(
            {
                "territory_id": m_id,
                "territory_name": str(mun["name"]),
                "territory_level": "municipio",
                "parent_territory_id": "CE",
                "region_name": str(mun.get("region", "Ceará")),
                "can_attribute_to_municipality": True,
            }
        )

    if len(seen_mun_ids) != 184:
        raise SchemaNormalizationError(
            f"Esperados 184 municípios em dim_territory, encontrados {len(seen_mun_ids)}."
        )

    df = pd.DataFrame(rows)
    if df.duplicated(subset=["territory_id", "territory_level"]).any():
        raise SchemaNormalizationError("Chave (territory_id, territory_level) duplicada em dim_territory.")
    return df


def build_dim_indicator() -> pd.DataFrame:
    indicators = [
        (
            "carteira_pf",
            "Saldo de crédito PF",
            "R$",
            "uf,regiao,br",
            "soma_estoque_mes",
            "BCB-SCR",
            "Estoque ao fim do mês; nunca somar meses.",
        ),
        (
            "inad90_carteira",
            "Inadimplência SCR.data (> 90 dias)",
            "%",
            "uf,regiao,br",
            "media_ponderada_P_div_C",
            "BCB-SCR",
            "Ponderação pela carteira ativa; mede carteira, não proporção de pessoas.",
        ),
        (
            "saldo_operacao",
            "Saldo médio por operação visível",
            "R$/operação",
            "uf,regiao,br",
            "razao_carteira_visivel_por_operacoes_visiveis",
            "BCB-SCR",
            "Operações <= 15 são mascaradas como -1 (suprimido); não é dívida por pessoa.",
        ),
        (
            "participacao_modalidade",
            "Participação da modalidade na carteira",
            "%",
            "uf,regiao,br",
            "razao_modalidade_por_carteira_universo",
            "BCB-SCR",
            "Soma das modalidades disjuntas fecha 100% do universo sem duplicar subtotais.",
        ),
        (
            "vencido15_sub",
            "Saldo vencido acima de 15 dias por sub-região postal",
            "%",
            "sub_regiao",
            "razao_vencido15_por_carteira_subregiao",
            "BCB-SUB",
            "Códigos 60..63 sem tabela municipal oficial; nunca comparar com inad90 (>90d).",
        ),
        (
            "familias_endividadas",
            "Proporção de famílias com dívidas declaradas",
            "%",
            "br,capital_pesquisa",
            "proporcao_amostral_total_familias",
            "CNC-PEIC / FECOMERCIO-CE-IPDC",
            "Denominador: total de famílias pesquisadas; inclui contas a vencer.",
        ),
        (
            "familias_atraso",
            "Proporção de famílias com contas ou dívidas em atraso",
            "%",
            "br,capital_pesquisa",
            "proporcao_amostral_total_familias",
            "CNC-PEIC / FECOMERCIO-CE-IPDC",
            "Denominador: total de famílias pesquisadas; critério distinto do SCR (>90d).",
        ),
        (
            "comprometimento_br",
            "Comprometimento de renda das famílias com o serviço da dívida (SFN)",
            "%",
            "br",
            "serie_sazonalmente_ajustada_bcb",
            "BCB-RENDA",
            "Série nacional SGS 29034; não municipalizar.",
        ),
        (
            "populacao_censo",
            "População residente (Censo 2022)",
            "pessoas",
            "municipio,uf,regiao,br",
            "contagem_censitaria",
            "IBGE-SIDRA-4714",
            "Retrato censitário oficial de 2022 para os 184 municípios.",
        ),
        (
            "renda_censo",
            "Rendimento nominal mensal domiciliar per capita (Censo 2022)",
            "R$",
            "municipio,uf,regiao,br",
            "media_e_mediana_censitaria",
            "IBGE-SIDRA-10295",
            "Valores nominais de 2022; exclui pensionistas e empregados domésticos.",
        ),
        (
            "emprego_saldo",
            "Saldo mensal de vínculos formais (Novo Caged)",
            "vínculos",
            "municipio,uf,regiao,br",
            "admissoes_menos_desligamentos",
            "MTE-NOVO-CAGED",
            "Localizado pelo município do estabelecimento.",
        ),
        (
            "taxa_desocupacao_pnad",
            "Taxa de desocupação trimestral (PNAD Contínua)",
            "%",
            "br,regiao,uf,capital_pesquisa",
            "estimativa_amostral_trimestral",
            "IBGE-PNAD-4099",
            "Acompanhada do coeficiente de variação (CV); não disponível para os 184 municípios.",
        ),
        (
            "rendimento_habitual_real_pnad",
            "Rendimento médio real habitual do trabalho principal (PNAD Contínua)",
            "R$",
            "br,regiao,uf,capital_pesquisa",
            "estimativa_amostral_trimestral",
            "IBGE-PNAD-6472",
            "Acompanhado do coeficiente de variação (CV); não disponível para os 184 municípios.",
        ),
        (
            "divida_municipal_direta",
            "Taxa municipal direta de endividamento ou inadimplência PF",
            "%",
            "municipio",
            "nao_aplicavel_indisponivel",
            "PORTAO-VIABILIDADE-D10",
            "Explicitamente indisponível (value=None) após o portão de viabilidade da Fase 00.",
        ),
    ]
    return pd.DataFrame(
        indicators,
        columns=[
            "indicator_id",
            "name",
            "unit",
            "allowed_levels",
            "aggregation_rule",
            "primary_source_id",
            "restrictions",
        ],
    )


def build_scr_facts(
    scr_monthly: dict[str, dict[str, Any]],
    ipca_index_by_period: dict[str, float],
    *,
    reference_ipca_period: str = "2026-09",
) -> tuple[pd.DataFrame, pd.DataFrame]:
    macro_records: list[dict[str, Any]] = []
    profile_records: list[dict[str, Any]] = []

    for ym, month_data in sorted(scr_monthly.items()):
        period = month_data["period"]
        for t_id, cli_map in month_data["macro"].items():
            t_name, t_level, _, _ = TERRITORY_META[t_id]
            # Apenas folhas PF e PJ na tabela fato macro para evitar duplicação com TOTAL!
            for cli in ("PF", "PJ"):
                if cli not in cli_map:
                    continue
                metrics = derive_scr_slice_metrics(
                    cli_map[cli],
                    period=period,
                    ipca_index_by_period=ipca_index_by_period,
                    reference_ipca_period=reference_ipca_period,
                )
                macro_records.append(
                    {
                        "period": period,
                        "territory_id": t_id,
                        "territory_name": t_name,
                        "territory_level": t_level,
                        "cliente": cli,
                        **metrics,
                    }
                )

        # Perfis disjuntos: modalidade (PF e PJ), porte (PF), ocupação (PF), origem (PF)
        for t_id, cli_mod_map in month_data["modalities"].items():
            t_name, t_level, _, _ = TERRITORY_META[t_id]
            for cli, mod_map in cli_mod_map.items():
                if cli not in ("PF", "PJ"):
                    continue
                universe_cart_mil = float(month_data["macro"][t_id][cli]["carteira_ativa_mil"])
                sum_mod_mil = sum(float(m["carteira_ativa_mil"]) for m in mod_map.values())
                if universe_cart_mil > 0 and abs(sum_mod_mil - universe_cart_mil) / universe_cart_mil > 1e-4:
                    raise SchemaNormalizationError(
                        f"Soma das modalidades ({sum_mod_mil}) diverge do total {t_id}/{cli} ({universe_cart_mil}) em {period}."
                    )
                for mod_name, slice_d in mod_map.items():
                    metrics = derive_scr_slice_metrics(
                        slice_d,
                        period=period,
                        ipca_index_by_period=ipca_index_by_period,
                        reference_ipca_period=reference_ipca_period,
                        universe_carteira_mil=universe_cart_mil,
                    )
                    profile_records.append(
                        {
                            "period": period,
                            "territory_id": t_id,
                            "territory_name": t_name,
                            "territory_level": t_level,
                            "cliente": cli,
                            "dimension_type": "modalidade",
                            "dimension_value": mod_name,
                            **metrics,
                        }
                    )

        for dim_type, raw_key in (("porte", "porte_pf"), ("cnae_ocupacao", "ocupacao_pf")):
            for t_id, group_map in month_data[raw_key].items():
                t_name, t_level, _, _ = TERRITORY_META[t_id]
                universe_cart_mil = float(month_data["macro"][t_id]["PF"]["carteira_ativa_mil"])
                sum_grp_mil = sum(float(g["carteira_ativa_mil"]) for g in group_map.values())
                if universe_cart_mil > 0 and abs(sum_grp_mil - universe_cart_mil) / universe_cart_mil > 1e-4:
                    raise SchemaNormalizationError(
                        f"Soma de {dim_type} ({sum_grp_mil}) diverge do total {t_id}/PF ({universe_cart_mil}) em {period}."
                    )
                for grp_name, slice_d in group_map.items():
                    metrics = derive_scr_slice_metrics(
                        slice_d,
                        period=period,
                        ipca_index_by_period=ipca_index_by_period,
                        reference_ipca_period=reference_ipca_period,
                        universe_carteira_mil=universe_cart_mil,
                    )
                    profile_records.append(
                        {
                            "period": period,
                            "territory_id": t_id,
                            "territory_name": t_name,
                            "territory_level": t_level,
                            "cliente": "PF",
                            "dimension_type": dim_type,
                            "dimension_value": grp_name,
                            **metrics,
                        }
                    )

    df_macro = pd.DataFrame(macro_records)
    df_profiles = pd.DataFrame(profile_records)

    if df_macro.duplicated(subset=["period", "territory_id", "cliente"]).any():
        raise SchemaNormalizationError("Duplicidade detectada em fact_scr_macro.")
    if df_profiles.duplicated(
        subset=["period", "territory_id", "cliente", "dimension_type", "dimension_value"]
    ).any():
        raise SchemaNormalizationError("Duplicidade detectada em fact_scr_profiles.")

    return df_macro, df_profiles


def build_subregion_facts(sub_by_ym: dict[str, list[dict[str, Any]]]) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for ym, raw_list in sorted(sub_by_ym.items()):
        period = normalize_period(ym, source_id="BCB-SUB")
        # Agregar por (sub_regiao, cliente) sem misturar com UF ou municípios
        grouped: dict[tuple[str, str], dict[str, float | int]] = {}
        for item in raw_list:
            sub_code = str(item.get("SUB_REGIAO", "")).strip()
            cli = str(item.get("CLIENTE", "")).strip()
            if cli not in ("PF", "PJ") or not sub_code:
                continue
            g = grouped.setdefault(
                (sub_code, cli),
                {"carteira_mil": 0.0, "vencido15_mil": 0.0, "operacoes_visiveis": 0},
            )
            g["carteira_mil"] = float(g["carteira_mil"]) + float(item.get("CARTEIRA") or 0.0)
            g["vencido15_mil"] = float(g["vencido15_mil"]) + float(item.get("VENCIDO_ACIMA_DE_15_DIAS") or 0.0)
            ops = int(item.get("OPERACOES") or 0)
            if ops > 0:
                g["operacoes_visiveis"] = int(g["operacoes_visiveis"]) + ops

        for (sub_code, cli), vals in sorted(grouped.items()):
            cart_raw = round(float(vals["carteira_mil"]), 2)
            venc15_raw = round(float(vals["vencido15_mil"]), 2)
            venc15_pct, status = compute_vencido15_sub_pct(venc15_raw, cart_raw)
            rows.append(
                {
                    "period": period,
                    "territory_id": sub_code,
                    "territory_name": f"Código BCB {sub_code}",
                    "territory_level": "sub_regiao",
                    "cliente": cli,
                    "carteira_valor_fonte": cart_raw,
                    "vencido15_valor_fonte": venc15_raw,
                    "vencido15_pct": venc15_pct,
                    "operacoes_visiveis": int(vals["operacoes_visiveis"]),
                    "status": status,
                }
            )

    df = pd.DataFrame(rows)
    if df.duplicated(subset=["period", "territory_id", "cliente"]).any():
        raise SchemaNormalizationError("Duplicidade detectada em fact_scr_subregion.")
    return df


def save_facts_and_dimensions(
    *,
    municipal_context: dict[str, Any],
    scr_monthly: dict[str, dict[str, Any]],
    sub_by_ym: dict[str, list[dict[str, Any]]],
    ipca_index_by_period: dict[str, float],
    caged_data: dict[str, Any],
    surveys_data: dict[str, Any],
) -> dict[str, Any]:
    out_dir = ROOT / "data/processed"
    out_dir.mkdir(parents=True, exist_ok=True)

    dim_territory = build_dim_territory(municipal_context)
    dim_indicator = build_dim_indicator()
    fact_scr_macro, fact_scr_profiles = build_scr_facts(scr_monthly, ipca_index_by_period)
    fact_scr_subregion = build_subregion_facts(sub_by_ym)

    # Fato Caged ajustado (separando nível macro BR/NE/CE e nível municipal 184 municípios)
    caged_rows: list[dict[str, Any]] = []
    for t_id, series in caged_data["macro"].items():
        t_name, t_level, _, _ = TERRITORY_META[t_id]
        for period, vals in series.items():
            if len(period) == 7:
                caged_rows.append(
                    {
                        "period": period,
                        "territory_id": t_id,
                        "territory_name": t_name,
                        "territory_level": t_level,
                        "estoque": vals.get("estoque"),
                        "admissoes": vals.get("admissoes"),
                        "desligamentos": vals.get("desligamentos"),
                        "saldo": vals.get("saldo"),
                        "variacao_relativa_pct": vals.get("variacao_relativa_pct"),
                    }
                )
    for m_id, m_obj in caged_data["municipalities"].items():
        for period, vals in m_obj["series"].items():
            if len(period) == 7:
                caged_rows.append(
                    {
                        "period": period,
                        "territory_id": m_id,
                        "territory_name": m_obj["name"],
                        "territory_level": "municipio",
                        "estoque": vals.get("estoque"),
                        "admissoes": vals.get("admissoes"),
                        "desligamentos": vals.get("desligamentos"),
                        "saldo": vals.get("saldo"),
                        "variacao_relativa_pct": vals.get("variacao_relativa_pct"),
                    }
                )
    fact_caged_adjusted = pd.DataFrame(caged_rows)
    if fact_caged_adjusted.duplicated(subset=["period", "territory_id", "territory_level"]).any():
        raise SchemaNormalizationError("Duplicidade detectada em fact_caged_adjusted.")

    # Fato pesquisas (PEIC nacional e IPDC Fortaleza capital_pesquisa)
    survey_rows: list[dict[str, Any]] = []
    for period, vals in sorted(surveys_data["peic_nacional"].items()):
        survey_rows.append(
            {
                "period": period,
                "territory_id": "BR",
                "territory_name": "Brasil",
                "territory_level": "br",
                "source_id": "CNC-PEIC",
                "familias_endividadas_pct": vals.get("familias_endividadas_pct"),
                "familias_atraso_pct": vals.get("familias_atraso_pct"),
                "nao_terao_condicao_pagar_pct": vals.get("nao_terao_condicao_pagar_pct"),
                "parcela_renda_comprometida_pct": vals.get("parcela_renda_comprometida_pct"),
                "tipo_cartao_credito_pct_endividados": vals.get("tipo_cartao_credito_pct_endividados"),
                "status": "observado",
            }
        )
    for period, vals in sorted(surveys_data["ipdc_fortaleza"].items()):
        endiv = vals.get("familias_endividadas_pct")
        survey_rows.append(
            {
                "period": period,
                "territory_id": "2304400",
                "territory_name": "Fortaleza",
                "territory_level": "capital_pesquisa",
                "source_id": "FECOMERCIO-CE-IPDC",
                "familias_endividadas_pct": endiv,
                "familias_atraso_pct": vals.get("familias_atraso_pct"),
                "nao_terao_condicao_pagar_pct": vals.get("nao_terao_condicao_pagar_pct"),
                "parcela_renda_comprometida_pct": vals.get("parcela_renda_comprometida_pct"),
                "tipo_cartao_credito_pct_endividados": vals.get("tipo_cartao_credito_pct_endividados"),
                "status": "observado" if endiv is not None else "indisponivel",
            }
        )
    fact_surveys = pd.DataFrame(survey_rows)

    tables = {
        "dim_territory": dim_territory,
        "dim_indicator": dim_indicator,
        "fact_scr_macro": fact_scr_macro,
        "fact_scr_profiles": fact_scr_profiles,
        "fact_scr_subregion": fact_scr_subregion,
        "fact_caged_adjusted": fact_caged_adjusted,
        "fact_surveys": fact_surveys,
    }

    saved_meta: dict[str, Any] = {}
    for name, df in tables.items():
        parquet_path = out_dir / f"{name}.parquet"
        df.to_parquet(parquet_path, index=False)
        saved_meta[name] = {
            "path": parquet_path.relative_to(ROOT).as_posix(),
            "rows": len(df),
            "columns": list(df.columns),
        }

    return {
        "tables": tables,
        "saved_meta": saved_meta,
    }
