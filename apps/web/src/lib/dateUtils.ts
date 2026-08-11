const FORMAT_OPTS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

const FORMAT_DATETIME_OPTS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

// "12 Aug 2025"
export function formatDate(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString('en-GB', FORMAT_OPTS);
}

// "12 Aug 2025, 14:30"
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date
    .toLocaleDateString('en-GB', FORMAT_DATETIME_OPTS)
    .replace(',', ',');
}

// "YYYY-MM-DD" suitable for <input type="date">
export function toInputDate(date?: Date): string {
  const d = date ?? new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isToday(iso: string): boolean {
  return iso.slice(0, 10) === toInputDate(new Date());
}
