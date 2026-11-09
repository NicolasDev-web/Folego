from __future__ import annotations

import gzip
import hashlib
import json
import time
from pathlib import Path
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
USER_AGENT = "Folego/0.2 phase02-pipeline"


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def fetch_bytes(
    url: str,
    *,
    timeout: int = 60,
    retries: int = 3,
    headers: dict[str, str] | None = None,
    decompress_gzip: bool = True,
) -> bytes:
    req_headers = {"User-Agent": USER_AGENT}
    if headers:
        req_headers.update(headers)
    request = Request(url, headers=req_headers)
    last_error: Exception | None = None

    for attempt in range(retries):
        try:
            with urlopen(request, timeout=timeout) as response:
                payload = response.read()
                if decompress_gzip and (
                    response.headers.get("Content-Encoding") == "gzip"
                    or payload[:2] == b"\x1f\x8b"
                ):
                    return gzip.decompress(payload)
                return payload
        except Exception as error:
            last_error = error
            if attempt < retries - 1:
                time.sleep((attempt + 1) * 1.5)

    raise RuntimeError(f"Falha ao baixar {url} após {retries} tentativas.") from last_error


def fetch_cached_bytes(
    url: str,
    relative_path: str,
    *,
    timeout: int = 60,
    retries: int = 3,
    force: bool = False,
    decompress_gzip: bool = True,
) -> tuple[bytes, dict[str, object]]:
    target = ROOT / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and not force and target.stat().st_size > 0:
        payload = target.read_bytes()
    else:
        payload = fetch_bytes(
            url,
            timeout=timeout,
            retries=retries,
            decompress_gzip=decompress_gzip,
        )
        target.write_bytes(payload)

    return payload, {
        "path": target.relative_to(ROOT).as_posix(),
        "url": url,
        "sha256": sha256_bytes(payload),
        "bytes": len(payload),
    }


def fetch_odata_paginated(
    base_url: str,
    *,
    filter_expr: str | None = None,
    page_size: int = 1000,
    timeout: int = 60,
) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    skip = 0

    while True:
        params: dict[str, str | int] = {
            "$top": page_size,
            "$format": "json",
        }
        if skip > 0:
            params["$skip"] = skip
        if filter_expr:
            params["$filter"] = filter_expr

        sep = "&" if "?" in base_url else "?"
        query = urlencode(params, safe="()@$,=", quote_via=quote)
        url = f"{base_url}{sep}{query}"
        payload = fetch_bytes(url, timeout=timeout)
        parsed = json.loads(payload.decode("utf-8"))
        batch = parsed.get("value", [])
        if not isinstance(batch, list):
            raise ValueError(f"Resposta OData inválida em {url}: campo 'value' não é lista.")
        rows.extend(batch)
        if len(batch) < page_size:
            break
        skip += page_size

    return rows


def write_json(relative_path: str, payload: object) -> Path:
    path = ROOT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return path
