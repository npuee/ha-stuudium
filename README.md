# Stuudium for Home Assistant

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/)
[![Validate](https://github.com/npuee/ha-stuudium/actions/workflows/validate.yml/badge.svg)](https://github.com/npuee/ha-stuudium/actions/workflows/validate.yml)

Follow your child's school life from Home Assistant: grades, averages and trends,
homework, absences, teacher remarks and unread messages from
[Stuudium](https://www.stuudium.com), the e-school platform used by many Estonian
schools (`*.ope.ee`). A dashboard card is included.

> **Eesti keeles:** Stuudiumi (e-kooli) integratsioon Home Assistantile – hinded,
> keskmised ja trendid, kodutööd, puudumised, kiitused/märkused ja lugemata sõnumid.
> Kaasas on armatuurlaua kaart. Seadistus ja kaart on nii eesti kui inglise keeles.

This is an unofficial integration and is not affiliated with Stuudium. Stuudium has no
public API, so it reads the same pages your browser shows.

## Features

- **Every child on the parent account** is found automatically and gets their own device.
- **Grades:** the latest grade with subject, teacher's note and an "important" flag
  (tests, *kontrolltöö*), plus the last 10 grades.
- **Averages:** an average for the current period and one per subject, each with a trend
  (last 3 weeks compared with earlier in the period). `5-` counts as 4.75, `4+` as 4.25,
  `5+` as 5, and non-numeric grades such as `AR` are skipped.
- **Homework:** the number of tasks due on the next school day, plus everything coming up.
- **Attendance:** unexcused and excused absences, late arrivals, homework not done and
  "attention!" marks.
- **Teacher remarks** (*Kiitused ja märkused*): praise and remarks for this school year.
- **Unread messages** from *Suhtlus*, with titles and senders. Reading them in Home
  Assistant does not mark them as read.
- **Events for automations:** `stuudium_new_grade` and `stuudium_new_message`.
- **Dashboard card** (`custom:stuudium-card`) in English and Estonian, with a visual
  editor. It is loaded automatically, so you don't add it as a dashboard resource.

## Installation

### HACS / Marketplace

1. Open HACS (on Home Assistant 2026.11 and newer: **Marketplace**) → ⋮ → **Custom
   repositories**.
2. Add `https://github.com/npuee/ha-stuudium` with the category **Integration**.
3. Install **Stuudium** and restart Home Assistant.

### Manual

Copy `custom_components/stuudium` into your Home Assistant `config/custom_components/`
folder and restart.

## Setup

Go to **Settings → Devices & services → Add integration → Stuudium**.

1. **School address:** your school's Stuudium address, for example `myschool.ope.ee`.
   You can paste the whole address bar.
2. **Log in with your browser.** Stuudium's login page has a captcha, so Home Assistant
   borrows your browser's session instead of your password:
   1. On a computer, log in at `https://myschool.ope.ee/auth/` with
      **"Logi mind tulevikus automaatselt sisse"** switched on.
   2. Press **F12** → **Application** (Firefox: **Storage**) → **Cookies** →
      `https://myschool.ope.ee`.
   3. Copy the **Value** of each of the two cookies into its own box:
      - **`_stdmss`**: the login itself (required).
      - **`__stclid`**: the "log me in automatically" cookie, valid for about a month
        (recommended).

   A whole `Cookie:` header, or **Copy as cURL** from the Network tab, also works in the
   first box.

Don't click *Logi välja* in that browser afterwards, because that ends this session too.
Stuudium ends a login 48 hours after it starts. When that happens, Home Assistant shows
a **re-authenticate** prompt with the same steps. You can also paste new cookies at any
time with **Settings → Devices & services → Stuudium → ⋮ → Reconfigure**.

For a child at a different school, add the integration again with that school's
address.

## Dashboard card

```yaml
type: custom:stuudium-card
student: Mari Maasikas   # optional: child's name as shown on the device; default = first child
language: et             # optional: en | et; default = your Home Assistant language
compact: false           # optional: header + four tiles only (good for a home screen)
tab: overview            # optional start tab: overview | grades | homework | subjects | attendance | messages
```

All options can also be set in the card's visual editor.

| Tab | Shows |
|---|---|
| Overview | Latest grade, average with trend and a 60-day sparkline, homework, absences, and a **Needs attention** list (falling subjects, low recent grades, absences, missing homework) |
| Grades | The last 10 grades with notes; ⭐ marks important ones |
| Homework | Upcoming homework grouped by day |
| Subjects | Average per subject on a 1–5 bar with a trend arrow; tap a subject to see its grades |
| Attendance | Absences and lesson marks, plus teacher remarks |
| Messages | Unread messages, with a link to Stuudium |

## Entities

Per child, where `<child>` is the child's name:

| Entity | State | Main attributes |
|---|---|---|
| `sensor.<child>_latest_grade` | latest grade | `subject`, `date`, `note`, `important`, `recent_grades` |
| `sensor.<child>_period_average` | average (1–5) | `trend`, `recent_average`, `earlier_average`, `subjects`, `subject_trends` |
| `sensor.<child>_<subject>_average` | subject average | `trend`, `grades`, `latest` |
| `sensor.<child>_homework_next_school_day` | tasks due next school day | `due_date`, `tasks`, `upcoming` |
| `sensor.<child>_absences` | absences this period | `unexcused`, `excused`, `late`, `no_homework`, `attention`, `recent` |
| `sensor.<child>_teacher_remarks` | remarks this school year | `praise`, `other`, `latest`, `recent` |

Per school account: `sensor.stuudium_<school>_unread_messages`, with `messages`,
`latest_title` and `latest_sender`.

Data refreshes every 30 minutes and covers the current grading period, the same view as
*Tunnid ja hinded tabelina* in Stuudium.

## Automation example

```yaml
triggers:
  - trigger: event
    event_type: stuudium_new_grade
actions:
  - action: notify.notify
    data:
      title: "{{ trigger.event.data.student }}: {{ trigger.event.data.grade }} ({{ trigger.event.data.subject }})"
      message: "{{ trigger.event.data.note or '' }}"
```

The first refresh after a restart does not fire events, so old grades are not replayed.

## Privacy

- The login cookies are stored in Home Assistant's config entry, like any other
  integration credential. They give access to the parent account, so treat it like a
  password.
- Home Assistant only talks to your school's Stuudium site. Nothing is sent anywhere
  else.

## License

MIT
