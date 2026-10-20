import { useState, type ChangeEvent } from 'react';
import { supabase } from './supabase';
import { Button } from './ui';
import type { PickedFood } from './foodsearch';
import { imageProblem, readImageAsBase64 } from './photo-upload';
import { normalizeMealPhotoEstimates, type MealPhotoEstimate } from './photo-nutrition';

/** Foto do prato: a IA sugere alimentos e porções; a pessoa escolhe cada item e revisa. */
export function useMealPhoto(onPick: (food: PickedFood) => void) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [items, setItems] = useState<MealPhotoEstimate[]>([]);

  async function analyze(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setNotice('');
    setItems([]);
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
      if (!token) throw new Error('Entre na sua conta para analisar o prato.');
      const response = await fetch('/api/ai/meal-photo', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ mimeType: file.type, imageBase64 }),
      });
      const body = await response.json() as { items?: unknown; error?: string };
      if (!response.ok) throw new Error(body.error || 'Não foi possível analisar a foto.');
      const valid = normalizeMealPhotoEstimates(body.items);
      setItems(valid);
      setNotice(valid.length ? 'Estimativas geradas. Escolha um item e revise os valores antes de salvar.' : 'Não consegui identificar itens com confiança suficiente. Tente outra foto ou digite o alimento.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não foi possível analisar a foto.');
    } finally {
      setBusy(false);
    }
  }

  function use(item: MealPhotoEstimate) {
    onPick({
      name: item.name,
      portion: `~${Math.round(item.grams)} g (estimativa por foto)`,
      nutritionSource: 'user-estimated',
      nutrients: {
        calories: item.calories,
        proteins: item.proteins,
        carbohydrates: item.carbohydrates,
        fats: item.fats,
        fiber: item.fiber,
      },
    });
    setNotice(`“${item.name}” foi para o formulário. Confira e ajuste antes de salvar.`);
  }

  return { busy, notice, items, analyze, use };
}

export type MealPhotoState = ReturnType<typeof useMealPhoto>;

/** Itens reconhecidos, com as calorias de cada um e a soma do prato. */
export function MealPhotoResults({ photo }: { photo: MealPhotoState }) {
  if (photo.items.length === 0) return null;
  const total = photo.items.reduce((sum, item) => sum + item.calories, 0);
  return (
    <div className="fs-photo-results" aria-label="Alimentos reconhecidos na foto">
      <p className="fs-photo-total"><strong>≈ {Math.round(total)} kcal</strong> no prato todo <small>(soma estimada dos itens)</small></p>
      {photo.items.map((item, index) => (
        <article key={`${item.name}-${index}`} className="fs-photo-item">
          <div>
            <strong>{item.name}</strong>
            <span>~{Math.round(item.grams)} g · <b>{Math.round(item.calories)} kcal</b> · proteína {Math.round(item.proteins * 10) / 10} g · confiança {item.confidence}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => photo.use(item)}>Usar</Button>
        </article>
      ))}
    </div>
  );
}
