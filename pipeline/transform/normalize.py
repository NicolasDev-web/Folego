from __future__ import annotations

import re
from typing import Any


class SchemaNormalizationError(ValueError):
    """Erro legível disparado quando uma fonte muda de schema, unidade ou código."""


PERIOD_YYYY_MM_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
PERIOD_YYYYMM_RE = re.compile(r"^\d{4}(0[1-9]|1[0-2])$")
PERIOD_DDMMYYYY_RE = re.compile(r"^(0[1-9]|[12]\d|3[01])/(0[1-9]|1[0-2])/(\d{4})$")
PERIOD_YYYY_RE = re.compile(r"^\d{4}$")
PERIOD_QUARTER_RE = re.compile(r"^\d{4}-T[1-4]$")
PERIOD_SPECIAL_RE = re.compile(r"^(\d{4}-YTD|\d{4}-\d{2}\.\.\d{4}-\d{2})$")


def validate_required_columns(
    actual_columns: list[str] | tuple[str, ...] | set[str],
    expected_columns: list[str] | tuple[str, ...] | set[str],
    source_id: str,
    *,
    allow_extra: bool = False,
) -> None:
    actual_set = {str(c).strip() for c in actual_columns}
    expected_set = {str(c).strip() for c in expected_columns}
    missing = sorted(expected_set - actual_set)
    extra = sorted(actual_set - expected_set)

    if missing or (extra and not allow_extra):
        details: list[str] = []
        if missing:
            details.append(f"colunas ausentes={missing}")
        if extra and not allow_extra:
            details.append(f"colunas inesperadas={extra}")
        raise SchemaNormalizationError(
            f"[{source_id}] Mudança de schema detectada: {', '.join(details)}."
        )


def normalize_period(raw_period: str | int, *, source_id: str = "PIPELINE") -> str:
    text = str(raw_period).strip()
    if not text:
        raise SchemaNormalizationError(f"[{source_id}] Competência/período vazio.")

    if PERIOD_YYYY_MM_RE.match(text):
        return text
    if PERIOD_YYYYMM_RE.match(text):
        return f"{text[:4]}-{text[4:6]}"
    if PERIOD_YYYY_RE.match(text) or PERIOD_QUARTER_RE.match(text) or PERIOD_SPECIAL_RE.match(text):
        return text

    m_br = PERIOD_DDMMYYYY_RE.match(text)
    if m_br:
        _, month, year = m_br.groups()
        return f"{year}-{month}"

    raise SchemaNormalizationError(
        f"[{source_id}] Formato de período não reconhecido: {raw_period!r}."
    )


def normalize_ibge_municipality_code(
    raw_code: str | int,
    *,
    valid_7digit_codes: set[str] | None = None,
    six_to_seven_map: dict[str, str] | None = None,
    source_id: str = "PIPELINE",
) -> str:
    code = str(raw_code).strip()
    if len(code) == 6 and code.isdigit() and six_to_seven_map is not None:
        mapped = six_to_seven_map.get(code)
        if not mapped:
            raise SchemaNormalizationError(
                f"[{source_id}] Código IBGE de 6 dígitos sem correspondência no Ceará: {code!r}."
            )
        code = mapped

    if len(code) != 7 or not code.isdigit() or not code.startswith("23"):
        raise SchemaNormalizationError(
            f"[{source_id}] Código municipal IBGE inválido para o Ceará (esperado 7 dígitos iniciando em 23): {raw_code!r}."
        )

    if valid_7digit_codes is not None and code not in valid_7digit_codes:
        raise SchemaNormalizationError(
            f"[{source_id}] Código municipal IBGE {code!r} não pertence à lista canônica dos 184 municípios do Ceará."
        )

    return code


def normalize_scr_monetary_to_brl(
    value_in_brl: float | int | None,
    *,
    scale: float = 1.0,
    source_id: str = "BCB-SCR",
) -> float | None:
    """
    Normaliza valores monetários do SCR.data (já expressos em Reais R$, scale=1.0,
    conforme metodologia_versao2.pdf e reconciliação com SGS 20541).
    Preserva None sem converter ausência em zero.
    """
    if value_in_brl is None:
        return None
    val = float(value_in_brl)
    if val < 0:
        raise SchemaNormalizationError(
            f"[{source_id}] Valor monetário negativo inesperado em saldo de carteira: {val}."
        )
    return round(val * scale, 2)


def deflate_to_reference_ipca(
    nominal_value: float | int | None,
    period: str,
    ipca_index_by_period: dict[str, float],
    *,
    reference_period: str = "2026-09",
) -> float | None:
    if nominal_value is None:
        return None
    norm_period = normalize_period(period, source_id="IBGE-IPCA")
    norm_ref = normalize_period(reference_period, source_id="IBGE-IPCA")
    idx_period = ipca_index_by_period.get(norm_period)
    idx_ref = ipca_index_by_period.get(norm_ref)
    if idx_period is None or idx_ref is None or idx_period <= 0:
        return None
    return round(float(nominal_value) * (float(idx_ref) / float(idx_period)), 2)


def resolve_scr_methodology_version(period_or_ym: str) -> dict[str, Any]:
    norm_period = normalize_period(period_or_ym, source_id="BCB-SCR")
    is_pos_2025 = norm_period >= "2025-01"
    return {
        "period": norm_period,
        "version": "sdd-scr-v2-pos2025" if is_pos_2025 else "sdd-scr-v2-pre2025",
        "break_period": "2025-01",
        "ativo_problematico_comparable_across_break": False,
        "carteira_and_inad90_comparable": True,
        "methodology_note": (
            "A partir de janeiro de 2025 (Metodologia SCR.data v2 revisada), o campo ativo_problematico "
            "passou a contemplar apenas operações marcadas com a característica especial 19 pelas instituições "
            "financeiras, gerando quebra estrutural nessa série específica."
            if is_pos_2025
            else "Até dezembro de 2024, o campo ativo_problematico seguia o critério anterior à revisão de "
            "janeiro de 2025; não comparar diretamente ativo_problematico pré e pós-2025-01 sem aviso."
        ),
    }
