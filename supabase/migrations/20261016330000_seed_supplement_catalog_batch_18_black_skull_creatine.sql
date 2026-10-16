-- Batch 18: Black Skull creatine variants listed by the official manufacturer.
-- The manufacturer page confirms ingredients and serving directions, but not a machine-readable nutrition panel.
-- Do not infer energy/macronutrient values: keep them NULL and mark records for label verification.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Creatine Monohidratada 300 g — Sem Sabor','Black Skull',null,'5 g (1 dosador); embalagem 300 g','100g',null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,
  '{"ativo_declarado":"creatina monohidratada","porcao_declarada_g":5,"nota":"Tabela nutricional completa não transcrita; confirmar rótulo físico antes de preencher macros."}'::jsonb,
  'Creatina monohidratada. Não contém glúten.','manufacturer-product-page','https://www.blackskullusa.com.br/creatine-creatina-monohidratada-300g/p','needs_verified_product_data'),
 ('Creatine Monohidratada 300 g — Laranja','Black Skull',null,'6 g (1 dosador); embalagem 300 g','100g',null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,
  '{"ativo_declarado":"creatina monohidratada","porcao_declarada_g":6,"nota":"Tabela nutricional completa não transcrita; confirmar rótulo físico antes de preencher macros."}'::jsonb,
  'Creatina monohidratada, acidulante ácido málico, antiumectante dióxido de silício, aromatizante, corante extrato de urucum/base norbixina e edulcorante sucralose. Não contém glúten.','manufacturer-product-page','https://www.blackskullusa.com.br/creatine-creatina-monohidratada-300g/p','needs_verified_product_data'),
 ('Creatine Monohidratada 300 g — Limão','Black Skull',null,'6 g (1 dosador); embalagem 300 g','100g',null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,
  '{"ativo_declarado":"creatina monohidratada","porcao_declarada_g":6,"nota":"Tabela nutricional completa não transcrita; confirmar rótulo físico antes de preencher macros."}'::jsonb,
  'Creatina monohidratada, acidulante ácido málico, antiumectante dióxido de silício, aromatizante, corante sais de potássio e sódio de complexos cúpricos de clorofilinas e edulcorante sucralose. Não contém glúten.','manufacturer-product-page','https://www.blackskullusa.com.br/creatine-creatina-monohidratada-300g/p','needs_verified_product_data')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);
