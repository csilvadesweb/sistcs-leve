import { useState, type ChangeEvent } from 'react';
import { Camera, ScanLine } from 'lucide-react';
import { supabase } from './supabase';
import type { PickedFood } from './foodsearch';
import { normalizeMealPhotoEstimates, type MealPhotoEstimate } from './photo-nutrition';



export function MealPhotoScanner({ onPick }: { onPick: (food: PickedFood) => void }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [items, setItems] = useState<MealPhotoEstimate[]>([]);

  async function analyze(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setNotice('');
    setItems([]);
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
      if (!token) throw new Error('Entre na sua conta para analisar o prato.');
      const response = await fetch('/api/ai/meal-photo', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ mimeType: file.type, imageBase64 }),
      });
      const body = await response.json() as { items?: MealPhotoEstimate[]; error?: string };
      if (!response.ok) throw new Error(body.error || 'Não foi possível analisar a foto.');
      const valid = normalizeMealPhotoEstimates(body.items);
      setItems(valid);
      setNotice(valid.length ? 'Estimativas geradas. Escolha um item e revise os valores antes de salvar.' : 'Não consegui identificar itens com confiança suficiente. Tente outra foto ou use a busca.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não foi possível analisar a foto.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ft-card" style={{ margin: '12px 0', padding: 14 }} aria-label="Estimativa de alimentos por foto do prato">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span aria-hidden="true"><ScanLine size={20} /></span>
        <div style={{ flex: 1 }}>
          <strong>Identificar alimentos pela foto do prato</strong>
          <p className="ft-explainer" style={{ margin: '4px 0 0' }}>A IA sugere alimentos e porções aproximadas; você confirma cada item.</p>
        </div>
        <label className="button button-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: busy ? 'wait' : 'pointer' }}>
          <Camera size={16} />{busy ? 'Analisando…' : 'Foto do prato'}
          <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={analyze} disabled={busy} hidden />
        </label>
      </div>
      <p className="ft-explainer" style={{ marginTop: 8 }}>A foto é enviada ao serviço de IA e não é salva pelo SISTCS Leve. As calorias são estimativas, não medições; confirme porção e nutrientes no formulário. Limite de 4 MB e até 30 usos de IA por dia.</p>
      {notice && <p className="ft-feedback" role="status" aria-live="polite">{notice}</p>}
      {items.length > 0 && (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {items.map((item, index) => (
            <article key={`${item.name}-${index}`} style={{ border: '1px solid var(--border, #ddd)', borderRadius: 12, padding: 12 }}>
              <strong>{item.name}</strong>
              <p className="ft-explainer" style={{ margin: '4px 0' }}>~{Math.round(item.grams)} g · {Math.round(item.calories)} kcal · proteína {Math.round(item.proteins * 10) / 10} g · confiança {item.confidence}</p>
              <button type="button" className="button button-outline" onClick={() => {
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
                setNotice(`“${item.name}” foi transferido ao formulário. Confira e ajuste antes de salvar.`);
              }}>Revisar no formulário</button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
