from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import math
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
CBO_URL = (
    "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/cbo/servicos/downloads/"
    "cbo2002-ocupacao.csv"
)
SALARY_METHODOLOGY_URL = (
    "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/"
    "programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/novo-caged/"
    "2026/setembro/sumario-executivo_setembro-de-2026.pdf/@@download/file"
)
MINIMUM_WAGE_BY_YEAR = {"2026": 1621.00}
MINIMUM_WAGE_SOURCE = (
    "https://www.gov.br/esocial/pt-br/noticias/"
    "novo-salario-minimo-2026-veja-como-registrar-o-reajuste-no-esocial-domestico"
)
EXPECTED_STATE_SALARY = {"202609": 2081.38}
SALARY_EXCLUSIONS = ("missing_or_nonpositive", "below_minimum", "above_maximum", "intermittent")

CNAE_SECTIONS = {
    "A": "Agropecuária",
    "B": "Indústrias extrativas",
    "C": "Indústrias de transformação",
    "D": "Eletricidade e gás",
    "E": "Água, esgoto e resíduos",
    "F": "Construção",
    "G": "Comércio e reparação de veículos",
    "H": "Transporte, armazenagem e correio",
    "I": "Alojamento e alimentação",
    "J": "Informação e comunicação",
    "K": "Atividades financeiras e seguros",
    "L": "Atividades imobiliárias",
    "M": "Atividades profissionais e técnicas",
    "N": "Atividades administrativas",
    "O": "Administração pública",
    "P": "Educação",
    "Q": "Saúde e serviços sociais",
    "R": "Artes, cultura e esporte",
    "S": "Outras atividades de serviços",
    "T": "Serviços domésticos",
    "U": "Organismos internacionais",
}

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
    parser.add_argument(
        "--cbo",
        type=Path,
        help="Dicionário CBO local. Se omitido, a tabela oficial é baixada.",
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


def load_cbo_titles(path: Path) -> dict[str, str]:
    with path.open("r", encoding="latin-1", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")
        if reader.fieldnames != ["CODIGO", "TITULO"]:
            raise ValueError(f"Leiaute inesperado no dicionário CBO: {reader.fieldnames}.")
        titles = {row["CODIGO"]: row["TITULO"].strip() for row in reader}
    if len(titles) < 2_000:
        raise ValueError(f"Dicionário CBO incompleto: somente {len(titles)} ocupações.")
    return titles


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


def salary_bounds(period: str) -> tuple[float, float]:
    minimum_wage = MINIMUM_WAGE_BY_YEAR.get(period[:4])
    if minimum_wage is None:
        raise ValueError(f"Salário mínimo não configurado para a competência {period}.")
    return round(minimum_wage * 0.3, 2), minimum_wage * 150


def classify_admission_salary(
    raw_salary: str, intermittent: str, bounds: tuple[float, float]
) -> tuple[float, str | None]:
    if intermittent not in {"0", "1"}:
        raise ValueError(f"Indicador de trabalho intermitente inválido: {intermittent!r}.")
    try:
        salary = float(raw_salary.replace(".", "").replace(",", "."))
    except ValueError:
        return 0.0, "missing_or_nonpositive"
    if not math.isfinite(salary) or salary <= 0:
        return 0.0, "missing_or_nonpositive"
    if salary < bounds[0]:
        return salary, "below_minimum"
    if salary > bounds[1]:
        return salary, "above_maximum"
    if intermittent == "1":
        return salary, "intermittent"
    return salary, None


def validate_official_salary(
    period: str, salaries: dict[str, dict[str, float | int]]
) -> dict[str, object]:
    count = sum(int(item["count"]) for item in salaries.values())
    total = sum(float(item["sum"]) for item in salaries.values())
    observed = round(total / count, 2) if count else None
    expected = EXPECTED_STATE_SALARY.get(period)
    if expected is None:
        raise ValueError(f"Média salarial oficial não configurada para {period}.")
    if observed != expected:
        raise ValueError(
            f"Salário médio do Ceará divergente: {observed}; divulgação oficial: {expected}."
        )
    return {
        "expected": expected,
        "observed": observed,
        "eligible_admissions": count,
        "salary_sum": round(total, 2),
        "excluded_admissions": {
            reason: sum(int(item[reason]) for item in salaries.values())
            for reason in SALARY_EXCLUSIONS
        },
        "exclusion_counts_are_disjoint": True,
        "source_url": SALARY_METHODOLOGY_URL,
    }


def aggregate_archive(
    archive: Path,
    period: str,
    municipality_map: dict[str, dict[str, object]],
) -> tuple[
    dict[str, dict[str, int]],
    dict[str, dict[str, dict[str, int]]],
    dict[str, dict[str, dict[str, int]]],
    dict[str, dict[str, float | int]],
    int,
]:
    bounds = salary_bounds(period)
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
    required = {
        "competênciamov",
        "uf",
        "município",
        "saldomovimentação",
        "cbo2002ocupação",
        "seção",
        "salário",
        "indtrabintermitente",
    }
    if reader.fieldnames is None or not required.issubset(reader.fieldnames):
        raise ValueError(f"Leiaute inesperado no CAGEDMOV: {reader.fieldnames}.")

    totals = {
        code: {"admissions": 0, "dismissals": 0, "balance": 0}
        for code in municipality_map
    }
    occupation_totals: dict[str, dict[str, dict[str, int]]] = {
        code: {} for code in municipality_map
    }
    sector_totals: dict[str, dict[str, dict[str, int]]] = {
        code: {} for code in municipality_map
    }
    admission_salaries: dict[str, dict[str, float | int]] = {
        code: {"sum": 0.0, "count": 0, **dict.fromkeys(SALARY_EXCLUSIONS, 0)}
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
        occupation_code = row["cbo2002ocupação"]
        section_code = row["seção"] or "?"
        occupation = occupation_totals[short_code].setdefault(
            occupation_code,
            {"admissions": 0, "dismissals": 0, "balance": 0},
        )
        sector = sector_totals[short_code].setdefault(
            section_code,
            {"admissions": 0, "dismissals": 0, "balance": 0},
        )
        occupation["balance"] += movement
        sector["balance"] += movement
        if movement == 1:
            totals[short_code]["admissions"] += 1
            occupation["admissions"] += 1
            sector["admissions"] += 1
            salary, exclusion = classify_admission_salary(
                row["salário"], row["indtrabintermitente"], bounds
            )
            if exclusion is None:
                admission_salaries[short_code]["sum"] += salary
                admission_salaries[short_code]["count"] += 1
            else:
                admission_salaries[short_code][exclusion] += 1
        else:
            totals[short_code]["dismissals"] += 1
            occupation["dismissals"] += 1
            sector["dismissals"] += 1

    stream.close()
    stderr = process.stderr.read().decode("utf-8", errors="replace") if process.stderr else ""
    return_code = process.wait()
    if return_code != 0:
        raise RuntimeError(f"Falha ao extrair {archive.name}: {stderr.strip()}")
    if ce_rows == 0:
        raise ValueError(f"Nenhuma movimentação do Ceará encontrada em {period}.")
    if movement_counts[1] - movement_counts[-1] != sum(item["balance"] for item in totals.values()):
        raise ValueError("Saldo estadual não fecha com admissões menos desligamentos.")

    return totals, occupation_totals, sector_totals, admission_salaries, ce_rows


def occupation_record(
    code: str,
    values: dict[str, int],
    cbo_titles: dict[str, str],
) -> dict[str, object]:
    return {
        "code": code,
        "title": cbo_titles.get(code, f"Ocupação não identificada ({code})"),
        **values,
    }


def employment_details(
    occupation_values: dict[str, dict[str, int]],
    sector_values: dict[str, dict[str, int]],
    salaries: dict[str, float | int],
    cbo_titles: dict[str, str],
) -> dict[str, object]:
    positive = [
        occupation_record(code, values, cbo_titles)
        for code, values in occupation_values.items()
        if values["balance"] > 0
    ]
    negative = [
        occupation_record(code, values, cbo_titles)
        for code, values in occupation_values.items()
        if values["balance"] < 0
    ]
    positive.sort(
        key=lambda item: (item["balance"], item["admissions"], item["title"]),
        reverse=True,
    )
    negative.sort(key=lambda item: (item["balance"], -item["dismissals"], item["title"]))

    sectors = [
        {
            "code": code,
            "title": CNAE_SECTIONS.get(code, f"Seção CNAE {code}"),
            **values,
        }
        for code, values in sector_values.items()
    ]
    sectors.sort(
        key=lambda item: (item["admissions"] + item["dismissals"], abs(item["balance"])),
        reverse=True,
    )

    salary_count = int(salaries["count"])
    average_salary = (
        round(float(salaries["sum"]) / salary_count, 2) if salary_count > 0 else None
    )
    return {
        "top_occupations": positive[:5],
        "declining_occupations": negative[:3],
        "busiest_sectors": sectors[:3],
        "average_admission_salary": average_salary,
        "salary_observations": salary_count,
    }


def write_occupation_facts(
    period_label: str,
    source_id: str,
    municipality_map: dict[str, dict[str, object]],
    occupation_totals: dict[str, dict[str, dict[str, int]]],
    cbo_titles: dict[str, str],
) -> tuple[str, int, int]:
    relative_path = f"data/processed/municipal_employment_occupations_{period_label}.csv"
    path = ROOT / relative_path
    missing_titles: set[str] = set()
    rows = 0
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "territory_id",
                "territory_name",
                "period",
                "occupation_code",
                "occupation_title",
                "admissions",
                "dismissals",
                "balance",
                "source_id",
            ],
        )
        writer.writeheader()
        for short_code, municipality in municipality_map.items():
            ordered = sorted(occupation_totals[short_code].items())
            for occupation_code, values in ordered:
                title = cbo_titles.get(occupation_code)
                if title is None:
                    missing_titles.add(occupation_code)
                    title = f"Ocupação não identificada ({occupation_code})"
                writer.writerow(
                    {
                        "territory_id": municipality["id"],
                        "territory_name": municipality["name"],
                        "period": period_label,
                        "occupation_code": occupation_code,
                        "occupation_title": title,
                        **values,
                        "source_id": source_id,
                    }
                )
                rows += 1
    return relative_path, rows, len(missing_titles)


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
    collected_date = collected_at[:10]
    cbo_raw_relative = f"data/raw/mte/cbo2002_ocupacao_{collected_date}.csv"
    if args.cbo and args.cbo.resolve().parent == (ROOT / "data/raw/mte").resolve():
        cbo_raw_relative = args.cbo.resolve().relative_to(ROOT).as_posix()
    cbo_raw_path = ROOT / cbo_raw_relative
    cbo_raw_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="folego-caged-") as temp_dir:
        archive = args.archive.resolve() if args.archive else Path(temp_dir) / f"CAGEDMOV{period}.7z"
        if not archive.exists():
            download(source_url, archive)
        cbo_path = args.cbo.resolve() if args.cbo else Path(temp_dir) / "cbo2002-ocupacao.csv"
        if not cbo_path.exists():
            download(CBO_URL, cbo_path)
        archive_bytes = archive.stat().st_size
        archive_hash = file_sha256(archive)
        cbo_bytes = cbo_path.stat().st_size
        cbo_hash = file_sha256(cbo_path)
        cbo_titles = load_cbo_titles(cbo_path)
        if cbo_path != cbo_raw_path.resolve():
            shutil.copyfile(cbo_path, cbo_raw_path)
        (
            totals,
            occupation_totals,
            sector_totals,
            admission_salaries,
            ce_rows,
        ) = aggregate_archive(archive, period, municipality_map)

    official_validation = validate_official_totals(period, totals, municipality_map)
    # Reconcile unrounded sums before writing any processed/public data.
    official_salary_validation = validate_official_salary(period, admission_salaries)
    period_label = f"{period[:4]}-{period[4:]}"

    for short_code, municipality in municipality_map.items():
        municipality["formal_employment"] = {
            "period": period_label,
            **totals[short_code],
            **employment_details(
                occupation_totals[short_code],
                sector_totals[short_code],
                admission_salaries[short_code],
                cbo_titles,
            ),
            "revision": "CAGEDMOV da competência; sem ajustes declarados posteriormente",
        }

    source_id = f"MTE-CAGEDMOV-{period}"
    context["schema_version"] = "1.3.0"
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
            "metric": "Admissões, desligamentos, saldo, ocupações, setores e salário de admissão",
            "unit": "vínculos",
            "revision": "CAGEDMOV da competência; sem ajustes declarados posteriormente",
        }
    )
    write_json("data/processed/municipal_context.json", context)
    write_json("app/public/data/municipal_context.json", context)

    occupation_path, occupation_rows, missing_occupation_titles = write_occupation_facts(
        period_label,
        source_id,
        municipality_map,
        occupation_totals,
        cbo_titles,
    )

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
    municipalities_without_movements = [
        municipality_map[code]["name"]
        for code, values in totals.items()
        if values["admissions"] + values["dismissals"] == 0
    ]
    manifest = {
        "schema_version": "1.2.0",
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
        "occupation_dictionary": {
            "source_url": CBO_URL,
            "path": cbo_raw_relative,
            "sha256": cbo_hash,
            "bytes": cbo_bytes,
            "titles": len(cbo_titles),
            "encoding": "latin-1",
        },
        "aggregation": {
            "filters": {"competênciamov": period, "uf": "23"},
            "municipality_key": "seis primeiros dígitos do código IBGE de sete dígitos",
            "admissions": "contagem de saldomovimentação = 1",
            "dismissals": "contagem de saldomovimentação = -1",
            "balance": "admissions - dismissals",
            "occupation": "CBO 2002 de seis dígitos",
            "sector": "seção da CNAE 2.0",
            "average_admission_salary": {
                "description": "Média nominal mensalizada das admissões elegíveis segundo o MTE",
                "salary_field": "salário (mensalizado pelo MTE; sem nova conversão por horas)",
                "minimum_wage": MINIMUM_WAGE_BY_YEAR[period[:4]],
                "minimum_wage_source": MINIMUM_WAGE_SOURCE,
                "minimum_inclusive": salary_bounds(period)[0],
                "maximum_inclusive": salary_bounds(period)[1],
                "exclude_intermittent": True,
                "methodology_url": SALARY_METHODOLOGY_URL,
                "empty_sample": None,
            },
            "revision": "CAGEDMOV da competência; sem ajustes declarados posteriormente",
        },
        "validation": {
            "municipalities": len(totals),
            "ce_rows": ce_rows,
            "state_admissions": state_admissions,
            "state_dismissals": state_dismissals,
            "state_balance": state_balance,
            "identity_holds": state_admissions - state_dismissals == state_balance,
            "occupation_rows": occupation_rows,
            "missing_occupation_titles": missing_occupation_titles,
            "occupation_fact_path": occupation_path,
            "municipalities_with_movements": len(totals) - len(municipalities_without_movements),
            "municipalities_without_movements": municipalities_without_movements,
            "official_cross_check": official_validation,
            "official_salary_cross_check": official_salary_validation,
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
                "occupation_rows": occupation_rows,
                "missing_occupation_titles": missing_occupation_titles,
                "official_cross_check": official_validation["available"],
                "coverage_matrix_updates": coverage_updates,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
