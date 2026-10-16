-- Batch 21: Darkness Carnibol beef protein flavor variants with per-flavor official nutrition tables.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Carnibol Proteína de Carne Bovina Caramelo Salgado 900 g','Darkness',null,'35 g (2 dosadores); cerca de 26 porções por embalagem de 900 g','100g',362.8571,85.7143,4.8571,0,0,0,null::numeric,0,548.5714,
  '{"rotulo_por_porcao_35g":{"energia_kcal":127,"carboidratos_g":1.7,"proteinas_g":30,"sodio_mg":192},"base_ativa":"ProMyoBlend (colágeno hidrolisado e proteína de origem bovina)"}'::jsonb,
  'ProMyoBlend (colágeno hidrolisado e proteína de origem bovina), cloreto de potássio, cloreto de sódio, aromatizantes, goma xantana, sucralose e corantes ponceau 4R, tartrazina e azul brilhante FCF. Alérgicos: contém derivados de soja. Não contém glúten.',
  'manufacturer-label','https://www.darkness.com.br/proteina-de-carne-900g-darkness/p?sabor=Caramelo+salgado&tamanho=900g','label_transcribed'),
 ('Carnibol Proteína de Carne Bovina Blueberry 900 g','Darkness',null,'35 g (2 dosadores); cerca de 26 porções por embalagem de 900 g','100g',371.4286,85.7143,6.8571,0,0,0,null::numeric,0,345.7143,
  '{"rotulo_por_porcao_35g":{"energia_kcal":130,"carboidratos_g":2.4,"proteinas_g":30,"sodio_mg":121},"base_ativa":"ProMyoBlend (colágeno hidrolisado e proteína de origem bovina)"}'::jsonb,
  'ProMyoBlend (colágeno hidrolisado e proteína de origem bovina), acidulante ácido cítrico, aromatizante, goma xantana, sucralose e corantes artificiais amaranto e indigotina. Alérgicos: contém derivados de soja. Não contém glúten.',
  'manufacturer-label','https://www.darkness.com.br/proteina-de-carne-900g-darkness/p?sabor=Blueberry&tamanho=900g','label_transcribed'),
 ('Carnibol Proteína de Carne Bovina Baunilha 900 g','Darkness',null,'35 g (2 dosadores); cerca de 26 porções por embalagem de 900 g','100g',368.5714,88.5714,3.7143,0,0,0,null::numeric,0,357.1429,
  '{"rotulo_por_porcao_35g":{"energia_kcal":129,"carboidratos_g":1.3,"proteinas_g":31,"sodio_mg":125},"base_ativa":"ProMyoBlend (colágeno hidrolisado e proteína de origem bovina)"}'::jsonb,
  'ProMyoBlend (colágeno hidrolisado e proteína de origem bovina), aromatizantes, goma xantana e sucralose. Alérgicos: contém derivados de soja. Não contém glúten.',
  'manufacturer-label','https://www.darkness.com.br/proteina-de-carne-900g-darkness/p?sabor=Baunilha&tamanho=900g','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);
