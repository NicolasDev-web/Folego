from __future__ import annotations

import argparse
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Callable

from pipeline.extract.bcb_adapter import SGS_SERIES, list_scr_zip_entries
from pipeline.extract.http_client import ROOT, fetch_bytes, write_json


MANIFEST_PATH = ROOT / "metadata/phase02_manifest.json"
DEFAULT_REPORT_PATH = "metadata/source_freshness.json"
MTE_FTP_YEAR = "ftp://ftp.mtps.gov.br/pdet/microdados/NOVO%20CAGED/{year}/"
SIDRA_PERIODS_URL = "https://servicodados.ibge.gov.br/api/v3/agregados/{table}/periodos"

SOURCE_LABELS = {
    "IBGE-SIDRA-1737": "IPCA",
    "IBGE-SIDRA-4099": "PNAD Contínua — desocupação",
    "IBGE-SIDRA-6472": "PNAD Contínua — rendimento",
    "MTE-NOVO-CAGED": "Novo Caged — competência municipal",
    "BCB-SCR": "SCR.data",
    "BCB-RENDA": "Comprometimento de renda (SGS 29034)",
    "BCB-SGS-20541": "Saldo de crédito PF (SGS 20541)",
    "BCB-SGS-21084": "Inadimplência PF (SGS 21084)",
}


def normalized_period(raw_period: str, *, quarterly: bool = False) -> str | None:
    value = str(raw_period).strip()
    quarter = re.fullmatch(r"(20\d{2})-?T([1-4])", value, flags=re.IGNORECASE)
    if quarter:
        return f"{quarter.group(1)}-T{quarter.group(2)}"
    sidra_quarter = re.fullmatch(r"(20\d{2})0([1-4])", value) if quarterly else None
    if sidra_quarter is not None:
        return f"{sidra_quarter.group(1)}-T{sidra_quarter.group(2)}"
    month = re.fullmatch(r"(20\d{2})-?(0[1-9]|1[0-2])", value)
    if month:
        return f"{month.group(1)}-{month.group(2)}"
    year = re.fullmatch(r"20\d{2}", value)
    return value if year else None


def period_sort_key(period: str) -> tuple[int, int, int]:
    normalized = normalized_period(period)
    if normalized is None:
        raise ValueError(f"Período inválido: {period!r}")
    if "-T" in normalized:
        year, quarter = normalized.split("-T")
        return int(year), int(quarter) * 3, 1
    if "-" in normalized:
        year, month = normalized.split("-")
        return int(year), int(month), 2
    return int(normalized), 12, 0


def latest_period_from_competence(competence: str) -> str | None:
    candidates: list[str] = []
    for raw in re.findall(r"20\d{2}(?:-T[1-4]|-(?:0[1-9]|1[0-2]))?", str(competence)):
        normalized = normalized_period(raw)
        if normalized:
            candidates.append(normalized)
    return max(candidates, key=period_sort_key) if candidates else None


def published_periods(manifest: dict[str, Any]) -> dict[str, str]:
    result: dict[str, str] = {}
    for source in manifest.get("raw_files", []):
        source_id = str(source.get("source_id", ""))
        latest = latest_period_from_competence(str(source.get("competence", "")))
        if source_id in SOURCE_LABELS and latest:
            previous = result.get(source_id)
            if previous is None or period_sort_key(latest) > period_sort_key(previous):
                result[source_id] = latest
    return result


def latest_sidra_period(table: str, *, quarterly: bool = False) -> str:
    payload = fetch_bytes(SIDRA_PERIODS_URL.format(table=table), timeout=20, retries=1)
    rows = json.loads(payload.decode("utf-8"))
    periods = [
        normalized_period(str(row.get("id", "")), quarterly=quarterly)
        for row in rows
        if isinstance(row, dict)
    ]
    valid = [period for period in periods if period]
    if not valid:
        raise ValueError(f"SIDRA {table} não retornou competências reconhecíveis.")
    return max(valid, key=period_sort_key)


def latest_mte_period(year: int) -> str:
    now = datetime.now(UTC)
    candidate_years = (year, year - 1) if year == now.year and now.month <= 2 else (year,)
    errors: list[str] = []
    for candidate_year in candidate_years:
        try:
            completed = subprocess.run(
                [
                    "curl",
                    "--silent",
                    "--show-error",
                    "--fail",
                    "--max-time",
                    "12",
                    MTE_FTP_YEAR.format(year=candidate_year),
                ],
                check=True,
                capture_output=True,
                text=True,
                timeout=15,
            )
            periods = re.findall(rf"\b({candidate_year}(?:0[1-9]|1[0-2]))\b", completed.stdout)
            if periods:
                return normalized_period(max(periods)) or ""
        except Exception as error:
            errors.append(f"{candidate_year}: {error}")
    raise ValueError(
        f"Nenhuma competência do Novo Caged encontrada para {year} ou {year - 1}. "
        + " | ".join(errors)
    )


def latest_scr_period(year: int) -> str:
    now = datetime.now(UTC)
    candidate_years = (year, year - 1) if year == now.year and now.month <= 2 else (year,)
    errors: list[str] = []
    for candidate_year in candidate_years:
        try:
            entries = list_scr_zip_entries(candidate_year, timeout=20)
            if entries:
                return normalized_period(max(entries)) or ""
        except Exception as error:
            errors.append(f"{candidate_year}: {error}")
    raise ValueError(
        f"SCR.data não retornou arquivos mensais para {year} ou {year - 1}. "
        + " | ".join(errors)
    )


def latest_sgs_period(code: str) -> str:
    base_url = str(SGS_SERIES[code]["url"]).split("?", 1)[0].rstrip("/")
    payload = fetch_bytes(f"{base_url}/ultimos/1?formato=json", timeout=20, retries=1)
    rows = json.loads(payload.decode("utf-8"))
    periods: list[str] = []
    for row in rows:
        raw_date = str(row.get("data", ""))
        if re.fullmatch(r"\d{2}/\d{2}/20\d{2}", raw_date):
            periods.append(f"{raw_date[6:10]}-{raw_date[3:5]}")
    if not periods:
        raise ValueError(f"SGS {code} não retornou datas reconhecíveis.")
    return max(periods, key=period_sort_key)


def discovery_functions(year: int) -> dict[str, Callable[[], str]]:
    return {
        "IBGE-SIDRA-1737": lambda: latest_sidra_period("1737"),
        "IBGE-SIDRA-4099": lambda: latest_sidra_period("4099", quarterly=True),
        "IBGE-SIDRA-6472": lambda: latest_sidra_period("6472", quarterly=True),
        "MTE-NOVO-CAGED": lambda: latest_mte_period(year),
        "BCB-SCR": lambda: latest_scr_period(year),
        "BCB-RENDA": lambda: latest_sgs_period("29034"),
        "BCB-SGS-20541": lambda: latest_sgs_period("20541"),
        "BCB-SGS-21084": lambda: latest_sgs_period("21084"),
    }


def build_freshness_report(
    manifest: dict[str, Any],
    *,
    year: int,
    discoverers: dict[str, Callable[[], str]] | None = None,
) -> dict[str, Any]:
    published = published_periods(manifest)
    source_discoverers = discoverers or discovery_functions(year)

    def check_source(source_id: str, discover: Callable[[], str]) -> dict[str, Any]:
        item: dict[str, Any] = {
            "source_id": source_id,
            "label": SOURCE_LABELS[source_id],
            "published_period": published.get(source_id),
        }
        if source_id == "MTE-NOVO-CAGED":
            item["availability_note"] = (
                "A disponibilidade vem do diretório oficial de microdados. A série ajustada só avança "
                "após validação da planilha de tabelas da mesma competência."
            )
        try:
            available = discover()
            item["available_period"] = available
            if item["published_period"] is None:
                item["status"] = "not_tracked"
            elif period_sort_key(available) > period_sort_key(item["published_period"]):
                item["status"] = "new_available"
            else:
                item["status"] = "current"
        except Exception as error:  # Mantém as demais fontes auditáveis se uma delas oscilar.
            item["available_period"] = None
            item["status"] = "check_failed"
            item["error"] = f"{type(error).__name__}: {error}"
        return item

    with ThreadPoolExecutor(max_workers=len(source_discoverers)) as pool:
        futures = {
            source_id: pool.submit(check_source, source_id, discover)
            for source_id, discover in source_discoverers.items()
        }
        checks = [futures[source_id].result() for source_id in source_discoverers]

    return {
        "schema_version": "1.0.0",
        "checked_at": datetime.now(UTC).replace(microsecond=0).isoformat(),
        "publication_policy": "Somente alerta; nenhuma competência é publicada automaticamente.",
        "summary": {
            "sources_checked": len(checks),
            "new_available": sum(item["status"] == "new_available" for item in checks),
            "check_failed": sum(item["status"] == "check_failed" for item in checks),
        },
        "checks": checks,
    }


def markdown_summary(report: dict[str, Any]) -> str:
    lines = ["## Atualização das fontes oficiais", ""]
    for item in report["checks"]:
        lines.append(
            f"- **{item['label']}**: `{item['status']}` "
            f"(publicado: {item['published_period'] or '-'}; "
            f"disponível: {item['available_period'] or '-'})"
        )
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compara a cobertura publicada com as competências disponíveis nas fontes oficiais.",
    )
    parser.add_argument("--manifest", type=Path, default=MANIFEST_PATH)
    parser.add_argument("--output", default=DEFAULT_REPORT_PATH)
    parser.add_argument("--summary", type=Path, help="Arquivo Markdown opcional para o resumo da execução.")
    parser.add_argument("--year", type=int, default=datetime.now(UTC).year)
    args = parser.parse_args()

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    report = build_freshness_report(manifest, year=args.year)
    report_path = write_json(args.output, report)
    if args.summary:
        args.summary.parent.mkdir(parents=True, exist_ok=True)
        args.summary.write_text(markdown_summary(report), encoding="utf-8")

    for item in report["checks"]:
        print(
            f"[{item['status']}] {item['label']}: "
            f"publicado={item['published_period'] or '-'} | disponível={item['available_period'] or '-'}"
        )
    print(f"Relatório salvo em {report_path.relative_to(ROOT).as_posix()}.")
    return 1 if report["summary"]["check_failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
