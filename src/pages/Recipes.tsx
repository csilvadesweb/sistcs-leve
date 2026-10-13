import { useMemo, useState } from 'react';
import { CookingPot, Clock3, Search, Users, UtensilsCrossed, Plus, CheckCircle2 } from 'lucide-react';
import { useAppData } from '../session';
import { createFoodEntry, type MealType } from '../data';
import { decimalText, todayInSaoPaulo } from '../ui';
import { filterRecipes, RECIPES, scaleRecipeNutrients, type Recipe, type RecipeCategory } from '../recipes';

const categories: Array<RecipeCategory | 'Todas'> = ['Todas', 'Café da manhã', 'Almoço e jantar', 'Lanches', 'Vegetariana'];
const meals: Array<{ value: MealType; label: string }> = [
  { value: 'breakfast', label: 'Café da manhã' },
  { value: 'lunch', label: 'Almoço' },
  { value: 'snack', label: 'Lanche' },
  { value: 'dinner', label: 'Jantar' },
  { value: 'other', label: 'Outros' },
];

export function Recipes() {
  const { reload } = useAppData();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<RecipeCategory | 'Todas'>('Todas');
  const [meal, setMeal] = useState<MealType>('lunch');
  const [servings, setServings] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; message: string; error?: boolean } | null>(null);
  const recipes = useMemo(() => filterRecipes(RECIPES, query, category), [query, category]);

  async function addToDiary(recipe: Recipe) {
    const amount = servings[recipe.id] ?? 1;
    const nutrients = scaleRecipeNutrients(recipe.nutrientsPerServing, amount);
    setBusyId(recipe.id);
    setFeedback(null);
    try {
      await createFoodEntry({
        date: todayInSaoPaulo(),
        meal,
        name: recipe.name,
        portion: '1 porção (receita; valores estimados)',
        quantity: amount,
        nutrientsPerPortion: recipe.nutrientsPerServing,
        nutritionSource: 'user-estimated',
      });
      await reload();
      setFeedback({ id: recipe.id, message: `${decimalText(nutrients.calories)} kcal estimadas adicionadas ao diário.` });
    } catch (error) {
      setFeedback({ id: recipe.id, message: error instanceof Error ? error.message : 'Não foi possível adicionar ao diário.', error: true });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="ft-page page-enter recipes-page">
      <header className="ft-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" />IDEIAS PARA SUA ROTINA</p>
          <h1 className="serif-display">Receitas</h1>
          <p>Descubra refeições práticas e registre porções no seu diário alimentar.</p>
        </div>
        <div className="ft-heading-icon" aria-hidden="true"><CookingPot size={29} /></div>
      </header>

      <section className="recipes-intro">
        <div className="recipes-intro-icon"><UtensilsCrossed size={22} /></div>
        <div><strong>Comida de verdade, do seu jeito</strong><p>Receitas iniciais com ingredientes comuns no Brasil. Os valores nutricionais são estimativas por porção.</p></div>
      </section>

      <div className="recipes-controls">
        <label className="recipes-search">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">Buscar receitas ou ingredientes</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar receita ou ingrediente…" />
        </label>
        <label className="recipes-meal">Adicionar ao diário como
          <select value={meal} onChange={(event) => setMeal(event.target.value as MealType)}>
            {meals.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </div>

      <div className="recipes-categories" aria-label="Filtrar receitas por categoria">
        {categories.map((item) => <button key={item} type="button" className={category === item ? 'is-active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
      </div>

      <div className="recipes-results" role="status">{recipes.length} {recipes.length === 1 ? 'receita encontrada' : 'receitas encontradas'}</div>
      {recipes.length ? <div className="recipes-grid">
        {recipes.map((recipe) => {
          const amount = servings[recipe.id] ?? 1;
          const nutrients = scaleRecipeNutrients(recipe.nutrientsPerServing, amount);
          const isExpanded = expanded === recipe.id;
          return <article className="recipe-card" key={recipe.id}>
            <div className="recipe-card-top"><span className="recipe-category">{recipe.category}</span><span className="recipe-time"><Clock3 size={14} /> {recipe.minutes} min</span></div>
            <h2>{recipe.name}</h2>
            <p className="recipe-description">{recipe.description}</p>
            <div className="recipe-nutrients">
              <div><strong>{decimalText(nutrients.calories)}</strong><span>kcal</span></div>
              <div><strong>{decimalText(nutrients.proteins)} g</strong><span>Proteínas</span></div>
              <div><strong>{decimalText(nutrients.carbohydrates)} g</strong><span>Carboidratos</span></div>
              <div><strong>{decimalText(nutrients.fats)} g</strong><span>Gorduras</span></div>
            </div>
            <label className="recipe-portions"><Users size={16} /> Porções
              <input type="number" min="0.25" max="20" step="0.25" value={amount} onChange={(event) => setServings((current) => ({ ...current, [recipe.id]: Math.min(20, Math.max(0.25, Number(event.target.value) || 0.25)) }))} />
            </label>
            <button className="recipe-details-button" type="button" aria-expanded={isExpanded} onClick={() => setExpanded(isExpanded ? null : recipe.id)}>{isExpanded ? 'Ocultar preparo' : 'Ver ingredientes e preparo'}</button>
            {isExpanded && <div className="recipe-details">
              <h3>Ingredientes</h3><ul>{recipe.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul>
              <h3>Modo de preparo</h3><ol>{recipe.steps.map((step) => <li key={step}>{step}</li>)}</ol>
              <p className="recipe-nutrition-note">{recipe.nutritionNote}</p>
              <p className="recipe-fiber">Fibras: {decimalText(nutrients.fiber)} g por quantidade selecionada.</p>
            </div>}
            <button className="btn recipe-add-button" type="button" disabled={busyId !== null} onClick={() => void addToDiary(recipe)}>
              {feedback?.id === recipe.id && !feedback.error ? <CheckCircle2 size={17} /> : <Plus size={17} />}
              {busyId === recipe.id ? 'Adicionando…' : 'Adicionar ao diário'}
            </button>
            {feedback?.id === recipe.id && <p className={feedback.error ? 'ft-feedback ft-feedback-error' : 'ft-feedback recipe-feedback'} role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}
          </article>;
        })}
      </div> : <section className="ft-card recipes-empty"><CookingPot size={26} /><h2>Nenhuma receita encontrada</h2><p>Tente outro nome ou selecione “Todas”.</p></section>}
    </div>
  );
}
