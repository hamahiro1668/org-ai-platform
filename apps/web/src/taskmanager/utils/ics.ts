import type { ScheduleResult } from '../types';

/** Convert various date string formats to ICS YYYYMMDD format, or null if unparseable. */
function parseToICSDate(dateStr: string): string | null {
  // YYYY-MM-DD
  const iso = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}${iso[2]}${iso[3]}`;

  // YYYY年M月D日
  const jaFull = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (jaFull) {
    return `${jaFull[1]}${jaFull[2].padStart(2, '0')}${jaFull[3].padStart(2, '0')}`;
  }

  // M月D日 (assume current year)
  const ja = dateStr.match(/(\d{1,2})月(\d{1,2})日/);
  if (ja) {
    const year = new Date().getFullYear();
    return `${year}${ja[1].padStart(2, '0')}${ja[2].padStart(2, '0')}`;
  }

  // M/D or MM/DD
  const slash = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
  if (slash) {
    const year = new Date().getFullYear();
    return `${year}${slash[1].padStart(2, '0')}${slash[2].padStart(2, '0')}`;
  }

  return null;
}

/** Return the next calendar day in ICS YYYYMMDD format (for all-day DTEND exclusive). */
function nextICSDay(icsDate: string): string {
  const year = parseInt(icsDate.slice(0, 4), 10);
  const month = parseInt(icsDate.slice(4, 6), 10) - 1;
  const day = parseInt(icsDate.slice(6, 8), 10);
  const d = new Date(year, month, day + 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/** Escape special characters for ICS text fields. */
function escapeICS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Generate an ICS (iCalendar) string from a ScheduleResult. */
export function generateICS(schedule: ScheduleResult): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Task Manager//JA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const item of schedule.items) {
    const dtstart = parseToICSDate(item.date);
    if (!dtstart) continue;

    const dtend = nextICSDay(dtstart);
    const uid = `${dtstart}-${Math.random().toString(36).slice(2)}@ai-task-manager`;

    lines.push('BEGIN:VEVENT');
    lines.push(`DTSTART;VALUE=DATE:${dtstart}`);
    lines.push(`DTEND;VALUE=DATE:${dtend}`);
    lines.push(`SUMMARY:${escapeICS(item.task)}`);
    if (item.assignee) {
      lines.push(`DESCRIPTION:担当: ${escapeICS(item.assignee)}`);
    }
    if (item.milestone) {
      lines.push('PRIORITY:1');
    }
    lines.push(`UID:${uid}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/** Trigger a browser download of the schedule as a .ics file. */
export function downloadICS(schedule: ScheduleResult, filename = 'schedule.ics'): void {
  const content = generateICS(schedule);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
