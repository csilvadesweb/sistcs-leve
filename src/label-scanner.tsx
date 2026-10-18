import { useRef, useState, type ChangeEvent } from 'react';
import { Camera, LoaderCircle, ScanText } from 'lucide-react';
import { supabase } from './supabase';
import { Button, buttonClass } from './ui';
import type { PickedFood } from './foodsearch';
import { hasCompleteNonNegativeNutrition } from './photo-nutrition';

type LabelResult = {
  name: string;
  brand: string;
  basis: '100g' | '100ml';
  servingSize: string;
  calories: number | null;
  proteins: number | null;
  carbohydrates: number | null;
  fats: number | null;
  fiber: number | null;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
};

export function NutritionLabelScanner({ onPick }: { onPick: (food: PickedFood) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState<LabelResult | null>(null);

  async function scan(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setNotice('');
    setPreview(null);
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setNotice('Escolha uma imagem JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setNotice('A imagem deve ter no máximo 4 MB.');
      return;
    }
    setBusy(true);
    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Não foi possível abrir a imagem.'));
        reader.onload = () => {
          const result = typeof reader.result === 'string' ? reader.result : '';
          const comma = result.indexOf(',');
          if (comma < 0) reject(new Error('Não foi possível preparar a imagem.'));
          else resolve(result.slice(comma + 1));
        };
        reader.readAsDataURL(file);
      });
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Entre na sua conta para ler o rótulo.');
      const response = await fetch('/api/ai/label', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ mimeType: file.type, imageBase64 }),
      });
      const body = await response.json() as { food?: LabelResult; error?: string };
      if (!response.ok || !body.food) throw new Error(body.error || 'Não foi possível ler o rótulo.');
      setPreview(body.food);
      if (body.food.confidence === 'low') setNotice('A leitura teve baixa confiança. Confira cada valor antes de usar.');
      else setNotice('Confira os valores reconhecidos. Nada será salvo até você confirmar no formulário.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não foi possível ler o rótulo.');
    } finally {
      setBusy(false);
    }
  }

  function useResult() {
    if (!preview) return;
    const values = [preview.calories, preview.proteins, preview.carbohydrates, preview.fats, preview.fiber];
    if (!hasCompleteNonNegativeNutrition(values)) {
      setNotice('Preencha todos os valores com números válidos e não negativos, ou descarte a leitura. Não vou transformar um valor ilegível em zero.');
      return;
    }
    if (typeof preview.name !== 'string' || !preview.name.trim()) {
      setNotice('Informe o nome do alimento reconhecido antes de transferir os valores.');
      return;
    }
    if (preview.basis !== '100g' && preview.basis !== '100ml') {
      setNotice('A base nutricional não foi reconhecida. Confira o rótulo antes de continuar.');
      return;
    }
    onPick({
      name: preview.brand && !preview.name.toLocaleLowerCase('pt-BR').includes(preview.brand.toLocaleLowerCase('pt-BR'))
        ? `${preview.name} (${preview.brand})`
        : preview.name,
      portion: `100 ${preview.basis === '100ml' ? 'ml' : 'g'} (rótulo; conferir)`,
      nutritionSource: 'user-reported',
      nutrients: {
        calories: preview.calories ?? 0,
        proteins: preview.proteins ?? 0,
        carbohydrates: preview.carbohydrates ?? 0,
        fats: preview.fats ?? 0,
        fiber: preview.fiber ?? 0,
      },
    });
    setPreview(null);
    setNotice('Valores transferidos para o formulário. Confira e ajuste os campos antes de salvar.');
  }

  return (
    <section className="ft-card" style={{ margin: '12px 0', padding: 14 }} aria-label="Leitura de tabela nutricional por foto">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span aria-hidden="true"><ScanText size={20} /></span>
        <div style={{ flex: 1 }}>
          <strong>Fotografar tabela nutricional</strong>
          <p className="ft-explainer" style={{ margin: '4px 0 0' }}>A IA tenta transcrever o rótulo; você revisa antes de registrar.</p>
        </div>
        <label className={buttonClass({ variant: 'outline' })} style={{ cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? <LoaderCircle size={16} /> : <Camera size={16} />}
          {busy ? 'Lendo…' : 'Enviar foto'}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={scan} disabled={busy} hidden />
        </label>
      </div>
      <p className="ft-explainer" style={{ marginTop: 8 }}>A imagem é enviada ao serviço de IA para leitura e não é salva pelo SISTCS Leve. Evite fotografar dados pessoais. Limite de 4 MB; usos de IA entram no limite diário de 30.</p>
      {notice && <p className="ft-feedback" role="status" aria-live="polite">{notice}</p>}
      {preview && (
        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          <div>
            <strong>{preview.name || 'Produto sem nome reconhecido'}</strong>
            {preview.brand && <p>{preview.brand}</p>}
            <small>Base: {preview.basis} · confiança {preview.confidence} · porção lida: {preview.servingSize || 'não identificada'}</small>
          </div>
          <div className="ft-form-grid">
            {([
              ['calories', 'Calorias (kcal)'],
              ['proteins', 'Proteínas (g)'],
              ['carbohydrates', 'Carboidratos (g)'],
              ['fats', 'Gorduras (g)'],
              ['fiber', 'Fibras (g)'],
            ] as const).map(([key, label]) => (
              <label key={key} className="ft-field">
                <span>{label}</span>
                <input className="input" type="number" min="0" step="any" value={preview[key] ?? ''} onChange={(event) => setPreview((current) => current ? { ...current, [key]: event.target.value === '' ? null : Number(event.target.value) } : current)} />
              </label>
            ))}
          </div>
          {preview.notes && <p className="ft-explainer">{preview.notes}</p>}
          <Button block onClick={useResult}>Revisar no formulário de alimento</Button>
        </div>
      )}
    </section>
  );
}
