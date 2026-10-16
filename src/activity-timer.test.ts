import { describe, expect, it } from 'vitest';
import {
  elapsedSeconds,
  formatClock,
  idleTimer,
  parseTimerState,
  pauseTimer,
  resumeTimer,
  sessionMinutes,
  startTimer,
  stopTimer,
} from './activity-timer';

const T0 = 1_000_000;

describe('cronômetro de treino', () => {
  it('conta o tempo enquanto roda', () => {
    const running = startTimer(idleTimer('Caminhada'), T0, '2026-10-16');
    expect(running.status).toBe('running');
    expect(running.startedDate).toBe('2026-10-16');
    expect(elapsedSeconds(running, T0)).toBe(0);
    expect(elapsedSeconds(running, T0 + 5_400)).toBe(5);
  });

  it('pausa congela o tempo e continuar retoma de onde parou', () => {
    const running = startTimer(idleTimer('Caminhada'), T0, '2026-10-16');
    const paused = pauseTimer(running, T0 + 5_000);
    expect(paused.status).toBe('paused');
    expect(elapsedSeconds(paused, T0 + 60_000)).toBe(5);

    const resumed = resumeTimer(paused, T0 + 20_000);
    expect(resumed.status).toBe('running');
    expect(elapsedSeconds(resumed, T0 + 23_000)).toBe(8);
  });

  it('parar congela o tempo a partir de rodando ou de pausado', () => {
    const running = startTimer(idleTimer('Corrida'), T0, '2026-10-16');
    const stoppedFromRunning = stopTimer(running, T0 + 8_000);
    expect(stoppedFromRunning.status).toBe('stopped');
    expect(elapsedSeconds(stoppedFromRunning, T0 + 999_000)).toBe(8);

    const stoppedFromPaused = stopTimer(pauseTimer(running, T0 + 3_000), T0 + 50_000);
    expect(stoppedFromPaused.status).toBe('stopped');
    expect(elapsedSeconds(stoppedFromPaused, T0 + 999_000)).toBe(3);
  });

  it('ignora ações que não fazem sentido no estado atual', () => {
    const idle = idleTimer('Caminhada');
    expect(pauseTimer(idle, T0)).toBe(idle);
    expect(resumeTimer(idle, T0)).toBe(idle);
    expect(stopTimer(idle, T0)).toBe(idle);

    const running = startTimer(idle, T0, '2026-10-16');
    expect(startTimer(running, T0 + 1_000, '2026-10-17')).toBe(running);
    expect(resumeTimer(running, T0 + 1_000)).toBe(running);

    const stopped = stopTimer(running, T0 + 1_000);
    expect(startTimer(stopped, T0 + 2_000, '2026-10-17')).toBe(stopped);
    expect(pauseTimer(stopped, T0 + 2_000)).toBe(stopped);
  });

  it('não deixa o tempo ficar negativo se o relógio do aparelho voltar', () => {
    const running = startTimer(idleTimer('Caminhada'), T0, '2026-10-16');
    expect(elapsedSeconds(running, T0 - 60_000)).toBe(0);
  });

  it('só registra sessões com ao menos 30 segundos e arredonda para minutos', () => {
    expect(sessionMinutes(0)).toBeNull();
    expect(sessionMinutes(29)).toBeNull();
    expect(sessionMinutes(30)).toBe(1);
    expect(sessionMinutes(89)).toBe(1);
    expect(sessionMinutes(90)).toBe(2);
    expect(sessionMinutes(1800)).toBe(30);
    expect(sessionMinutes(Number.NaN)).toBeNull();
  });

  it('formata o relógio como hh:mm:ss', () => {
    expect(formatClock(0)).toBe('00:00:00');
    expect(formatClock(4)).toBe('00:00:04');
    expect(formatClock(3725)).toBe('01:02:05');
    expect(formatClock(-5)).toBe('00:00:00');
  });
});

describe('estado guardado do cronômetro', () => {
  it('recupera um cronômetro rodando ou pausado', () => {
    const running = { status: 'running', accumulatedMs: 4000, segmentStartedAt: T0, startedDate: '2026-10-16', exerciseName: 'Corrida' };
    expect(parseTimerState(running, 'Caminhada')).toEqual(running);

    const paused = { status: 'paused', accumulatedMs: 9000, segmentStartedAt: null, startedDate: '2026-10-16', exerciseName: 'Corrida' };
    expect(parseTimerState(paused, 'Caminhada')).toEqual(paused);
  });

  it('volta ao estado inicial quando o conteúdo é inválido', () => {
    const fallback = idleTimer('Caminhada');
    expect(parseTimerState(null, 'Caminhada')).toEqual(fallback);
    expect(parseTimerState('texto', 'Caminhada')).toEqual(fallback);
    expect(parseTimerState({ status: 'voando' }, 'Caminhada')).toEqual(fallback);
    expect(parseTimerState({ status: 'paused', accumulatedMs: -1 }, 'Caminhada')).toEqual(fallback);
    expect(parseTimerState({ status: 'running', accumulatedMs: 0, segmentStartedAt: 'x' }, 'Caminhada')).toEqual(fallback);
  });

  it('troca nome de exercício ou data inválidos por valores seguros', () => {
    const parsed = parseTimerState(
      { status: 'paused', accumulatedMs: 1000, segmentStartedAt: null, startedDate: 'ontem', exerciseName: '' },
      'Caminhada',
    );
    expect(parsed.startedDate).toBeNull();
    expect(parsed.exerciseName).toBe('Caminhada');
  });
});
