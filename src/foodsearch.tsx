import { useEffect, useRef, useState } from 'react';
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

const GRAM_CHIPS = [50, 100, 150, 200, 300];

export function FoodSearch({ onPick }: { onPick: (food: PickedFood) => void }) {
  const [query, setQuery] = useState('');
  const [grams, setGrams] = useState('100');
  const [selected, setSelected] = useState<FoodPer100 | null>(null);
  const [online, setOnline] = useState<FoodPer100[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  useEffect(() => () => abort.current?.abort(), []);

  const local = searchLocal(query);
  const gramsOk = decimalIsValid(grams, false) && parseDecimal(grams) <= 5000;
  const g = gramsOk ? parseDecimal(grams) : 0;
  const calc = selected && gramsOk ? scale(selected, g) : null;

  // Cálculo automático: sempre que o alimento ou a quantidade mudam, os campos do formulário são recalculados.
  useEffect(() => {
    if (!selected || !gramsOk) return;
    onPickRef.current({
      name: selected.brand ? `${selected.name} (${selected.brand})` : selected.name,
      portion: `${decimalText(g)} g`,
      nutrients: scale(selected, g),
    });
  }, [selected, gramsOk, g]);

  // Busca de produtos embalados automática enquanto a pessoa digita (a lista local aparece na hora).
  useEffect(() => {
    if (selected) return;
    if (normalize(query).length < 3) {
      setOnline([]);
      setStatus('idle');
      return;
    }
    const ctl = new AbortController();
    const timer = window.setTimeout(async () => {
      abort.current?.abort();
      abort.current = ctl;
      setStatus('loading');
      try {
        setOnline(await searchOpenFoodFacts(query, ctl.signal));
        setStatus('done');
      } catch {
        if (!ctl.signal.aborted) {
          setOnline([]);
          setStatus('error');
        }
      }
    }, 600);
    return () => {
      window.clearTimeout(timer);
      ctl.abort();
    };
  }, [query, selected]);

  function choose(f: FoodPer100) {
    setSelected(f);
    setMessage('');
    if (!decimalIsValid(grams, false)) setGrams('100');
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
      choose(f);
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
      <Button variant="outline" size="sm" onClick={() => choose(f)}>Selecionar</Button>
    </li>
  );

  return (
    <div className="fs-box">
      <div className="fs-head">
        <h4><Search size={15} aria-hidden="true" /> Buscar alimento</h4>
        <p>Digite o nome, escolha o alimento e informe a quantidade: as calorias e os nutrientes são calculados sozinhos.</p>
      </div>

      {selected ? (
        <div className="fs-selected">
          <div className="fs-selected-top">
            <div>
              <strong>{selected.name}</strong>
              <span>{selected.brand ? `${selected.brand} · ` : ''}{decimalText(selected.kcal)} kcal por 100 g</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setMessage(''); }}><X aria-hidden="true" /> Trocar</Button>
          </div>
          <label className="fs-g-label" htmlFor="fs-g">Quantidade</label>
          <div className="fs-grams-row">
            <div className="fs-grams"><input id="fs-g" className="input" inputMode="decimal" maxLength={6} value={grams} onChange={(e) => setGrams(e.target.value)} aria-invalid={!gramsOk} /><span aria-hidden="true">g</span></div>
            <div className="fs-chips" role="group" aria-label="Quantidades rápidas">
              {GRAM_CHIPS.map((c) => (
                <button type="button" key={c} className={`fs-chip ${gramsOk && g === c ? 'on' : ''}`} onClick={() => setGrams(String(c))}>{c} g</button>
              ))}
            </div>
          </div>
          {!gramsOk && <p className="field-error" role="alert">Informe a quantidade em gramas (maior que zero, até 5000).</p>}
          {calc && (
            <p className="fs-calc" aria-live="polite">
              <strong>{decimalText(calc.calories)} kcal</strong>
              <span>Proteínas {decimalText(calc.proteins)} g · Carboidratos {decimalText(calc.carbohydrates)} g · Gorduras {decimalText(calc.fats)} g · Fibras {decimalText(calc.fiber)} g</span>
              <em>Calculado automaticamente para {decimalText(g)} g e já preenchido abaixo.</em>
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="fs-bar" role="search">
            <label className="sr-only" htmlFor="fs-q">Nome do alimento</label>
            <input id="fs-q" className="input" type="search" placeholder="Ex.: arroz, banana, iogurte…" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
          </div>
          <div className="fs-bar">
            <label className="sr-only" htmlFor="fs-code">Código de barras</label>
            <input id="fs-code" className="input" inputMode="numeric" maxLength={14} placeholder="Código de barras (EAN)" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button variant="outline" size="sm" onClick={() => byCode(code)} disabled={status === 'loading'}>Consultar</Button>
            <Button variant="outline" size="sm" onClick={() => setScanning((v) => !v)}><ScanBarcode aria-hidden="true" /> {scanning ? 'Parar' : 'Ler com a câmera'}</Button>
          </div>
          {scanning && <BarcodeScanner onCode={(c) => { setCode(c); void byCode(c); }} onClose={() => setScanning(false)} />}

          <div aria-live="polite">
            {message && <p className={status === 'error' ? 'field-error' : 'field-hint'}>{message}</p>}
            {status === 'loading' && <p className="field-hint">Buscando produtos…</p>}
            {status === 'error' && !message && <p className="field-hint">A busca de produtos embalados não respondeu. Os alimentos comuns continuam disponíveis.</p>}
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
          {status === 'done' && online.length === 0 && local.length === 0 && !message && <p className="field-hint">Nenhum alimento encontrado. Você pode preencher os valores à mão.</p>}
        </>
      )}
    </div>
  );
}
