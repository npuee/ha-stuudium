# Changelog

## 1.0.0

First public release.

### Integration
- Finds every child on the parent account automatically. A child at another school is
  added as a second integration entry.
- Latest grade with subject, teacher's note and an "important" flag (tests), plus the
  last 10 grades.
- Period average and one average per subject, each with a trend (last 3 weeks compared
  with earlier in the period).
- Homework due on the next school day, and all upcoming homework.
- Absences (unexcused and excused), late arrivals, homework not done and "attention!"
  marks.
- Teacher remarks (*Kiitused ja märkused*) for the current school year.
- Unread messages from *Suhtlus*. Reading them in Home Assistant does not mark them as
  read.
- `stuudium_new_grade` and `stuudium_new_message` events for automations.
- Two-step setup: the school address, then the browser session cookie (`_stdmss`), with
  step-by-step instructions. The cookie field also accepts a `Cookie:` header, Copy as
  cURL and cookie-extension exports.
- A re-authenticate prompt when the Stuudium session ends.
- Setup screens in English and Estonian.

### Dashboard card (`custom:stuudium-card`)
- Bundled with the integration and loaded automatically, so you don't add it as a
  dashboard resource.
- Tabs: Overview (with a "Needs attention" list and an average sparkline), Grades,
  Homework, Subjects, Attendance and Messages.
- Compact mode with the header and four tiles.
- English and Estonian (`language: en | et`, default: your Home Assistant language).
- Visual editor for the child, language, start tab and compact mode.
