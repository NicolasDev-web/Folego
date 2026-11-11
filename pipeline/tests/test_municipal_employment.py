from __future__ import annotations

import io
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from pipeline.extract import municipal_employment as employment


@pytest.mark.parametrize(
    ("salary", "intermittent", "reason"),
    [
        ("486,29", "0", "below_minimum"),
        ("486,30", "0", None),
        ("1.621,00", "0", None),
        ("243150,00", "0", None),
        ("243150,01", "0", "above_maximum"),
        ("426604,19", "0", "above_maximum"),
        ("1621,00", "1", "intermittent"),
        ("426604,19", "1", "above_maximum"),
        ("0,00", "0", "missing_or_nonpositive"),
        ("-1", "0", "missing_or_nonpositive"),
        ("", "0", "missing_or_nonpositive"),
        ("não informado", "0", "missing_or_nonpositive"),
        ("NaN", "0", "missing_or_nonpositive"),
        ("inf", "0", "missing_or_nonpositive"),
    ],
)
def test_official_salary_eligibility(salary: str, intermittent: str, reason: str | None) -> None:
    _, observed = employment.classify_admission_salary(
        salary, intermittent, employment.salary_bounds("202609")
    )
    assert observed == reason


def test_unconfigured_wage_or_unknown_intermittent_flag_blocks_processing() -> None:
    with pytest.raises(ValueError, match="Salário mínimo não configurado"):
        employment.salary_bounds("202709")
    with pytest.raises(ValueError, match="intermitente inválido"):
        employment.classify_admission_salary("1621,00", "", (486.30, 243150.00))


def test_archive_excludes_salaries_without_changing_employment_counts(monkeypatch) -> None:
    # Croatá's three real admissions plus an intermittent admission and a dismissal.
    raw = (
        "competênciamov;uf;município;saldomovimentação;cbo2002ocupação;seção;salário;indtrabintermitente\n"
        "202609;23;230395;1;333105;P;426604,19;0\n"
        "202609;23;230395;1;521110;G;1645,00;0\n"
        "202609;23;230395;1;521135;G;1621,00;0\n"
        "202609;23;230395;1;521135;G;1800,00;1\n"
        "202609;23;230395;-1;521110;G;1645,00;0\n"
        "202608;23;230395;1;521135;G;1621,00;0\n"
        "202609;35;355030;1;521135;G;1621,00;0\n"
    )

    class ExtractedArchive:
        stdout = io.BytesIO(raw.encode("utf-8-sig"))
        stderr = io.BytesIO()

        def wait(self):
            return 0

    monkeypatch.setattr(employment.shutil, "which", lambda _: "7z")
    monkeypatch.setattr(employment.subprocess, "Popen", lambda *a, **kw: ExtractedArchive())
    totals, occupations, sectors, salaries, rows = employment.aggregate_archive(
        Path("fixture.7z"), "202609", {"230395": {"name": "Croatá"}}
    )
    assert rows == 5
    assert totals["230395"] == {"admissions": 4, "dismissals": 1, "balance": 3}
    assert sum(item["admissions"] for item in occupations["230395"].values()) == 4
    assert sum(item["balance"] for item in sectors["230395"].values()) == 3
    assert salaries["230395"]["above_maximum"] == 1
    assert salaries["230395"]["intermittent"] == 1
    details = employment.employment_details(occupations["230395"], sectors["230395"], salaries["230395"], {})
    assert details["average_admission_salary"] == 1633.00
    assert details["salary_observations"] == 2


def test_empty_eligible_sample_preserves_null() -> None:
    details = employment.employment_details({}, {}, {"sum": 0, "count": 0}, {})
    assert details["average_admission_salary"] is None
    assert details["salary_observations"] == 0


def test_official_reconciliation_rejects_original_inflated_average() -> None:
    with pytest.raises(ValueError, match="Salário médio do Ceará divergente"):
        employment.validate_official_salary("202609", {"CE": {"sum": 2548.75, "count": 1}})
    with pytest.raises(ValueError, match="Média salarial oficial não configurada"):
        employment.validate_official_salary("202610", {})


def test_published_salary_package_matches_corrected_snapshot_and_manifest() -> None:
    public_path = employment.ROOT / "app/public/data/municipal_context.json"
    processed_path = employment.ROOT / "data/processed/municipal_context.json"
    assert public_path.read_bytes() == processed_path.read_bytes()
    context = json.loads(public_path.read_text(encoding="utf-8"))
    municipalities = context["municipalities"]
    assert len(municipalities) == 184
    by_name = {m["name"]: m["formal_employment"] for m in municipalities}
    expected = {"Croatá": (1633.00, 2), "Ipueiras": (1519.54, 21), "Quixelô": (1753.31, 13)}
    for name, (salary, count) in expected.items():
        assert by_name[name]["average_admission_salary"] == salary
        assert by_name[name]["salary_observations"] == count

    assert sum(m["salary_observations"] for m in by_name.values()) == 57237
    assert sum(m["admissions"] for m in by_name.values()) == 58672
    assert sum(m["dismissals"] for m in by_name.values()) == 53516
    assert sum(m["balance"] for m in by_name.values()) == 5156
    assert sum(m["average_admission_salary"] is None for m in by_name.values()) == 7
    for item in by_name.values():
        count = item["salary_observations"]
        average = item["average_admission_salary"]
        assert 0 <= count <= item["admissions"]
        assert (average is None) == (count == 0)
        if average is not None:
            assert 486.30 <= average <= 243150.00

    manifest = json.loads((employment.ROOT / "metadata/municipal_employment_manifest.json").read_text(encoding="utf-8"))
    check = manifest["validation"]["official_salary_cross_check"]
    assert check["expected"] == check["observed"] == 2081.38
    assert check["eligible_admissions"] == 57237
    assert sum(check["excluded_admissions"].values()) + 57237 == 58672
    # Reconstruct from rounded municipal means within the half-cent rounding bound.
    weighted = sum((m["average_admission_salary"] or 0) * m["salary_observations"] for m in by_name.values()) / 57237
    assert abs(weighted - 2081.38) <= 0.01
