-- Batch 23: DUX Whey Protein Concentrado sachet, official 30 g nutrition table.
-- The page exposes a flavor selector and the following label table; do not extrapolate it to other flavors.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Whey Protein Concentrado DUX Sachê 30 g — Baunilha','DUX',null,'30 g (1 sachê); embalagem unitária','100g',406.6667,66.6667,19,7,4.3333,null::numeric,null::numeric,16.6667,380,
  '{"rotulo_por_sache_30g":{"energia_kcal":122,"carboidratos_g":5.7,"acucares_totais_g":5,"acucares_adicionados_g":0,"proteinas_g":20,"gorduras_totais_g":2.1,"gorduras_saturadas_g":1.3,"sodio_mg":114},"nota":"Trans fats and dietary fiber are not specified in the published table."}'::jsonb,
  null::text,'manufacturer-label','https://www.duxhumanhealth.com/wheyproteinconcentrado-1sache/p?idsku=2883','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);
