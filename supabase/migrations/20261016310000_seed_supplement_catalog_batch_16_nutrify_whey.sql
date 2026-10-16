-- Batch 16: Nutrify Whey Protein flavor variants from the official technical sheet.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Whey Protein Nutrify Cacau 900 g','Nutrify',null,'30 g (3 scoops); embalagem 900 g','100g',333.3333,73.3333,11.6667,2.3333,1.3333,0,3.3333,null::numeric,340,
  '{"rotulo_por_porcao_30g":{"energia_kcal":100,"carboidratos_g":3.5,"poliois_g":2.2,"proteinas_g":22,"gorduras_totais_g":0.7,"gorduras_saturadas_g":0.4,"gorduras_trans_g":0,"fibras_g":1,"sodio_mg":102}}'::jsonb,
  'Proteína isolada do soro de leite, proteína hidrolisada do soro de leite, cacau em pó, chia em pó, eritritol, estévia, taumatina e goma xantana. Alérgicos: contém derivados de leite e soja.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/WHEYPROTEIN_NUTRIFY.pdf','label_transcribed'),
 ('Whey Protein Nutrify Chocolate 900 g','Nutrify',null,'30 g (3 scoops); embalagem 900 g','100g',340,73.3333,12,2,1,0,3.6667,null::numeric,263.3333,
  '{"rotulo_por_porcao_30g":{"energia_kcal":102,"carboidratos_g":3.6,"poliois_g":1.4,"proteinas_g":22,"gorduras_totais_g":0.6,"gorduras_saturadas_g":0.3,"gorduras_trans_g":0,"fibras_g":1.1,"sodio_mg":79}}'::jsonb,
  'Proteína isolada do soro de leite, proteína hidrolisada do soro de leite, cacau em pó, chia em pó, eritritol, estévia, taumatina, aroma natural e goma xantana. Alérgicos: contém derivados de leite e soja.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/WHEYPROTEIN_NUTRIFY.pdf','label_transcribed'),
 ('Whey Protein Nutrify Baunilha 900 g','Nutrify',null,'30 g (3 scoops); embalagem 900 g','100g',323.3333,73.3333,15.6667,0,0,0,0,null::numeric,273.3333,
  '{"rotulo_por_porcao_30g":{"energia_kcal":97,"carboidratos_g":4.7,"poliois_g":2.6,"proteinas_g":22,"gorduras_totais_g":0,"gorduras_saturadas_g":0,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":82},"nota":"Valores de gorduras e fibras declarados como não significativos."}'::jsonb,
  'Proteína isolada do soro de leite, proteína hidrolisada do soro de leite, ingredientes aromatizantes e edulcorantes conforme ficha técnica. Alérgicos: contém derivados de leite e soja.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/WHEYPROTEIN_NUTRIFY.pdf','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);
