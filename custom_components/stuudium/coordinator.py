"""Data update coordinator for Stuudium."""
from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .api import (
    StuudiumAuthError,
    StuudiumClient,
    StuudiumData,
    StuudiumError,
    Student,
    cookies_to_text,
    parse_grades_page,
    parse_remarks_page,
)
from .const import CONF_COOKIE, DOMAIN, EVENT_NEW_GRADE, EVENT_NEW_MESSAGE, SCAN_INTERVAL

_LOGGER = logging.getLogger(__name__)


class StuudiumCoordinator(DataUpdateCoordinator[StuudiumData]):
    """Polls grades and unread messages; fires events for new ones."""

    config_entry: ConfigEntry

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, client: StuudiumClient) -> None:
        super().__init__(
            hass, _LOGGER, name=DOMAIN, update_interval=SCAN_INTERVAL, config_entry=entry
        )
        self.client = client
        self._seen_grades: set[str] | None = None
        self._seen_messages: set[str] | None = None

    async def _async_update_data(self) -> StuudiumData:
        try:
            students: dict[str, Student] = {}
            for sid in await self.client.get_student_ids():
                page = await self.client.get_grades_page(sid)
                name, grades, homework, marks = await self.hass.async_add_executor_job(
                    parse_grades_page, page
                )
                remarks_page = await self.client.get_remarks_page(sid)
                remarks = await self.hass.async_add_executor_job(
                    parse_remarks_page, remarks_page, dt_util.now().date()
                )
                students[sid] = Student(
                    id=sid, name=name or f"Student {sid}", grades=grades,
                    homework=homework, marks=marks, remarks=remarks,
                )
            count, messages = await self.client.get_unread()
        except StuudiumAuthError as err:
            raise ConfigEntryAuthFailed(str(err)) from err
        except StuudiumError as err:
            raise UpdateFailed(str(err)) from err
        finally:
            self._persist_rotated_cookies()

        self._fire_new_events(students, messages)
        return StuudiumData(students=students, unread_count=count, unread_messages=messages)

    def _persist_rotated_cookies(self) -> None:
        if not self.client.cookies_changed or not self.client.cookies:
            return
        self.client.cookies_changed = False
        self.hass.config_entries.async_update_entry(
            self.config_entry,
            data={**self.config_entry.data, CONF_COOKIE: cookies_to_text(self.client.cookies)},
        )
        _LOGGER.debug("Stored rotated Stuudium cookies")

    @staticmethod
    def _grade_keys(student: Student) -> list[str]:
        """Stable key per grade; identical grades on the same day get #1, #2..."""
        seen: dict[str, int] = {}
        keys = []
        for grade in student.grades:
            base = f"{student.id}|{grade.key}"
            seen[base] = seen.get(base, 0) + 1
            keys.append(f"{base}#{seen[base]}")
        return keys

    def _fire_new_events(self, students: dict[str, Student], messages) -> None:
        grade_keys = {k for s in students.values() for k in self._grade_keys(s)}
        msg_ids = {m.id for m in messages}

        # First poll after start-up only seeds the "seen" sets, so a restart
        # does not replay every grade of the period.
        if self._seen_grades is not None:
            for student in students.values():
                pairs = list(zip(student.grades, self._grade_keys(student)))
                for grade, key in reversed(pairs):
                    if key not in self._seen_grades:
                        self.hass.bus.async_fire(
                            EVENT_NEW_GRADE,
                            {"student": student.name, "student_id": student.id, **grade.as_dict()},
                        )
        if self._seen_messages is not None:
            for msg in messages:
                if msg.id not in self._seen_messages:
                    self.hass.bus.async_fire(EVENT_NEW_MESSAGE, msg.as_dict(with_body=True))

        # Keep old grade keys too so a grade that drops out of the table and
        # back in is not reported twice; messages only track the unread set.
        self._seen_grades = (self._seen_grades or set()) | grade_keys
        self._seen_messages = (self._seen_messages or set()) | msg_ids
