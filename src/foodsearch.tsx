import { useEffect, useMemo, useRef, useState } from 'react';
import { ScanBarcode, Search, X } from 'lucide-react';
import { Button, decimalIsValid, decimalText, parseDecimal } from './ui';
import { gramsFor, lookupBarcode, normalize, parseQuery, scale, searchLocal, searchOpenFoodFactsPage, searchTempoLifeFoods, type FoodPer100 } from './foods-br';

export interface PickedFood {
  name: string;
  portion: string;
  nutrients: { calories: number; proteins: number; carbohydrates: number; fats: number; fiber: number };
}

type Detector = { detect(v: HTMLVideoElement): Promise<Array<{ rawValue: string }>> };

function BarcodeScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);
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
            const code = found[0]?.rawValue?.trim();
            if (!stopped && code) {
              const previous = lastCodeRef.current;
              // BarcodeDetector encontra o mesmo código em muitos quadros seguidos.
              // Evita disparar várias consultas para o mesmo produto em sequência.
              if (previous?.code === code && Date.now() - previous.at < 2500) return;
              lastCodeRef.current = { code, at: Date.now() };
              onCodeRef.current(code);
            }
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
  const [manualPick, setManualPick] = useState<FoodPer100 | null>(null);
  const [gramsText, setGramsText] = useState<string | null>(null);
  const [measureUnit, setMeasureUnit] = useState('g');
  const [measureAmount, setMeasureAmount] = useState('100');
  const [online, setOnline] = useState<FoodPer100[]>([]);
  const [referenceFoods, setReferenceFoods] = useState<FoodPer100[]>([]);
  const [onlinePage, setOnlinePage] = useState(1);
  const [hasMoreOnline, setHasMoreOnline] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  useEffect(() => () => abort.current?.abort(), []);

  // Tudo é derivado do que foi digitado: "2 ovos", "150 g de arroz", "1 colher de sopa de azeite".
  const parsed = parseQuery(query);
  // Mantém a identidade dos resultados estável enquanto o nome pesquisado não muda.
  // Isso evita reexecutar o efeito de preenchimento nutricional em cada renderização do formulário.
  const matches = useMemo(() => (parsed.name ? searchLocal(parsed.name, 6) : []), [parsed.name]);
  const food = manualPick ?? matches[0] ?? null;
  const auto = food ? gramsFor(food, parsed) : null;
  const measureOptions = useMemo(() => {
    const defaults: Array<{ value: string; label: string; grams: number }> = [
      { value: 'g', label: 'Gramas (g)', grams: 1 },
      { value: 'colher de chá', label: 'Colher de chá', grams: 5 },
      { value: 'colher de sobremesa', label: 'Colher de sobremesa', grams: 10 },
      { value: 'colher de sopa', label: 'Colher de sopa', grams: 15 },
      { value: 'colher de servir', label: 'Colher grande de servir (estimativa)', grams: 50 },
      { value: 'xícara', label: 'Xícara', grams: 240 },
      { value: 'copo', label: 'Copo', grams: 200 },
      { value: 'concha', label: 'Concha', grams: 100 },
    ];
    const options = new Map(defaults.map((item) => [normalize(item.value), item]));
    for (const [name, weight] of food?.units ?? []) {
      const key = normalize(name);
      const existing = options.get(key);
      options.set(key, { value: name, label: name.charAt(0).toLocaleUpperCase('pt-BR') + name.slice(1), grams: weight });
      if (existing && existing.value === 'g') continue;
    }
    return [...options.values()];
  }, [food]);
  const selectedMeasure = measureOptions.find((option) => normalize(option.value) === normalize(measureUnit)) ?? measureOptions[0]!;
  const amountValid = decimalIsValid(measureAmount, false) && parseDecimal(measureAmount) > 0;
  const calculatedGrams = amountValid ? parseDecimal(measureAmount) * selectedMeasure.grams : 0;
  const typedOk = gramsText !== null && decimalIsValid(gramsText, false) && parseDecimal(gramsText) <= 5000;
  const grams = gramsText !== null ? (typedOk ? parseDecimal(gramsText) : 0) : auto?.grams ?? 0;
  const gramsOk = grams > 0 && grams <= 5000;
  const label =
    gramsText !== null || !auto
      ? `${decimalText(grams)} g`
      : auto.label.includes('×')
        ? `${auto.label} (${decimalText(Math.round(grams * 10) / 10)} g)`
        : auto.label;
  const calc = food && gramsOk ? scale(food, grams) : null;

  // Cálculo automático: preenche o formulário toda vez que o alimento ou a quantidade mudam.
  useEffect(() => {
    if (!food || !gramsOk) return;
    onPickRef.current({
      name: food.brand ? `${food.name} (${food.brand})` : food.name,
      portion: label,
      nutrients: scale(food, grams),
    });
  }, [food, gramsOk, grams, label]);

  // Produtos embalados: busca automática enquanto a pessoa digita.
  useEffect(() => {
    setOnline([]);
    setReferenceFoods([]);
    setOnlinePage(1);
    setHasMoreOnline(false);
    setLoadingMore(false);
    if (manualPick) return;
    if (normalize(parsed.name).length < 3) {
      setStatus('idle');
      return;
    }
    const ctl = new AbortController();
    const timer = window.setTimeout(async () => {
      abort.current?.abort();
      abort.current = ctl;
      setStatus('loading');
      try {
        const results = await Promise.allSettled([
          searchOpenFoodFactsPage(parsed.name, 1, ctl.signal),
          searchTempoLifeFoods(parsed.name, 20),
        ]);
        if (ctl.signal.aborted) return;
        const productResult = results[0].status === 'fulfilled' ? results[0].value : { foods: [], hasMore: false };
        const referenceResult = results[1].status === 'fulfilled' ? results[1].value : [];
        setOnline(productResult.foods);
        setReferenceFoods(referenceResult);
        setHasMoreOnline(productResult.hasMore);
        setStatus(results.every((result) => result.status === 'rejected') ? 'error' : 'done');
      } catch {
        if (!ctl.signal.aborted) {
          setOnline([]);
          setStatus('error');
        }
      }
    }, 700);
    return () => {
      window.clearTimeout(timer);
      ctl.abort();
    };
  }, [parsed.name, manualPick]);

  async function loadMoreOnline() {
    if (loadingMore || !hasMoreOnline || normalize(parsed.name).length < 3) return;
    const nextPage = onlinePage + 1;
    const ctl = new AbortController();
    abort.current?.abort();
    abort.current = ctl;
    setLoadingMore(true);
    setMessage('');
    try {
      const result = await searchOpenFoodFactsPage(parsed.name, nextPage, ctl.signal);
      if (ctl.signal.aborted) return;
      setOnline((previous) => {
        const seen = new Set(previous.map((item) => `${item.code ?? ''}|${normalize(item.name)}|${normalize(item.brand ?? '')}`));
        const additions = result.foods.filter((item) => !seen.has(`${item.code ?? ''}|${normalize(item.name)}|${normalize(item.brand ?? '')}`));
        return [...previous, ...additions];
      });
      setOnlinePage(nextPage);
      setHasMoreOnline(result.hasMore);
    } catch {
      if (!ctl.signal.aborted) setMessage('Não foi possível carregar mais produtos. Tente novamente.');
    } finally {
      if (!ctl.signal.aborted) setLoadingMore(false);
    }
  }

  function choose(f: FoodPer100) {
    setManualPick(f);
    setGramsText(null);
    setMeasureUnit('g');
    setMeasureAmount('100');
    setMessage('');
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
        setStatus('done');
        return setMessage('Produto não encontrado. Tente buscar pelo nome.');
      }
      choose(f);
      setQuery(f.name);
      setStatus('done');
    } catch (e) {
      if (ctl.signal.aborted) return;
      setStatus('error');
      setMessage(e instanceof Error ? e.message : 'Não foi possível consultar o código.');
    }
  }

  const others = [...matches.filter((m) => m !== food), ...online.filter((o) => o !== food), ...referenceFoods.filter((r) => r !== food)];
  const row = (f: FoodPer100, key: string) => (
    <li key={key} className="fs-row">
      <div>
        <strong>{f.name}</strong>
        <span>{f.brand ? `${f.brand} · ` : ''}{decimalText(f.kcal)} kcal por 100 g{f.origin === 'usda' ? ' · USDA (referência)' : ''}</span>
        {f.origin === 'usda' && <a href={f.sourceUrl ?? 'https://tempolife.app/'} target="_blank" rel="noreferrer">Fonte: USDA via TempoLife</a>}
      </div>
      <Button variant="outline" size="sm" onClick={() => choose(f)}>Usar</Button>
    </li>
  );

  return (
    <div className="fs-box">
      <div className="fs-head">
        <h4><Search size={15} aria-hidden="true" /> O que você comeu?</h4>
        <p>Digite do seu jeito, como “2 ovos”, “150 g de arroz” ou “1 banana”. O app encontra o alimento e calcula tudo sozinho.</p>
      </div>
      <div className="fs-bar" role="search">
        <label className="sr-only" htmlFor="fs-q">O que você comeu</label>
        <input
          id="fs-q"
          className="input fs-main"
          type="search"
          placeholder="Ex.: 2 ovos, 150 g de arroz, 1 banana…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setManualPick(null); setGramsText(null); }}
          autoComplete="off"
          autoFocus
        />
      </div>
      <div className="fs-bar">
        <label className="sr-only" htmlFor="fs-code">Código de barras</label>
        <input id="fs-code" className="input" inputMode="numeric" maxLength={14} placeholder="Ou o código de barras (EAN)" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button variant="outline" size="sm" onClick={() => byCode(code)} disabled={status === 'loading'}>Consultar</Button>
        <Button variant="outline" size="sm" onClick={() => setScanning((v) => !v)}><ScanBarcode aria-hidden="true" /> {scanning ? 'Parar' : 'Ler com a câmera'}</Button>
      </div>
      {scanning && <BarcodeScanner onCode={(c) => { setCode(c); void byCode(c); }} onClose={() => setScanning(false)} />}

      <div aria-live="polite">
        {message && <p className={status === 'error' ? 'field-error' : 'field-hint'}>{message}</p>}
        {status === 'loading' && <p className="field-hint">Buscando produtos…</p>}
      </div>

      {food ? (
        <div className="fs-selected">
          <div className="fs-selected-top">
            <div>
              <strong>{food.name}</strong>
              <span>{food.brand ? `${food.brand} · ` : ''}{decimalText(food.kcal)} kcal por 100 g{food.origin === 'local' ? ' · fonte: TACO (Unicamp)' : food.origin === 'estimate' ? ' · estimativa nutricional' : food.origin === 'usda' ? ' · USDA SR Legacy via TempoLife (referência internacional)' : ''}</span>
              {food.origin === 'usda' && <a href={food.sourceUrl ?? 'https://tempolife.app/'} target="_blank" rel="noreferrer">Fonte dos nutrientes: USDA SR Legacy via TempoLife</a>}
            </div>
          </div>
          <label className="fs-g-label" htmlFor="fs-measure">Medida do alimento</label>
          <div className="fs-grams-row">
            <div className="fs-grams">
              <input id="fs-measure-amount" className="input" inputMode="decimal" maxLength={6} aria-label="Quantidade da medida selecionada" value={measureAmount} onChange={(e) => {
                setMeasureAmount(e.target.value);
                const next = decimalIsValid(e.target.value, false) ? parseDecimal(e.target.value) * selectedMeasure.grams : 0;
                setGramsText(next > 0 && next <= 5000 ? String(Math.round(next * 10) / 10) : '0');
              }} aria-invalid={!amountValid || calculatedGrams > 5000} />
            </div>
            <select id="fs-measure" className="input" value={measureUnit} onChange={(e) => {
              const nextUnit = e.target.value;
              const nextMeasure = measureOptions.find((option) => normalize(option.value) === normalize(nextUnit)) ?? measureOptions[0]!;
              setMeasureUnit(nextUnit);
              const next = amountValid ? parseDecimal(measureAmount) * nextMeasure.grams : 0;
              setGramsText(next > 0 && next <= 5000 ? String(Math.round(next * 10) / 10) : '0');
            }} aria-label="Unidade de medida">
              {measureOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <p className="field-hint">Equivalência estimada: {decimalText(calculatedGrams)} g. Para maior precisão, escolha gramas. Colheres e utensílios variam de tamanho e densidade conforme o alimento.</p>
          <div className="fs-chips" role="group" aria-label="Quantidades rápidas em gramas">
            {GRAM_CHIPS.map((c) => (
              <button type="button" key={c} className={`fs-chip ${gramsOk && grams === c ? 'on' : ''}`} onClick={() => { setMeasureUnit('g'); setMeasureAmount(String(c)); setGramsText(String(c)); }}>{c} g</button>
            ))}
          </div>
          {(!amountValid || !gramsOk || calculatedGrams > 5000) && <p className="field-error" role="alert">Informe uma quantidade válida, maior que zero e de até 5000 g.</p>}
          {calc && (
            <p className="fs-calc" aria-live="polite">
              <strong>{decimalText(calc.calories)} kcal</strong>
              <span>Proteínas {decimalText(calc.proteins)} g · Carboidratos {decimalText(calc.carbohydrates)} g · Gorduras {decimalText(calc.fats)} g · Fibras {decimalText(calc.fiber)} g</span>
              <em>{label}: calculado automaticamente e já pronto para registrar.</em>
            </p>
          )}
        </div>
      ) : (
        query.trim() && status !== 'loading' && <p className="field-hint">Nenhum alimento da lista com esse nome{status === 'done' ? ' nem nos produtos embalados' : ''}. Abra “Preencher à mão” abaixo.</p>
      )}

      {others.length > 0 && (
        <>
          <p className="fs-group">{food ? 'Outras opções' : 'Resultados'} <small>toque para trocar</small></p>
          <ul className="fs-list">{others.slice(0, Math.max(onlinePage * 12, referenceFoods.length)).map((f, i) => row(f, `${f.origin}-${f.code ?? f.name}-${i}`))}</ul>
        </>
      )}
      {hasMoreOnline && !manualPick && (
        <div className="fs-more">
          <Button variant="outline" size="sm" onClick={loadMoreOnline} disabled={loadingMore || status === 'loading'}>
            {loadingMore ? 'Carregando produtos…' : 'Carregar mais produtos'}
          </Button>
        </div>
      )}
    </div>
  );
}
