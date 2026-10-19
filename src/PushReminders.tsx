import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { Button } from './ui';
import { disablePush, enablePush, isPushEnabled, pushSupport, sendTestPush } from './push';

type Notice = { kind: 'ok' | 'error'; text: string } | null;

/** Liga os lembretes de dose no celular, mesmo com o app fechado. */
export function PushReminders() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const supported = pushSupport() === 'supported';

  useEffect(() => {
    let cancelled = false;
    if (!supported) {
      setEnabled(false);
      return;
    }
    void isPushEnabled().then((value) => { if (!cancelled) setEnabled(value); });
    return () => { cancelled = true; };
  }, [supported]);

  async function run(action: () => Promise<void>, okText: string) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      setNotice({ kind: 'ok', text: okText });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Algo deu errado. Tente novamente.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ft-card" aria-labelledby="push-title">
      <div className="ft-section-heading">
        <div className="ft-section-mark"><BellRing size={19} aria-hidden="true" /></div>
        <div>
          <p className="ft-kicker">LEMBRETES NO CELULAR</p>
          <h2 id="push-title">Avisar na hora da dose</h2>
        </div>
      </div>
      <p className="ft-explainer">
        Receba um aviso no horário de cada dose cadastrada, mesmo com o app fechado. O aviso é genérico: não mostra o nome do medicamento.
        No iPhone, instale o app na tela inicial antes de ativar.
      </p>
      {!supported ? (
        <p className="ft-feedback" role="note">Este navegador não oferece notificações push.</p>
      ) : (
        <div className="btn-group">
          {enabled ? (
            <>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => run(sendTestPush, 'Teste enviado. Ele deve chegar em instantes.')}>Enviar teste</Button>
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => run(async () => { await disablePush(); setEnabled(false); }, 'Notificações desativadas neste aparelho.')}>Desativar</Button>
            </>
          ) : (
            <Button size="sm" disabled={busy || enabled === null} onClick={() => run(async () => { await enablePush(); setEnabled(true); }, 'Notificações ativadas neste aparelho. Use “Enviar teste” para conferir.')}>
              <BellRing aria-hidden="true" /> Ativar lembretes
            </Button>
          )}
        </div>
      )}
      {notice && <p className={`ft-feedback ft-feedback-${notice.kind === 'ok' ? 'success' : 'error'}`} role={notice.kind === 'error' ? 'alert' : 'status'} aria-live="polite">{notice.text}</p>}
    </section>
  );
}
