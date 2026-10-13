import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WATER_REMINDER_SETTINGS,
  isWithinWaterReminderWindow,
  normalizeWaterReminderSettings,
  shouldSendWaterReminder,
} from './water-reminders';

describe('preferências dos lembretes de água', () => {
  it('usa padrões seguros quando não há configuração salva', () => {
    expect(normalizeWaterReminderSettings(null)).toEqual(DEFAULT_WATER_REMINDER_SETTINGS);
  });

  it('normaliza intervalos e horários inválidos sem lançar exceção', () => {
    expect(normalizeWaterReminderSettings({ enabled: true, intervalMinutes: 5, startTime: '99:99', endTime: 'x' }))
      .toEqual({ enabled: true, intervalMinutes: 60, startTime: '09:00', endTime: '21:00', soundEnabled: true });
  });
});

  it('mantém compatibilidade com preferências antigas e permite desativar o som', () => {
    expect(normalizeWaterReminderSettings({ enabled: true, intervalMinutes: 30, startTime: '08:00', endTime: '20:00' }).soundEnabled).toBe(true);
    expect(normalizeWaterReminderSettings({ soundEnabled: false }).soundEnabled).toBe(false);
  });

describe('janela de lembretes', () => {
  it('inclui o início e exclui o fim da janela diurna', () => {
    expect(isWithinWaterReminderWindow(new Date(2026, 0, 1, 9, 0), '09:00', '21:00')).toBe(true);
    expect(isWithinWaterReminderWindow(new Date(2026, 0, 1, 21, 0), '09:00', '21:00')).toBe(false);
  });

  it('suporta uma janela que cruza a meia-noite', () => {
    expect(isWithinWaterReminderWindow(new Date(2026, 0, 1, 23, 0), '22:00', '06:00')).toBe(true);
    expect(isWithinWaterReminderWindow(new Date(2026, 0, 1, 5, 59), '22:00', '06:00')).toBe(true);
    expect(isWithinWaterReminderWindow(new Date(2026, 0, 1, 12, 0), '22:00', '06:00')).toBe(false);
  });
});

describe('frequência de notificações', () => {
  const settings = { enabled: true, intervalMinutes: 60 as const, startTime: '09:00', endTime: '21:00' };

  it('não notifica se estiver desativado, fora do horário ou sem registro anterior', () => {
    const now = new Date(2026, 0, 1, 10, 0);
    expect(shouldSendWaterReminder({ ...settings, enabled: false }, now, now.getTime() - 3_600_000)).toBe(false);
    expect(shouldSendWaterReminder(settings, new Date(2026, 0, 1, 22, 0), now.getTime() - 3_600_000)).toBe(false);
    expect(shouldSendWaterReminder(settings, now, null)).toBe(false);
  });

  it('respeita o intervalo configurado', () => {
    const now = new Date(2026, 0, 1, 10, 0);
    expect(shouldSendWaterReminder(settings, now, now.getTime() - 59 * 60_000)).toBe(false);
    expect(shouldSendWaterReminder(settings, now, now.getTime() - 60 * 60_000)).toBe(true);
  });
});
