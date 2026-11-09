from __future__ import annotations

from typing import Any

from pipeline.transform.normalize import (
    SchemaNormalizationError,
    deflate_to_reference_ipca,
    normalize_period,
    normalize_scr_monetary_to_brl,
    resolve_scr_methodology_version,
)

VALID_TERRITORY_LEVELS = {"br", "regiao", "uf", "BR", "UF", "sub_regiao", "capital_pesquisa", "municipio"}
VALID_STATUSES = {"observado", "parcial", "suprimido", "indisponivel", "nao_aplicavel", "erro"}

CONTRACT_TERRITORY_LEVEL_MAP = {
    "br": "BR",
    "regiao": "BR",
    "BR": "BR",
    "uf": "UF",
    "UF": "UF",
    "sub_regiao": "sub_regiao",
    "capital_pesquisa": "capital_pesquisa",
    "municipio": "municipio",
}


def build_observation(
    *,
    indicator_id: str,
    territory_id: str,
    territory_name: str,
    territory_level: str,
    period: str,
    value: float | int | None,
    unit: str,
    status: str,
    source_id: str,
    source_url: str,
    universe: str,
    aggregation_rule: str,
    version: str,
    comparable_with: list[str] | None = None,
    note: str | None = None,
    numerator: float | int | None = None,
    denominator: float | int | None = None,
    dimensions: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if territory_level not in VALID_TERRITORY_LEVELS:
        raise SchemaNormalizationError(f"Nível territorial inválido: {territory_level!r}")
    if status not in VALID_STATUSES:
        raise SchemaNormalizationError(f"Status de observação inválido: {status!r}")

    norm_period = normalize_period(period, source_id=source_id)

    if status in ("indisponivel", "suprimido", "nao_aplicavel", "erro"):
        if value is not None:
            raise SchemaNormalizationError(
                f"Observação com status {status!r} ({indicator_id}, {territory_id}, {norm_period}) "
                f"não pode ter valor numérico ({value!r}); deve ser None."
            )
    else:
        if value is None or isinstance(value, bool) or not isinstance(value, (int, float)):
            raise SchemaNormalizationError(
                f"Observação com status {status!r} ({indicator_id}, {territory_id}, {norm_period}) "
                "exige valor numérico válido."
            )

    contract_level = CONTRACT_TERRITORY_LEVEL_MAP[territory_level]
    contract_status = "indisponivel" if status == "erro" else status

    obs: dict[str, Any] = {
        "source_id": str(source_id),
        "metric_id": str(indicator_id),
        "indicator_id": str(indicator_id),
        "territory_id": str(territory_id),
        "territory_name": str(territory_name),
        "territory_level": contract_level,
        "period": norm_period,
        "value": round(float(value), 2) if isinstance(value, float) else value,
        "unit": str(unit),
        "status": contract_status,
        "source_url": str(source_url),
        "universe": str(universe),
        "aggregation_rule": str(aggregation_rule),
        "methodology_version": str(version),
        "version": str(version),
    }
    if numerator is not None:
        obs["numerator"] = round(float(numerator), 2) if isinstance(numerator, float) else numerator
    if denominator is not None:
        obs["denominator"] = round(float(denominator), 2) if isinstance(denominator, float) else denominator
    if dimensions:
        obs["dimensions"] = dict(dimensions)
    if comparable_with is not None:
        obs["comparable_with"] = list(comparable_with)
    if note:
        obs["note"] = str(note)
        obs["notes"] = [str(note)]
    return obs


def compute_inad90_pct(
    carteira_inadimplida: float | int | None,
    carteira_ativa: float | int | None,
) -> tuple[float | None, str]:
    if carteira_inadimplida is None or carteira_ativa is None:
        return None, "indisponivel"
    denom = float(carteira_ativa)
    num = float(carteira_inadimplida)
    if denom <= 0:
        return None, "indisponivel"
    if num < 0:
        raise SchemaNormalizationError(f"Numerador negativo inválido em inad90_carteira: {num}")
    return round((num / denom) * 100.0, 2), "observado"


def compute_weighted_rate_pct(
    slices: list[tuple[float | int | None, float | int | None]],
) -> tuple[float | None, str]:
    """Calcula taxa percentual ponderada pela carteira: SUM(numerador) / SUM(denominador) * 100."""
    valid_pairs = [
        (float(num), float(den))
        for num, den in slices
        if num is not None and den is not None and float(den) > 0
    ]
    if not valid_pairs:
        return None, "indisponivel"
    total_num = sum(p[0] for p in valid_pairs)
    total_den = sum(p[1] for p in valid_pairs)
    if total_den <= 0:
        return None, "indisponivel"
    return round((total_num / total_den) * 100.0, 2), "observado"


def compute_saldo_operacao(
    carteira_brl: float | int | None,
    numero_de_operacoes: int | None,
    *,
    has_suppressed_rows: bool = False,
) -> tuple[float | None, str]:
    """
    Calcula R$/operação respeitando a regra de sigilo do SCR.data:
    - Quando numero_de_operacoes == -1 (<= 15 operações), retorna (None, 'suprimido').
    - Quando numero_de_operacoes == 0 ou None, retorna (None, 'suprimido' se has_suppressed_rows senão 'indisponivel').
    """
    if numero_de_operacoes is None or carteira_brl is None:
        return None, "indisponivel"
    ops = int(numero_de_operacoes)
    if ops < 0:
        return None, "suprimido"
    if ops == 0:
        return None, ("suprimido" if has_suppressed_rows else "indisponivel")
    val = float(carteira_brl)
    if val < 0:
        raise SchemaNormalizationError(f"Carteira negativa inválida em saldo_operacao: {val}")
    return round(val / ops, 2), "observado"


def compute_participacao_modalidade_pct(
    carteira_modalidade: float | int | None,
    carteira_universo: float | int | None,
) -> tuple[float | None, str]:
    if carteira_modalidade is None or carteira_universo is None:
        return None, "indisponivel"
    denom = float(carteira_universo)
    num = float(carteira_modalidade)
    if denom <= 0:
        return None, "indisponivel"
    if num < 0 or num > denom * 1.0001:
        raise SchemaNormalizationError(
            f"Participação de modalidade inválida: modalidade={num} excede universo={denom}."
        )
    return round((num / denom) * 100.0, 2), "observado"


def compute_vencido15_sub_pct(
    vencido_acima_15_dias: float | int | None,
    carteira_sub_regiao: float | int | None,
) -> tuple[float | None, str]:
    """
    Calcula o percentual vencido > 15 dias na sub-região postal do BCB-SUB.
    Status é sempre 'parcial' quando há dado porque SUB_REGIAO (60..63) não possui
    tabela oficial de correspondência municipal publicada pelo BCB.
    """
    if vencido_acima_15_dias is None or carteira_sub_regiao is None:
        return None, "indisponivel"
    denom = float(carteira_sub_regiao)
    num = float(vencido_acima_15_dias)
    if denom <= 0:
        return None, "indisponivel"
    return round((num / denom) * 100.0, 2), "parcial"


def derive_scr_slice_metrics(
    slice_dict: dict[str, Any],
    *,
    period: str,
    ipca_index_by_period: dict[str, float],
    reference_ipca_period: str = "2026-09",
    universe_carteira_mil: float | None = None,
) -> dict[str, Any]:
    cart_mil = float(slice_dict.get("carteira_ativa_mil", 0.0))
    venc_mil = float(slice_dict.get("carteira_vencida_mil", 0.0))
    venc15_90_mil = float(slice_dict.get("vencido_15_90_mil", 0.0))
    inad90_mil = float(slice_dict.get("carteira_inadimplida_mil", 0.0))
    at_prob_mil = float(slice_dict.get("ativo_problematico_mil", 0.0))
    ops_vis = int(slice_dict.get("operacoes_visiveis", 0))
    cart_ops_vis_mil = float(slice_dict.get("carteira_ativa_op_visiveis_mil", 0.0))
    linhas_sup = int(slice_dict.get("linhas_op_suprimidas", 0))

    cart_brl = normalize_scr_monetary_to_brl(cart_mil)
    cart_real_brl = deflate_to_reference_ipca(
        cart_brl,
        period,
        ipca_index_by_period,
        reference_period=reference_ipca_period,
    )
    inad90_brl = normalize_scr_monetary_to_brl(inad90_mil)
    venc15_brl = normalize_scr_monetary_to_brl(venc_mil)
    at_prob_brl = normalize_scr_monetary_to_brl(at_prob_mil)

    inad90_pct, inad90_status = compute_inad90_pct(inad90_mil, cart_mil)
    venc15_pct, _ = compute_inad90_pct(venc_mil, cart_mil)
    at_prob_pct, _ = compute_inad90_pct(at_prob_mil, cart_mil)

    cart_ops_vis_brl = normalize_scr_monetary_to_brl(cart_ops_vis_mil)
    saldo_op_brl, saldo_op_status = compute_saldo_operacao(
        cart_ops_vis_brl,
        ops_vis,
        has_suppressed_rows=(linhas_sup > 0),
    )
    saldo_op_real_brl = deflate_to_reference_ipca(
        saldo_op_brl,
        period,
        ipca_index_by_period,
        reference_period=reference_ipca_period,
    )

    part_pct: float | None = None
    if universe_carteira_mil is not None:
        part_pct, _ = compute_participacao_modalidade_pct(cart_mil, universe_carteira_mil)

    ver_meta = resolve_scr_methodology_version(period)

    return {
        "period": ver_meta["period"],
        "methodology_version": ver_meta["version"],
        "carteira_ativa_brl": cart_brl,
        "carteira_ativa_real_brl": cart_real_brl,
        "carteira_inadimplida_brl": inad90_brl,
        "carteira_vencida15_brl": venc15_brl,
        "vencido_15_90_brl": normalize_scr_monetary_to_brl(venc15_90_mil),
        "ativo_problematico_brl": at_prob_brl,
        "inad90_pct": inad90_pct,
        "inad90_status": inad90_status,
        "vencido15_pct": venc15_pct,
        "ativo_problematico_pct": at_prob_pct,
        "operacoes_visiveis": ops_vis,
        "linhas_op_suprimidas": linhas_sup,
        "saldo_operacao_brl": saldo_op_brl,
        "saldo_operacao_real_brl": saldo_op_real_brl,
        "saldo_operacao_status": saldo_op_status,
        "participacao_pct": part_pct,
    }
