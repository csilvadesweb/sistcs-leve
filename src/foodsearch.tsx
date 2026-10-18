import { useEffect, useMemo, useRef, useState } from 'react';
import { ScanBarcode, Search, X } from 'lucide-react';
import { Button, decimalIsValid, decimalText, parseDecimal } from './ui';
import { foodConfidence, foodSourceLabel, foodSourceUrl, gramsFor, householdUnitsForFood, lookupBarcode, normalize, normalizeBarcodeInput, parseQuery, scale, searchFoodCatalog, searchLocal, searchOpenFoodFactsPage, searchSupplementCatalog, searchTempoLifeFoods, type FoodPer100 } from './foods-br';

export interface PickedFood {
  name: string;
  portion: string;
  nutritionSource?: "user-reported" | "user-estimated";
  nutrients: { calories: number; proteins: number; carbohydrates: number; fats: number; fiber: number };
}

type Detector = { detect(v: HTMLVideoElement): Promise<Array<{ rawValue: string }>> };

function BarcodeScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [detected, setDetected] = useState(false);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    const Ctor = (window as any).BarcodeDetector as (new (o: { formats: string[] }) => Detector) | undefined;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('A câmera exige conexão segura (HTTPS) e permissão do navegador. Você também pode digitar o código abaixo.');
      return;
    }
    if (!Ctor) {
      setError('A leitura pela câmera não é compatível com este navegador. Digite o número do código abaixo.');
      return;
    }
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    let detecting = false;
    let delivered = false;
    let detector: Detector;
    try {
      detector = new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    } catch {
      setError('Este dispositivo não oferece os formatos de leitura necessários. Digite o código abaixo.');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(async (s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        const el = video.current;
        if (!el) return s.getTracks().forEach((t) => t.stop());
        el.srcObject = s;
        try {
          await el.play();
          if (!stopped) setCameraReady(true);
        } catch {
          setError('Não foi possível iniciar a prévia da câmera. Confira a permissão e tente novamente.');
          return;
        }
        timer = window.setInterval(async () => {
          if (stopped || detecting || delivered || el.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
          detecting = true;
          try {
            const found = await detector.detect(el);
            const code = found[0]?.rawValue?.trim();
            if (!stopped && code) {
              const previous = lastCodeRef.current;
              if (previous?.code === code && Date.now() - previous.at < 2500) return;
              lastCodeRef.current = { code, at: Date.now() };
              delivered = true;
              setDetected(true);
              onCodeRef.current(code);
            }
          } catch {
            // Um quadro pode não conter código legível; continua tentando.
          } finally {
            detecting = false;
          }
        }, 300);
      })
      .catch(() => setError('Não foi possível acessar a câmera. Permita o acesso nas configurações do navegador ou digite o código abaixo.'));
    return () => {
      stopped = true;
      window.clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
      const el = video.current;
      if (el) el.srcObject = null;
    };
  }, []);

  return (
    <section className="scanner scanner-premium" aria-label="Leitor de código de barras">
      <div className="scanner-heading">
        <span className="scanner-heading-icon"><ScanBarcode size={20} aria-hidden="true" /></span>
        <div>
          <strong>Leitor de produtos</strong>
          <p>{error ? 'Use a busca manual como alternativa.' : detected ? 'Código detectado. Consultando o catálogo…' : cameraReady ? 'Centralize o código de barras na moldura.' : 'Preparando a câmera traseira…'}</p>
        </div>
        <span className={error ? 'scanner-status scanner-status-warning' : cameraReady ? 'scanner-status scanner-status-live' : 'scanner-status'}>{error ? 'Manual' : cameraReady ? 'Ao vivo' : 'Iniciando'}</span>
      </div>
      <div className="scanner-viewport">
        <video ref={video} muted playsInline aria-label="Prévia da câmera traseira para ler o código de barras" />
        {!error && <div className="scanner-overlay" aria-hidden="true"><span /><span /><span /><span /><i /></div>}
        {error && <div className="scanner-fallback"><ScanBarcode size={34} aria-hidden="true" /><p>{error}</p></div>}
      </div>
      <p className="scanner-tip">Dica: mantenha o rótulo iluminado, firme e a poucos centímetros da câmera. A leitura depende do suporte do navegador.</p>
      <Button variant="outline" size="sm" onClick={onClose}><X aria-hidden="true" /> Fechar leitor</Button>
    </section>
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
  const [catalogFoods, setCatalogFoods] = useState<FoodPer100[]>([]);
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
  const food = manualPick ?? matches[0] ?? catalogFoods[0] ?? null;
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
    for (const [name, weight] of (food ? householdUnitsForFood(food) : [])) {
      const key = normalize(name);
      const existing = options.get(key);
      options.set(key, { value: name, label: name.charAt(0).toLocaleUpperCase('pt-BR') + name.slice(1), grams: weight });
      if (existing && existing.value === 'g') continue;
    }
    return [...options.values()];
  }, [food]);
  const selectedMeasure = measureOptions.find((option) => normalize(option.value) === normalize(measureUnit)) ?? measureOptions[0]!;
  const displayedMeasureAmount = gramsText === null && auto && measureUnit === 'g' ? String(auto.grams) : measureAmount;
  const amountValid = decimalIsValid(displayedMeasureAmount, false) && parseDecimal(displayedMeasureAmount) > 0;
  const calculatedGrams = amountValid ? parseDecimal(displayedMeasureAmount) * selectedMeasure.grams : 0;
  const typedOk = gramsText !== null && decimalIsValid(gramsText, false) && parseDecimal(gramsText) <= 5000;
  const grams = gramsText !== null ? (typedOk ? parseDecimal(gramsText) : 0) : auto?.grams ?? 0;
  const gramsOk = grams > 0 && grams <= 5000;
  const label =
    gramsText !== null || !auto
      ? `${decimalText(grams)} ${food?.basis === '100ml' ? 'ml' : 'g'}`
      : auto.label.includes('×')
        ? `${auto.label} (${decimalText(Math.round(grams * 10) / 10)} ${food?.basis === '100ml' ? 'ml' : 'g'})`
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
    setCatalogFoods([]);
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
          searchFoodCatalog(parsed.name, 20),
          searchSupplementCatalog(parsed.name, 20),
        ]);
        if (ctl.signal.aborted) return;
        const productResult = results[0].status === 'fulfilled' ? results[0].value : { foods: [], hasMore: false };
        const referenceResult = results[1].status === 'fulfilled' ? results[1].value : [];
        const catalogResult = results[2].status === 'fulfilled' ? results[2].value : [];
        const supplementResult = results[3].status === 'fulfilled' ? results[3].value : [];
        setOnline(productResult.foods);
        setReferenceFoods(referenceResult);
        // Produtos cadastrados de suplementos aparecem antes das referências genéricas.
        setCatalogFoods([...supplementResult, ...catalogResult]);
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
        return setMessage('Esse código não está no catálogo online. Pesquise “Vigor Grego Protein” ou “Danone Mais Proteínas Morango” no campo acima; produtos do catálogo local também podem ser encontrados pelo nome.');
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

  const localNames = new Set(matches.map((item) => normalize(item.name)));
  const others = [
    ...matches.filter((m) => m !== food),
    ...catalogFoods.filter((item) => item !== food && !localNames.has(normalize(item.name))),
    ...online.filter((o) => o !== food),
    ...referenceFoods.filter((r) => r !== food),
  ];
  const row = (f: FoodPer100, key: string) => (
    <li key={key} className="fs-row">
      <div>
        <strong>{f.name}</strong>
        <span>{f.brand ? `${f.brand} · ` : ''}{decimalText(f.kcal)} kcal por {f.basis === '100ml' ? '100 ml' : '100 g'}</span>
        <span>Fonte: {foodSourceLabel(f)} · Confiança {foodConfidence(f).level}</span>
        <small>{foodConfidence(f).explanation}</small>
        {foodSourceUrl(f) && <a href={foodSourceUrl(f)} target="_blank" rel="noreferrer">Consultar fonte</a>}
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
      <section className="fs-supplement-shortcuts" aria-label="Catálogo de suplementos">
        <strong>Catálogo de suplementos</strong>
        <p className="field-hint">Digite o nome do produto ou da marca — por exemplo, “creatina Integralmédica” ou “ISO Triple Zero”. Também pode consultar pelo código de barras. Os resultados mostram produtos identificados, não categorias genéricas.</p>
        <small className="field-hint">Confira a porção e o rótulo antes de registrar. Quando os dados nutricionais não estiverem disponíveis, eles não serão inventados.</small>
      </section>
      <div className="fs-bar">
        <label className="sr-only" htmlFor="fs-code">Código de barras</label>
        <input id="fs-code" className="input" inputMode="numeric" placeholder="Ou o código de barras (EAN)" value={code} onChange={(e) => setCode(normalizeBarcodeInput(e.target.value))} />
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
              <span>{food.brand ? `${food.brand} · ` : ''}{decimalText(food.kcal)} kcal por {food.basis === '100ml' ? '100 ml' : '100 g'}</span>
              <span>Fonte: {foodSourceLabel(food)} · Confiança {foodConfidence(food).level}</span>
              <small>{foodConfidence(food).explanation}</small>
              {foodSourceUrl(food) && <a href={foodSourceUrl(food)} target="_blank" rel="noreferrer">Consultar fonte</a>}
            </div>
          </div>
          {(food.origin === 'off' || food.origin === 'supplement') && <section className="fs-nutrition-details" aria-label="Tabela nutricional por 100 gramas">
            <strong>Tabela nutricional por 100 {food.basis === '100ml' ? 'ml' : 'g'}</strong>
            {food.servingSize && <p className="field-hint">Porção indicada no rótulo: {food.servingSize}</p>}
            <dl>
              <div><dt>Energia</dt><dd>{decimalText(food.kcal)} kcal</dd></div>
              <div><dt>Proteínas</dt><dd>{food.reportedNutrients?.protein === false ? 'Não informado' : `${decimalText(food.protein)} g`}</dd></div>
              <div><dt>Carboidratos</dt><dd>{food.reportedNutrients?.carbs === false ? 'Não informado' : `${decimalText(food.carbs)} g`}</dd></div>
              <div><dt>Gorduras totais</dt><dd>{food.reportedNutrients?.fat === false ? 'Não informado' : `${decimalText(food.fat)} g`}</dd></div>
              <div><dt>Gorduras saturadas</dt><dd>{food.saturatedFat === undefined ? 'Não informado' : `${decimalText(food.saturatedFat)} g`}</dd></div>
              <div><dt>Fibra alimentar</dt><dd>{food.reportedNutrients?.fiber === false ? 'Não informado' : `${decimalText(food.fiber)} g`}</dd></div>
              <div><dt>Açúcares</dt><dd>{food.sugars === undefined ? 'Não informado' : `${decimalText(food.sugars)} g`}</dd></div>
              <div><dt>Sódio</dt><dd>{food.sodiumMg === undefined ? 'Não informado' : `${decimalText(food.sodiumMg)} mg`}</dd></div>
              {Object.entries(food.micronutrients ?? {}).map(([name, value]) => <div key={name}><dt>{name.replaceAll('_', ' ')}</dt><dd>{String(value)}</dd></div>)}
            </dl>
            {food.ingredients && <p><strong>Ingredientes e alergênicos:</strong> {food.ingredients}</p>}
            {food.reportedNutrients && Object.values(food.reportedNutrients).some((available) => !available) && <p>Alguns nutrientes não foram informados pela fonte; o cálculo desses itens pode ficar incompleto.</p>}
          </section>}
          <label className="fs-g-label" htmlFor="fs-measure">Medida do alimento</label>
          <div className="fs-grams-row">
            <div className="fs-grams">
              <input id="fs-measure-amount" className="input" inputMode="decimal" maxLength={6} aria-label="Quantidade da medida selecionada" value={displayedMeasureAmount} onChange={(e) => {
                setMeasureAmount(e.target.value);
                const next = decimalIsValid(e.target.value, false) ? parseDecimal(e.target.value) * selectedMeasure.grams : 0;
                setGramsText(next > 0 && next <= 5000 ? String(Math.round(next * 10) / 10) : '0');
              }} aria-invalid={!amountValid || calculatedGrams > 5000} />
            </div>
            <select id="fs-measure" className="input" value={measureUnit} onChange={(e) => {
              const nextUnit = e.target.value;
              const nextMeasure = measureOptions.find((option) => normalize(option.value) === normalize(nextUnit)) ?? measureOptions[0]!;
              setMeasureUnit(nextUnit);
              const nextAmount = nextUnit === 'g' && auto ? String(auto.grams) : '1';
              setMeasureAmount(nextAmount);
              const next = decimalIsValid(nextAmount, false) ? parseDecimal(nextAmount) * nextMeasure.grams : 0;
              setGramsText(next > 0 && next <= 5000 ? String(Math.round(next * 10) / 10) : '0');
            }} aria-label="Unidade de medida">
              {measureOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <p className="field-hint">Equivalência estimada: {decimalText(calculatedGrams)} g. Para maior precisão, escolha gramas. Colheres e utensílios variam de tamanho e densidade conforme o alimento.</p>
          <div className="fs-chips" role="group" aria-label="Quantidades rápidas em gramas">
            {GRAM_CHIPS.map((c) => (
              <Button key={c} size="sm" variant={gramsOk && grams === c ? 'default' : 'outline'} aria-pressed={gramsOk && grams === c} onClick={() => { setMeasureUnit('g'); setMeasureAmount(String(c)); setGramsText(String(c)); }}>{c} g</Button>
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
