import { useEffect, useState, type ChangeEvent } from 'react';
import { BellRing, BellOff, Droplets } from 'lucide-react';
import {
  DEFAULT_WATER_REMINDER_SETTINGS,
  normalizeWaterReminderSettings,
  shouldSendWaterReminder,
  type WaterReminderSettings,
} from './water-reminders';
import {
  clearCustomWaterSound,
  getCustomWaterSoundName,
  playWaterReminderSound,
  prepareWaterReminderAudio,
  saveCustomWaterSound,
} from './water-reminder-sound';
import { validateCustomSound } from './water-reminder-custom-sound';

const SETTINGS_KEY = 'sistcs-leve-water-reminders-v1';
const LAST_SENT_KEY = 'sistcs-leve-water-reminders-last-sent-v1';

function readSettings(): WaterReminderSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? normalizeWaterReminderSettings(JSON.parse(raw)) : { ...DEFAULT_WATER_REMINDER_SETTINGS };
  } catch {
    return { ...DEFAULT_WATER_REMINDER_SETTINGS };
  }
}

function readLastSent(): number | null {
  try {
    const value = Number(window.localStorage.getItem(LAST_SENT_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function saveSettings(settings: WaterReminderSettings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // O recurso continua utilizável na sessão mesmo se o armazenamento estiver indisponível.
  }
}

async function showWaterNotification() {
  const options = {
    body: 'Uma pausa para beber água pode ajudar você a manter sua rotina. Registre a quantidade no SISTCS Leve.',
    icon: `${import.meta.env.BASE_URL}icon-192.png`,
    tag: 'sistcs-leve-water-reminder',
    // Solicita alerta sonoro e permite novo alerta quando a mesma notificação é substituída.
    silent: false,
    renotify: true,
  };
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Hora de beber água', options);
      return;
    } catch {
      // Alguns navegadores não disponibilizam uma registration ativa.
    }
  }
  if ('Notification' in window) new Notification('Hora de beber água', options);
}

export function WaterReminders() {
  const [settings, setSettings] = useState<WaterReminderSettings>(() => readSettings());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    'Notification' in window ? Notification.permission : 'unsupported',
  );
  const [message, setMessage] = useState('');
  const [customSoundName, setCustomSoundName] = useState<string | null>(null);

  useEffect(() => {
    void getCustomWaterSoundName().then(setCustomSoundName);
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!settings.enabled || permission !== 'granted') return;
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      const now = new Date();
      const lastSent = readLastSent();
      if (!shouldSendWaterReminder(settings, now, lastSent)) return;
      try {
        await showWaterNotification();
        const soundPlayed = settings.soundEnabled ? await playWaterReminderSound() : false;
        window.localStorage.setItem(LAST_SENT_KEY, String(now.getTime()));
        setMessage(settings.soundEnabled && !soundPlayed
          ? 'Notificação enviada. O navegador bloqueou o som; toque em “Testar som” para liberar o áudio.'
          : soundPlayed
            ? 'Lembrete enviado com som. O próximo respeitará o intervalo escolhido.'
            : 'Lembrete enviado sem som. O próximo respeitará o intervalo escolhido.');
      } catch {
        setMessage('Não foi possível mostrar a notificação. Confira as permissões do navegador.');
      }
    };
    const timer = window.setInterval(() => { void check(); }, 15_000);
    void check();
    return () => window.clearInterval(timer);
  }, [settings, permission]);

  async function enableReminders() {
    // Criar/desbloquear o contexto de áudio durante o toque do usuário respeita as regras de autoplay.
    const audioReadyPromise = prepareWaterReminderAudio();
    if (permission === 'unsupported') {
      setMessage('Este navegador não oferece notificações. Tente instalar o app ou usar um navegador compatível.');
      return;
    }
    if (Notification.permission === 'denied') {
      setMessage('As notificações estão bloqueadas nas permissões do navegador. Ative-as nas configurações do site.');
      return;
    }
    try {
      const result = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        setSettings((current) => ({ ...current, enabled: false }));
        setMessage('Permissão não concedida. Você pode ativar as notificações nas configurações do navegador.');
        return;
      }
      setSettings((current) => ({ ...current, enabled: true }));
      window.localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
      const audioReady = await audioReadyPromise;
      setMessage(audioReady && settings.soundEnabled
        ? 'Lembretes ativados com som enquanto o SISTCS Leve estiver aberto e ativo.'
        : 'Lembretes ativados. Para liberar o som, toque em “Testar som”; o sistema também pode silenciar notificações.');
    } catch {
      setMessage('Não foi possível solicitar permissão para notificações neste navegador.');
    }
  }

  async function testReminderSound() {
    const played = await playWaterReminderSound();
    setMessage(played
      ? 'Teste de som concluído. O volume e o modo silencioso do aparelho continuam sob controle do sistema.'
      : 'Não foi possível tocar o som. Confira o volume, o modo silencioso e as permissões do navegador.');
  }

  async function chooseCustomSound(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const problem = validateCustomSound(file);
    if (problem) {
      setMessage(problem);
      return;
    }
    try {
      await saveCustomWaterSound(file);
      setCustomSoundName(file.name);
      const played = await playWaterReminderSound();
      setMessage(played
        ? 'Som escolhido e guardado neste aparelho. Ele toca nos próximos lembretes.'
        : 'Som guardado, mas não foi possível tocá-lo agora. Confira o volume e o modo silencioso.');
    } catch {
      setMessage('Não foi possível guardar o som neste aparelho.');
    }
  }

  async function removeCustomSound() {
    await clearCustomWaterSound();
    setCustomSoundName(null);
    setMessage('Som personalizado removido. Voltou o som padrão.');
  }

  function disableReminders() {
    setSettings((current) => ({ ...current, enabled: false }));
    setMessage('Lembretes desativados.');
  }

  return (
    <section className="water-reminder-card" aria-labelledby="water-reminders-title">
      <div className="water-reminder-heading">
        <span className="water-reminder-icon"><Droplets size={20} aria-hidden="true" /></span>
        <div>
          <p className="ft-kicker">HÁBITOS DIÁRIOS</p>
          <h2 id="water-reminders-title">Lembretes para beber água</h2>
          <p>Escolha a frequência e o período que combinam com sua rotina.</p>
        </div>
      </div>

      <div className="water-reminder-controls">
        <div className="water-reminder-field">
          <label htmlFor="water-reminder-interval">Repetir a cada</label>
          <select id="water-reminder-interval" value={settings.intervalMinutes} onChange={(event) => setSettings((current) => ({ ...current, intervalMinutes: Number(event.target.value) as WaterReminderSettings['intervalMinutes'] }))}>
            <option value={30}>30 minutos</option>
            <option value={60}>1 hora</option>
            <option value={90}>1 hora e 30 minutos</option>
            <option value={120}>2 horas</option>
          </select>
        </div>
        <div className="water-reminder-field">
          <label htmlFor="water-reminder-start">Começar às</label>
          <input id="water-reminder-start" type="time" value={settings.startTime} onChange={(event) => setSettings((current) => ({ ...current, startTime: event.target.value }))} />
        </div>
        <div className="water-reminder-field">
          <label htmlFor="water-reminder-end">Terminar às</label>
          <input id="water-reminder-end" type="time" value={settings.endTime} onChange={(event) => setSettings((current) => ({ ...current, endTime: event.target.value }))} />
        </div>
      </div>

      <div className="water-reminder-actions">
        {settings.enabled ? (
          <button className="btn btn-default btn-md" type="button" onClick={disableReminders}><BellOff size={17} aria-hidden="true" /> Desativar lembretes</button>
        ) : (
          <button className="btn btn-primary btn-md" type="button" onClick={() => void enableReminders()}><BellRing size={17} aria-hidden="true" /> Ativar notificações</button>
        )}
        <span className="water-reminder-status" role="status">{settings.enabled ? 'Ativo neste dispositivo' : 'Desativado'}</span>
      </div>
      <div className="water-reminder-actions">
        <label className="water-reminder-sound-option">
          <input type="checkbox" checked={settings.soundEnabled} onChange={(event) => setSettings((current) => ({ ...current, soundEnabled: event.target.checked }))} />
          Tocar som nos lembretes
        </label>
        <button className="btn btn-outline btn-sm" type="button" onClick={() => void testReminderSound()}>Testar som</button>
      </div>
      <div className="water-reminder-actions">
        <label className="btn btn-outline btn-sm" htmlFor="water-reminder-custom-sound">Escolher som do celular</label>
        <input id="water-reminder-custom-sound" type="file" accept="audio/*" hidden onChange={(event) => void chooseCustomSound(event)} />
        {customSoundName && (
          <>
            <span className="water-reminder-status">Som: {customSoundName}</span>
            <button className="btn btn-outline btn-sm" type="button" onClick={() => void removeCustomSound()}>Remover</button>
          </>
        )}
      </div>
      <p className="water-reminder-note">Importante: o som é reproduzido enquanto a página está ativa e o navegador permite áudio. O som da notificação do sistema depende do volume, modo silencioso e configurações de notificação do Android. O som escolhido do seu celular fica guardado só neste aparelho, toca com o app aberto (até 10 segundos, arquivos de até 2 MB). Os lembretes não são garantidos com o app fechado; isso exige Web Push e configuração adicional.</p>
      {message && <p className="water-reminder-feedback" role="status">{message}</p>}
    </section>
  );
}
