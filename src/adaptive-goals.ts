import type { FoodEntry, WeightEntry } from './data';
import type { GoalType } from './calc';

export interface AdaptiveProgressInsight {
  kind: 'review' | 'on-track' | 'stable';
  weightChangeKg: number;
  averageCalories: number;
  calorieGoal: number | null;
  loggedDays: number;
  message: string;
}

function isValidDate(value: string): boolean {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/**
 * Produces a conservative insight only when there are enough observations.
 * It never changes goals or prescribes a calorie adjustment automatically.
 */
export function analyzeAdaptiveProgress(
  weights: WeightEntry[],
  foodEntries: FoodEntry[],
  goalType: GoalType | null | undefined,
  calorieGoal: number | null,
  today: string,
): AdaptiveProgressInsight | null {
  if (!goalType || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return null;
  const start = shiftDate(today, -27);
  const split = shiftDate(today, -13);
  const recentWeights = weights.filter((entry) => entry.date >= split && entry.date <= today);
  const priorWeights = weights.filter((entry) => entry.date >= start && entry.date < split);
  if (recentWeights.length < 3 || priorWeights.length < 3) return null;

  const entriesInRange = foodEntries.filter((entry) =>
    isValidDate(entry.date) &&
    entry.date >= start && entry.date <= today &&
    Number.isFinite(entry.quantity) && entry.quantity > 0 &&
    Number.isFinite(entry.nutrientsPerPortion?.calories) && entry.nutrientsPerPortion.calories >= 0
  );
  const priorEntries = entriesInRange.filter((entry) => entry.date < split);
  const recentEntries = entriesInRange.filter((entry) => entry.date >= split);
  const uniqueDays = (entries: FoodEntry[]) => new Set(entries.map((entry) => entry.date)).size;
  if (uniqueDays(priorEntries) < 5 || uniqueDays(recentEntries) < 5) return null;

  const averageWeight = (entries: { weightKg: number }[]) => entries.reduce((sum, entry) => sum + entry.weightKg, 0) / entries.length;
  const weightChangeKg = averageWeight(recentWeights) - averageWeight(priorWeights);
  const dailyCalories = (entries: FoodEntry[]) => {
    const totals = new Map<string, number>();
    for (const entry of entries) totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.nutrientsPerPortion.calories * entry.quantity);
    return [...totals.values()].reduce((sum, value) => sum + value, 0) / totals.size;
  };
  const averageCalories = Math.round((dailyCalories(priorEntries) + dailyCalories(recentEntries)) / 2);
  const loggedDays = uniqueDays(entriesInRange);

  let kind: AdaptiveProgressInsight['kind'];
  let message: string;
  if (goalType === 'lose') {
    kind = weightChangeKg < -0.3 ? 'on-track' : 'review';
    message = kind === 'on-track'
      ? 'A tendência média do peso está caminhando na direção do seu objetivo. Continue registrando; as metas permanecem sob seu controle.'
      : 'A tendência do peso ficou estável ou diferente do objetivo neste período. Confira a consistência dos registros e as porções; não reduzimos nem alteramos suas metas automaticamente.';
  } else if (goalType === 'gain') {
    kind = weightChangeKg > 0.3 ? 'on-track' : 'review';
    message = kind === 'on-track'
      ? 'A tendência média do peso está caminhando na direção do seu objetivo. Continue registrando; as metas permanecem sob seu controle.'
      : 'A tendência do peso ficou estável ou diferente do objetivo neste período. Confira a consistência dos registros e as porções; não aumentamos nem alteramos suas metas automaticamente.';
  } else {
    kind = Math.abs(weightChangeKg) <= 0.3 ? 'stable' : 'review';
    message = kind === 'stable'
      ? 'A tendência média do peso ficou relativamente estável. As metas continuam sob seu controle e não mudam automaticamente.'
      : 'A tendência do peso variou neste período. Considere o contexto e a variação natural antes de decidir se deseja revisar suas metas.';
  }

  return { kind, weightChangeKg, averageCalories, calorieGoal, loggedDays, message };
}
