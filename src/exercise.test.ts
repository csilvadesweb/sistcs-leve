import{describe,expect,it}from'vitest';import{EXERCISE_ACTIVITIES,estimateExerciseCalories,validateExerciseInput}from'./exercise';describe('diário de exercícios',()=>{it('estima calorias por MET, peso e duração',()=>expect(estimateExerciseCalories(4,70,30)).toBe(147));it('retorna zero para valores inválidos',()=>{expect(estimateExerciseCalories(0,70,30)).toBe(0);expect(estimateExerciseCalories(4,NaN,30)).toBe(0);expect(estimateExerciseCalories(4,70,0)).toBe(0);expect(estimateExerciseCalories(21,70,30)).toBe(0)});it('valida os dados antes de persistir',()=>{const v={date:'2026-10-12',activity:'Caminhada rápida',durationMinutes:30,weightKg:70,note:''};expect(validateExerciseInput(v)).toBeNull();expect(validateExerciseInput({...v,durationMinutes:0})).toContain('duração');expect(validateExerciseInput({...v,weightKg:0})).toContain('peso');expect(validateExerciseInput({...v,date:'2026-02-30'})).toContain('data')})
it('trata campos ausentes ou de tipo inesperado sem lançar exceção',()=>{
 expect(validateExerciseInput({date:undefined as unknown as string,activity:'Caminhada rápida',durationMinutes:30,weightKg:70,note:''})).toContain('data');
 expect(validateExerciseInput({date:'2026-10-12',activity:undefined as unknown as string,durationMinutes:30,weightKg:70,note:''})).toContain('atividade');
 expect(validateExerciseInput({date:'2026-10-12',activity:'Caminhada rápida',durationMinutes:30,weightKg:70,note:undefined as unknown as string})).toContain('caracteres');
});

it('rejeita atividade fora do catálogo e estimativas acima do limite persistido',()=>{
 const v={date:'2026-10-12',activity:'Caminhada rápida',durationMinutes:30,weightKg:70,note:''};
 expect(validateExerciseInput({...v,activity:'Atividade inventada'})).toContain('atividade válida');
 expect(validateExerciseInput({...v,activity:'Corrida',durationMinutes:1440,weightKg:400})).toContain('20.000 kcal');
});
});
describe('catálogo de atividades e intensidades',()=>{
 it('oferece atividades distintas e níveis de caminhada, corrida, bike e musculação',()=>{
  const labels=EXERCISE_ACTIVITIES.map(a=>a.label);
  expect(labels).toContain('Caminhada moderada');
  expect(labels).toContain('Corrida');
  expect(labels).toContain('Musculação moderada');
  expect(labels).toContain('Bike moderada');
  expect(new Set(EXERCISE_ACTIVITIES.map(a=>a.id)).size).toBe(EXERCISE_ACTIVITIES.length);
  expect(new Set(EXERCISE_ACTIVITIES.map(a=>a.met)).size).toBeGreaterThan(5);
 });
 it('estima caminhada moderada para 70 kg durante 30 minutos',()=>{
  const walking=EXERCISE_ACTIVITIES.find(a=>a.id==='walking_moderate')!;
  expect(estimateExerciseCalories(walking.met,70,30)).toBe(129);
 });
});
