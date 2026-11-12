"""Sensors for Stuudium.

Per student: latest grade, period average (+trend), average and trend per
subject, homework for the next school day, absences / lesson marks, teacher
remarks. Per account: unread messages.
"""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util

from . import StuudiumConfigEntry
from .api import ABSENCE_KINDS, Student, average, grade_value, trend
from .const import DOMAIN, RECENT_GRADES, RECENT_MESSAGES
from .coordinator import StuudiumCoordinator

UPCOMING_HOMEWORK = 15


def next_school_day(today: date) -> date:
    day = today + timedelta(days=1)
    while day.weekday() >= 5:  # skip Saturday/Sunday
        day += timedelta(days=1)
    return day


async def async_setup_entry(
    hass: HomeAssistant, entry: StuudiumConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator = entry.runtime_data
    known: set[str] = set()

    @callback
    def _add_new_entities() -> None:
        """Create sensors for students/subjects that appear (also mid-period)."""
        new: list[SensorEntity] = []
        if "unread" not in known:
            known.add("unread")
            new.append(UnreadMessagesSensor(coordinator))
        for sid, student in coordinator.data.students.items():
            if sid not in known:
                known.add(sid)
                new += [
                    LatestGradeSensor(coordinator, sid),
                    AverageSensor(coordinator, sid),
                    HomeworkSensor(coordinator, sid),
                    AbsencesSensor(coordinator, sid),
                    RemarksSensor(coordinator, sid),
                ]
            for subject in student.subject_averages():
                key = f"{sid}|{subject}"
                if key not in known:
                    known.add(key)
                    new.append(SubjectAverageSensor(coordinator, sid, subject))
        if new:
            async_add_entities(new)

    _add_new_entities()
    entry.async_on_unload(coordinator.async_add_listener(_add_new_entities))


class _StudentSensor(CoordinatorEntity[StuudiumCoordinator], SensorEntity):
    _attr_has_entity_name = True

    def __init__(self, coordinator: StuudiumCoordinator, student_id: str, key: str) -> None:
        super().__init__(coordinator)
        self._sid = student_id
        uid = coordinator.config_entry.unique_id
        self._attr_unique_id = f"{uid}_{student_id}_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"{uid}_{student_id}")},
            name=coordinator.data.students[student_id].name,
            manufacturer="Stuudium",
            model=coordinator.client.host,
            entry_type=DeviceEntryType.SERVICE,
            configuration_url=f"{coordinator.client.base}/grades/student/{student_id}",
        )

    @property
    def device_info(self) -> DeviceInfo:
        """Link the child's device to the school-account device (where messages live)."""
        info = DeviceInfo(**self._attr_device_info)
        if self.hass:
            acct = dr.async_get(self.hass).async_get_device(
                identifiers={(DOMAIN, self.coordinator.config_entry.unique_id)}
            )
            if acct:
                info["via_device_id"] = acct.id
        return info

    @property
    def _student(self) -> Student | None:
        return self.coordinator.data.students.get(self._sid)

    @property
    def available(self) -> bool:
        return super().available and self._student is not None


class LatestGradeSensor(_StudentSensor):
    _attr_translation_key = "latest_grade"
    _attr_icon = "mdi:school"
    _attr_name = "Latest grade"
    _unrecorded_attributes = frozenset({"recent_grades"})

    def __init__(self, coordinator: StuudiumCoordinator, student_id: str) -> None:
        super().__init__(coordinator, student_id, "latest_grade")

    @property
    def native_value(self) -> str | None:
        student = self._student
        return student.grades[0].grade if student and student.grades else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        student = self._student
        if not student or not student.grades:
            return {}
        latest = student.grades[0]
        return {
            "subject": latest.subject,
            "date": latest.date.isoformat(),
            "note": latest.note,
            "important": latest.important,
            "grades_this_period": len(student.grades),
            "recent_grades": [g.as_dict() for g in student.grades[:RECENT_GRADES]],
        }


class AverageSensor(_StudentSensor):
    """Average of all numeric grades this period ('5-' = 4.75, 'AR' ignored)."""

    _attr_translation_key = "period_average"
    _attr_icon = "mdi:chart-line"
    _attr_name = "Period average"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 2

    def __init__(self, coordinator: StuudiumCoordinator, student_id: str) -> None:
        super().__init__(coordinator, student_id, "period_average")

    @property
    def native_value(self) -> float | None:
        student = self._student
        return student.overall_average() if student else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        student = self._student
        if not student:
            return {}
        today = dt_util.now().date()
        trends = {
            subj: trend([g for g in student.grades if g.subject == subj], today)["trend"]
            for subj in student.subject_averages()
        }
        return {
            **trend(student.grades, today),
            "subjects": student.subject_averages(),
            "subject_trends": trends,
            "numeric_grades": sum(1 for g in student.grades if grade_value(g.grade) is not None),
            "important_average": average(
                [v for g in student.grades if g.important and (v := grade_value(g.grade)) is not None]
            ),
        }


class SubjectAverageSensor(_StudentSensor):
    _attr_translation_key = "subject_average"
    _attr_icon = "mdi:book-open-variant"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 2

    def __init__(self, coordinator: StuudiumCoordinator, student_id: str, subject: str) -> None:
        super().__init__(coordinator, student_id, f"average_{subject}")
        self._subject = subject
        self._attr_name = f"{subject} average"

    @property
    def native_value(self) -> float | None:
        student = self._student
        return student.subject_averages().get(self._subject) if student else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        student = self._student
        if not student:
            return {}
        grades = [g for g in student.grades if g.subject == self._subject]
        return {
            "subject": self._subject,
            **trend(grades, dt_util.now().date()),
            "grades": [g.grade for g in grades],
            "latest": grades[0].as_dict() if grades else None,
        }


class HomeworkSensor(_StudentSensor):
    """Number of tasks due on the next school day; upcoming list in attributes."""

    _attr_translation_key = "homework_next_day"
    _attr_icon = "mdi:notebook-edit-outline"
    _attr_name = "Homework next school day"
    _attr_native_unit_of_measurement = "tasks"
    _unrecorded_attributes = frozenset({"tasks", "upcoming"})

    def __init__(self, coordinator: StuudiumCoordinator, student_id: str) -> None:
        super().__init__(coordinator, student_id, "homework_next_day")

    def _split(self):
        student = self._student
        today = dt_util.now().date()
        day = next_school_day(today)
        if not student:
            return day, [], []
        upcoming = [h for h in student.homework if h.due > today]
        return day, [h for h in upcoming if h.due == day], upcoming

    @property
    def native_value(self) -> int:
        return len(self._split()[1])

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        day, due_next, upcoming = self._split()
        return {
            "due_date": day.isoformat(),
            "subjects": sorted({h.subject for h in due_next}),
            "tasks": [h.as_dict() for h in due_next],
            "upcoming": [h.as_dict() for h in upcoming[:UPCOMING_HOMEWORK]],
        }


class AbsencesSensor(_StudentSensor):
    """Absences this period; late / missing homework / attention marks as attributes."""

    _attr_translation_key = "absences"
    _attr_icon = "mdi:account-clock-outline"
    _attr_name = "Absences"
    _attr_native_unit_of_measurement = "lessons"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _unrecorded_attributes = frozenset({"recent"})

    def __init__(self, coordinator: StuudiumCoordinator, student_id: str) -> None:
        super().__init__(coordinator, student_id, "absences")

    def _count(self, kind: str) -> int:
        student = self._student
        return sum(1 for m in student.marks if m.kind == kind) if student else 0

    @property
    def native_value(self) -> int:
        return sum(self._count(k) for k in ABSENCE_KINDS)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        student = self._student
        return {
            "unexcused": self._count("absent"),
            "excused": self._count("absent_excused"),
            "late": self._count("late"),
            "no_homework": self._count("no_homework"),
            "attention": self._count("attention"),
            "exempt": self._count("exempt"),
            "recent": [m.as_dict() for m in student.marks[:RECENT_GRADES]] if student else [],
        }


class RemarksSensor(_StudentSensor):
    """Teacher praise / remarks (Kiitused ja märkused). State = count this school year."""

    _attr_translation_key = "teacher_remarks"
    _attr_icon = "mdi:message-star-outline"
    _attr_name = "Teacher remarks"
    _attr_native_unit_of_measurement = "remarks"
    _unrecorded_attributes = frozenset({"recent"})

    def __init__(self, coordinator: StuudiumCoordinator, student_id: str) -> None:
        super().__init__(coordinator, student_id, "remarks")

    def _this_school_year(self) -> list:
        student = self._student
        if not student:
            return []
        today = dt_util.now().date()
        start = date(today.year if today.month >= 8 else today.year - 1, 8, 1)
        return [r for r in student.remarks if r.date and r.date >= start]

    @property
    def native_value(self) -> int:
        return len(self._this_school_year())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        student = self._student
        remarks = self._this_school_year()
        return {
            "praise": sum(1 for r in remarks if r.positive),
            "other": sum(1 for r in remarks if not r.positive),
            "latest": remarks[0].as_dict() if remarks else None,
            "recent": [r.as_dict() for r in (student.remarks if student else [])[:RECENT_GRADES]],
        }


class UnreadMessagesSensor(CoordinatorEntity[StuudiumCoordinator], SensorEntity):
    _attr_has_entity_name = True
    _attr_translation_key = "unread_messages"
    _attr_icon = "mdi:email-outline"
    _attr_name = "Unread messages"
    _attr_native_unit_of_measurement = "messages"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _unrecorded_attributes = frozenset({"messages"})

    def __init__(self, coordinator: StuudiumCoordinator) -> None:
        super().__init__(coordinator)
        uid = coordinator.config_entry.unique_id
        self._attr_unique_id = f"{uid}_unread_messages"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, uid)},
            name=f"Stuudium {coordinator.client.host}",
            manufacturer="Stuudium",
            entry_type=DeviceEntryType.SERVICE,
            configuration_url=f"{coordinator.client.base}/suhtlus/",
        )

    @property
    def native_value(self) -> int:
        return self.coordinator.data.unread_count

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        msgs = self.coordinator.data.unread_messages
        return {
            "latest_title": msgs[0].title if msgs else None,
            "latest_sender": msgs[0].sender if msgs else None,
            "messages": [m.as_dict() for m in msgs[:RECENT_MESSAGES]],
        }
