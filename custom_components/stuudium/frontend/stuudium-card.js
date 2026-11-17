/*
 * Stuudium card – bundled with the Stuudium custom integration.
 *
 *   type: custom:stuudium-card
 *   student: Mari Maasikas    # optional: device name or device_id; default = first child
 *   language: et              # optional: en | et; default = the user's Home Assistant language
 *   compact: false            # optional: header + four tiles only
 *   tab: overview             # optional start tab: overview|grades|homework|subjects|attendance|messages
 *
 * All options can also be set in the visual card editor.
 * Sensors are found through the integration's devices (translation_key = kind),
 * so no entity ids need to be configured.
 */
const CARD_VERSION = "1.1.0";

// ---------------------------------------------------------------- i18n
const I18N = {
  en: {
    tab_overview: "Overview",
    tab_grades: "Grades",
    tab_homework: "Homework",
    tab_subjects: "Subjects",
    tab_attendance: "Attendance",
    tab_messages: "Messages",
    mark_absent: "Absent (unexcused)",
    mark_absent_excused: "Absent (excused)",
    mark_late: "Late",
    mark_no_homework: "Homework not done",
    mark_attention: "Attention!",
    mark_exempt: "Exempt",
    trend_up: "improving",
    trend_down: "falling",
    trend_steady: "steady",
    today: "Today",
    tomorrow: "Tomorrow",
    yesterday: "Yesterday",
    ago_min: "{n} min ago",
    ago_h: "{n} h ago",
    ago_d: "{n} d ago",
    latest_grade: "Latest grade",
    unread_messages: "Unread messages",
    average: "Average",
    last_3_weeks_value: "last 3 wks {v}",
    this_period: "this period",
    homework: "Homework",
    due_day: "due {day}",
    absences: "Absences",
    n_late: "{n} late",
    spark_label: "Average, last 60 days",
    needs_attention: "Needs attention",
    attn_low_avg: "<b>{s}</b> average is {v}",
    attn_falling: "<b>{s}</b> falling: {r} in the last 3 weeks (was {e})",
    attn_low_grade: "{pill} in <b>{s}</b> on {date}",
    attn_unexcused: "{n} unexcused absence(s) this period",
    attn_no_homework: "Homework not done {n}×",
    attn_attention: "{n} teacher attention mark(s)",
    all_good: "All good – nothing needs attention.",
    homework_for: "Homework for {day}",
    latest_remark: "Latest teacher remark",
    no_grades: "No grades yet this period.",
    important: "Important (e.g. test)",
    grades_foot: "Last {n} of {t} grades this period",
    all_grades: "All grades in Stuudium",
    no_homework: "No upcoming homework.",
    no_subjects: "No subject averages yet.",
    subjects_legend: "Sorted weakest first · arrow = last 3 weeks vs. earlier · tap a subject for its grades",
    last_3_weeks: "Last 3 weeks: {v}",
    earlier: "earlier: {v}",
    latest_on: "Latest: {g} on {date}",
    chip_unexcused: "Unexcused",
    chip_excused: "Excused",
    chip_late: "Late",
    chip_no_homework: "No homework",
    chip_attention: "Attention",
    no_marks: "No absences or lesson marks this period.",
    remarks: "Teacher remarks",
    remarks_year: "this school year: {p} praise · {o} other",
    no_remarks: "No remarks yet.",
    no_messages_sensor: "No messages sensor found.",
    n_unread: "<b>{n}</b> unread",
    open_stuudium: "Open Stuudium",
    no_unread: "No unread messages.",
    showing_newest: "Showing the {n} newest of {t}.",
    no_children: "No Stuudium children found. Is the Stuudium integration set up?",
    no_child_named: 'No Stuudium child named "{s}".',
    card_error: "Stuudium card error",
  },
  et: {
    tab_overview: "Ülevaade",
    tab_grades: "Hinded",
    tab_homework: "Kodutööd",
    tab_subjects: "Ained",
    tab_attendance: "Puudumised",
    tab_messages: "Sõnumid",
    mark_absent: "Puudus põhjuseta",
    mark_absent_excused: "Puudus põhjusega",
    mark_late: "Hilines",
    mark_no_homework: "Kodutöö tegemata",
    mark_attention: "Tähelepanu!",
    mark_exempt: "Vabastatud",
    trend_up: "paraneb",
    trend_down: "langeb",
    trend_steady: "stabiilne",
    today: "Täna",
    tomorrow: "Homme",
    yesterday: "Eile",
    ago_min: "{n} min tagasi",
    ago_h: "{n} t tagasi",
    ago_d: "{n} p tagasi",
    latest_grade: "Viimane hinne",
    unread_messages: "Lugemata sõnumid",
    average: "Keskmine",
    last_3_weeks_value: "viimased 3 näd {v}",
    this_period: "sel perioodil",
    homework: "Kodutööd",
    due_day: "tähtaeg {day}",
    absences: "Puudumised",
    n_late: "{n} hilinemist",
    spark_label: "Keskmine, viimased 60 päeva",
    needs_attention: "Vajab tähelepanu",
    attn_low_avg: "<b>{s}</b> keskmine on {v}",
    attn_falling: "<b>{s}</b> langeb: viimased 3 nädalat {r} (varem {e})",
    attn_low_grade: "{pill} aines <b>{s}</b>, {date}",
    attn_unexcused: "{n} põhjuseta puudumist sel perioodil",
    attn_no_homework: "Kodutöö tegemata {n}×",
    attn_attention: "{n} tähelepanu märget",
    all_good: "Kõik korras – midagi ei vaja tähelepanu.",
    homework_for: "Kodutööd: {day}",
    latest_remark: "Viimane kiitus või märkus",
    no_grades: "Sel perioodil veel hindeid pole.",
    important: "Oluline (nt kontrolltöö)",
    grades_foot: "Viimased {n} hinnet {t}-st sel perioodil",
    all_grades: "Kõik hinded Stuudiumis",
    no_homework: "Eesolevaid kodutöid pole.",
    no_subjects: "Ainete keskmisi veel pole.",
    subjects_legend: "Nõrgemad eespool · nool = viimased 3 nädalat vs varem · puuduta ainet, et näha hindeid",
    last_3_weeks: "Viimased 3 nädalat: {v}",
    earlier: "varem: {v}",
    latest_on: "Viimane: {g}, {date}",
    chip_unexcused: "Põhjuseta",
    chip_excused: "Põhjusega",
    chip_late: "Hilinemised",
    chip_no_homework: "Kodutöö tegemata",
    chip_attention: "Tähelepanu",
    no_marks: "Sel perioodil puudumisi ega märkeid pole.",
    remarks: "Kiitused ja märkused",
    remarks_year: "sel õppeaastal: {p} kiitust · {o} muud",
    no_remarks: "Kiitusi ega märkusi veel pole.",
    no_messages_sensor: "Sõnumite andurit ei leitud.",
    n_unread: "<b>{n}</b> lugemata",
    open_stuudium: "Ava Stuudium",
    no_unread: "Lugemata sõnumeid pole.",
    showing_newest: "Näidatakse {n} uusimat {t}-st.",
    no_children: "Stuudiumi lapsi ei leitud. Kas Stuudiumi integratsioon on seadistatud?",
    no_child_named: 'Last nimega "{s}" ei leitud.',
    card_error: "Stuudiumi kaardi viga",
  },
};
const DATE_LOCALE = { en: "en-GB", et: "et-EE" };
const LANGUAGES = ["en", "et"];

const TABS = [
  ["overview", "mdi:view-dashboard-outline"],
  ["grades", "mdi:format-list-numbered"],
  ["homework", "mdi:notebook-edit-outline"],
  ["subjects", "mdi:chart-bar"],
  ["attendance", "mdi:account-clock-outline"],
  ["messages", "mdi:email-outline"],
];

const SUFFIX_KIND = [
  ["_latest_grade", "latest_grade"],
  ["_period_average", "period_average"],
  ["_homework_next_school_day", "homework_next_day"],
  ["_absences", "absences"],
  ["_teacher_remarks", "teacher_remarks"],
  ["_unread_messages", "unread_messages"],
  ["_average", "subject_average"],
];

const TREND_ICON = {
  up: ["mdi:trending-up", "trend-up"],
  down: ["mdi:trending-down", "trend-down"],
  steady: ["mdi:trending-neutral", "trend-steady"],
};

const esc = (v) =>
  String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function gradeValue(g) {
  const m = /^\s*([1-5])\s*([+-]?)\s*$/.exec(String(g == null ? "" : g));
  if (!m) return null;
  return Math.min(5, Math.max(1, Number(m[1]) + (m[2] === "+" ? 0.25 : m[2] === "-" ? -0.25 : 0)));
}

function levelClass(v) {
  if (v == null || isNaN(v)) return "lv-none";
  if (v >= 4.5) return "lv-5";
  if (v >= 3.75) return "lv-4";
  if (v >= 2.75) return "lv-3";
  return "lv-2";
}

function parseDate(iso) {
  if (!iso) return null;
  // date-only strings are local dates, not UTC midnight
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + "T00:00:00") : new Date(iso);
}

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function entityKind(e) {
  if (e.translation_key) return e.translation_key;
  const hit = SUFFIX_KIND.find(([suf]) => e.entity_id.endsWith(suf));
  return hit ? hit[1] : null;
}

/** All Stuudium children visible in hass: [{ id, name, entities }] */
function findStudents(hass) {
  if (!hass || !hass.entities || !hass.devices) return null;
  const ents = Object.values(hass.entities).filter((e) => e.platform === "stuudium" && !e.hidden);
  const byDevice = {};
  for (const e of ents) (byDevice[e.device_id] = byDevice[e.device_id] || []).push(e);
  const students = Object.keys(byDevice)
    .filter((d) => byDevice[d].some((e) => entityKind(e) === "latest_grade"))
    .map((d) => {
      const dev = hass.devices[d] || {};
      return { id: d, name: dev.name_by_user || dev.name || "Student", dev, entities: byDevice[d] };
    });
  return { students, ents, byDevice };
}

function resolveLanguage(config, hass) {
  const want = String((config && config.language) || "").toLowerCase();
  if (LANGUAGES.includes(want)) return want;
  const ha = String((hass && hass.locale && hass.locale.language) || (hass && hass.language) || "en").toLowerCase();
  return ha.startsWith("et") ? "et" : "en";
}

// ---------------------------------------------------------------- card
class StuudiumCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = "overview";
    this._open = new Set(); // expanded subjects
    this._spark = null;
    this._sparkFetched = 0;
  }

  static getConfigElement() {
    return document.createElement("stuudium-card-editor");
  }

  static getStubConfig(hass) {
    const found = findStudents(hass);
    const first = found && found.students[0];
    return first ? { student: first.name } : {};
  }

  setConfig(config) {
    if (config.language && !LANGUAGES.includes(String(config.language).toLowerCase()))
      throw new Error(`language must be one of: ${LANGUAGES.join(", ")}`);
    this._config = Object.assign({ compact: false }, config);
    if (config.tab) this._tab = config.tab;
    this._sig = null;
    if (this._hass) this.hass = this._hass; // re-render with the new config (editor preview)
  }

  getCardSize() {
    return this._config && this._config.compact ? 3 : 9;
  }

  getGridOptions() {
    return this._config && this._config.compact ? { columns: 12, min_columns: 6 } : { columns: 12, min_columns: 9 };
  }

  set hass(hass) {
    try {
      this._setHass(hass);
    } catch (err) {
      this._showError(err);
    }
  }

  // ---------- i18n ----------
  _t(key, vars) {
    const dict = I18N[this._lng] || I18N.en;
    let s = dict[key] != null ? dict[key] : I18N.en[key] != null ? I18N.en[key] : key;
    if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(vars[k]);
    return s;
  }

  _showError(err) {
    const msg = `${err && err.name ? err.name + ": " : ""}${(err && err.message) || err}`;
    const where = ((err && err.stack) || "").split("\n").slice(0, 3).join(" | ");
    console.error("stuudium-card", err);
    if (this.shadowRoot)
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card><div class="empty"><b>${esc(this._t("card_error"))}</b><br>${esc(msg)}<br><small>${esc(navigator.userAgent)}</small></div></ha-card>`;
    // Report once per message so it shows up in the HA log (Settings → System → Logs)
    if (this._hass && this._lastErr !== msg) {
      this._lastErr = msg;
      try {
        this._hass.callService("system_log", "write", {
          logger: "custom_components.stuudium.card",
          level: "error",
          message: `stuudium-card ${CARD_VERSION}: ${msg} @ ${where} [${navigator.userAgent}]`,
        });
      } catch (e) {}
    }
  }

  _setHass(hass) {
    this._hass = hass;
    this._lng = resolveLanguage(this._config, hass);
    const r = this._resolve();
    const sig =
      (r && r.ids
        ? Object.values(r.ids)
            .flat()
            .map((id) => (hass.states[id] || {}).last_updated)
            .join("|")
        : JSON.stringify(r)) +
      "|" +
      this._lng;
    if (sig !== this._sig) {
      this._sig = sig;
      this._r = r;
      this._render();
      this._maybeFetchSpark().catch(() => {});
    }
  }

  // ---------- data ----------
  _resolve() {
    const hass = this._hass;
    const found = findStudents(hass);
    if (!found || !found.students.length) return null;
    const want = String(this._config.student || "").trim().toLowerCase();
    let st = found.students[0];
    if (want) {
      st = found.students.find((s) => s.id === want || s.name.toLowerCase() === want);
      if (!st) return { error: this._t("no_child_named", { s: esc(this._config.student) }) };
    }
    const ids = { subjects: [] };
    for (const e of st.entities) {
      const k = entityKind(e);
      if (k === "subject_average") ids.subjects.push(e.entity_id);
      else if (k) ids[k] = e.entity_id;
    }
    // unread messages live on the school-account device this child links to
    const acct = st.dev.via_device_id;
    const isUnread = (e) => entityKind(e) === "unread_messages";
    const unread =
      (acct && (found.byDevice[acct] || []).find(isUnread)) ||
      found.ents.find((e) => isUnread(e) && (hass.devices[e.device_id] || {}).model === st.dev.model) ||
      found.ents.find(isUnread);
    if (unread) ids.unread_messages = unread.entity_id;
    return { name: st.name, school: st.dev.model || "", url: st.dev.configuration_url || "", ids };
  }

  _st(kind) {
    const id = this._r && this._r.ids && this._r.ids[kind];
    return id ? this._hass.states[id] : undefined;
  }

  _attr(kind, a) {
    const s = this._st(kind);
    return s && s.attributes ? s.attributes[a] : undefined;
  }

  async _maybeFetchSpark() {
    const id = this._r && this._r.ids && this._r.ids.period_average;
    if (!id || this._config.compact || Date.now() - this._sparkFetched < 15 * 60 * 1000) return;
    this._sparkFetched = Date.now();
    try {
      const start = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
      const res = await this._hass.callWS({
        type: "history/history_during_period",
        start_time: start,
        entity_ids: [id],
        minimal_response: true,
        no_attributes: true,
        significant_changes_only: false,
      });
      const pts = ((res && res[id]) || [])
        .map((p) => [Number(p.lu != null ? p.lu : p.lc) * 1000, Number(p.s)])
        .filter(([t, v]) => !isNaN(t) && !isNaN(v));
      this._spark = pts.length >= 2 ? pts : null;
      this._render();
    } catch (err) {
      this._spark = null;
    }
  }

  // ---------- helpers ----------
  _day(iso, opts = { weekday: "short", day: "2-digit", month: "2-digit" }) {
    const d = parseDate(iso);
    if (!d || isNaN(d)) return "";
    try {
      return d.toLocaleDateString(DATE_LOCALE[this._lng] || "en-GB", opts);
    } catch (e) {
      return d.toLocaleDateString("en-GB", opts);
    }
  }

  _relDay(iso) {
    const d = parseDate(iso);
    if (!d) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    if (diff === 0) return this._t("today");
    if (diff === 1) return this._t("tomorrow");
    if (diff === -1) return this._t("yesterday");
    return capitalize(this._day(iso, { weekday: "long", day: "numeric", month: "numeric" }));
  }

  _ago(iso) {
    const d = parseDate(iso);
    if (!d) return "";
    const s = (Date.now() - d.getTime()) / 1000;
    if (s < 3600) return this._t("ago_min", { n: Math.max(1, Math.round(s / 60)) });
    if (s < 86400) return this._t("ago_h", { n: Math.round(s / 3600) });
    if (s < 7 * 86400) return this._t("ago_d", { n: Math.round(s / 86400) });
    return this._day(iso, { day: "2-digit", month: "2-digit" });
  }

  _pill(g, big = false) {
    return `<span class="pill ${levelClass(gradeValue(g))}${big ? " big" : ""}">${esc(g)}</span>`;
  }

  _trendIcon(t) {
    if (!t || !TREND_ICON[t]) return "";
    const [icon, cls] = TREND_ICON[t];
    return `<span class="trend ${cls}" title="${esc(this._t("trend_" + t))}"><ha-icon icon="${icon}"></ha-icon></span>`;
  }

  _moreInfo(entityId) {
    if (!entityId) return;
    const ev = new Event("hass-more-info", { bubbles: true, composed: true });
    ev.detail = { entityId };
    this.dispatchEvent(ev);
  }

  // ---------- render ----------
  _render() {
    try {
      this._renderInner();
    } catch (err) {
      this._showError(err);
    }
  }

  _renderInner() {
    const root = this.shadowRoot;
    const r = this._r;
    if (!this._hass) return;
    let body;
    if (!r) body = `<div class="empty">${esc(this._t("no_children"))}</div>`;
    else if (r.error) body = `<div class="empty">${r.error}</div>`;
    else body = this._config.compact ? this._header() + this._tiles() : this._header() + this._tabs() + this._tabBody();

    root.innerHTML = `<style>${STYLE}</style><ha-card lang="${this._lng}">${body}</ha-card>`;
    root.querySelectorAll("[data-tab]").forEach((el) =>
      el.addEventListener("click", () => {
        this._tab = el.dataset.tab;
        this._render();
      })
    );
    root.querySelectorAll("[data-subject]").forEach((el) =>
      el.addEventListener("click", () => {
        const s = el.dataset.subject;
        if (this._open.has(s)) this._open.delete(s);
        else this._open.add(s);
        this._render();
      })
    );
    root.querySelectorAll("[data-more]").forEach((el) =>
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this._moreInfo(el.dataset.more);
      })
    );
  }

  _header() {
    const r = this._r;
    const latest = this._st("latest_grade");
    const unreadSt = this._st("unread_messages");
    const unread = Number(unreadSt && unreadSt.state) || 0;
    const initials = r.name
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const latestVal = latest && !["unknown", "unavailable"].includes(latest.state) ? latest.state : null;
    return `
      <div class="header">
        <div class="avatar">${esc(initials)}</div>
        <div class="who">
          <div class="name">${esc(r.name)}</div>
          <div class="school">${esc(r.school)}</div>
        </div>
        <div class="badges">
          ${latestVal ? `<div class="badge" data-more="${esc(r.ids.latest_grade)}" title="${esc(this._t("latest_grade"))}">${this._pill(latestVal)}</div>` : ""}
          ${
            r.ids.unread_messages
              ? `<a class="badge mail ${unread ? "has" : ""}" href="https://${esc(r.school)}/suhtlus/" target="_blank" rel="noreferrer" title="${esc(this._t("unread_messages"))}">
                  <ha-icon icon="mdi:email-outline"></ha-icon>${unread ? `<span class="count">${unread > 99 ? "99+" : unread}</span>` : ""}
                </a>`
              : ""
          }
        </div>
      </div>`;
  }

  _tabs() {
    const abs = (this._st("absences") || {}).attributes || {};
    const hwNext = Number((this._st("homework_next_day") || {}).state) || 0;
    const unread = Number((this._st("unread_messages") || {}).state) || 0;
    const dot = {
      homework: hwNext > 0,
      attendance: (Number(abs.unexcused) || 0) + (Number(abs.no_homework) || 0) > 0,
      messages: unread > 0,
    };
    return `<div class="tabs">${TABS.map(([key, icon]) => {
      const label = esc(this._t("tab_" + key));
      return `<button class="tab ${this._tab === key ? "active" : ""}" data-tab="${key}" title="${label}">
          <ha-icon icon="${icon}"></ha-icon><span class="tl">${label}</span>${dot[key] ? `<i class="dot"></i>` : ""}
        </button>`;
    }).join("")}</div>`;
  }

  _tabBody() {
    const fn =
      {
        overview: () => this._overview(),
        grades: () => this._grades(),
        homework: () => this._homework(),
        subjects: () => this._subjects(),
        attendance: () => this._attendance(),
        messages: () => this._messages(),
      }[this._tab] || (() => this._overview());
    return `<div class="body">${fn()}</div>`;
  }

  _tiles() {
    const ids = this._r.ids;
    const latest = this._st("latest_grade");
    const avg = this._st("period_average");
    const hw = this._st("homework_next_day");
    const abs = this._st("absences");
    const avgA = (avg && avg.attributes) || {};
    const avgV = Number(avg && avg.state);
    const hwN = Number(hw && hw.state) || 0;
    const absN = Number(abs && abs.state) || 0;
    const late = Number(abs && abs.attributes && abs.attributes.late) || 0;
    const hwDue = hw && hw.attributes && hw.attributes.due_date;
    const la = (latest && latest.attributes) || {};
    return `
      <div class="tiles">
        <div class="tile" data-more="${esc(ids.latest_grade)}">
          <div class="tlabel">${esc(this._t("latest_grade"))}</div>
          <div class="tval">${latest ? this._pill(latest.state, true) : "–"}</div>
          <div class="tsub">${esc(la.subject || "")}${la.important ? " ⭐" : ""}</div>
        </div>
        <div class="tile" data-more="${esc(ids.period_average)}">
          <div class="tlabel">${esc(this._t("average"))}</div>
          <div class="tval"><span class="avg ${levelClass(avgV)}">${isNaN(avgV) ? "–" : avgV.toFixed(2)}</span>${this._trendIcon(avgA.trend)}</div>
          <div class="tsub">${esc(
            avgA.recent_average != null
              ? this._t("last_3_weeks_value", { v: Number(avgA.recent_average).toFixed(2) })
              : this._t("this_period")
          )}</div>
        </div>
        <div class="tile" data-more="${esc(ids.homework_next_day)}">
          <div class="tlabel">${esc(this._t("homework"))}</div>
          <div class="tval"><span class="num ${hwN ? "warn" : ""}">${hwN}</span></div>
          <div class="tsub">${hwDue ? esc(this._t("due_day", { day: this._relDay(hwDue).toLowerCase() })) : ""}</div>
        </div>
        <div class="tile" data-more="${esc(ids.absences)}">
          <div class="tlabel">${esc(this._t("absences"))}</div>
          <div class="tval"><span class="num ${absN ? "bad" : "good"}">${absN}</span></div>
          <div class="tsub">${esc(late ? this._t("n_late", { n: late }) : this._t("this_period"))}</div>
        </div>
      </div>`;
  }

  _sparkSvg() {
    const pts = this._spark;
    if (!pts) return "";
    const w = 300,
      h = 44,
      pad = 4;
    const t0 = pts[0][0],
      t1 = Date.now();
    const vs = pts.map((p) => p[1]);
    let lo = Math.min(...vs),
      hi = Math.max(...vs);
    if (hi - lo < 0.2) {
      lo -= 0.1;
      hi += 0.1;
    }
    const x = (t) => pad + ((t - t0) / Math.max(1, t1 - t0)) * (w - 2 * pad);
    const y = (v) => h - pad - ((v - lo) / (hi - lo)) * (h - 2 * pad);
    // step line, extended to now
    let d = `M${x(pts[0][0]).toFixed(1)},${y(pts[0][1]).toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) d += ` H${x(pts[i][0]).toFixed(1)} V${y(pts[i][1]).toFixed(1)}`;
    d += ` H${x(t1).toFixed(1)}`;
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${d}"/></svg>`;
  }

  _attention() {
    const items = [];
    const avg = (this._st("period_average") || {}).attributes || {};
    const subjects = avg.subjects || {};
    for (const [s, v] of Object.entries(subjects)) {
      if (v < 3.5) items.push(["mdi:alert-circle-outline", "bad", this._t("attn_low_avg", { s: esc(s), v: v.toFixed(2) })]);
    }
    for (const id of this._r.ids.subjects) {
      const a = (this._hass.states[id] || {}).attributes || {};
      if (a.trend === "down")
        items.push([
          "mdi:trending-down",
          "warn",
          this._t("attn_falling", {
            s: esc(a.subject),
            r: Number(a.recent_average).toFixed(2),
            e: Number(a.earlier_average).toFixed(2),
          }),
        ]);
    }
    const recent = this._attr("latest_grade", "recent_grades") || [];
    const cutoff = Date.now() - 14 * 86400000;
    for (const g of recent) {
      const v = gradeValue(g.grade);
      if (v != null && v < 3.75 && parseDate(g.date) >= cutoff)
        items.push([
          "mdi:numeric-3-circle-outline",
          v < 2.75 ? "bad" : "warn",
          this._t("attn_low_grade", {
            pill: this._pill(g.grade),
            s: esc(g.subject),
            date: esc(this._day(g.date, { day: "2-digit", month: "2-digit" })),
          }) + (g.note ? ` – ${esc(g.note)}` : ""),
        ]);
    }
    const abs = (this._st("absences") || {}).attributes || {};
    if (abs.unexcused) items.push(["mdi:account-cancel-outline", "bad", this._t("attn_unexcused", { n: abs.unexcused })]);
    if (abs.no_homework) items.push(["mdi:notebook-remove-outline", "warn", this._t("attn_no_homework", { n: abs.no_homework })]);
    if (abs.attention) items.push(["mdi:alert-outline", "warn", this._t("attn_attention", { n: abs.attention })]);
    if (!items.length)
      return `<div class="allgood"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${esc(this._t("all_good"))}</div>`;
    return `<div class="attn">${items
      .map(([icon, cls, html]) => `<div class="attn-item ${cls}"><ha-icon icon="${icon}"></ha-icon><div>${html}</div></div>`)
      .join("")}</div>`;
  }

  _overview() {
    const spark = this._sparkSvg();
    const remark = this._attr("teacher_remarks", "latest");
    const hwTasks = this._attr("homework_next_day", "tasks") || [];
    const hwDue = this._attr("homework_next_day", "due_date");
    return `
      ${this._tiles()}
      ${spark ? `<div class="spark-wrap"><div class="slabel">${esc(this._t("spark_label"))}</div>${spark}</div>` : ""}
      <div class="section-title">${esc(this._t("needs_attention"))}</div>
      ${this._attention()}
      ${
        hwTasks.length
          ? `<div class="section-title">${esc(this._t("homework_for", { day: this._relDay(hwDue).toLowerCase() }))}</div>
             ${hwTasks.map((h) => this._hwItem(h)).join("")}`
          : ""
      }
      ${remark ? `<div class="section-title">${esc(this._t("latest_remark"))}</div>${this._remarkItem(remark)}` : ""}`;
  }

  _grades() {
    const gs = this._attr("latest_grade", "recent_grades") || [];
    if (!gs.length) return `<div class="empty">${esc(this._t("no_grades"))}</div>`;
    const total = this._attr("latest_grade", "grades_this_period");
    return `${gs
      .map(
        (g) => `
        <div class="row">
          ${this._pill(g.grade)}
          <div class="rmain">
            <div class="rtitle">${esc(g.subject)}${g.important ? ` <span class="star" title="${esc(this._t("important"))}">⭐</span>` : ""}</div>
            ${g.note ? `<div class="rsub">${esc(g.note)}</div>` : ""}
          </div>
          <div class="rdate">${esc(this._day(g.date))}</div>
        </div>`
      )
      .join("")}
      <div class="foot">${esc(this._t("grades_foot", { n: gs.length, t: total != null ? total : gs.length }))} · <a href="${esc(this._r.url)}" target="_blank" rel="noreferrer">${esc(this._t("all_grades"))}</a></div>`;
  }

  _hwItem(h) {
    return `<div class="hw"><div class="hw-subj">${esc(h.subject)}</div><div class="hw-text">${esc(h.text).replace(/\n/g, "<br>")}</div></div>`;
  }

  _homework() {
    const up = this._attr("homework_next_day", "upcoming") || [];
    if (!up.length) return `<div class="allgood"><ha-icon icon="mdi:party-popper"></ha-icon>${esc(this._t("no_homework"))}</div>`;
    const groups = {};
    for (const h of up) (groups[h.due] = groups[h.due] || []).push(h);
    return Object.keys(groups)
      .sort()
      .map(
        (due) => `
        <div class="day">
          <div class="day-title">${esc(this._relDay(due))}<span class="day-count">${groups[due].length}</span></div>
          ${groups[due].map((h) => this._hwItem(h)).join("")}
        </div>`
      )
      .join("");
  }

  _subjects() {
    const rows = this._r.ids.subjects
      .map((id) => this._hass.states[id])
      .filter((s) => s && !isNaN(Number(s.state)))
      .map((s) => ({ id: s.entity_id, v: Number(s.state), a: s.attributes }))
      .sort((x, y) => x.v - y.v);
    if (!rows.length) return `<div class="empty">${esc(this._t("no_subjects"))}</div>`;
    return `<div class="legend">${esc(this._t("subjects_legend"))}</div>
      ${rows
        .map(({ id, v, a }) => {
          const subj = a.subject || id;
          const open = this._open.has(subj);
          const pct = Math.max(2, ((v - 1) / 4) * 100);
          const detail = [];
          if (a.recent_average != null) {
            let line = this._t("last_3_weeks", { v: Number(a.recent_average).toFixed(2) });
            if (a.earlier_average != null) line += " · " + this._t("earlier", { v: Number(a.earlier_average).toFixed(2) });
            detail.push(`<div class="rsub">${esc(line)}</div>`);
          }
          if (a.latest)
            detail.push(
              `<div class="rsub">${esc(this._t("latest_on", { g: a.latest.grade, date: this._day(a.latest.date) }))}${a.latest.note ? ` – ${esc(a.latest.note)}` : ""}</div>`
            );
          return `
          <div class="subj ${open ? "open" : ""}" data-subject="${esc(subj)}">
            <div class="subj-row">
              <div class="subj-name">${esc(subj)}</div>
              <div class="bar"><div class="fill ${levelClass(v)}" style="width:${pct}%"></div></div>
              <div class="subj-val">${v.toFixed(2)}</div>
              <div class="subj-trend">${this._trendIcon(a.trend) || `<span class="trend none">–</span>`}</div>
            </div>
            ${
              open
                ? `<div class="subj-detail">
                    <div class="chips">${(a.grades || []).map((g) => this._pill(g)).join("")}</div>
                    ${detail.join("")}
                  </div>`
                : ""
            }
          </div>`;
        })
        .join("")}`;
  }

  _remarkItem(r) {
    return `<div class="remark ${r.positive ? "pos" : "neg"}">
      <ha-icon icon="${r.positive ? "mdi:thumb-up-outline" : "mdi:alert-outline"}"></ha-icon>
      <div>
        <div class="rtitle">${esc(r.kind)} · ${esc(r.subject)}<span class="rdate">${r.date ? esc(this._day(r.date, { day: "2-digit", month: "2-digit", year: "numeric" })) : ""}</span></div>
        <div class="rsub">${esc(r.text).replace(/\n/g, "<br>")}</div>
        <div class="who-sm">${esc(r.teacher)}</div>
      </div>
    </div>`;
  }

  _attendance() {
    const a = (this._st("absences") || {}).attributes || {};
    const chips = [
      ["chip_unexcused", a.unexcused, "bad"],
      ["chip_excused", a.excused, "neutral"],
      ["chip_late", a.late, "warn"],
      ["chip_no_homework", a.no_homework, "warn"],
      ["chip_attention", a.attention, "warn"],
    ];
    const recent = a.recent || [];
    const rem = this._attr("teacher_remarks", "recent") || [];
    const praise = this._attr("teacher_remarks", "praise") || 0;
    const other = this._attr("teacher_remarks", "other") || 0;
    return `
      <div class="stat-chips">${chips
        .map(([key, n, cls]) => `<div class="schip ${n ? cls : "zero"}"><span class="sn">${n || 0}</span>${esc(this._t(key))}</div>`)
        .join("")}</div>
      ${
        recent.length
          ? recent
              .map(
                (m) => `<div class="row"><ha-icon class="mk ${esc(m.kind)}" icon="mdi:calendar-alert"></ha-icon>
                  <div class="rmain"><div class="rtitle">${esc(this._t("mark_" + m.kind))}</div><div class="rsub">${esc(m.subject)}</div></div>
                  <div class="rdate">${esc(this._day(m.date))}</div></div>`
              )
              .join("")
          : `<div class="allgood"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${esc(this._t("no_marks"))}</div>`
      }
      <div class="section-title">${esc(this._t("remarks"))} <span class="muted">${esc(this._t("remarks_year", { p: praise, o: other }))}</span></div>
      ${rem.length ? rem.map((r) => this._remarkItem(r)).join("") : `<div class="empty">${esc(this._t("no_remarks"))}</div>`}`;
  }

  _messages() {
    const st = this._st("unread_messages");
    if (!st) return `<div class="empty">${esc(this._t("no_messages_sensor"))}</div>`;
    const msgs = st.attributes.messages || [];
    const n = Number(st.state) || 0;
    const link = `https://${esc(this._r.school)}/suhtlus/`;
    return `
      <div class="msg-head"><span>${this._t("n_unread", { n })}</span><a class="btn" href="${link}" target="_blank" rel="noreferrer"><ha-icon icon="mdi:open-in-new"></ha-icon>${esc(this._t("open_stuudium"))}</a></div>
      ${
        msgs.length
          ? msgs
              .map(
                (m) => `<a class="msg" href="${link}" target="_blank" rel="noreferrer">
                  <div class="mavatar">${esc((m.sender || "?").split(/\s+/).map((p) => p[0]).slice(0, 2).join(""))}</div>
                  <div class="rmain"><div class="rtitle">${esc(m.title)}</div><div class="rsub">${esc(m.sender)}</div></div>
                  <div class="rdate">${esc(this._ago(m.created))}</div>
                </a>`
              )
              .join("")
          : `<div class="allgood"><ha-icon icon="mdi:email-check-outline"></ha-icon>${esc(this._t("no_unread"))}</div>`
      }
      ${n > msgs.length && msgs.length ? `<div class="foot">${esc(this._t("showing_newest", { n: msgs.length, t: n }))}</div>` : ""}`;
  }
}

// ---------------------------------------------------------------- visual editor
const EDITOR_LABELS = {
  en: {
    student: "Child",
    language: "Language",
    tab: "Start tab",
    compact: "Compact (header + 4 tiles)",
    auto: "Automatic (Home Assistant language)",
  },
  et: {
    student: "Laps",
    language: "Keel",
    tab: "Avavaade",
    compact: "Kompaktne (päis + 4 paani)",
    auto: "Automaatne (Home Assistanti keel)",
  },
};

class StuudiumCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = Object.assign({}, config);
    this._update();
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  _labels() {
    return EDITOR_LABELS[resolveLanguage({}, this._hass)] || EDITOR_LABELS.en;
  }

  _schema() {
    const L = this._labels();
    const found = findStudents(this._hass);
    const children = ((found && found.students) || []).map((s) => ({ value: s.name, label: s.name }));
    const lng = resolveLanguage(this._config, this._hass);
    return [
      { name: "student", selector: { select: { options: children, mode: "dropdown", custom_value: true } } },
      {
        name: "language",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "auto", label: L.auto },
              { value: "en", label: "English" },
              { value: "et", label: "Eesti" },
            ],
          },
        },
      },
      {
        name: "tab",
        selector: {
          select: {
            mode: "dropdown",
            options: TABS.map(([key]) => ({ value: key, label: I18N[lng]["tab_" + key] })),
          },
        },
      },
      { name: "compact", selector: { boolean: {} } },
    ];
  }

  _update() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => this._labels()[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => this._changed(ev));
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = this._schema();
    this._form.data = Object.assign({ language: "auto", tab: "overview", compact: false }, this._config, {
      language: this._config.language ? String(this._config.language).toLowerCase() : "auto",
    });
  }

  _changed(ev) {
    ev.stopPropagation();
    const v = ev.detail.value || {};
    const config = Object.assign({}, this._config);
    for (const key of ["student", "language", "tab", "compact"]) {
      const val = v[key];
      const isDefault =
        val == null || val === "" || (key === "language" && val === "auto") || (key === "tab" && val === "overview") || (key === "compact" && val === false);
      if (isDefault) delete config[key];
      else config[key] = val;
    }
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }
}

// ---------------------------------------------------------------- styles
const STYLE = `
  :host { --sc-green: var(--success-color, #2e9d4a); --sc-lime: #7cb342; --sc-amber: var(--warning-color, #f0a400); --sc-red: var(--error-color, #db4437); }
  ha-card { overflow: hidden; }
  a { color: inherit; }
  .header { display: flex; align-items: center; gap: 12px; padding: 16px 16px 12px; }
  .avatar { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; font-weight: 600; font-size: 16px;
    color: var(--text-primary-color, #fff); background: linear-gradient(135deg, var(--primary-color), var(--accent-color, var(--primary-color))); flex: none; }
  .who { flex: 1; min-width: 0; }
  .name { font-size: 18px; font-weight: 600; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .school { color: var(--secondary-text-color); font-size: 13px; }
  .badges { display: flex; align-items: center; gap: 8px; }
  .badge { cursor: pointer; text-decoration: none; position: relative; display: flex; align-items: center; }
  .badge.mail { width: 38px; height: 38px; border-radius: 50%; justify-content: center; background: var(--secondary-background-color); color: var(--secondary-text-color); }
  .badge.mail.has { color: var(--primary-color); }
  .badge .count { position: absolute; top: -4px; right: -6px; min-width: 18px; height: 18px; padding: 0 4px; box-sizing: border-box; border-radius: 9px;
    background: var(--sc-red); color: #fff; font-size: 11px; font-weight: 700; display: grid; place-items: center; }

  .tabs { display: flex; gap: 2px; padding: 0 8px; border-bottom: 1px solid var(--divider-color); overflow-x: auto; scrollbar-width: none; }
  .tabs::-webkit-scrollbar { display: none; }
  .tab { position: relative; flex: 1 0 auto; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 10px; border: none; background: none;
    color: var(--secondary-text-color); font: inherit; font-size: 13px; cursor: pointer; border-bottom: 2px solid transparent; }
  .tab.active { color: var(--primary-color); border-bottom-color: var(--primary-color); font-weight: 600; }
  .tab ha-icon { --mdc-icon-size: 18px; }
  .tab .dot { position: absolute; top: 7px; right: 4px; width: 7px; height: 7px; border-radius: 50%; background: var(--sc-red); }
  @media (max-width: 560px) { .tab .tl { display: none; } .tab { padding: 12px 8px; } }

  .body { padding: 12px 16px 16px; }
  .tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 0 16px 16px; }
  .body .tiles { padding: 0 0 4px; }
  @media (max-width: 460px) { .tiles { grid-template-columns: repeat(2, 1fr); } }
  .tile { background: var(--secondary-background-color); border-radius: 12px; padding: 10px 12px; cursor: pointer; min-width: 0; }
  .tlabel { font-size: 12px; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tval { display: flex; align-items: center; gap: 6px; margin: 6px 0 2px; min-height: 34px; }
  .tsub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .avg { font-size: 24px; font-weight: 700; }
  .num { font-size: 26px; font-weight: 700; }
  .num.warn { color: var(--sc-amber); } .num.bad { color: var(--sc-red); } .num.good { color: var(--sc-green); }
  .avg.lv-5 { color: var(--sc-green); } .avg.lv-4 { color: var(--sc-lime); } .avg.lv-3 { color: var(--sc-amber); } .avg.lv-2 { color: var(--sc-red); }

  .pill { display: inline-grid; place-items: center; min-width: 30px; height: 30px; padding: 0 6px; box-sizing: border-box; border-radius: 9px;
    font-weight: 700; font-size: 15px; color: #fff; flex: none; }
  .pill.big { min-width: 40px; height: 36px; font-size: 20px; border-radius: 11px; }
  .pill.lv-5, .fill.lv-5 { background: var(--sc-green); }
  .pill.lv-4, .fill.lv-4 { background: var(--sc-lime); }
  .pill.lv-3, .fill.lv-3 { background: var(--sc-amber); }
  .pill.lv-2, .fill.lv-2 { background: var(--sc-red); }
  .pill.lv-none { background: var(--disabled-text-color, #9e9e9e); font-size: 12px; }

  .trend { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; }
  .trend ha-icon { --mdc-icon-size: 22px; }
  .trend-up { color: var(--sc-green); } .trend-down { color: var(--sc-red); } .trend-steady, .trend.none { color: var(--secondary-text-color); }

  .spark-wrap { margin: 10px 0 2px; }
  .slabel { font-size: 12px; color: var(--secondary-text-color); margin-bottom: 2px; }
  .spark { width: 100%; height: 44px; display: block; }
  .spark path { fill: none; stroke: var(--primary-color); stroke-width: 2; vector-effect: non-scaling-stroke; }

  .section-title { font-size: 13px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: .04em; margin: 18px 0 8px; }
  .muted { font-weight: 400; text-transform: none; letter-spacing: 0; }
  .attn { display: flex; flex-direction: column; gap: 6px; }
  .attn-item { display: flex; gap: 10px; align-items: center; padding: 8px 10px; border-radius: 10px; background: var(--secondary-background-color); font-size: 14px; }
  .attn-item.bad > ha-icon { color: var(--sc-red); } .attn-item.warn > ha-icon { color: var(--sc-amber); }
  .attn-item .pill { min-width: 24px; height: 22px; font-size: 13px; border-radius: 6px; }
  .allgood { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 10px; color: var(--sc-green);
    background: color-mix(in srgb, var(--sc-green) 12%, transparent); font-size: 14px; }
  .empty { padding: 24px 16px; text-align: center; color: var(--secondary-text-color); }

  .row { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--divider-color); }
  .row:last-of-type { border-bottom: none; }
  .rmain { flex: 1; min-width: 0; }
  .rtitle { font-weight: 500; font-size: 14px; }
  .rsub { font-size: 13px; color: var(--secondary-text-color); margin-top: 2px; overflow-wrap: anywhere; }
  .rdate { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; margin-left: auto; padding-left: 8px; }
  .foot { font-size: 12px; color: var(--secondary-text-color); margin-top: 10px; }
  .foot a { color: var(--primary-color); }
  .star { font-size: 12px; }

  .day { margin-bottom: 14px; }
  .day-title { display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 6px; }
  .day-count { font-size: 12px; font-weight: 600; background: var(--primary-color); color: var(--text-primary-color, #fff); border-radius: 10px; padding: 1px 8px; }
  .hw { padding: 8px 12px; border-left: 3px solid var(--primary-color); background: var(--secondary-background-color); border-radius: 0 10px 10px 0; margin-bottom: 6px; }
  .hw-subj { font-weight: 600; font-size: 13px; }
  .hw-text { font-size: 14px; margin-top: 2px; overflow-wrap: anywhere; }

  .legend { font-size: 12px; color: var(--secondary-text-color); margin-bottom: 8px; }
  .subj { border-radius: 10px; cursor: pointer; padding: 4px 6px; margin: 0 -6px; }
  .subj:hover, .subj.open { background: var(--secondary-background-color); }
  .subj-row { display: grid; grid-template-columns: minmax(90px, 34%) 1fr 40px 28px; align-items: center; gap: 10px; min-height: 30px; }
  .subj-name { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar { height: 10px; border-radius: 5px; background: var(--divider-color); overflow: hidden; }
  .fill { height: 100%; border-radius: 5px; }
  .subj-val { font-weight: 600; font-size: 14px; text-align: right; }
  .subj-trend { display: flex; justify-content: center; }
  .subj-detail { padding: 6px 0 8px; }
  .chips { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 4px; }
  .chips .pill { min-width: 26px; height: 24px; font-size: 13px; border-radius: 7px; }

  .stat-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
  .schip { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 18px; font-size: 13px; background: var(--secondary-background-color); }
  .schip .sn { font-weight: 700; font-size: 15px; }
  .schip.zero { color: var(--secondary-text-color); }
  .schip.bad .sn { color: var(--sc-red); } .schip.warn .sn { color: var(--sc-amber); }
  .mk { color: var(--sc-amber); } .mk.absent { color: var(--sc-red); } .mk.absent_excused, .mk.exempt { color: var(--secondary-text-color); }
  .remark { display: flex; gap: 10px; padding: 10px 12px; border-radius: 10px; margin-bottom: 8px; background: var(--secondary-background-color); }
  .remark.pos > ha-icon { color: var(--sc-green); } .remark.neg > ha-icon { color: var(--sc-red); }
  .remark > div { flex: 1; min-width: 0; }
  .remark .rtitle { display: flex; gap: 8px; }
  .who-sm { font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; font-style: italic; }

  .msg-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .btn { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; color: var(--primary-color); font-size: 13px; font-weight: 500;
    padding: 6px 10px; border-radius: 16px; background: color-mix(in srgb, var(--primary-color) 10%, transparent); }
  .btn ha-icon { --mdc-icon-size: 16px; }
  .msg { display: flex; align-items: center; gap: 12px; padding: 9px 4px; border-bottom: 1px solid var(--divider-color); text-decoration: none; border-radius: 6px; }
  .msg:hover { background: var(--secondary-background-color); }
  .mavatar { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 600; flex: none;
    background: var(--secondary-background-color); color: var(--secondary-text-color); }
`;

if (!customElements.get("stuudium-card-editor")) customElements.define("stuudium-card-editor", StuudiumCardEditor);
if (!customElements.get("stuudium-card")) {
  customElements.define("stuudium-card", StuudiumCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "stuudium-card",
    name: "Stuudium",
    description: "Grades, averages, homework, attendance and messages from Stuudium (e-kool).",
    preview: true,
    documentationURL: "https://www.stuudium.com",
  });
  console.info(`%c STUUDIUM-CARD %c ${CARD_VERSION} `, "background:#2e9d4a;color:#fff;font-weight:700", "");
}
