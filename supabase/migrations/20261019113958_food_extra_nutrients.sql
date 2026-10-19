-- Nutrientes extras do diário alimentar: gordura saturada, açúcares e sódio.
-- Aditiva e reversível: colunas anuláveis. NULL = "não informado" (diferente de zero),
-- pois o catálogo local não traz esses valores e inventá-los como 0 distorceria os totais.
alter table public.food_entries
  add column if not exists saturated_fat numeric check (saturated_fat is null or saturated_fat >= 0),
  add column if not exists sugars numeric check (sugars is null or sugars >= 0),
  add column if not exists sodium_mg numeric check (sodium_mg is null or sodium_mg >= 0);

alter table public.favorite_foods
  add column if not exists saturated_fat numeric check (saturated_fat is null or saturated_fat >= 0),
  add column if not exists sugars numeric check (sugars is null or sugars >= 0),
  add column if not exists sodium_mg numeric check (sodium_mg is null or sodium_mg >= 0);
