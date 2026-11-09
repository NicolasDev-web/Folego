from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import shutil
import subprocess
import tempfile
import time
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PERIOD = "202609"
FTP_TEMPLATE = (
    "ftp://ftp.mtps.gov.br/pdet/microdados/NOVO%20CAGED/{year}/{period}/"
    "CAGEDMOV{period}.7z"
)
RELEASE_PAGE = (
    "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/"
    "programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/novo-caged/"
    "2026/setembro/pagina-inicial"
)
VALIDATION_PAGE = (
    "https://www.gov.br/secom/pt-br/assuntos/noticias-regionalizadas/"
    "numeros-do-novo-caged-em-2026/09/"
    "ceara-gera-5-1-mil-empregos-com-carteira-assinada-em-setembro"
)

EXPECTED_VALIDATION = {
    "202609": {
        "state_balance": 5156,
        "municipal_balances": {
            "Fortaleza": 1876,
            "Morada Nova": 731,
            "Sobral": 562,
            "Caucaia": 271,
            "Tianguá": 179,
        },
    }
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Agrega o Novo Caged por município do Ceará."
    )
    parser.add_argument("--period", default=DEFAULT_PERIOD, help="Competência AAAAMM.")
    parser.add_argument(
        "--archive",
        type=Path,
        help="Arquivo CAGEDMOV local. Se omitido, o arquivo oficial é baixado.",
    )
    return parser.parse_args()


def download(url: str, destination: Path) -> None:
    request = Request(url, headers={"User-Agent": "Folego/0.4 municipal-employment"})
    last_error: Exception | None = None

    for attempt in range(3):
        try:
            with urlopen(request, timeout=120) as response, destination.open("wb") as handle:
                shutil.copyfileobj(response, handle, length=1024 * 1024)
            return
        except Exception as error:
            last_error = error
            destination.unlink(missing_ok=True)
            if attempt < 2:
                time.sleep(attempt + 1)

    raise RuntimeError(f"Falha ao baixar {url}") from last_error


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_json(relative_path: str, payload: object) -> None:
    path = ROOT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def canonical_municipality_map(context: dict[str, object]) -> dict[str, dict[str, object]]:
    mapping: dict[str, dict[str, object]] = {}
    for municipality in context["municipalities"]:
        short_code = municipality["id"][:6]
        if short_code in mapping:
            raise ValueError(f"Prefixo municipal duplicado: {short_code}.")
        mapping[short_code] = municipality
    if len(mapping) != 184:
        raise ValueError(f"Esperados 184 municípios no contexto; encontrados {len(mapping)}.")
    return mapping


def aggregate_archive(
    archive: Path,
    period: str,
    municipality_map: dict[str, dict[str, object]],
) -> tuple[dict[str, dict[str, int]], int]:
    seven_zip = shutil.which("7z")
    if seven_zip is None:
        raise RuntimeError("7-Zip não encontrado. Instale o comando `7z` para ler o microdado.")

    process = subprocess.Popen(
        [seven_zip, "x", "-so", str(archive)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    assert process.stdout is not None
    stream = io.TextIOWrapper(process.stdout, encoding="utf-8-sig", newline="")
    reader = csv.DictReader(stream, delimiter=";")
    required = {"competênciamov", "uf", "município", "saldomovimentação"}
    if reader.fieldnames is None or not required.issubset(reader.fieldnames):
        raise ValueError(f"Leiaute inesperado no CAGEDMOV: {reader.fieldnames}.")

    totals = {
        code: {"admissions": 0, "dismissals": 0, "balance": 0}
        for code in municipality_map
    }
    movement_counts: defaultdict[int, int] = defaultdict(int)
    ce_rows = 0

    for row in reader:
        if row["competênciamov"] != period or row["uf"] != "23":
            continue
        short_code = row["município"]
        if short_code not in totals:
            raise ValueError(f"Código municipal do Ceará ausente no cadastro: {short_code}.")
        try:
            movement = int(row["saldomovimentação"])
        except ValueError as error:
            raise ValueError(f"Movimentação inválida: {row['saldomovimentação']}.") from error
        if movement not in {-1, 1}:
            raise ValueError(f"Movimentação fora do domínio -1/1: {movement}.")

        ce_rows += 1
        movement_counts[movement] += 1
        totals[short_code]["balance"] += movement
        if movement == 1:
            totals[short_code]["admissions"] += 1
        else:
            totals[short_code]["dismissals"] += 1

    stream.close()
    stderr = process.stderr.read().decode("utf-8", errors="replace") if process.stderr else ""
    return_code = process.wait()
    if return_code != 0:
        raise RuntimeError(f"Falha ao extrair {archive.name}: {stderr.strip()}")
    if ce_rows == 0:
        raise ValueError(f"Nenhuma movimentação do Ceará encontrada em {period}.")
    if movement_counts[1] - movement_counts[-1] != sum(item["balance"] for item in totals.values()):
        raise ValueError("Saldo estadual não fecha com admissões menos desligamentos.")

    return totals, ce_rows


def validate_official_totals(
    period: str,
    totals: dict[str, dict[str, int]],
    municipality_map: dict[str, dict[str, object]],
) -> dict[str, object]:
    expected = EXPECTED_VALIDATION.get(period)
    if expected is None:
        return {"available": False, "reason": "Sem total independente configurado."}

    observed_state_balance = sum(item["balance"] for item in totals.values())
    if observed_state_balance != expected["state_balance"]:
        raise ValueError(
            f"Saldo do Ceará divergente: {observed_state_balance}; "
            f"divulgação oficial: {expected['state_balance']}."
        )

    code_by_name = {
        municipality["name"]: short_code
        for short_code, municipality in municipality_map.items()
    }
    checks: dict[str, dict[str, int]] = {}
    for name, expected_balance in expected["municipal_balances"].items():
        observed = totals[code_by_name[name]]["balance"]
        if observed != expected_balance:
            raise ValueError(
                f"Saldo divergente em {name}: {observed}; divulgação oficial: {expected_balance}."
            )
        checks[name] = {"expected": expected_balance, "observed": observed}

    return {
        "available": True,
        "state_balance": {
            "expected": expected["state_balance"],
            "observed": observed_state_balance,
        },
        "municipal_balances": checks,
        "source_url": VALIDATION_PAGE,
    }


def main() -> None:
    args = parse_args()
    period = args.period
    if len(period) != 6 or not period.isdigit():
        raise ValueError("A competência deve seguir AAAAMM.")

    context_path = ROOT / "data/processed/municipal_context.json"
    if not context_path.exists():
        raise FileNotFoundError("Execute as etapas anteriores do contexto municipal.")
    context = json.loads(context_path.read_text(encoding="utf-8"))
    municipality_map = canonical_municipality_map(context)

    source_url = FTP_TEMPLATE.format(year=period[:4], period=period)
    collected_at = datetime.now(UTC).replace(microsecond=0).isoformat()
    with tempfile.TemporaryDirectory(prefix="folego-caged-") as temp_dir:
        archive = args.archive.resolve() if args.archive else Path(temp_dir) / f"CAGEDMOV{period}.7z"
        if not archive.exists():
            download(source_url, archive)
        archive_bytes = archive.stat().st_size
        archive_hash = file_sha256(archive)
        totals, ce_rows = aggregate_archive(archive, period, municipality_map)

    official_validation = validate_official_totals(period, totals, municipality_map)
    period_label = f"{period[:4]}-{period[4:]}"

    for short_code, municipality in municipality_map.items():
        municipality["formal_employment"] = {
            "period": period_label,
            **totals[short_code],
            "revision": "CAGEDMOV da competência; sem ajustes declarados posteriormente",
        }

    source_id = f"MTE-CAGEDMOV-{period}"
    context["schema_version"] = "1.2.0"
    context["generated_at"] = collected_at
    context["sources"] = [
        source
        for source in context["sources"]
        if not str(source.get("source_id", "")).startswith("MTE-CAGEDMOV-")
    ]
    context["sources"].append(
        {
            "source_id": source_id,
            "label": f"MTE — Novo Caged, {period_label}",
            "url": source_url,
            "period": period_label,
            "metric": "Admissões, desligamentos e saldo de vínculos formais",
            "unit": "vínculos",
            "revision": "CAGEDMOV da competência; sem ajustes declarados posteriormente",
        }
    )
    write_json("data/processed/municipal_context.json", context)
    write_json("app/public/data/municipal_context.json", context)

    processed_path = ROOT / f"data/processed/municipal_employment_{period_label}.csv"
    with processed_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "territory_id",
                "territory_name",
                "period",
                "admissions",
                "dismissals",
                "balance",
                "revision",
                "source_id",
            ],
        )
        writer.writeheader()
        for municipality in context["municipalities"]:
            employment = municipality["formal_employment"]
            writer.writerow(
                {
                    "territory_id": municipality["id"],
                    "territory_name": municipality["name"],
                    "period": period_label,
                    "admissions": employment["admissions"],
                    "dismissals": employment["dismissals"],
                    "balance": employment["balance"],
                    "revision": employment["revision"],
                    "source_id": source_id,
                }
            )

    coverage_path = ROOT / "data/processed/coverage_matrix.csv"
    coverage_updates = 0
    if coverage_path.exists():
        with coverage_path.open("r", encoding="utf-8", newline="") as handle:
            coverage_rows = list(csv.DictReader(handle))
        for row in coverage_rows:
            if row["indicator_id"] == "emprego_saldo":
                row["period"] = period_label
                row["status"] = "observado"
                row["source_id"] = source_id
                row["note"] = "Saldo mensal sem ajustes declarados após a competência."
                coverage_updates += 1
        with coverage_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=coverage_rows[0].keys())
            writer.writeheader()
            writer.writerows(coverage_rows)

    state_admissions = sum(item["admissions"] for item in totals.values())
    state_dismissals = sum(item["dismissals"] for item in totals.values())
    state_balance = sum(item["balance"] for item in totals.values())
    manifest = {
        "schema_version": "1.0.0",
        "collected_at": collected_at,
        "source_id": source_id,
        "source_url": source_url,
        "release_page": RELEASE_PAGE,
        "period": period_label,
        "unit": "vínculos",
        "archive": {
            "name": f"CAGEDMOV{period}.7z",
            "sha256": archive_hash,
            "bytes": archive_bytes,
            "stored_in_repository": False,
            "reason": "Arquivo nacional volumoso; o agregado municipal e o hash são versionados.",
        },
        "aggregation": {
            "filters": {"competênciamov": period, "uf": "23"},
            "municipality_key": "seis primeiros dígitos do código IBGE de sete dígitos",
            "admissions": "contagem de saldomovimentação = 1",
            "dismissals": "contagem de saldomovimentação = -1",
            "balance": "admissions - dismissals",
            "revision": "CAGEDMOV da competência; sem ajustes declarados posteriormente",
        },
        "validation": {
            "municipalities": len(totals),
            "ce_rows": ce_rows,
            "state_admissions": state_admissions,
            "state_dismissals": state_dismissals,
            "state_balance": state_balance,
            "identity_holds": state_admissions - state_dismissals == state_balance,
            "official_cross_check": official_validation,
            "coverage_matrix_updates": coverage_updates,
        },
    }
    write_json("metadata/municipal_employment_manifest.json", manifest)

    print(
        json.dumps(
            {
                "period": period_label,
                "municipalities": len(totals),
                "ce_rows": ce_rows,
                "state_admissions": state_admissions,
                "state_dismissals": state_dismissals,
                "state_balance": state_balance,
                "official_cross_check": official_validation["available"],
                "coverage_matrix_updates": coverage_updates,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
