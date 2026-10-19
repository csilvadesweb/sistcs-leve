import { describe, expect, it } from 'vitest';
import {
  addDays,
  applyGoalChanges,
  computeAwards,
  mergeAwards,
  monthEnd,
  parseAwards,
  parseGoals,
  periodProgress,
  periodRange,
  validateGoalsInput,
  weekStart,
  resolveSync,
  type Award,
  type Goals,
} from './activity-goals';

const entry = (date: string, durationMinutes: number) => ({ date, durationMinutes });
const goal = (minutes: number, since = '2026-10-01') => ({ minutes, since });

describe('datas das metas', () => {
  it('calcula a segunda-feira da semana', () => {
    expect(weekStart('2026-10-16')).toBe('2026-10-12'); // sexta
    expect(weekStart('2026-10-18')).toBe('2026-10-12'); // domingo
    expect(weekStart('2026-10-19')).toBe('2026-10-19'); // segunda
  });

  it('soma dias atravessando mês e ano', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('acha o último dia do mês, inclusive em ano bissexto', () => {
    expect(monthEnd('2026-10-16')).toBe('2026-10-31');
    expect(monthEnd('2026-02-10')).toBe('2026-02-28');
    expect(monthEnd('2028-02-10')).toBe('2028-02-29');
    expect(monthEnd('2026-12-05')).toBe('2026-12-31');
  });

  it('define o intervalo de cada período', () => {
    expect(periodRange('day', '2026-10-16')).toEqual({ from: '2026-10-16', to: '2026-10-16' });
    expect(periodRange('week', '2026-10-16')).toEqual({ from: '2026-10-12', to: '2026-10-18' });
    expect(periodRange('month', '2026-10-16')).toEqual({ from: '2026-10-01', to: '2026-10-31' });
  });
});

describe('progresso das metas', () => {
  const entries = [entry('2026-09-30', 90), entry('2026-10-05', 60), entry('2026-10-12', 20), entry('2026-10-16', 35)];
  const goals: Goals = { day: goal(30), week: goal(150), month: goal(600) };

  it('conta só os minutos do período atual', () => {
    const day = periodProgress(entries, goals, 'day', '2026-10-16');
    expect(day.minutes).toBe(35);
    expect(day.done).toBe(true);
    expect(day.ratio).toBeCloseTo(35 / 30);

    const week = periodProgress(entries, goals, 'week', '2026-10-16');
    expect(week.minutes).toBe(55);
    expect(week.done).toBe(false);
    expect(week.ratio).toBeCloseTo(55 / 150);

    expect(periodProgress(entries, goals, 'month', '2026-10-16').minutes).toBe(115);
  });

  it('soma vários exercícios do mesmo dia', () => {
    const twice = [entry('2026-10-16', 10), entry('2026-10-16', 25)];
    expect(periodProgress(twice, goals, 'day', '2026-10-16').minutes).toBe(35);
  });

  it('sem meta definida não marca como concluída', () => {
    const progress = periodProgress(entries, {}, 'day', '2026-10-16');
    expect(progress.goal).toBeNull();
    expect(progress.ratio).toBe(0);
    expect(progress.done).toBe(false);
  });
});

describe('medalhas', () => {
  it('dá a medalha do dia só nos dias em que a meta foi batida', () => {
    const awards = computeAwards(
      [entry('2026-10-12', 30), entry('2026-10-13', 45), entry('2026-10-14', 10)],
      { day: goal(30) },
      '2026-10-14',
    );
    expect(awards.map((award) => award.id)).toEqual(['day:2026-10-13', 'day:2026-10-12']);
  });

  it('só vale a partir do dia em que a meta foi criada', () => {
    const awards = computeAwards(
      [entry('2026-10-12', 30), entry('2026-10-13', 30)],
      { day: goal(30, '2026-10-13') },
      '2026-10-13',
    );
    expect(awards.map((award) => award.id)).toEqual(['day:2026-10-13']);
  });

  it('dá semana perfeita e sequência de 7 dias ao fechar a meta diária toda a semana', () => {
    const entries = Array.from({ length: 7 }, (_, i) => entry(addDays('2026-10-12', i), 30));
    const awards = computeAwards(entries, { day: goal(30) }, '2026-10-18');

    expect(awards.filter((award) => award.kind === 'day')).toHaveLength(7);
    expect(awards.find((award) => award.kind === 'streak_7')).toMatchObject({
      id: 'streak_7:2026-10-12',
      earnedOn: '2026-10-18',
    });
    expect(awards.find((award) => award.kind === 'perfect_week')).toMatchObject({
      id: 'perfect_week:2026-10-12',
      earnedOn: '2026-10-18',
    });
  });

  it('não dá semana perfeita enquanto a semana não terminou', () => {
    const entries = Array.from({ length: 6 }, (_, i) => entry(addDays('2026-10-12', i), 30));
    const awards = computeAwards(entries, { day: goal(30) }, '2026-10-17');
    expect(awards.some((award) => award.kind === 'perfect_week')).toBe(false);
    expect(awards.some((award) => award.kind === 'streak_7')).toBe(false);
  });

  it('dá a sequência de 30 dias e as semanas perfeitas completas', () => {
    const entries = Array.from({ length: 30 }, (_, i) => entry(addDays('2026-09-01', i), 30));
    const awards = computeAwards(entries, { day: goal(30, '2026-08-01') }, '2026-09-30');

    expect(awards.find((award) => award.kind === 'streak_30')).toMatchObject({
      id: 'streak_30:2026-09-01',
      earnedOn: '2026-09-30',
    });
    expect(awards.find((award) => award.kind === 'streak_7')?.earnedOn).toBe('2026-09-07');
    expect(awards.filter((award) => award.kind === 'perfect_week')).toHaveLength(3);
  });

  it('um dia sem bater a meta quebra a sequência', () => {
    const entries = [
      ...Array.from({ length: 3 }, (_, i) => entry(addDays('2026-10-01', i), 30)),
      entry('2026-10-04', 5),
      ...Array.from({ length: 4 }, (_, i) => entry(addDays('2026-10-05', i), 30)),
    ];
    const awards = computeAwards(entries, { day: goal(30) }, '2026-10-08');
    expect(awards.some((award) => award.kind === 'streak_7')).toBe(false);
  });

  it('dá a medalha da semana no dia em que a soma atinge a meta', () => {
    const entries = [entry('2026-10-12', 40), entry('2026-10-14', 30), entry('2026-10-15', 40)];
    const awards = computeAwards(entries, { week: goal(100, '2026-10-12') }, '2026-10-16');
    expect(awards).toEqual([{ id: 'week:2026-10-12', kind: 'week', earnedOn: '2026-10-15', periodKey: '2026-10-12' }]);
  });

  it('não dá medalha da semana se a meta já estava batida antes de existir', () => {
    const entries = [entry('2026-10-12', 40), entry('2026-10-14', 30), entry('2026-10-15', 40)];
    expect(computeAwards(entries, { week: goal(100, '2026-10-16') }, '2026-10-16')).toEqual([]);
  });

  it('dá a medalha do mês, inclusive de meses anteriores', () => {
    const entries = [entry('2026-09-10', 120), entry('2026-10-03', 60), entry('2026-10-20', 50)];
    const awards = computeAwards(entries, { month: goal(100, '2026-09-01') }, '2026-10-20');
    expect(awards.map((award) => [award.id, award.earnedOn])).toEqual([
      ['month:2026-10-01', '2026-10-20'],
      ['month:2026-09-01', '2026-09-10'],
    ]);
  });

  it('sem histórico ou sem metas não há medalhas', () => {
    expect(computeAwards([], { day: goal(30) }, '2026-10-16')).toEqual([]);
    expect(computeAwards([entry('2026-10-16', 60)], {}, '2026-10-16')).toEqual([]);
  });

  it('mantém as medalhas já guardadas e informa só as novas', () => {
    const a: Award = { id: 'day:2026-10-12', kind: 'day', earnedOn: '2026-10-12', periodKey: '2026-10-12' };
    const b: Award = { id: 'day:2026-10-13', kind: 'day', earnedOn: '2026-10-13', periodKey: '2026-10-13' };
    const { all, added } = mergeAwards([a], [a, b]);
    expect(added).toEqual([b]);
    expect(all.map((award) => award.id)).toEqual(['day:2026-10-13', 'day:2026-10-12']);

    // Uma medalha guardada nunca some, mesmo que a meta tenha mudado.
    expect(mergeAwards([a], []).all).toEqual([a]);
  });
});

describe('validação e edição das metas', () => {
  it('aceita metas válidas e campos em branco', () => {
    expect(validateGoalsInput({ day: '30', week: '150', month: '600' })).toEqual({ values: { day: 30, week: 150, month: 600 } });
    expect(validateGoalsInput({ day: '', week: ' ', month: '' })).toEqual({ values: { day: null, week: null, month: null } });
  });

  it('rejeita valores fora do limite ou que não sejam inteiros', () => {
    expect(validateGoalsInput({ day: '0', week: '', month: '' })).toHaveProperty('error');
    expect(validateGoalsInput({ day: '1441', week: '', month: '' })).toHaveProperty('error');
    expect(validateGoalsInput({ day: '', week: '1.5', month: '' })).toHaveProperty('error');
    expect(validateGoalsInput({ day: '', week: 'abc', month: '' })).toHaveProperty('error');
  });

  it('exige que a meta maior período seja ao menos igual à menor', () => {
    expect(validateGoalsInput({ day: '30', week: '20', month: '' })).toMatchObject({ error: expect.stringContaining('semanal') });
    expect(validateGoalsInput({ day: '', week: '150', month: '100' })).toMatchObject({ error: expect.stringContaining('mensal') });
    expect(validateGoalsInput({ day: '60', week: '', month: '30' })).toMatchObject({ error: expect.stringContaining('mensal') });
  });

  it('mantém a data original se a meta não mudou e recomeça hoje se mudou', () => {
    const previous: Goals = { day: goal(30, '2026-10-01'), week: goal(150, '2026-10-01'), month: goal(600, '2026-10-01') };
    const next = applyGoalChanges(previous, { day: 30, week: 200, month: null }, '2026-10-16');
    expect(next).toEqual({ day: goal(30, '2026-10-01'), week: goal(200, '2026-10-16') });
    expect(next.month).toBeUndefined();
  });

  it('descarta metas guardadas com formato inválido', () => {
    const parsed = parseGoals({ day: goal(30), week: { minutes: 0, since: 'x' }, month: 'a' });
    expect(parsed).toEqual({ day: goal(30) });
    expect(parseGoals(null)).toEqual({});
    expect(parseGoals({ week: goal(10081) })).toEqual({});
  });

  it('descarta medalhas guardadas com formato inválido', () => {
    const valid: Award = { id: 'day:2026-10-12', kind: 'day', earnedOn: '2026-10-12', periodKey: '2026-10-12' };
    expect(parseAwards([valid, { id: 'x', kind: 'inventada', earnedOn: '2026-10-12', periodKey: '2026-10-12' }, null, 3])).toEqual([valid]);
    expect(parseAwards('nada')).toEqual([]);
  });
});

describe('sincronização na conta', () => {
  const g = (minutes: number, since = '2026-10-01'): Goals => ({ week: { minutes, since } });
  const a = (id: string, earnedOn = '2026-10-10'): Award => ({ id, kind: 'day', earnedOn, periodKey: earnedOn });

  it('primeira sincronização: sobe o que está no aparelho', () => {
    const r = resolveSync({ goals: g(150), awards: [a('x')] }, false, null);
    expect(r).toMatchObject({ goals: g(150), pushGoals: true, pushAwards: true });
  });

  it('sem registro na conta e nada local: não envia nada', () => {
    expect(resolveSync({ goals: {}, awards: [] }, false, null)).toMatchObject({ pushGoals: false, pushAwards: false });
  });

  it('caso normal: as metas da conta valem e uma meta apagada lá some aqui', () => {
    const r = resolveSync({ goals: g(150), awards: [] }, false, { goals: {}, awards: [] });
    expect(r.goals).toEqual({});
    expect(r.pushGoals).toBe(false);
  });

  it('alteração feita sem conexão vence a da conta e sobe', () => {
    const r = resolveSync({ goals: g(200), awards: [] }, true, { goals: g(100), awards: [] });
    expect(r.goals).toEqual(g(200));
    expect(r.pushGoals).toBe(true);
  });

  it('medalhas são a união das duas listas e só sobem se a conta estava atrás', () => {
    const both = resolveSync({ goals: {}, awards: [a('b', '2026-10-12')] }, false, { goals: {}, awards: [a('a', '2026-10-10')] });
    expect(both.awards.map((x) => x.id).sort()).toEqual(['a', 'b']);
    expect(both.pushAwards).toBe(true);
    const same = resolveSync({ goals: {}, awards: [a('a')] }, false, { goals: {}, awards: [a('a'), a('b')] });
    expect(same.awards).toHaveLength(2);
    expect(same.pushAwards).toBe(false);
  });
});
