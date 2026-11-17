"""Minimal Stuudium (ope.ee) client.

Stuudium has no public API and its password login is behind a Cloudflare
captcha, so this client reuses a browser session: the long-lived
"automatic login" cookie (__stclid) plus the session cookie (_stdmss).
Rotated cookies from Set-Cookie headers are tracked so the caller can persist
them.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from http.cookies import SimpleCookie
import html
import json
import logging
import re
from urllib.parse import urljoin, urlsplit
from zoneinfo import ZoneInfo

import aiohttp
from bs4 import BeautifulSoup

_LOGGER = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0"
)
MAX_REDIRECTS = 10
SCHOOL_TZ = ZoneInfo("Europe/Tallinn")  # Stuudium timestamps are Estonian local time


class StuudiumError(Exception):
    """Generic Stuudium failure."""


class StuudiumAuthError(StuudiumError):
    """Session is no longer logged in."""


def normalize_host(text: str) -> str | None:
    """'https://school.ope.ee/s/123', 'school.ope.ee/' or 'school.ope.ee' -> 'school.ope.ee'."""
    text = text.strip()
    if "://" not in text:
        text = "https://" + text
    host = (urlsplit(text).hostname or "").lower()
    return host if re.fullmatch(r"[a-z0-9-]+(\.[a-z0-9-]+)+", host) else None


def parse_cookie_text(text: str) -> dict[str, str]:
    """Accept 'a=1; b=2' or one 'name:value' / 'name=value' per line."""
    cookies: dict[str, str] = {}
    for part in re.split(r"[;\n]", text):
        part = part.strip()
        if not part:
            continue
        match = re.match(r"^([^=:\s]+)\s*[=:]\s*(.+)$", part)
        if match:
            cookies[match.group(1)] = match.group(2).strip().strip('"')
    return cookies


SESSION_COOKIE = "_stdmss"  # the login session, ends 48 h after logging in
# With "Logi mind tulevikus automaatselt sisse" switched on, __stclid is the
# browser's remember-me cookie (about 30 days). bid is set on the login page.
AUTOLOGIN_COOKIE = "__stclid"
KNOWN_COOKIES = (SESSION_COOKIE, AUTOLOGIN_COOKIE, "bid")


def extract_cookies(text: str) -> dict[str, str]:
    """Pull Stuudium cookies out of whatever the user pasted.

    Understands: 'a=1; b=2', a 'Cookie: ...' header, 'Copy as cURL' (-b / -H cookie),
    JSON exports of cookie extensions, Netscape cookie files and rows copied from the
    DevTools cookie table (name<TAB>value<TAB>domain...). Only Stuudium cookies are
    kept when any are present.
    """
    text = (text or "").strip()
    if not text:
        return {}
    found: dict[str, str] = {}

    # JSON export (Cookie-Editor, EditThisCookie...): list of {name, value} or {name: value}
    if text[:1] in "[{":
        try:
            data = json.loads(text)
            items = data if isinstance(data, list) else (
                [{"name": k, "value": v} for k, v in data.items()] if isinstance(data, dict) else []
            )
            for item in items:
                if isinstance(item, dict) and "name" in item and "value" in item:
                    found[str(item["name"])] = str(item["value"])
        except ValueError:
            pass

    if not found:
        # cURL: -b 'a=1; b=2' / --cookie "..." / -H 'cookie: a=1; b=2'
        for m in re.finditer(r"""(?:-b|--cookie)\s+(['"])(.*?)\1|-H\s+(['"])cookie:\s*(.*?)\3""", text, re.I | re.S):
            found.update(parse_cookie_text(m.group(2) or m.group(4) or ""))
    if not found:
        for line in text.splitlines():
            cols = [c.strip() for c in line.split("\t")]
            if len(cols) >= 7 and cols[0].startswith((".", "#HttpOnly_")) or (len(cols) == 7 and cols[4].isdigit()):
                found[cols[5]] = cols[6]  # Netscape cookie file
            elif len(cols) >= 2 and cols[0] in KNOWN_COOKIES:
                found[cols[0]] = cols[1]  # DevTools table row
    if not found:
        found = parse_cookie_text(re.sub(r"^\s*cookie:\s*", "", text, flags=re.I))

    found = {k: v.strip().strip('"').strip("'") for k, v in found.items() if v.strip()}
    known = {k: v for k, v in found.items() if k in KNOWN_COOKIES}
    return known or found


def cookies_to_text(cookies: dict[str, str]) -> str:
    return "; ".join(f"{k}={v}" for k, v in cookies.items())


@dataclass
class Grade:
    subject: str
    date: date
    grade: str
    note: str = ""
    important: bool = False

    @property
    def key(self) -> str:
        return f"{self.subject}|{self.date.isoformat()}|{self.grade}|{self.note}"

    def as_dict(self) -> dict:
        return {
            "subject": self.subject,
            "date": self.date.isoformat(),
            "grade": self.grade,
            "note": self.note,
            "important": self.important,
        }


def grade_value(grade: str) -> float | None:
    """Numeric value of a grade: '5-' -> 4.75, '4+' -> 4.25, '5+' -> 5; 'AR', 'A' etc. -> None."""
    m = re.fullmatch(r"([1-5])\s*([+-]?)", grade.strip())
    if not m:
        return None
    value = int(m.group(1)) + {"+": 0.25, "-": -0.25, "": 0.0}[m.group(2)]
    return min(max(value, 1.0), 5.0)


def average(values: list[float]) -> float | None:
    return round(sum(values) / len(values), 2) if values else None


@dataclass
class Homework:
    subject: str
    given: date
    due: date
    text: str

    def as_dict(self) -> dict:
        return {
            "subject": self.subject,
            "due": self.due.isoformat(),
            "given": self.given.isoformat(),
            "text": self.text,
        }


# Per-lesson marks in the grades table (legend on the page).
LESSON_MARKS = {
    "grade_param_is_late": "late",                # H - Hilines
    "grade_param_is_absent": "absent",            # P - Puudus põhjuseta
    "grade_param_is_excused": "exempt",           # V - Vabastatud
    "grade_param_is_no_homework": "no_homework",  # K - Kodutöö tegemata
    "grade_param_is_notify": "attention",         # ! - Tähelepanu
}
ABSENCE_KINDS = ("absent", "absent_excused")


@dataclass
class LessonMark:
    subject: str
    date: date
    kind: str  # late, absent, absent_excused, exempt, no_homework, attention

    def as_dict(self) -> dict:
        return {"subject": self.subject, "date": self.date.isoformat(), "kind": self.kind}


ET_MONTHS = {
    m: i for i, m in enumerate(
        ["jaanuar", "veebruar", "märts", "aprill", "mai", "juuni", "juuli",
         "august", "september", "oktoober", "november", "detsember"], start=1)
}


def parse_et_date(text: str, today: date) -> date | None:
    """'22. september' or '11. november 2025' -> date (no year = most recent past one)."""
    m = re.search(r"(\d{1,2})\.\s*([a-zõäöü]+)(?:\s+(\d{4}))?", text.lower())
    if not m or m.group(2) not in ET_MONTHS:
        return None
    day, month = int(m.group(1)), ET_MONTHS[m.group(2)]
    try:
        if m.group(3):
            return date(int(m.group(3)), month, day)
        result = date(today.year, month, day)
    except ValueError:
        return None
    return result.replace(year=today.year - 1) if result > today else result


@dataclass
class Remark:
    kind: str  # "Kiitus", "Märkus", ...
    positive: bool
    subject: str
    date: date | None
    text: str
    teacher: str

    def as_dict(self) -> dict:
        return {
            "kind": self.kind,
            "positive": self.positive,
            "subject": self.subject,
            "date": self.date.isoformat() if self.date else None,
            "text": self.text,
            "teacher": self.teacher,
        }


def parse_remarks_page(page: str, today: date) -> list[Remark]:
    """Parse /s/<id>/comments (Kiitused ja märkused), newest first."""
    soup = BeautifulSoup(page, "html.parser")
    remarks: list[Remark] = []
    for entry in soup.select("div.entry.notice"):
        classes = entry.get("class", [])
        kind_tag = entry.select_one(".entry_type")
        subj_tag = entry.select_one(".subject_name")
        date_tag = entry.select_one(".entry_date")
        body_tag = entry.select_one(".notice_body")
        teacher_tag = entry.select_one(".teacher_name")
        subject = ""
        if subj_tag:
            subject = subj_tag.get_text(" ", strip=True)
            if date_tag:
                subject = subject.replace(date_tag.get_text(" ", strip=True), "")
            subject = subject.strip(" ,:")
        remarks.append(
            Remark(
                kind=kind_tag.get_text(strip=True).rstrip(":") if kind_tag else "",
                positive="positive" in classes,
                subject=subject,
                date=parse_et_date(date_tag.get_text(" ", strip=True), today) if date_tag else None,
                text=body_tag.get_text("\n", strip=True) if body_tag else "",
                teacher=teacher_tag.get_text(" ", strip=True).replace("\xa0", " ") if teacher_tag else "",
            )
        )
    remarks.sort(key=lambda r: r.date or date.min, reverse=True)
    return remarks


TREND_DAYS = 21
TREND_THRESHOLD = 0.25


def trend(grades: list["Grade"], today: date) -> dict:
    """Recent (last TREND_DAYS) average vs. the earlier part of the period."""
    cutoff = today - timedelta(days=TREND_DAYS)
    recent = [v for g in grades if g.date > cutoff and (v := grade_value(g.grade)) is not None]
    earlier = [v for g in grades if g.date <= cutoff and (v := grade_value(g.grade)) is not None]
    r_avg, e_avg = average(recent), average(earlier)
    direction = None
    if r_avg is not None and e_avg is not None:
        diff = r_avg - e_avg
        direction = "up" if diff >= TREND_THRESHOLD else "down" if diff <= -TREND_THRESHOLD else "steady"
    return {"trend": direction, "recent_average": r_avg, "earlier_average": e_avg}


@dataclass
class Message:
    id: str
    title: str
    sender: str
    created: datetime | None
    body: str = ""

    def as_dict(self, with_body: bool = False) -> dict:
        data = {
            "id": self.id,
            "title": self.title,
            "sender": self.sender,
            "created": self.created.isoformat() if self.created else None,
        }
        if with_body:
            data["body"] = self.body
        return data


@dataclass
class Student:
    id: str
    name: str
    grades: list[Grade] = field(default_factory=list)
    homework: list[Homework] = field(default_factory=list)
    marks: list[LessonMark] = field(default_factory=list)
    remarks: list[Remark] = field(default_factory=list)

    def subject_averages(self) -> dict[str, float]:
        by_subject: dict[str, list[float]] = {}
        for g in self.grades:
            if (v := grade_value(g.grade)) is not None:
                by_subject.setdefault(g.subject, []).append(v)
        return {subj: average(vals) for subj, vals in sorted(by_subject.items())}

    def overall_average(self) -> float | None:
        return average([v for g in self.grades if (v := grade_value(g.grade)) is not None])


@dataclass
class StuudiumData:
    students: dict[str, Student]
    unread_count: int
    unread_messages: list[Message]


def _due_date(lesson_day: date, day_month: str) -> date | None:
    """'18.11' given in a lesson on lesson_day -> full date (handles the new-year wrap)."""
    try:
        d, m = (int(x) for x in day_month.strip().rstrip(".").split(".")[:2])
        due = date(lesson_day.year, m, d)
    except ValueError:
        return None
    if due < lesson_day - timedelta(days=60):
        due = due.replace(year=due.year + 1)
    return due


def parse_grades_page(page: str) -> tuple[str, list[Grade], list[Homework], list[LessonMark]]:
    """Parse /grades/student/<id>: name, grades (newest first), homework (by due), lesson marks."""
    soup = BeautifulSoup(page, "html.parser")
    name = ""
    if soup.title and soup.title.string:
        name = soup.title.string.split(" - ")[0].strip()

    grades: list[Grade] = []
    homework: dict[tuple, Homework] = {}
    marks: list[LessonMark] = []
    for row in soup.select("tr"):
        link = row.select_one('th a[href*="/subjects/student/"]')
        if not link:
            continue
        subject = link.get_text(strip=True)
        for cell in row.find_all("td"):
            day = None
            for css in cell.get("class", []):
                if m := re.fullmatch(r"lesson_(\d{8})", css):
                    day = datetime.strptime(m.group(1), "%Y%m%d").date()
            if day is None:
                continue
            for tag in cell.select('[class*="grade_param_is_"]'):
                css = tag.get("class", [])
                kind = next((LESSON_MARKS[c] for c in css if c in LESSON_MARKS), None)
                if kind == "absent" and "grade_param_is_absent_excused" in css:
                    kind = "absent_excused"
                if kind:
                    marks.append(LessonMark(subject, day, kind))
            for hw in cell.select("span.lesson_homework"):
                label = hw.find("strong")
                due_tag = label.find("b") if label else None
                due = _due_date(day, due_tag.get_text()) if due_tag else None
                if label:
                    label.extract()
                text = re.sub(r"[ \t]*\r?\n\s*", "\n", hw.get_text(" ", strip=True))
                if due and text:
                    # Double lessons repeat the same task; keep one.
                    homework.setdefault((subject, due, text), Homework(subject, day, due, text))
            for g in cell.select("span.grade"):
                value = g.select_one(".grade_active")
                if not value:
                    continue
                note = g.select_one(".grade_notes")
                grades.append(
                    Grade(
                        subject=subject,
                        date=day,
                        grade=value.get_text(strip=True),
                        note=note.get_text(" ", strip=True) if note else "",
                        important=g.select_one(".grade_is_important") is not None,
                    )
                )
    grades.sort(key=lambda g: g.date, reverse=True)
    marks.sort(key=lambda m: m.date, reverse=True)
    return name, grades, sorted(homework.values(), key=lambda h: (h.due, h.subject)), marks


class StuudiumClient:
    """Talks to one school's Stuudium site with a browser cookie session."""

    def __init__(self, session: aiohttp.ClientSession, host: str, cookies: dict[str, str]) -> None:
        self._session = session
        self.host = normalize_host(host) or host.strip()
        self.base = f"https://{self.host}"
        self.cookies = dict(cookies)
        self.cookies_changed = False
        self.user_guid: str | None = None

    def _absorb_cookies(self, resp: aiohttp.ClientResponse) -> None:
        for header in resp.headers.getall("Set-Cookie", []):
            jar = SimpleCookie()
            try:
                jar.load(header)
            except Exception:  # noqa: BLE001 - odd cookie formats are not fatal
                continue
            for name, morsel in jar.items():
                expired = morsel["max-age"] == "0" or morsel.value in ("", "deleted")
                if expired:
                    if name in self.cookies:
                        self.cookies.pop(name)
                        self.cookies_changed = True
                elif self.cookies.get(name) != morsel.value:
                    self.cookies[name] = morsel.value
                    self.cookies_changed = True

    async def _get(self, path: str, *, xhr: bool = False) -> tuple[str, str]:
        """GET following redirects manually so rotated cookies are reused. Returns (final_url, body)."""
        url = urljoin(self.base + "/", path)
        for _ in range(MAX_REDIRECTS):
            headers = {"User-Agent": USER_AGENT, "Cookie": cookies_to_text(self.cookies)}
            if xhr:
                headers["X-Requested-With"] = "XMLHttpRequest"
                headers["Accept"] = "application/json"
            try:
                async with self._session.get(
                    url, headers=headers, allow_redirects=False,
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as resp:
                    self._absorb_cookies(resp)
                    if resp.status in (301, 302, 303, 307, 308):
                        url = urljoin(url, resp.headers["Location"])
                        continue
                    if resp.status >= 400:
                        raise StuudiumError(f"HTTP {resp.status} for {url}")
                    body = await resp.text()
            except aiohttp.ClientError as err:
                raise StuudiumError(f"Request to {url} failed: {err}") from err
            if urlsplit(url).path.startswith("/auth"):
                raise StuudiumAuthError("Redirected to the login page")
            return url, body
        raise StuudiumError(f"Too many redirects for {path}")

    async def get_student_ids(self) -> list[str]:
        _, body = await self._get("/")
        # Every child linked to the parent account is in the top menu.
        ids = re.findall(r'st-nav-item_student[^"]*"\s+href="/s/(\d+)"', body)
        if not ids:  # menu markup differs (e.g. other layouts): any student page link
            ids = re.findall(r'href="/s/(\d+)"', body)
        if not ids:
            ids = re.findall(r"curr_url = '/s/(\d+)'", body)
        if not ids:
            raise StuudiumAuthError("No students visible; session probably not logged in")
        return list(dict.fromkeys(ids))

    async def get_grades_page(self, student_id: str) -> str:
        _, body = await self._get(f"/grades/student/{student_id}")
        return body

    async def get_remarks_page(self, student_id: str) -> str:
        _, body = await self._get(f"/s/{student_id}/comments")
        return body

    async def _inbox_config(self) -> dict:
        for attempt in range(2):
            _, body = await self._get("/suhtlus/")
            match = re.search(r'name="suhtlus:config" content="([^"]+)"', body)
            if not match:
                raise StuudiumError("Inbox config not found")
            config = json.loads(html.unescape(match.group(1)))
            if config.get("authed"):
                return config
            if attempt == 0:
                await self._get("/suhtlus/api/auth")
        raise StuudiumAuthError("Inbox is not logged in")

    async def get_unread(self) -> tuple[int, list[Message]]:
        config = await self._inbox_config()
        self.user_guid = config["user"]["guid"]
        api = config.get("api_url", "/suhtlus/api/")

        _, body = await self._get(
            f"{api}channels/unread_counts?v=2020&c%5B%5D=a%2Funread&uid={self.user_guid}", xhr=True
        )
        count = int(json.loads(body).get("a/unread", {}).get("unread_count") or 0)

        messages: list[Message] = []
        if count:
            # Read-only listing; it does not mark anything as read.
            _, body = await self._get(
                f"{api}channels/updates/a/unread?v=2020&uid={self.user_guid}", xhr=True
            )
            for item in json.loads(body).get("updates", []):
                created = None
                if item.get("created_at"):
                    try:
                        created = datetime.strptime(
                            item["created_at"], "%Y-%m-%d %H:%M:%S"
                        ).replace(tzinfo=SCHOOL_TZ)
                    except ValueError:
                        pass
                sender = " ".join(
                    filter(None, [item.get("user_name_first"), item.get("user_name_last")])
                )
                messages.append(
                    Message(
                        id=str(item.get("post_id") or item.get("id")),
                        title=html.unescape(item.get("title_formatted") or item.get("title") or ""),
                        sender=html.unescape(sender),
                        created=created,
                        body=item.get("body_formatted") or item.get("body") or "",
                    )
                )
        return count, messages
