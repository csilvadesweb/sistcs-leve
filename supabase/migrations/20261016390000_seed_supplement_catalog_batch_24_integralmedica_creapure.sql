-- Batch 24: Integralmédica Creatina Creapure 300 g, official table of nutrition.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Creatina Creapure 300 g — Neutro','Integralmédica',null,'5 g (1 dosador); embalagem 300 g','100g',null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,
  '{"rotulo_por_porcao_5g":{"creatina_mg":5000},"nota":"Tabela oficial publica creatina por porção; energia e macros não aparecem como valores declarados."}'::jsonb,
  'Creatina monohidratada. Alérgicos: pode conter leite, soja e ovo. Não contém glúten.',
  'manufacturer-label','https://www.integralmedica.com.br/creatina-creapure-300g/p','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);
