import { supabase } from './supabase';

export interface ExerciseMetricsInput {
  id?: string;
  date: string;
  activity: string;
  activityId: string;
  metValue: number;
  bodyWeightKg: number;
  durationMinutes: number;
  caloriesBurned: number;
  note: string;
}

/**
 * Persiste os dados originais do diário e os detalhes usados no cálculo MET.
 * As colunas de métricas são aditivas; os campos legados continuam intactos.
 */
export async function saveExerciseWithMetrics(input: ExerciseMetricsInput): Promise<void> {
  const row = {
    entry_date: input.date,
    activity: input.activity,
    activity_id: input.activityId,
    met_value: input.metValue,
    body_weight_kg: input.bodyWeightKg,
    duration_minutes: input.durationMinutes,
    calories_burned: input.caloriesBurned,
    note: input.note.trim() || null,
  };

  const result = input.id
    ? await supabase.from('exercise_entries').update(row).eq('id', input.id).select('id').single()
    : await supabase.from('exercise_entries').insert(row).select('id').single();

  if (result.error) {
    console.error(result.error);
    throw new Error(`Não foi possível ${input.id ? 'atualizar' : 'salvar'} o exercício. ${result.error.message}`);
  }
}
