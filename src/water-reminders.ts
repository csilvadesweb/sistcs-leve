export type WaterReminderSettings = {
  enabled: boolean;
  intervalMinutes: 30 | 60 | 90 | 120;
  startTime: string;
  endTime: string;
};

export const DEFAULT_WATER_REMINDER_SETTINGS: WaterReminderSettings = {
  enabled: false,
  intervalMinutes: 60,
  startTime: '09:00',
  endTime: '21:00',
};

const ALLOWED_INTERVALS = new Set([30, 60, 90, 120]);

export function normalizeWaterReminderSettings(value: unknown): WaterReminderSettings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_WATER_REMINDER_SETTINGS };
  const input = value as Partial<WaterReminderSettings>;
  const interval = Number(input.intervalMinutes);
  const validTime = (time: unknown): time is string =>
    typeof time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
  return {
    enabled: input.enabled === true,
    intervalMinutes: (ALLOWED_INTERVALS.has(interval) ? interval : 60) as WaterReminderSettings['intervalMinutes'],
    startTime: validTime(input.startTime) ? input.startTime : DEFAULT_WATER_REMINDER_SETTINGS.startTime,
    endTime: validTime(input.endTime) ? input.endTime : DEFAULT_WATER_REMINDER_SETTINGS.endTime,
  };
}

function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function parseTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isWithinWaterReminderWindow(now: Date, startTime: string, endTime: string): boolean {
  const current = minutesOfDay(now);
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  if (start === end) return true;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

export function shouldSendWaterReminder(
  settings: WaterReminderSettings,
  now: Date,
  lastReminderAt: number | null,
): boolean {
  if (!settings.enabled || !isWithinWaterReminderWindow(now, settings.startTime, settings.endTime)) return false;
  if (lastReminderAt === null) return false;
  return now.getTime() - lastReminderAt >= settings.intervalMinutes * 60_000;
}
