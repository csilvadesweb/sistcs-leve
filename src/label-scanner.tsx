import { useState, type ChangeEvent } from 'react';
import { supabase } from './supabase';
import { Button } from './ui';
import type { PickedFood } from './foodsearch';
import { hasCompleteNonNegativeNutrition } from './photo-nutrition';
import { imageProblem, readImageAsBase64 } from './photo-upload';

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

/** Foto da tabela nutricional: a IA transcreve o rótulo; a pessoa revisa os números antes de usar. */
export function useLabelScan(onPick: (food: PickedFood) => void) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState<LabelResult | null>(null);

  async function scan(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setNotice('');
    setPreview(null);
    if (!file) return;
    const problem = imageProblem(file);
    if (problem) {
      setNotice(problem);
      return;
    }
    setBusy(true);
    try {
      const imageBase64 = await readImageAsBase64(file);
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

  return { busy, notice, preview, setPreview, scan, useResult };
}

export type LabelScanState = ReturnType<typeof useLabelScan>;

/** Leitura do rótulo, com os números editáveis. */
export function LabelResults({ label }: { label: LabelScanState }) {
  const { preview, setPreview, useResult } = label;
  if (!preview) return null;
  return (
    <div className="fs-label-results" aria-label="Valores lidos do rótulo">
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
        ] as const).map(([key, text]) => (
          <label key={key} className="ft-field">
            <span>{text}</span>
            <input className="input" type="number" min="0" step="any" value={preview[key] ?? ''} onChange={(event) => setPreview((current) => current ? { ...current, [key]: event.target.value === '' ? null : Number(event.target.value) } : current)} />
          </label>
        ))}
      </div>
      {preview.notes && <p className="ft-explainer">{preview.notes}</p>}
      <Button block onClick={useResult}>Usar estes valores</Button>
    </div>
  );
}
