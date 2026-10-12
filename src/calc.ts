/**
 * Estimativa de metas diárias a partir dos dados informados pelo usuário.
 * Usa a equação de Mifflin-St Jeor e fatores de atividade usuais.
 * É uma estimativa geral, não orientação médica ou nutricional.
 */

export type Sex = 'female' | 'male';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type GoalType = 'lose' | 'maintain' | 'gain';
export type MacroPreset = 'balanced' | 'high_protein' | 'low_carb';

export const ACTIVITY: Record<Activity, { label: string; hint: string; factor: number }> = {
  sedentary: { label: 'Sedentário', hint: 'Pouco ou nenhum exercício', factor: 1.2 },
  light: { label: 'Levemente ativo', hint: 'Exercício leve 1 a 3 dias por semana', factor: 1.375 },
  moderate: { label: 'Moderadamente ativo', hint: 'Exercício moderado 3 a 5 dias por semana', factor: 1.55 },
  active: { label: 'Muito ativo', hint: 'Exercício intenso 6 a 7 dias por semana', factor: 1.725 },
  very_active: { label: 'Extremamente ativo', hint: 'Treino intenso diário ou trabalho físico pesado', factor: 1.9 },
};

export const GOAL_LABEL: Record<GoalType, string> = {
  lose: 'Perder peso',
  maintain: 'Manter o peso',
  gain: 'Ganhar peso',
};

/** Percentual das calorias para proteína, carboidrato e gordura. */
export const PRESETS: Record<MacroPreset, { label: string; hint: string; p: number; c: number; f: number }> = {
  balanced: { label: 'Equilibrada', hint: '25% proteínas · 50% carboidratos · 25% gorduras', p: 0.25, c: 0.5, f: 0.25 },
  high_protein: { label: 'Mais proteína', hint: '35% proteínas · 35% carboidratos · 30% gorduras', p: 0.35, c: 0.35, f: 0.3 },
  low_carb: { label: 'Menos carboidrato', hint: '30% proteínas · 25% carboidratos · 45% gorduras', p: 0.3, c: 0.25, f: 0.45 },
};

export const MIN_KCAL: Record<Sex, number> = { female: 1200, male: 1500 };
const KCAL_PER_KG = 7700;

export interface EstimateInput {
  sex: Sex | null;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  activity: Activity | null;
  goalType: GoalType | null;
  weeklyRateKg: number | null;
  macroPreset: MacroPreset;
}

export type Estimate =
  | { ok: false; reason: string }
  | {
      ok: true;
      age: number;
      bmr: number;
      tdee: number;
      kcal: number;
      delta: number;
      floorApplied: boolean;
      protein: number;
      carbs: number;
      fats: number;
      fiber: number;
      waterMl: number;
    };

function parseValidDate(value: string): [number, number, number] | null {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    !Number.isFinite(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return [year, month, day];
}

export function ageFromBirth(birth: string, today: string): number {
  const birthParts = parseValidDate(birth);
  const todayParts = parseValidDate(today);
  if (!birthParts || !todayParts) return Number.NaN;
  const [by, bm, bd] = birthParts;
  const [ty, tm, td] = todayParts;
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age;
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export function estimate(input: EstimateInput, today: string): Estimate {
  const missing: string[] = [];
  if (!input.sex) missing.push('sexo');
  if (!input.birthDate) missing.push('data de nascimento');
  if (input.heightCm === null) missing.push('altura');
  if (input.weightKg === null) missing.push('peso atual');
  if (!input.activity) missing.push('nível de atividade');
  if (!input.goalType) missing.push('objetivo');
  if (missing.length) return { ok: false, reason: `Para calcular, preencha: ${missing.join(', ')}.` };

  const sex = input.sex as Sex;
  const age = ageFromBirth(input.birthDate as string, today);
  if (!Number.isFinite(age) || age < 0 || age > 120) return { ok: false, reason: 'Confira a data de nascimento.' };
  if (age < 18) {
    return {
      ok: false,
      reason: 'O cálculo automático é só para maiores de 18 anos. Para menores, a orientação deve vir de um profissional de saúde.',
    };
  }

  const weight = input.weightKg as number;
  const height = input.heightCm as number;
  if (!Number.isFinite(weight) || weight < 20 || weight > 400) {
    return { ok: false, reason: 'Confira o peso atual (entre 20 e 400 kg).' };
  }
  if (!Number.isFinite(height) || height < 50 || height > 260) {
    return { ok: false, reason: 'Confira a altura (entre 50 e 260 cm).' };
  }
  if (!ACTIVITY[input.activity as Activity] || !PRESETS[input.macroPreset]) {
    return { ok: false, reason: 'Confira o nível de atividade e a distribuição de macronutrientes.' };
  }
  const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'male' ? 5 : -161);
  const tdee = bmr * ACTIVITY[input.activity as Activity].factor;

  const goal = input.goalType as GoalType;
  const rate = Math.min(1, Math.max(0.1, input.weeklyRateKg ?? (goal === 'gain' ? 0.25 : 0.5)));
  const delta = goal === 'maintain' ? 0 : ((goal === 'lose' ? -1 : 1) * rate * KCAL_PER_KG) / 7;

  let kcal = tdee + delta;
  let floorApplied = false;
  if (goal === 'lose' && kcal < MIN_KCAL[sex]) {
    kcal = MIN_KCAL[sex];
    floorApplied = true;
  }
  kcal = roundTo(kcal, 10);

  const preset = PRESETS[input.macroPreset];
  return {
    ok: true,
    age,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal,
    delta: Math.round(kcal - tdee),
    floorApplied,
    protein: Math.round((kcal * preset.p) / 4),
    carbs: Math.round((kcal * preset.c) / 4),
    fats: Math.round((kcal * preset.f) / 9),
    fiber: Math.round((kcal / 1000) * 14),
    waterMl: roundTo(weight * 35, 50),
  };
}
