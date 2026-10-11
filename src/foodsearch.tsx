import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ScanBarcode, Search, X } from 'lucide-react';
import { Button, decimalIsValid, decimalText, parseDecimal } from './ui';
import { lookupBarcode, normalize, scale, searchLocal, searchOpenFoodFacts, type FoodPer100 } from './foods-br';

export interface PickedFood {
  name: string;
  portion: string;
  nutrients: { calories: number; proteins: number; carbohydrates: number; fats: number; fiber: number };
}

type Detector = { detect(v: HTMLVideoElement): Promise<Array<{ rawValue: string }>> };

function BarcodeScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  // Guarda o callback mais recente para a câmera não reiniciar a cada renderização do pai.
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    const Ctor = (window as any).BarcodeDetector as (new (o: { formats: string[] }) => Detector) | undefined;
    if (!Ctor || !navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador não lê códigos de barras pela câmera. Digite o número do código.');
      return;
    }
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    const detector = new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        const el = video.current;
        if (!el) return;
        el.srcObject = s;
        void el.play();
        timer = window.setInterval(async () => {
          try {
            const found = await detector.detect(el);
            if (!stopped && found[0]?.rawValue) onCodeRef.current(found[0].rawValue);
          } catch {
            /* quadro sem código: tenta de novo */
          }
        }, 350);
      })
      .catch(() => setError('Não foi possível usar a câmera. Verifique a permissão ou digite o número do código.'));
    return () => {
      stopped = true;
      window.clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="scanner">
      {error ? <p className="field-error" role="alert">{error}</p> : <video ref={video} muted playsInline aria-label="Câmera para ler o código de barras" />}
      <Button variant="ghost" size="sm" onClick={onClose}><X aria-hidden="true" /> Fechar câmera</Button>
    </div>
  );
}

export function FoodSearch({ onPick }: { onPick: (food: PickedFood) => void }) {
  const [query, setQuery] = useState('');
  const [grams, setGrams] = useState('100');
  const [online, setOnline] = useState<FoodPer100[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  const local = searchLocal(query);
  const gramsOk = decimalIsValid(grams, false) && parseDecimal(grams) <= 5000;

  function pick(f: FoodPer100) {
    if (!gramsOk) return setMessage('Informe a quantidade em gramas (maior que zero).');
    const g = parseDecimal(grams);
    onPick({
      name: f.brand ? `${f.name} (${f.brand})` : f.name,
      portion: `${decimalText(g)} g`,
      nutrients: scale(f, g),
    });
    setMessage('');
  }

  async function searchOnline(event?: FormEvent) {
    event?.preventDefault();
    if (normalize(query).length < 3) return setMessage('Digite pelo menos 3 letras para buscar produtos.');
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setStatus('loading');
    setMessage('');
    try {
      setOnline(await searchOpenFoodFacts(query, ctl.signal));
      setStatus('done');
    } catch (e) {
      if (ctl.signal.aborted) return;
      setStatus('error');
      setMessage(e instanceof Error ? e.message : 'Não foi possível buscar produtos.');
    }
  }

  async function byCode(raw: string) {
    const c = raw.replace(/\D/g, '');
    if (c.length < 8 || c.length > 14) return setMessage('O código de barras tem de 8 a 14 números.');
    setScanning(false);
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setStatus('loading');
    setMessage('');
    try {
      const f = await lookupBarcode(c, ctl.signal);
      if (!f) {
        setOnline([]);
        setStatus('done');
        return setMessage('Produto não encontrado. Você pode preencher os valores à mão.');
      }
      setOnline([f]);
      setStatus('done');
    } catch (e) {
      if (ctl.signal.aborted) return;
      setStatus('error');
      setMessage(e instanceof Error ? e.message : 'Não foi possível consultar o código.');
    }
  }

  const row = (f: FoodPer100, key: string) => (
    <li key={key} className="fs-row">
      <div>
        <strong>{f.name}</strong>
        <span>{f.brand ? `${f.brand} · ` : ''}{decimalText(f.kcal)} kcal · P {decimalText(f.protein)} · C {decimalText(f.carbs)} · G {decimalText(f.fat)} <em>(por 100 g)</em></span>
      </div>
      <Button variant="outline" size="sm" onClick={() => pick(f)}>Usar {gramsOk ? `${decimalText(parseDecimal(grams))} g` : ''}</Button>
    </li>
  );

  return (
    <div className="fs-box">
      <div className="fs-head">
        <h4><Search size={15} aria-hidden="true" /> Buscar alimento</h4>
        <p>Escolha na lista para preencher os valores. Você pode ajustar tudo antes de registrar.</p>
      </div>
      <form className="fs-bar" onSubmit={searchOnline} role="search">
        <label className="sr-only" htmlFor="fs-q">Nome do alimento</label>
        <input id="fs-q" className="input" type="search" placeholder="Ex.: arroz, banana, iogurte…" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
        <label className="sr-only" htmlFor="fs-g">Quantidade em gramas</label>
        <div className="fs-grams"><input id="fs-g" className="input" inputMode="decimal" maxLength={6} value={grams} onChange={(e) => setGrams(e.target.value)} /><span aria-hidden="true">g</span></div>
        <Button type="submit" variant="outline" size="sm" disabled={status === 'loading'}>Buscar produtos</Button>
      </form>
      <div className="fs-bar">
        <label className="sr-only" htmlFor="fs-code">Código de barras</label>
        <input id="fs-code" className="input" inputMode="numeric" maxLength={14} placeholder="Código de barras (EAN)" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button variant="outline" size="sm" onClick={() => byCode(code)} disabled={status === 'loading'}>Consultar</Button>
        <Button variant="outline" size="sm" onClick={() => setScanning((v) => !v)}><ScanBarcode aria-hidden="true" /> {scanning ? 'Parar' : 'Ler com a câmera'}</Button>
      </div>
      {scanning && <BarcodeScanner onCode={(c) => { setCode(c); void byCode(c); }} onClose={() => setScanning(false)} />}

      <div aria-live="polite">
        {message && <p className={status === 'error' ? 'field-error' : 'field-hint'}>{message}</p>}
        {status === 'loading' && <p className="field-hint">Buscando…</p>}
      </div>

      {local.length > 0 && (
        <>
          <p className="fs-group">Alimentos comuns <small>valores aproximados, confira com o rótulo ou seu nutricionista</small></p>
          <ul className="fs-list">{local.map((f) => row(f, `l-${f.name}`))}</ul>
        </>
      )}
      {status === 'done' && online.length > 0 && (
        <>
          <p className="fs-group">Produtos embalados <small>Open Food Facts, dados colaborativos</small></p>
          <ul className="fs-list">{online.map((f, i) => row(f, `o-${f.code ?? i}`))}</ul>
        </>
      )}
      {status === 'done' && online.length === 0 && !message && <p className="field-hint">Nenhum produto encontrado.</p>}
    </div>
  );
}
