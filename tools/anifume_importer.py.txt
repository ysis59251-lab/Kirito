#!/usr/bin/env python3
"""Discover authorized Anifume episode pages and import approved direct media URLs.

This worker deliberately does not reverse-engineer player tokens. A direct media URL
must be supplied by an authorized API/export or by an admin in Firebase.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials, db, storage
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE_URL = os.getenv("ANIFUME_BASE_URL", "https://anifume.com").rstrip("/")
USER_AGENT = "AnimeFumeAuthorizedMediaMonitor/1.0 (+authorized-import-worker)"
MAX_DISCOVERY_PAGES = int(os.getenv("ANIFUME_MAX_PAGES", "20"))
MAX_EPISODE_PAGES = int(os.getenv("ANIFUME_MAX_EPISODES", "500"))
MAX_MEDIA_BYTES = int(os.getenv("MAX_MEDIA_BYTES", str(8 * 1024 * 1024 * 1024)))


def init_firebase() -> None:
    if firebase_admin._apps:
        return
    raw = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if raw:
        info = json.loads(raw)
        cred = credentials.Certificate(info)
    else:
        path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if not path:
            raise RuntimeError("ตั้งค่า FIREBASE_SERVICE_ACCOUNT_JSON หรือ GOOGLE_APPLICATION_CREDENTIALS ก่อน")
        cred = credentials.Certificate(path)
    firebase_admin.initialize_app(
        cred,
        {
            "databaseURL": os.getenv("FIREBASE_DATABASE_URL", "https://mpmp-5864a-default-rtdb.firebaseio.com"),
            "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", "mpmp-5864a.firebasestorage.app"),
        },
    )


def key_for(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:32]


def validate_http_url(url: str, allowed_hosts: set[str] | None = None) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or parsed.username or parsed.password:
        raise RuntimeError(f"URL ไม่ปลอดภัย: {url}")
    if parsed.port not in {None, 80, 443}:
        raise RuntimeError(f"พอร์ต URL ไม่ได้รับอนุญาต: {parsed.port}")
    host = (parsed.hostname or "").lower().rstrip(".")
    if not host:
        raise RuntimeError(f"URL ไม่มี hostname: {url}")
    if allowed_hosts is not None and host not in allowed_hosts:
        raise RuntimeError(f"host ไม่อยู่ใน allowlist: {host}")
    return url


def media_allowlist() -> set[str]:
    return {x.strip().lower().rstrip(".") for x in os.getenv("MEDIA_ALLOWLIST", "").split(",") if x.strip()}


def storage_allowlist() -> set[str]:
    bucket = os.getenv("FIREBASE_STORAGE_BUCKET", "mpmp-5864a.firebasestorage.app").strip().lower().rstrip(".")
    return {bucket, "storage.googleapis.com", "firebasestorage.googleapis.com"}


def checked_get(session: requests.Session, url: str, allowed_hosts: set[str], **kwargs):
    current = url
    for _ in range(4):
        validate_http_url(current, allowed_hosts)
        response = session.get(current, allow_redirects=False, **kwargs)
        if not response.is_redirect:
            return response, current
        location = response.headers.get("Location")
        response.close()
        if not location:
            raise RuntimeError(f"redirect ไม่มีปลายทาง: {current}")
        current = urljoin(current, location)
    raise RuntimeError(f"redirect เกินจำนวนที่อนุญาต: {url}")


def fetch(session: requests.Session, url: str) -> str:
    response, _ = checked_get(session, url, {urlparse(BASE_URL).hostname.lower().rstrip(".")}, timeout=(15, 30))
    try:
        response.raise_for_status()
        if "text/html" not in response.headers.get("content-type", ""):
            raise RuntimeError(f"ไม่ใช่ HTML: {url}")
        return response.text
    finally:
        response.close()


def parse_episode_links(page_url: str, html: str) -> list[dict[str, str]]:
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.get_text(" ", strip=True) if soup.title else page_url
    result = []
    for anchor in soup.select("a[href]"):
        href = urljoin(page_url, anchor.get("href", ""))
        parsed = urlparse(href)
        if parsed.netloc != urlparse(BASE_URL).netloc:
            continue
        if not re.fullmatch(r"/\d+/[A-Za-z0-9_-]+", parsed.path.rstrip("/")):
            continue
        label = anchor.get_text(" ", strip=True)
        result.append({"url": href, "title": label or title})
    unique = {}
    for item in result:
        unique[item["url"]] = item
    return list(unique.values())


def discover(session: requests.Session) -> list[dict[str, str]]:
    episodes: dict[str, dict[str, str]] = {}
    for page in range(1, MAX_DISCOVERY_PAGES + 1):
        url = BASE_URL if page == 1 else f"{BASE_URL}/page/{page}/"
        try:
            html = fetch(session, url)
        except Exception as exc:
            print(f"discover skip {url}: {exc}", file=sys.stderr)
            continue
        soup = BeautifulSoup(html, "html.parser")
        for anchor in soup.select("a[href]"):
            href = urljoin(url, anchor.get("href", ""))
            path = urlparse(href).path.rstrip("/")
            if re.fullmatch(r"/\d+", path):
                try:
                    for episode in parse_episode_links(href, fetch(session, href)):
                        episodes.setdefault(episode["url"], {**episode, "seriesUrl": href})
                except Exception as exc:
                    print(f"detail skip {href}: {exc}", file=sys.stderr)
                if len(episodes) >= MAX_EPISODE_PAGES:
                    return list(episodes.values())
    return list(episodes.values())


def upsert_discovery(items: list[dict[str, str]]) -> list[tuple[str, dict]]:
    root = db.reference("videoImports")
    current = root.get() or {}
    updates = {}
    now = int(time.time() * 1000)
    for item in items:
        key = key_for(item["url"])
        old = current.get(key) if isinstance(current.get(key), dict) else {}
        # Preserve admin approval, directMediaUrl, upload metadata, and failure history.
        patch = {
            "source": "anifume.com",
            "sourcePageUrl": item["url"],
            "seriesUrl": item.get("seriesUrl", ""),
            "title": item["title"],
            "lastDiscoveredAt": now,
        }
        if not old.get("state"):
            patch["state"] = "discovered"
        updates[key] = patch
    if updates:
        root.update(updates)
    return list(updates.items())


def authorized_media_url(record: dict) -> str:
    url = str(record.get("directMediaUrl", "")).strip()
    if not url:
        return ""
    validate_http_url(url, media_allowlist())
    return url



def check_media_url(session: requests.Session, url: str, allowed_hosts: set[str]) -> tuple[bool, str]:
    try:
        response, _ = checked_get(session, url, allowed_hosts, headers={"Range": "bytes=0-1023"}, stream=True, timeout=(15, 30))
        content_type = response.headers.get("content-type", "").lower()
        ok = response.status_code in {200, 206} and (content_type.startswith("video/") or content_type in {"application/octet-stream", "application/mp4"})
        response.close()
        return ok, f"HTTP {response.status_code} {content_type}"
    except Exception as exc:
        return False, str(exc)


def health_check_records(records: dict, session: requests.Session) -> None:
    now = int(time.time() * 1000)
    for key, record in records.items():
        if not isinstance(record, dict):
            continue
        storage_url = str(record.get("storageUrl", "")).strip()
        direct_url = str(record.get("directMediaUrl", "")).strip()
        target = storage_url or direct_url
        if not target or record.get("state") not in {"uploaded", "approved", "retry", "failed"}:
            continue
        allowed_hosts = storage_allowlist() if storage_url else media_allowlist()
        ok, detail = check_media_url(session, target, allowed_hosts)
        patch = {"lastCheckedAt": now, "health": "ok" if ok else "failed", "healthDetail": detail}
        if not ok:
            patch.update({"state": "failed", "needsReplacement": True, "error": f"media health check failed: {detail}"})
        db.reference(f"videoImports/{key}").update(patch)

def import_media(key: str, record: dict, session: requests.Session) -> None:
    url = authorized_media_url(record)
    if not url:
        db.reference(f"videoImports/{key}").update({"state": "awaiting_media_url", "lastCheckedAt": int(time.time() * 1000)})
        return
    response, final_url = checked_get(session, url, media_allowlist(), stream=True, timeout=(20, 60))
    response.raise_for_status()
    content_type = response.headers.get("content-type", "").lower()
    if not (content_type.startswith("video/") or content_type in {"application/octet-stream", "application/mp4"}):
        raise RuntimeError(f"ปลายทางไม่ใช่ไฟล์วิดีโอ: {content_type}")
    length = int(response.headers.get("content-length", "0") or 0)
    if length > MAX_MEDIA_BYTES:
        raise RuntimeError("ไฟล์ใหญ่เกิน MAX_MEDIA_BYTES")
    suffix = ".mp4" if "mp4" in content_type or final_url.lower().split("?")[0].endswith(".mp4") else ".media"
    temp = None
    try:
        with tempfile.NamedTemporaryFile(prefix="animefume-", suffix=suffix, delete=False) as handle:
            temp = Path(handle.name)
            total = 0
            digest = hashlib.sha256()
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if not chunk:
                    continue
                total += len(chunk)
                if total > MAX_MEDIA_BYTES:
                    raise RuntimeError("ไฟล์ใหญ่เกิน MAX_MEDIA_BYTES")
                handle.write(chunk)
                digest.update(chunk)
        blob_path = f"videos/{key}{suffix}"
        bucket = storage.bucket()
        blob = bucket.blob(blob_path)
        blob.upload_from_filename(str(temp), content_type=content_type)
        blob.make_public()
        now = int(time.time() * 1000)
        db.reference(f"videoImports/{key}").update({
            "state": "uploaded",
            "storagePath": blob_path,
            "storageUrl": blob.public_url,
            "bytes": total,
            "sha256": digest.hexdigest(),
            "contentType": content_type,
            "uploadedAt": now,
            "lastCheckedAt": now,
            "needsReplacement": False,
        })
    finally:
        response.close()
        if temp:
            temp.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()
    if not args.once:
        parser.error("ใช้ --once ใน scheduled worker แต่ละรอบ")
    init_firebase()
    session = requests.Session()
    retry = Retry(total=3, connect=3, read=3, backoff_factor=0.6, status_forcelist={429, 500, 502, 503, 504}, allowed_methods=frozenset({"GET", "HEAD"}), respect_retry_after_header=True)
    session.mount("https://", HTTPAdapter(max_retries=retry))
    session.mount("http://", HTTPAdapter(max_retries=retry))
    session.headers.update({"User-Agent": USER_AGENT, "Accept": "text/html,application/json;q=0.9,*/*;q=0.8"})
    if os.getenv("ANIFUME_COOKIE"):
        session.headers["Cookie"] = os.environ["ANIFUME_COOKIE"]
    items = discover(session)
    print(f"discovered={len(items)}")
    upsert_discovery(items)
    records = db.reference("videoImports").get() or {}
    health_check_records(records, session)
    for key, record in records.items():
        if not isinstance(record, dict):
            continue
        if record.get("state") in {"approved", "retry", "awaiting_media_url", "failed"} and record.get("directMediaUrl") and record.get("needsReplacement") is not False:
            try:
                import_media(key, record, session)
            except Exception as exc:
                db.reference(f"videoImports/{key}").update({"state": "failed", "error": str(exc), "lastCheckedAt": int(time.time() * 1000)})
                print(f"import failed {key}: {exc}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
