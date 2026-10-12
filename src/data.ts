import { supabase } from './supabase';
import type { Activity, GoalType, MacroPreset, Sex } from './calc';

export type GoalKey = 'calories' | 'proteins' | 'carbohydrates' | 'fats' | 'fiber' | 'waterMl';
export type UserGoals = Record<GoalKey, number | null>;

export interface UserProfile {
  displayName: string;
  goals: UserGoals;
  cupVolumeMl: number | null;
  heightCm?: number | null;
  targetWeightKg?: number | null;
  targetDate?: string | null;
  // Personalização (todos opcionais)
  sex?: Sex | null;
  birthDate?: string | null;
  activity?: Activity | null;
  goalType?: GoalType | null;
  weeklyRateKg?: number | null;
  macroPreset?: MacroPreset;
  avatarPath?: string | null;
  navigationPreferences?: NavigationPreferences;
}

export interface NavigationPreferences {
  order: string[];
  labels: Record<string, string>;
}

export type PhotoKind = 'before' | 'progress' | 'after';
export interface ProgressPhoto {
  id: string;
  date: string;
  kind: PhotoKind;
  path: string;
  note: string;
}

export interface FastingEntry {
  id: string;
  startedAt: string; // ISO
  endedAt: string | null; // ISO; null = em andamento
  targetHours: number;
  note: string;
}

export interface WeightEntryInput {
  date: string;
  weightKg: number;
  note: string;
}
export interface WeightEntry extends WeightEntryInput {
  id: string;
}

export interface MedicationInput {
  name: string;
  dose: string;
  times: string[]; // 'HH:MM'
  notes: string;
  active: boolean;
}
export interface Medication extends MedicationInput {
  id: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  date: string;
  time: string;
}

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'other';
export type NutritionSource = 'user-reported' | 'user-estimated';

export interface FoodNutrients {
  calories: number;
  proteins: number;
  carbohydrates: number;
  fats: number;
  fiber: number;
}
export type FoodNutrientKey = keyof FoodNutrients;

export interface FoodEntryInput {
  date: string;
  meal: MealType;
  name: string;
  portion: string;
  quantity: number;
  nutrientsPerPortion: FoodNutrients;
  nutritionSource: NutritionSource;
}
export interface FoodEntry extends FoodEntryInput {
  id: string;
}

export interface FavoriteFood {
  id: string;
  sourceEntryId: string | null;
  name: string;
  portion: string;
  nutrientsPerPortion: FoodNutrients;
  nutritionSource: NutritionSource;
}

export interface WaterEntryInput {
  date: string;
  volumeMl: number;
}
export interface WaterEntry extends WaterEntryInput {
  id: string;
}

export interface AppData {
  profile: UserProfile | null;
  foodEntries: FoodEntry[];
  favoriteFoods: FavoriteFood[];
  waterEntries: WaterEntry[];
  weightEntries: WeightEntry[];
  medications: Medication[];
  medicationLogs: MedicationLog[];
  progressPhotos: ProgressPhoto[];
  fastingEntries: FastingEntry[];
}

export const EMPTY_DATA: AppData = {
  profile: null,
  foodEntries: [],
  favoriteFoods: [],
  waterEntries: [],
  weightEntries: [],
  medications: [],
  medicationLogs: [],
  progressPhotos: [],
  fastingEntries: [],
};

/* ---------- cálculos ---------- */

const nutrientKeys: FoodNutrientKey[] = ['calories', 'proteins', 'carbohydrates', 'fats', 'fiber'];

export function calculateFoodEntryNutrient(
  entry: Pick<FoodEntry, 'quantity' | 'nutrientsPerPortion'>,
  nutrient: FoodNutrientKey,
) {
  return entry.nutrientsPerPortion[nutrient] * entry.quantity;
}

export function calculateFoodNutrientTotals(
  entries: Array<Pick<FoodEntry, 'quantity' | 'nutrientsPerPortion'>>,
): FoodNutrients {
  return entries.reduce<FoodNutrients>(
    (total, entry) => {
      for (const nutrient of nutrientKeys) total[nutrient] += calculateFoodEntryNutrient(entry, nutrient);
      return total;
    },
    { calories: 0, proteins: 0, carbohydrates: 0, fats: 0, fiber: 0 },
  );
}

/* ---------- mapeamento linhas <-> tipos do app ---------- */

type Row = Record<string, any>;
const num = (v: unknown) => Number(v);
const DEFAULT_NAVIGATION_ORDER = ['/', '/alimentacao', '/registros', '/jejum', '/medicamentos', '/relatorios', '/perfil'];

export function normalizeNavigationPreferences(value: unknown): NavigationPreferences {
  const input = value && typeof value === 'object' ? value as Partial<NavigationPreferences> : {};
  const requestedOrder = Array.isArray(input.order) ? input.order.filter((item): item is string => typeof item === 'string') : [];
  const order = [...new Set([...requestedOrder.filter((item) => DEFAULT_NAVIGATION_ORDER.includes(item)), ...DEFAULT_NAVIGATION_ORDER])];
  const labels: Record<string, string> = {};
  if (input.labels && typeof input.labels === 'object') {
    for (const [key, label] of Object.entries(input.labels)) {
      if (DEFAULT_NAVIGATION_ORDER.includes(key) && typeof label === 'string' && label.trim()) labels[key] = label.trim().slice(0, 30);
    }
  }
  return { order, labels };
}
const numOrNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function profileFromRow(r: Row): UserProfile {
  return {
    displayName: r.display_name ?? '',
    goals: {
      calories: numOrNull(r.goal_calories),
      proteins: numOrNull(r.goal_proteins),
      carbohydrates: numOrNull(r.goal_carbohydrates),
      fats: numOrNull(r.goal_fats),
      fiber: numOrNull(r.goal_fiber),
      waterMl: numOrNull(r.goal_water_ml),
    },
    cupVolumeMl: numOrNull(r.cup_volume_ml),
    heightCm: numOrNull(r.height_cm),
    targetWeightKg: numOrNull(r.target_weight_kg),
    targetDate: r.target_date ?? null,
    sex: r.sex ?? null,
    birthDate: r.birth_date ?? null,
    activity: r.activity_level ?? null,
    goalType: r.goal_type ?? null,
    weeklyRateKg: numOrNull(r.weekly_rate_kg),
    macroPreset: (r.macro_preset ?? 'balanced') as MacroPreset,
    avatarPath: r.avatar_path ?? null,
    navigationPreferences: normalizeNavigationPreferences(r.navigation_preferences),
  };
}

function photoFromRow(r: Row): ProgressPhoto {
  return { id: r.id, date: r.taken_on, kind: r.kind, path: r.path, note: r.note ?? '' };
}

function fastingFromRow(r: Row): FastingEntry {
  return {
    id: r.id,
    startedAt: r.started_at,
    endedAt: r.ended_at ?? null,
    targetHours: num(r.target_hours),
    note: r.note ?? '',
  };
}

function nutrientsFromRow(r: Row): FoodNutrients {
  return {
    calories: num(r.calories),
    proteins: num(r.proteins),
    carbohydrates: num(r.carbohydrates),
    fats: num(r.fats),
    fiber: num(r.fiber),
  };
}

function nutrientsToRow(n: FoodNutrients) {
  return {
    calories: n.calories,
    proteins: n.proteins,
    carbohydrates: n.carbohydrates,
    fats: n.fats,
    fiber: n.fiber,
  };
}

function foodFromRow(r: Row): FoodEntry {
  return {
    id: r.id,
    date: r.entry_date,
    meal: r.meal,
    name: r.name,
    portion: r.portion,
    quantity: num(r.quantity),
    nutrientsPerPortion: nutrientsFromRow(r),
    nutritionSource: r.nutrition_source,
  };
}

function foodToRow(i: FoodEntryInput) {
  return {
    entry_date: i.date,
    meal: i.meal,
    name: i.name,
    portion: i.portion,
    quantity: i.quantity,
    ...nutrientsToRow(i.nutrientsPerPortion),
    nutrition_source: i.nutritionSource,
  };
}

function favoriteFromRow(r: Row): FavoriteFood {
  return {
    id: r.id,
    sourceEntryId: r.source_entry_id ?? null,
    name: r.name,
    portion: r.portion,
    nutrientsPerPortion: nutrientsFromRow(r),
    nutritionSource: r.nutrition_source,
  };
}

function waterFromRow(r: Row): WaterEntry {
  return { id: r.id, date: r.entry_date, volumeMl: num(r.volume_ml) };
}

function weightFromRow(r: Row): WeightEntry {
  return { id: r.id, date: r.entry_date, weightKg: num(r.weight_kg), note: r.note ?? '' };
}

function medicationFromRow(r: Row): Medication {
  return {
    id: r.id,
    name: r.name,
    dose: r.dose ?? '',
    times: Array.isArray(r.times) ? [...r.times].sort() : [],
    notes: r.notes ?? '',
    active: Boolean(r.active),
  };
}

function medicationLogFromRow(r: Row): MedicationLog {
  return { id: r.id, medicationId: r.medication_id, date: r.log_date, time: r.scheduled_time ?? '' };
}

function fail(error: { message: string } | null, fallback: string): asserts error is null {
  if (error) {
    console.error(error);
    throw new Error(`${fallback} (${error.message})`);
  }
}

/* ---------- leitura ---------- */

export async function loadAll(userId: string): Promise<AppData> {
  const [profile, foods, favorites, water, weights, meds, medLogs, photos, fasts] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('food_entries').select('*').order('created_at', { ascending: false }),
    supabase.from('favorite_foods').select('*').order('created_at', { ascending: false }),
    supabase.from('water_entries').select('*').order('created_at', { ascending: false }),
    supabase.from('weight_entries').select('*').order('entry_date', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('medications').select('*').order('created_at', { ascending: true }),
    supabase.from('medication_logs').select('*').order('log_date', { ascending: false }),
    supabase.from('progress_photos').select('*').order('taken_on', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('fasting_entries').select('*').order('started_at', { ascending: false }).limit(200),
  ]);
  fail(profile.error, 'Não foi possível carregar o perfil.');
  fail(foods.error, 'Não foi possível carregar os alimentos.');
  fail(favorites.error, 'Não foi possível carregar os favoritos.');
  fail(water.error, 'Não foi possível carregar os registros de água.');
  fail(weights.error, 'Não foi possível carregar os registros de peso.');
  fail(meds.error, 'Não foi possível carregar os medicamentos.');
  fail(medLogs.error, 'Não foi possível carregar o uso dos medicamentos.');
  fail(photos.error, 'Não foi possível carregar as fotos.');
  fail(fasts.error, 'Não foi possível carregar os jejuns.');
  return {
    profile: profile.data ? profileFromRow(profile.data) : null,
    foodEntries: (foods.data ?? []).map(foodFromRow),
    favoriteFoods: (favorites.data ?? []).map(favoriteFromRow),
    waterEntries: (water.data ?? []).map(waterFromRow),
    weightEntries: (weights.data ?? []).map(weightFromRow),
    medications: (meds.data ?? []).map(medicationFromRow),
    medicationLogs: (medLogs.data ?? []).map(medicationLogFromRow),
    progressPhotos: (photos.data ?? []).map(photoFromRow),
    fastingEntries: (fasts.data ?? []).map(fastingFromRow),
  };
}

/* ---------- perfil ---------- */

export async function saveNavigationPreferences(userId: string, preferences: NavigationPreferences) {
  const safePreferences = normalizeNavigationPreferences(preferences);
  const { error } = await supabase.from('profiles').upsert(
    { user_id: userId, navigation_preferences: safePreferences },
    { onConflict: 'user_id' },
  );
  fail(error, 'Não foi possível salvar a personalização do menu.');
}

export async function saveUserProfile(userId: string, p: UserProfile) {
  const { error } = await supabase.from('profiles').upsert(
    {
      user_id: userId,
      display_name: p.displayName,
      goal_calories: p.goals.calories,
      goal_proteins: p.goals.proteins,
      goal_carbohydrates: p.goals.carbohydrates,
      goal_fats: p.goals.fats,
      goal_fiber: p.goals.fiber,
      goal_water_ml: p.goals.waterMl,
      cup_volume_ml: p.cupVolumeMl,
      height_cm: p.heightCm ?? null,
      target_weight_kg: p.targetWeightKg ?? null,
      target_date: p.targetDate || null,
      sex: p.sex ?? null,
      birth_date: p.birthDate || null,
      activity_level: p.activity ?? null,
      goal_type: p.goalType ?? null,
      weekly_rate_kg: p.weeklyRateKg ?? null,
      macro_preset: p.macroPreset ?? 'balanced',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  fail(error, 'Não foi possível salvar o perfil.');
}

/* ---------- alimentos ---------- */

export async function createFoodEntry(input: FoodEntryInput): Promise<FoodEntry> {
  const { data, error } = await supabase.from('food_entries').insert(foodToRow(input)).select().single();
  fail(error, 'Não foi possível salvar o alimento.');
  return foodFromRow(data);
}

export async function updateFoodEntry(id: string, input: FoodEntryInput): Promise<FoodEntry> {
  const { data, error } = await supabase
    .from('food_entries')
    .update(foodToRow(input))
    .eq('id', id)
    .select()
    .single();
  fail(error, 'Não foi possível atualizar o alimento.');
  // Mantém os favoritos ligados a este lançamento sincronizados, como no app original.
  const fav = await supabase
    .from('favorite_foods')
    .update({
      name: input.name,
      portion: input.portion,
      ...nutrientsToRow(input.nutrientsPerPortion),
      nutrition_source: input.nutritionSource,
    })
    .eq('source_entry_id', id);
  fail(fav.error, 'O alimento foi atualizado, mas não foi possível atualizar o favorito.');
  return foodFromRow(data);
}

export async function deleteFoodEntry(id: string) {
  const { error } = await supabase.from('food_entries').delete().eq('id', id);
  fail(error, 'Não foi possível excluir o alimento.');
}

export async function saveFoodFavoriteFromEntry(entry: FoodEntry) {
  const { error } = await supabase.from('favorite_foods').insert({
    source_entry_id: entry.id,
    name: entry.name,
    portion: entry.portion,
    ...nutrientsToRow(entry.nutrientsPerPortion),
    nutrition_source: entry.nutritionSource,
  });
  fail(error, 'Não foi possível salvar o favorito.');
}

export async function deleteFoodFavorite(id: string) {
  const { error } = await supabase.from('favorite_foods').delete().eq('id', id);
  fail(error, 'Não foi possível remover o favorito.');
}

/* ---------- água ---------- */

export async function createWaterEntry(input: WaterEntryInput): Promise<WaterEntry> {
  const { data, error } = await supabase
    .from('water_entries')
    .insert({ entry_date: input.date, volume_ml: input.volumeMl })
    .select()
    .single();
  fail(error, 'Não foi possível registrar a água.');
  return waterFromRow(data);
}

export async function updateWaterEntry(id: string, input: WaterEntryInput): Promise<WaterEntry> {
  const { data, error } = await supabase
    .from('water_entries')
    .update({ entry_date: input.date, volume_ml: input.volumeMl })
    .eq('id', id)
    .select()
    .single();
  fail(error, 'Não foi possível atualizar o registro de água.');
  return waterFromRow(data);
}

export async function deleteWaterEntry(id: string) {
  const { error } = await supabase.from('water_entries').delete().eq('id', id);
  fail(error, 'Não foi possível excluir o registro de água.');
}

/* ---------- peso ---------- */

export async function createWeightEntry(input: WeightEntryInput): Promise<WeightEntry> {
  const { data, error } = await supabase
    .from('weight_entries')
    .insert({ entry_date: input.date, weight_kg: input.weightKg, note: input.note || null })
    .select()
    .single();
  fail(error, 'Não foi possível salvar o peso.');
  return weightFromRow(data);
}

export async function updateWeightEntry(id: string, input: WeightEntryInput): Promise<WeightEntry> {
  const { data, error } = await supabase
    .from('weight_entries')
    .update({ entry_date: input.date, weight_kg: input.weightKg, note: input.note || null })
    .eq('id', id)
    .select()
    .single();
  fail(error, 'Não foi possível atualizar o peso.');
  return weightFromRow(data);
}

export async function deleteWeightEntry(id: string) {
  const { error } = await supabase.from('weight_entries').delete().eq('id', id);
  fail(error, 'Não foi possível excluir o registro de peso.');
}

/* ---------- medicamentos ---------- */

function medicationToRow(i: MedicationInput) {
  return { name: i.name, dose: i.dose, times: i.times, notes: i.notes || null, active: i.active };
}

export async function createMedication(input: MedicationInput): Promise<Medication> {
  const { data, error } = await supabase.from('medications').insert(medicationToRow(input)).select().single();
  fail(error, 'Não foi possível salvar o medicamento.');
  return medicationFromRow(data);
}

export async function updateMedication(id: string, input: MedicationInput): Promise<Medication> {
  const { data, error } = await supabase
    .from('medications')
    .update(medicationToRow(input))
    .eq('id', id)
    .select()
    .single();
  fail(error, 'Não foi possível atualizar o medicamento.');
  return medicationFromRow(data);
}

export async function deleteMedication(id: string) {
  const { error } = await supabase.from('medications').delete().eq('id', id);
  fail(error, 'Não foi possível excluir o medicamento.');
}

/** Marca ou desmarca uma dose (medicamento + data + horário). */
export async function setMedicationTaken(medicationId: string, date: string, time: string, taken: boolean) {
  if (taken) {
    const { error } = await supabase
      .from('medication_logs')
      .upsert(
        { medication_id: medicationId, log_date: date, scheduled_time: time },
        { onConflict: 'medication_id,log_date,scheduled_time', ignoreDuplicates: true },
      );
    fail(error, 'Não foi possível registrar a dose.');
  } else {
    const { error } = await supabase
      .from('medication_logs')
      .delete()
      .eq('medication_id', medicationId)
      .eq('log_date', date)
      .eq('scheduled_time', time);
    fail(error, 'Não foi possível desmarcar a dose.');
  }
}

/* ---------- fotos (Storage privado) ---------- */

export async function signedPhotoUrl(bucket: 'avatars' | 'progress-photos', path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
}

async function uploadImage(bucket: 'avatars' | 'progress-photos', userId: string, blob: Blob): Promise<string> {
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  fail(error, 'Não foi possível enviar a imagem.');
  return path;
}

export async function setAvatar(userId: string, blob: Blob, previousPath: string | null) {
  const path = await uploadImage('avatars', userId, blob);
  const { error } = await supabase.from('profiles').upsert({ user_id: userId, avatar_path: path, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) {
    await supabase.storage.from('avatars').remove([path]);
    fail(error, 'Não foi possível salvar a foto de perfil.');
  }
  if (previousPath) await supabase.storage.from('avatars').remove([previousPath]);
}

export async function removeAvatar(userId: string, path: string) {
  const { error } = await supabase.from('profiles').update({ avatar_path: null }).eq('user_id', userId);
  fail(error, 'Não foi possível remover a foto de perfil.');
  await supabase.storage.from('avatars').remove([path]);
}

export async function addProgressPhoto(userId: string, blob: Blob, input: { date: string; kind: PhotoKind; note: string }) {
  const path = await uploadImage('progress-photos', userId, blob);
  const { error } = await supabase.from('progress_photos').insert({ taken_on: input.date, kind: input.kind, path, note: input.note || null });
  if (error) {
    await supabase.storage.from('progress-photos').remove([path]);
    fail(error, 'Não foi possível salvar a foto.');
  }
}

export async function deleteProgressPhoto(photo: ProgressPhoto) {
  const { error } = await supabase.from('progress_photos').delete().eq('id', photo.id);
  fail(error, 'Não foi possível excluir a foto.');
  await supabase.storage.from('progress-photos').remove([photo.path]);
}

/* ---------- jejum intermitente ---------- */

export async function startFast(targetHours: number, startedAt: Date = new Date()): Promise<FastingEntry> {
  const { data, error } = await supabase
    .from('fasting_entries')
    .insert({ started_at: startedAt.toISOString(), target_hours: targetHours })
    .select()
    .single();
  fail(error, 'Não foi possível iniciar o jejum. Se já houver um em andamento, encerre-o antes.');
  return fastingFromRow(data);
}

export async function endFast(id: string, endedAt: Date = new Date()) {
  const { error } = await supabase.from('fasting_entries').update({ ended_at: endedAt.toISOString() }).eq('id', id);
  fail(error, 'Não foi possível encerrar o jejum.');
}

export async function updateFastingStart(id: string, startedAt: Date) {
  const { error } = await supabase.from('fasting_entries').update({ started_at: startedAt.toISOString() }).eq('id', id);
  fail(error, 'Não foi possível ajustar o horário de início.');
}

export async function deleteFast(id: string) {
  const { error } = await supabase.from('fasting_entries').delete().eq('id', id);
  fail(error, 'Não foi possível excluir o jejum.');
}

export function fastHours(f: Pick<FastingEntry, 'startedAt' | 'endedAt'>, now: number = Date.now()): number {
  const end = f.endedAt ? Date.parse(f.endedAt) : now;
  return Math.max(0, (end - Date.parse(f.startedAt)) / 3600000);
}

/* ---------- datas e resumos ---------- */

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

/** Últimos `count` dias terminando em `end` (inclusive), do mais antigo ao mais recente. */
export function lastDays(end: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(end, i - (count - 1)));
}

/** Peso mais recente (por data) e o primeiro registro. */
export function weightSummary(entries: WeightEntry[]) {
  if (!entries.length) return { first: null, latest: null };
  const sorted = [...entries].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1));
  return { first: sorted[0], latest: sorted[sorted.length - 1] };
}

/* ---------- dados da conta ---------- */

export async function clearAllUserData(userId: string) {
  // Remove os arquivos de foto antes das linhas que apontam para eles.
  for (const bucket of ['avatars', 'progress-photos']) {
    const { data: files } = await supabase.storage.from(bucket).list(userId, { limit: 1000 });
    if (files?.length) await supabase.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`));
  }
  const tables = [
    'fasting_entries',
    'progress_photos',
    'medication_logs',
    'medications',
    'weight_entries',
    'favorite_foods',
    'food_entries',
    'water_entries',
    'profiles',
  ];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId);
    fail(error, 'Não foi possível apagar os dados.');
  }
}

export function createDataExport(data: AppData) {
  return {
    app: 'SISTCS Leve',
    formatVersion: 3,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/* ---------- importação dos dados antigos do navegador (localStorage) ---------- */

const LEGACY_KEY = 'meu-progresso-total:local-data:v1';

interface LegacyData {
  profile?: UserProfile | null;
  foodEntries?: FoodEntry[];
  favoriteFoods?: FavoriteFood[];
  waterEntries?: WaterEntry[];
}

export function readLegacyData(): LegacyData | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LegacyData;
    const has =
      parsed.profile ||
      parsed.foodEntries?.length ||
      parsed.favoriteFoods?.length ||
      parsed.waterEntries?.length;
    return has ? parsed : null;
  } catch {
    return null;
  }
}

export async function importLegacyData(userId: string, legacy: LegacyData) {
  if (legacy.profile) {
    // Preserva medidas e meta de peso já salvas na conta, se houver.
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    const current = existing ? profileFromRow(existing) : null;
    await saveUserProfile(userId, {
      ...(current ?? {}),
      ...legacy.profile,
      // Medidas e personalização já salvas na conta não são sobrescritas.
      heightCm: current?.heightCm ?? null,
      targetWeightKg: current?.targetWeightKg ?? null,
      targetDate: current?.targetDate ?? null,
      sex: current?.sex ?? null,
      birthDate: current?.birthDate ?? null,
      activity: current?.activity ?? null,
      goalType: current?.goalType ?? null,
      weeklyRateKg: current?.weeklyRateKg ?? null,
      macroPreset: current?.macroPreset ?? 'balanced',
    });
  }

  const foods = legacy.foodEntries ?? [];
  if (foods.length) {
    const { error } = await supabase
      .from('food_entries')
      .upsert(foods.map((f) => ({ id: f.id, ...foodToRow(f) })), { onConflict: 'id' });
    fail(error, 'Não foi possível importar os alimentos.');
  }

  const foodIds = new Set(foods.map((f) => f.id));
  const favorites = legacy.favoriteFoods ?? [];
  if (favorites.length) {
    const { error } = await supabase.from('favorite_foods').upsert(
      favorites.map((f) => ({
        id: f.id,
        source_entry_id: f.sourceEntryId && foodIds.has(f.sourceEntryId) ? f.sourceEntryId : null,
        name: f.name,
        portion: f.portion,
        ...nutrientsToRow(f.nutrientsPerPortion),
        nutrition_source: f.nutritionSource,
      })),
      { onConflict: 'id' },
    );
    fail(error, 'Não foi possível importar os favoritos.');
  }

  const water = legacy.waterEntries ?? [];
  if (water.length) {
    const { error } = await supabase
      .from('water_entries')
      .upsert(water.map((w) => ({ id: w.id, entry_date: w.date, volume_ml: w.volumeMl })), { onConflict: 'id' });
    fail(error, 'Não foi possível importar os registros de água.');
  }
}
