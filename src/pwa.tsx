import { useEffect, useState } from 'react';

/* ---------- instalação (captura o evento antes do React montar) ---------- */

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    notify();
  });
}

export function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function usePwaInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return {
    canInstall: deferred !== null,
    installed: installed || isStandalone(),
    ios: isIOS(),
    async install() {
      if (!deferred) return false;
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;
      notify();
      return outcome === 'accepted';
    },
  };
}

/* ---------- service worker e atualização ---------- */

let waitingWorker: ServiceWorker | null = null;
const updateListeners = new Set<() => void>();

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((reg) => {
        const flag = (w: ServiceWorker | null) => {
          if (w && navigator.serviceWorker.controller) {
            waitingWorker = w;
            updateListeners.forEach((l) => l());
          }
        };
        flag(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const w = reg.installing;
          w?.addEventListener('statechange', () => {
            if (w.state === 'installed') flag(w);
          });
        });
        // Procura versão nova ao voltar para o app e a cada hora.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void reg.update();
        });
        window.setInterval(() => void reg.update(), 3600000);
      })
      .catch(() => {
        /* sem service worker o app continua funcionando normalmente */
      });
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  });
}

export function useUpdateReady() {
  const [ready, setReady] = useState(waitingWorker !== null);
  useEffect(() => {
    const l = () => setReady(waitingWorker !== null);
    updateListeners.add(l);
    return () => void updateListeners.delete(l);
  }, []);
  return { ready, apply: () => waitingWorker?.postMessage({ type: 'SKIP_WAITING' }) };
}

export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/** Faixas no topo: sem internet e nova versão disponível. */
export function PwaBanners() {
  const online = useOnline();
  const update = useUpdateReady();
  if (online && !update.ready) return null;
  return (
    <div className="pwa-banners">
      {!online && (
        <p className="pwa-banner pwa-offline" role="status">
          Você está sem internet. O que aparece pode estar desatualizado, e novos registros só são salvos quando a conexão voltar.
        </p>
      )}
      {update.ready && (
        <p className="pwa-banner pwa-update" role="status">
          <span>Há uma nova versão do app.</span>
          <button type="button" className="pwa-banner-btn" onClick={update.apply}>Atualizar agora</button>
        </p>
      )}
    </div>
  );
}

/** Cartão para o Perfil: instalar no celular ou no computador. */
export function InstallCard() {
  const { canInstall, installed: isInstalled, ios, install } = usePwaInstall();
  const [msg, setMsg] = useState('');
  return (
    <div className="install-card">
      <img src={`${import.meta.env.BASE_URL}emblem.webp`} alt="" width={56} height={56} />
      <div>
        <strong>Instale o app no seu aparelho</strong>
        {isInstalled ? (
          <p>O app já está instalado e abre em tela cheia.</p>
        ) : canInstall ? (
          <>
            <p>Abre direto da tela inicial, em tela cheia, e carrega mais rápido.</p>
            <button
              type="button"
              className="btn btn-default btn-md"
              onClick={async () => {
                try {
                  setMsg((await install()) ? 'App instalado.' : 'Instalação não concluída. Use o menu do navegador para tentar novamente.');
                } catch {
                  setMsg('O navegador não conseguiu iniciar a instalação. Use o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.');
                }
              }}
            >
              Instalar app
            </button>
          </>
        ) : ios ? (
          <p>No iPhone ou iPad, abra no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.</p>
        ) : (
          <p>No Chrome ou Edge, use o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”. A opção só aparece na versão publicada, com HTTPS.</p>
        )}
        {msg && <p role="status">{msg}</p>}
      </div>
    </div>
  );
}
