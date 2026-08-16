#!/usr/bin/env python3
# pip install requests beautifulsoup4 python-dotenv

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup

try:
    from dotenv import load_dotenv

    load_dotenv(".env.local")
    load_dotenv()
except Exception:
    pass

BASE_URL = "https://kacpta.or.kr"
REGION_MAIN_URL = f"{BASE_URL}/kacpta_view/kac_search/taxaccountant_n.asp"
ZIPCODE_LIST_URL = f"{BASE_URL}/kacpta_view/kac_search/taxAccountantCode_n.asp?zipcode={{zipcode}}"
DELAY_SEC = float(os.environ.get("CRAWL_DELAY_SEC", "1"))
STATE_FILE = Path(__file__).with_name("crawl_state.json")

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = (
    os.environ.get("SUPABASE_KEY")
    or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)

USER_AGENT = os.environ.get(
    "CRAWL_USER_AGENT",
    "Mozilla/5.0 (compatible; findtax-crawler/1.0; +https://findtax.kr)",
)

# 요청 스펙 반영: 최소 필수 코드 범위(서울/부산/경기) 포함
DEFAULT_ZIPCODE_RANGES: dict[str, range] = {
    "서울": range(101, 126),  # 101~125
    "부산": range(201, 217),  # 201~216
    "경기": range(401, 443),  # 401~442
}

SIDO_PREFIXES = (
    "서울특별시",
    "부산광역시",
    "대구광역시",
    "인천광역시",
    "광주광역시",
    "대전광역시",
    "울산광역시",
    "세종특별자치시",
    "경기도",
    "강원특별자치도",
    "충청북도",
    "충청남도",
    "전북특별자치도",
    "전라남도",
    "경상북도",
    "경상남도",
    "제주특별자치도",
)


def normalize_space(s: str | None) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip()


def sleep_delay() -> None:
    time.sleep(DELAY_SEC)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_state() -> dict[str, Any] | None:
    if not STATE_FILE.exists():
        return None
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return None


def save_state(
    last_completed_zipcode: int | None,
    processed_count: int,
    total_count: int,
) -> None:
    payload = {
        "last_completed_zipcode": last_completed_zipcode,
        "processed_count": processed_count,
        "total_count": total_count,
        "updated_at": now_iso(),
    }
    STATE_FILE.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def fetch_html(session: requests.Session, url: str) -> str:
    resp = session.get(url, timeout=40)
    resp.raise_for_status()
    resp.encoding = resp.apparent_encoding or "euc-kr"
    return resp.text


def abs_url(base: str, href: str) -> str:
    return urllib.parse.urljoin(base, href)


def parse_sido_sigungu_from_context(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    text = normalize_space(soup.get_text(" "))
    m = re.search(
        r"검색조건\s*:\s*([가-힣특별광역자치도시]+)\s*([가-힣0-9·\-\s]+?)\s*(총|자료검색)",
        text,
    )
    if m:
        sido = normalize_space(m.group(1))
        sigungu = normalize_space(m.group(2))
        return (sido or "미상", sigungu or "미상")
    return ("미상", "미상")


def split_sido_sigungu_from_address(address: str | None) -> tuple[str, str]:
    addr = normalize_space(address)
    if not addr:
        return ("미상", "미상")
    for sido in SIDO_PREFIXES:
        if addr.startswith(sido):
            rest = normalize_space(addr[len(sido) :])
            sigungu = rest.split()[0] if rest else "미상"
            return (sido, sigungu)
    return ("미상", "미상")


def discover_zipcodes(session: requests.Session) -> list[int]:
    zipcodes: set[int] = set()
    for _, r in DEFAULT_ZIPCODE_RANGES.items():
        zipcodes.update(r)

    try:
        main_html = fetch_html(session, REGION_MAIN_URL)
    except Exception as e:
        print(f"[warn] 메인 페이지 코드 추출 실패: {e}")
        return sorted(zipcodes)

    soup = BeautifulSoup(main_html, "html.parser")
    area_links = []
    for a in soup.select('a[href*="taxAccountant_n.asp?area="]'):
        href = a.get("href") or ""
        area_links.append(abs_url(REGION_MAIN_URL, href))

    page_urls = [REGION_MAIN_URL]
    seen_areas: set[str] = set()
    for u in area_links:
        if u not in seen_areas:
            seen_areas.add(u)
            page_urls.append(u)

    for i, page_url in enumerate(page_urls, start=1):
        if i > 1:
            sleep_delay()
        try:
            html = fetch_html(session, page_url)
        except Exception:
            continue
        for m in re.finditer(
            r"taxAccountantCode_n\.asp\?zipcode=(\d+)",
            html,
            flags=re.IGNORECASE,
        ):
            zipcodes.add(int(m.group(1)))

    return sorted(zipcodes)


def parse_detail_page(session: requests.Session, detail_url: str) -> dict[str, str | None]:
    sleep_delay()
    html = fetch_html(session, detail_url)
    soup = BeautifulSoup(html, "html.parser")
    rows = soup.select("tr")
    out: dict[str, str | None] = {
        "name": None,
        "phone": None,
        "address": None,
        "office_name": None,
    }

    for tr in rows:
        tds = tr.find_all("td")
        if len(tds) < 2:
            continue
        label = normalize_space(tds[0].get_text(" "))
        value = normalize_space(tds[1].get_text(" "))
        if "이 름" in label or "이름" in label:
            out["name"] = value or out["name"]
        elif "전화번호" in label:
            out["phone"] = value or out["phone"]
        elif "사무소주소" in label or "주소" in label:
            out["address"] = value or out["address"]
        elif "사무소명" in label:
            out["office_name"] = value or out["office_name"]

    return out


def slug_for(name: str, phone: str | None, address: str | None) -> str:
    raw = normalize_space(f"{name}|{phone or ''}|{address or ''}")
    return "kacpta-" + hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


def parse_zipcode_page(
    session: requests.Session,
    zipcode: int,
) -> list[dict[str, str | int | bool | None | list[str]]]:
    url = ZIPCODE_LIST_URL.format(zipcode=zipcode)
    html = fetch_html(session, url)
    soup = BeautifulSoup(html, "html.parser")
    context_sido, context_sigungu = parse_sido_sigungu_from_context(html)

    rows: list[dict[str, str | int | bool | None | list[str]]] = []
    for tr in soup.select("tr"):
        tds = tr.find_all("td")
        if len(tds) < 3:
            continue

        anchor = tds[0].find("a", href=True)
        if not anchor:
            continue

        name = normalize_space(anchor.get_text(" "))
        phone = normalize_space(tds[1].get_text(" "))
        status = normalize_space(tds[2].get_text(" "))

        if not name or name in {"이름", "검색결과"}:
            continue
        if "개업" not in status:
            continue

        detail_href = anchor.get("href", "")
        detail_url = abs_url(url, detail_href)

        office_name = f"{name} 세무사사무소"
        address: str | None = None
        detail_phone: str | None = None
        detail_name: str | None = None
        detail_office: str | None = None

        try:
            detail = parse_detail_page(session, detail_url)
            detail_name = normalize_space(detail.get("name"))
            detail_phone = normalize_space(detail.get("phone"))
            address = normalize_space(detail.get("address")) or None
            detail_office = normalize_space(detail.get("office_name"))
        except Exception:
            pass

        final_name = detail_name or name
        if detail_office:
            office_name = detail_office
        elif final_name:
            office_name = f"{final_name} 세무사사무소"

        final_phone = detail_phone or phone
        if final_phone in {"비공개", "02-", ""}:
            final_phone = None

        if address:
            addr_sido, addr_sigungu = split_sido_sigungu_from_address(address)
        else:
            addr_sido, addr_sigungu = ("미상", "미상")

        sido = addr_sido if addr_sido != "미상" else context_sido
        sigungu = addr_sigungu if addr_sigungu != "미상" else context_sigungu
        slug = slug_for(final_name, final_phone, address)

        rows.append(
            {
                "name": final_name,
                "office_name": office_name,
                "phone": final_phone,
                "address": address,
                "sido": sido,
                "sigungu": sigungu,
                "slug": slug,
                "representative_name": final_name,
                "email": None,
                "specialties": [],
                "bio": f"출처: 한국세무사회 지역별 개업세무사 ({detail_url})",
                "is_premium": False,
                "is_active": True,
                "sort_order": 0,
            }
        )

    return rows


def upsert_to_supabase(rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL/SUPABASE_KEY가 필요합니다 (.env.local 확인).")

    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/tax_accountants?on_conflict=slug"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    payload_rows = []
    for r in rows:
        rep_name = normalize_space(r.get("representative_name"))
        row_name = normalize_space(r.get("name"))
        office_name = normalize_space(r.get("office_name"))
        final_name = rep_name or row_name or office_name or "세무사"
        if not final_name:
            continue
        payload_rows.append(
            {
                "name": final_name,
                "slug": r["slug"],
                "office_name": r["office_name"],
                "representative_name": rep_name or final_name,
                "sido": r["sido"],
                "sigungu": r["sigungu"],
                "address": r["address"],
                "phone": r["phone"],
                "email": r["email"],
                "specialties": r["specialties"],
                "bio": r["bio"],
                "is_premium": r["is_premium"],
                "is_active": r["is_active"],
                "sort_order": r["sort_order"],
            }
        )

    # 같은 배치에 동일 slug가 두 번 들어가면 ON CONFLICT가 같은 row를 두 번 갱신하려 해 500 발생
    by_slug_payload: dict[str, dict[str, Any]] = {}
    for row in payload_rows:
        by_slug_payload[row["slug"]] = row
    payload_rows = list(by_slug_payload.values())

    batch_size = 500
    for i in range(0, len(payload_rows), batch_size):
        batch = payload_rows[i : i + batch_size]
        resp = requests.post(endpoint, headers=headers, json=batch, timeout=60)
        if resp.status_code >= 300:
            raise RuntimeError(
                f"Supabase upsert 실패: {resp.status_code} {resp.text[:500]}"
            )


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="KACPTA 지역별 개업세무사 크롤러")
    parser.add_argument(
        "--start-zipcode",
        type=int,
        default=None,
        help="해당 zipcode부터 시작 (예: 136)",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="crawl_state.json 기준 다음 zipcode부터 재개",
    )
    args = parser.parse_args(argv)
    if args.start_zipcode is not None and args.resume:
        parser.error("--start-zipcode와 --resume은 동시에 사용할 수 없습니다.")
    return args


def resolve_start_zipcode(
    all_zipcodes: list[int],
    start_zipcode_opt: int | None,
    resume_opt: bool,
) -> tuple[list[int], int]:
    if not all_zipcodes:
        return ([], 0)

    if start_zipcode_opt is not None:
        run_zipcodes = [z for z in all_zipcodes if z >= start_zipcode_opt]
        processed_count = len(all_zipcodes) - len(run_zipcodes)
        return (run_zipcodes, processed_count)

    if resume_opt:
        state = load_state() or {}
        last = state.get("last_completed_zipcode")
        if isinstance(last, int):
            resume_from = last + 1
            run_zipcodes = [z for z in all_zipcodes if z >= resume_from]
            if isinstance(state.get("processed_count"), int):
                processed_count = int(state["processed_count"])
            else:
                processed_count = len(all_zipcodes) - len(run_zipcodes)
            return (run_zipcodes, processed_count)

    return (list(all_zipcodes), 0)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": USER_AGENT,
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8",
            "Referer": REGION_MAIN_URL,
        }
    )

    all_zipcodes = discover_zipcodes(session)
    if not all_zipcodes:
        print("[error] zipcode 목록이 비어 있습니다.", file=sys.stderr)
        return 1

    run_zipcodes, processed_count = resolve_start_zipcode(
        all_zipcodes=all_zipcodes,
        start_zipcode_opt=args.start_zipcode,
        resume_opt=args.resume,
    )
    total_count = len(all_zipcodes)

    if not run_zipcodes:
        print("[done] 처리할 zipcode가 없습니다.")
        save_state(
            last_completed_zipcode=all_zipcodes[-1],
            processed_count=total_count,
            total_count=total_count,
        )
        return 0

    print(
        f"[start] 전체 {total_count}개 zipcode 중 "
        f"{run_zipcodes[0]}부터 {len(run_zipcodes)}개 처리 시작"
    )

    by_slug: dict[str, dict[str, Any]] = {}
    last_completed_zipcode: int | None = None

    try:
        for zipcode in run_zipcodes:
            if processed_count > 0:
                sleep_delay()

            try:
                rows = parse_zipcode_page(session, zipcode)
            except Exception as e:
                print(f"[warn] zipcode={zipcode} 실패: {e}")
                continue

            for row in rows:
                by_slug[row["slug"]] = row

            # zipcode 처리 단위로 upsert 유지
            upsert_to_supabase(rows)

            processed_count += 1
            last_completed_zipcode = zipcode

            # zipcode가 완전히 끝난 직후 상태 저장
            save_state(
                last_completed_zipcode=last_completed_zipcode,
                processed_count=processed_count,
                total_count=total_count,
            )

            print(
                f"[progress] {processed_count}/{total_count} "
                f"zipcode={zipcode} 누적 {len(by_slug)}명"
            )
    except KeyboardInterrupt:
        print("\n[interrupt] 사용자 중단 감지 (Ctrl+C)")
        save_state(
            last_completed_zipcode=last_completed_zipcode,
            processed_count=processed_count,
            total_count=total_count,
        )
        print(
            "[interrupt] 현재 상태 저장 완료: "
            f"last_completed_zipcode={last_completed_zipcode}, "
            f"processed_count={processed_count}, total_count={total_count}"
        )
        print("[interrupt] --resume 옵션으로 이어서 실행할 수 있습니다.")
        return 0

    print(f"[done] 총 {len(by_slug)}명 정리 완료")
    save_state(
        last_completed_zipcode=last_completed_zipcode,
        processed_count=processed_count,
        total_count=total_count,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

# 실행 예시
# python scripts/crawl.py --start-zipcode 136
# python scripts/crawl.py --resume
# python scripts/crawl.py
