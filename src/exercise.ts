export interface ExerciseActivity { id:string; label:string; met:number }

/**
 * Catálogo de atividades com valores MET aproximados.
 * A estimativa varia conforme ritmo, técnica, pausas e características individuais.
 */
export const EXERCISE_ACTIVITIES:ExerciseActivity[]=[
{id:'walking_slow',label:'Caminhada leve',met:2.8},
{id:'walking_moderate',label:'Caminhada moderada',met:3.5},
{id:'walking_brisk',label:'Caminhada rápida',met:4.8},
{id:'hiking',label:'Trilha / caminhada em subida',met:6},
{id:'jogging',label:'Trote',met:7},
{id:'running',label:'Corrida',met:8.3},
{id:'cycling_leisure',label:'Bike leve',met:4},
{id:'cycling_moderate',label:'Bike moderada',met:6.8},
{id:'cycling_fast',label:'Bike intensa',met:8},
{id:'strength_light',label:'Musculação leve',met:3.5},
{id:'strength',label:'Musculação moderada',met:5},
{id:'strength_vigorous',label:'Musculação intensa',met:6},
{id:'swimming',label:'Natação',met:6},
{id:'dance',label:'Dança',met:5.5},
{id:'football',label:'Futebol',met:7},
{id:'basketball',label:'Basquete',met:6.5},
{id:'volleyball',label:'Vôlei',met:4},
{id:'tennis',label:'Tênis',met:7.3},
{id:'jump_rope',label:'Pular corda',met:10},
{id:'elliptical',label:'Elíptico',met:5},
{id:'rowing',label:'Remo ergométrico',met:7},
{id:'stairs',label:'Subir escadas',met:8},
{id:'pilates',label:'Pilates',met:3},
{id:'yoga',label:'Yoga',met:2.5},
{id:'other',label:'Outra atividade moderada',met:4}
];

/** Estimativa aproximada por MET; não é medição individual. */
export function estimateExerciseCalories(met:number,weightKg:number,durationMinutes:number):number{
 if(!Number.isFinite(met)||met<=0||met>20||!Number.isFinite(weightKg)||weightKg<20||weightKg>400||!Number.isFinite(durationMinutes)||durationMinutes<1||durationMinutes>1440)return 0;
 return Math.round(met*3.5*weightKg/200*durationMinutes);
}
export function validateExerciseInput(input:{date:string;activity:string;durationMinutes:number;weightKg:number;note:string}):string|null{
  if (!input || typeof input.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.date) || Number.isNaN(Date.parse(input.date)) || new Date(input.date).toISOString().slice(0,10) !== input.date) return 'Escolha uma data válida.';
  if (typeof input.activity !== 'string' || !EXERCISE_ACTIVITIES.some((item) => item.label === input.activity) || input.activity.length > 100) return 'Escolha uma atividade válida.';
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 1 || input.durationMinutes > 1440) return 'Informe uma duração entre 1 e 1.440 minutos.';
  if (!Number.isFinite(input.weightKg) || input.weightKg < 20 || input.weightKg > 400) return 'Informe um peso entre 20 e 400 kg para estimar o gasto.';
  const selected = EXERCISE_ACTIVITIES.find((item) => item.label === input.activity)!;
  if (estimateExerciseCalories(selected.met, input.weightKg, input.durationMinutes) > 20000) return 'Essa combinação excede o limite de 20.000 kcal por registro. Confira o peso e reduza a duração.';
  if (typeof input.note !== 'string' || input.note.length > 300) return 'Use até 300 caracteres nas observações.';
  return null;
}
