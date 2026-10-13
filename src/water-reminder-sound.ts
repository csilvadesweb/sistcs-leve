let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Context = window.AudioContext;
  if (!Context) return null;
  if (!audioContext || audioContext.state === 'closed') audioContext = new Context();
  return audioContext;
}

/** Deve ser chamado em resposta a uma ação do usuário para cumprir a política de autoplay. */
export async function prepareWaterReminderAudio(): Promise<boolean> {
  try {
    const context = getAudioContext();
    if (!context) return false;
    if (context.state === 'suspended') await context.resume();
    return context.state === 'running';
  } catch {
    return false;
  }
}

/** Toca um toque curto e discreto; não altera o som do canal de notificações do sistema. */
export async function playWaterReminderSound(): Promise<boolean> {
  try {
    const ready = await prepareWaterReminderAudio();
    const context = getAudioContext();
    if (!ready || !context) return false;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(660, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
    return true;
  } catch {
    return false;
  }
}
