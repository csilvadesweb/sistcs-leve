import { useEffect, useMemo, useState } from 'react';
import { CookingPot, Clock3, Search, Users, UtensilsCrossed, Plus, CheckCircle2, Star, Download } from 'lucide-react';
import { useAppData } from '../session';
import { createFoodEntry, type MealType } from '../data';
import { decimalText, todayInSaoPaulo } from '../ui';
import { filterRecipes, RECIPES, scaleRecipeNutrients, type Recipe, type RecipeFilter } from '../recipes';
import { buildShoppingList, resolvePlannedMeals, validatePlannedMeals, WEEK_DAYS, type PlannedMeal } from '../meal-plan';
import { toggleFavoriteId, validateFavoriteIds } from '../recipe-favorites';
import { downloadShoppingListPdf } from '../shopping-list-pdf';

const MEAL_LABELS: Record<MealType, string> = { breakfast: 'Café da manhã', lunch: 'Almoço', snack: 'Lanche', dinner: 'Jantar', other: 'Outros' };
const categories: RecipeFilter[] = ['Fitness', 'Brasileira', 'Todas', 'Café da manhã', 'Almoço e jantar', 'Lanches', 'Vegetariana'];
const meals: Array<{ value: MealType; label: string }> = [
  { value: 'breakfast', label: 'Café da manhã' },
  { value: 'lunch', label: 'Almoço' },
  { value: 'snack', label: 'Lanche' },
  { value: 'dinner', label: 'Jantar' },
  { value: 'other', label: 'Outros' },
];

const PAGE_SIZE = 24;

export function Recipes() {
  const { reload, user } = useAppData();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<RecipeFilter>('Todas');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(`sistcs-leve-recipe-favorites-v1:${user.id}`);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return validateFavoriteIds(parsed, RECIPES.map((recipe) => recipe.id));
    } catch { return []; }
  });
  const [meal, setMeal] = useState<MealType>('lunch');
  const [servings, setServings] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; message: string; error?: boolean } | null>(null);
  const [planDay, setPlanDay] = useState<string>(WEEK_DAYS[0]);
  const [planMeal, setPlanMeal] = useState<MealType>('lunch');
  const [planRecipeQuery, setPlanRecipeQuery] = useState('');
  const [planRecipeId, setPlanRecipeId] = useState('');
  const [planItems, setPlanItems] = useState<PlannedMeal[]>(() => {
    try {
      const raw = window.localStorage.getItem(`sistcs-leve-meal-plan-v1:${user.id}`);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return validatePlannedMeals(parsed, RECIPES);
    } catch {
      return [];
    }
  });
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [shoppingPdfBusy, setShoppingPdfBusy] = useState(false);
  const [shoppingPdfError, setShoppingPdfError] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  useEffect(() => {
    try { window.localStorage.setItem(`sistcs-leve-meal-plan-v1:${user.id}`, JSON.stringify(planItems)); } catch { /* storage unavailable: planner remains usable for this session */ }
  }, [planItems, user.id]);
  useEffect(() => {
    try { window.localStorage.setItem(`sistcs-leve-recipe-favorites-v1:${user.id}`, JSON.stringify(favorites)); } catch { /* favorites remain available for this session */ }
  }, [favorites, user.id]);
  const recipes = useMemo(() => filterRecipes(RECIPES, query, category).filter((recipe) => !favoritesOnly || favorites.includes(recipe.id)), [query, category, favoritesOnly, favorites]);

  useEffect(() => { setVisible(PAGE_SIZE); }, [query, category, favoritesOnly]);

  function toggleFavorite(recipeId: string) {
    setFavorites((current) => toggleFavoriteId(current, recipeId, RECIPES.map((recipe) => recipe.id)));
  }

  function addToPlan(recipe: Recipe) {
    setPlanItems((items) => [...items, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      day: planDay,
      meal: planMeal,
      recipeId: recipe.id,
    }]);
    setShoppingOpen(false);
    setFeedback({ id: recipe.id, message: `Adicionada ao planejamento: ${planDay}, ${MEAL_LABELS[planMeal]}.` });
  }

  const planRecipeOptions = useMemo(
    () => filterRecipes(RECIPES, planRecipeQuery, 'Todas').slice(0, 50),
    [planRecipeQuery],
  );

  function addSelectedRecipeToPlan() {
    const recipe = RECIPES.find((candidate) => candidate.id === planRecipeId);
    if (!recipe) return;
    addToPlan(recipe);
    setPlanRecipeQuery('');
    setPlanRecipeId('');
  }

  const plannedWithRecipes = resolvePlannedMeals(planItems, RECIPES);
  const shoppingIngredients = buildShoppingList(plannedWithRecipes);

  async function downloadShoppingList() {
    if (shoppingPdfBusy || !shoppingIngredients.length) return;
    setShoppingPdfBusy(true);
    setShoppingPdfError(null);
    try {
      await downloadShoppingListPdf(shoppingIngredients, plannedWithRecipes.length);
    } catch (error) {
      setShoppingPdfError(error instanceof Error ? error.message : 'Não foi possível baixar o PDF. Tente novamente.');
    } finally {
      setShoppingPdfBusy(false);
    }
  }

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
        <div><strong>Comida de verdade, do seu jeito</strong><p>Receitas práticas para seus objetivos. Os valores nutricionais são estimativas por porção.</p><p className="recipe-nutrition-note">{RECIPES.length} receitas. Favoritas e planejamento semanal ficam salvos apenas neste aparelho.</p></div>
      </section>

      <section className="meal-planner-panel" aria-labelledby="meal-planner-title">
        <div className="meal-planner-heading">
          <div><p className="eyebrow">ORGANIZE SUA SEMANA</p><h2 id="meal-planner-title">Planejador de refeições</h2><p>Escolha o dia e a refeição; depois adicione qualquer receita ao planejamento.</p></div>
          <span className="meal-plan-count">{planItems.length} {planItems.length === 1 ? 'refeição' : 'refeições'}</span>
        </div>
        <div className="meal-plan-choices">
          <label>Dia
            <select value={planDay} onChange={(event) => setPlanDay(event.target.value)}>
              {WEEK_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
          </label>
          <label>Refeição
            <select value={planMeal} onChange={(event) => setPlanMeal(event.target.value as MealType)}>
              {meals.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>
        <div className="meal-plan-add-recipe">
          <div className="meal-plan-recipe-fields">
            <label htmlFor="meal-plan-recipe-search">Buscar receita ou ingrediente
              <input
                id="meal-plan-recipe-search"
                type="search"
                value={planRecipeQuery}
                onChange={(event) => { setPlanRecipeQuery(event.target.value); setPlanRecipeId(''); }}
                placeholder="Ex.: omelete, frango, aveia…"
                autoComplete="off"
              />
            </label>
            <label htmlFor="meal-plan-recipe-select">Receita
              <select id="meal-plan-recipe-select" value={planRecipeId} onChange={(event) => setPlanRecipeId(event.target.value)}>
                <option value="">Selecione uma receita</option>
                {planRecipeOptions.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}
              </select>
            </label>
          </div>
          <button className="recipe-plan-button" type="button" disabled={!planRecipeId} onClick={addSelectedRecipeToPlan}>
            <Plus size={16} aria-hidden="true" /> Adicionar ao dia e refeição escolhidos
          </button>
        </div>
        {plannedWithRecipes.length ? <div className="meal-plan-list">
          {WEEK_DAYS.filter((day) => plannedWithRecipes.some((item) => item.day === day)).map((day) => <section className="meal-plan-day" key={day}>
            <h3>{day}</h3>
            {plannedWithRecipes.filter((item) => item.day === day).map((item) => <div className="meal-plan-item" key={item.id}>
              <div><strong>{item.recipe.name}</strong><span>{MEAL_LABELS[item.meal]} · {item.recipe.nutrientsPerServing.calories} kcal estimadas/porção</span></div>
              <button type="button" className="meal-plan-remove" aria-label={`Remover ${item.recipe.name} de ${day}`} onClick={() => { setPlanItems((items) => items.filter((entry) => entry.id !== item.id)); setShoppingOpen(false); }}>Remover</button>
            </div>)}
          </section>)}
        </div> : <p className="meal-plan-empty">Seu planejamento está vazio. Escolha o dia e a refeição, busque uma receita no campo acima e toque em “Adicionar ao dia e refeição escolhidos”.</p>}
        <div className="shopping-list-actions">
          <button className="recipe-details-button" type="button" disabled={!plannedWithRecipes.length} aria-expanded={shoppingOpen} onClick={() => setShoppingOpen((open) => !open)}>{shoppingOpen ? 'Ocultar lista de compras' : 'Gerar lista de compras'}</button>
          {planItems.length > 0 && <button type="button" className="meal-plan-clear" onClick={() => { setPlanItems([]); setShoppingOpen(false); }}>Limpar semana</button>}
        </div>
        {shoppingOpen && plannedWithRecipes.length > 0 && <div className="shopping-list" aria-live="polite">
          <h3>Lista de compras</h3>
          <p>Ingredientes das {plannedWithRecipes.length} refeições planejadas. Ingredientes com a mesma descrição foram agrupados; confira as quantidades para o número de porções desejado.</p>
          <ul>{shoppingIngredients.map((entry) => <li key={entry.ingredient}><span>{entry.ingredient}</span>{entry.count > 1 && <small>usado em {entry.count} receitas</small>}</li>)}</ul>
          <button type="button" className="meal-plan-print" onClick={() => void downloadShoppingList()} disabled={shoppingPdfBusy || !shoppingIngredients.length}>
            {shoppingPdfBusy ? <Clock3 size={17} aria-hidden="true" /> : <Download size={17} aria-hidden="true" />}
            {shoppingPdfBusy ? 'Preparando PDF…' : 'Baixar lista em PDF'}
          </button>
          {shoppingPdfError && <p className="ft-feedback ft-feedback-error" role="alert">{shoppingPdfError}</p>}
        </div>}
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
        {categories.map((item) => <button key={item} type="button" className={category === item && !favoritesOnly ? 'is-active' : ''} aria-pressed={category === item && !favoritesOnly} onClick={() => { setCategory(item); setFavoritesOnly(false); }}>{item}</button>)}
        <button type="button" className={favoritesOnly ? 'is-active favorites-filter' : 'favorites-filter'} aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly((value) => !value)}><Star size={15} fill={favoritesOnly ? 'currentColor' : 'none'} /> Favoritas ({favorites.length})</button>
      </div>

      <div className="recipes-results" role="status">{recipes.length} {recipes.length === 1 ? 'receita encontrada' : 'receitas encontradas'}</div>
      {recipes.length ? <><div className="recipes-grid">
        {recipes.slice(0, visible).map((recipe) => {
          const amount = servings[recipe.id] ?? 1;
          const nutrients = scaleRecipeNutrients(recipe.nutrientsPerServing, amount);
          const isExpanded = expanded === recipe.id;
          return <article className="recipe-card" key={recipe.id}>
            <div className="recipe-card-top"><span className="recipe-category">{recipe.category}</span><div className="recipe-card-meta"><span className="recipe-time"><Clock3 size={14} /> {recipe.minutes} min</span><button type="button" className={`recipe-favorite-button${favorites.includes(recipe.id) ? ' is-favorite' : ''}`} aria-label={favorites.includes(recipe.id) ? `Remover ${recipe.name} das favoritas` : `Adicionar ${recipe.name} às favoritas`} aria-pressed={favorites.includes(recipe.id)} onClick={() => toggleFavorite(recipe.id)}><Star size={18} fill={favorites.includes(recipe.id) ? 'currentColor' : 'none'} /></button></div></div>
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
            <button className="recipe-plan-button" type="button" onClick={() => addToPlan(recipe)}>Adicionar ao planejamento semanal</button>
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
      </div>
      {recipes.length > visible && <div className="recipes-more"><button type="button" className="btn" onClick={() => setVisible((v) => v + PAGE_SIZE)}>Mostrar mais receitas ({recipes.length - visible} restantes)</button></div>}
      </> : <section className="ft-card recipes-empty"><CookingPot size={26} /><h2>{favoritesOnly ? 'Você ainda não tem receitas favoritas' : 'Nenhuma receita encontrada'}</h2><p>{favoritesOnly ? 'Toque na estrela de uma receita para salvá-la aqui.' : 'Tente outro nome ou selecione “Todas”.'}</p></section>}
    </div>
  );
}
