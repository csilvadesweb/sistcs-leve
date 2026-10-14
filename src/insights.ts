import { addDays, calculateFoodNutrientTotals, type FoodEntry, type UserGoals } from './data';

/** Dias consecutivos com pelo menos um alimento registrado. Se hoje ainda está vazio, conta a partir de ontem. */
export function loggingStreak(entries: Array<Pick<FoodEntry, 'date'>>, today: string): number {
  const days = new Set(entries.map((e) => e.date));
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export interface WeeklySummary {
  daysLogged: number;
  avgCalories: number | null;
  avgProteins: number | null;
  /** Dias em que a meta de proteína foi atingida (≥ 100%). Null sem meta. */
  proteinDaysHit: number | null;
  /** Dias com calorias entre 90% e 110% da meta. Null sem meta. */
  calorieDaysOnTarget: number | null;
}

/** Resumo dos 7 dias que terminam em `today` (inclusive). Médias só consideram dias com registro. */
export function weeklySummary(entries: FoodEntry[], goals: UserGoals | null, today: string): WeeklySummary {
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, -i));
  const perDay = dates
    .map((date) => ({ date, items: entries.filter((e) => e.date === date) }))
    .filter((d) => d.items.length > 0)
    .map((d) => calculateFoodNutrientTotals(d.items));
  const daysLogged = perDay.length;
  const avg = (pick: (t: (typeof perDay)[number]) => number) =>
    daysLogged ? Math.round(perDay.reduce((s, t) => s + pick(t), 0) / daysLogged) : null;
  const kcalGoal = goals?.calories ?? null;
  const proteinGoal = goals?.proteins ?? null;
  return {
    daysLogged,
    avgCalories: avg((t) => t.calories),
    avgProteins: avg((t) => t.proteins),
    proteinDaysHit: proteinGoal ? perDay.filter((t) => t.proteins >= proteinGoal).length : null,
    calorieDaysOnTarget: kcalGoal ? perDay.filter((t) => t.calories >= kcalGoal * 0.9 && t.calories <= kcalGoal * 1.1).length : null,
  };
}

export interface Achievement {
  id: string;
  label: string;
  hint: string;
  earned: boolean;
}

/** Conquistas determinísticas, calculadas só a partir dos registros (nada é gravado). */
export function achievements(entries: Array<Pick<FoodEntry, 'date'>>, today: string): Achievement[] {
  const streak = loggingStreak(entries, today);
  const totalDays = new Set(entries.map((e) => e.date)).size;
  return [
    { id: 'first', label: 'Primeiro registro', hint: 'Registre seu primeiro alimento', earned: totalDays >= 1 },
    { id: 'streak3', label: '3 dias seguidos', hint: 'Registre 3 dias em sequência', earned: streak >= 3 },
    { id: 'streak7', label: 'Semana completa', hint: 'Registre 7 dias em sequência', earned: streak >= 7 },
    { id: 'days30', label: '30 dias de registro', hint: 'Some 30 dias com alimentos registrados', earned: totalDays >= 30 },
  ];
}
