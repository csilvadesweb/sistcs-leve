-- Batch 11: Essential Nutrition whey variants transcribed from official product nutrition panels.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Cacao Whey 420 g','Essential Nutrition',null,'28 g (1 colher-medida); embalagem 420 g','100g',371.4286,78.5714,6.7857,3.2143,1.7857,0,5.7143,1.0714,317.8571,
  '{"rotulo_por_porcao_28g":{"energia_kcal":104,"carboidratos_g":1.9,"acucares_totais_g":0.3,"acucares_adicionados_g":0,"proteinas_g":22,"gorduras_totais_g":0.9,"gorduras_saturadas_g":0.5,"gorduras_trans_g":0,"fibras_g":1.6,"sodio_mg":89,"calcio_mg":93,"ferro_mg":2.2,"fosforo_mg":87,"magnesio_mg":41}}'::jsonb,
  'Proteínas hidrolisada e isolada do soro de leite (Thermax 690 e Provon 292), cacau em pó, colágeno hidrolisado em peptídeos, aromas natural e idêntico ao natural, taumatina e glicosídeos de esteviol. Não contém glúten. Alérgicos: contém derivados de leite e soja.','manufacturer-label','https://www.essentialnutrition.com.br/produtos/proteinas/whey/cacao-whey-essential','label_transcribed'),
 ('H.I. Whey Sem Sabor 375 g','Essential Nutrition',null,'25 g (1 colher-medida); embalagem 375 g','100g',352,88,0,0,0,0,0,0,368,
  '{"rotulo_por_porcao_25g":{"energia_kcal":88,"carboidratos_g":0,"acucares_totais_g":0,"acucares_adicionados_g":0,"proteinas_g":22,"gorduras_totais_g":0,"gorduras_saturadas_g":0,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":92,"calcio_mg":105,"fosforo_mg":60}}'::jsonb,
  'Proteínas hidrolisada e isolada do soro de leite (Thermax 690 e Provon 292) e antiumectante dióxido de silício. Não contém glúten. Alérgicos: contém derivados de leite e soja.','manufacturer-label','https://www.essentialnutrition.com.br/h-i-whey-protein-sem-sabor','label_transcribed'),
 ('Espresso Whey 420 g','Essential Nutrition',null,'30 g (1 colher-medida); embalagem 420 g','100g',366.6667,73.3333,15,1.3333,0.6667,0,2.3333,0,286.6667,
  '{"rotulo_por_porcao_30g":{"energia_kcal":110,"carboidratos_g":4.5,"acucares_totais_g":0,"acucares_adicionados_g":0,"proteinas_g":22,"gorduras_totais_g":0.4,"gorduras_saturadas_g":0.2,"gorduras_trans_g":0,"fibras_g":0.7,"sodio_mg":86,"calcio_mg":87,"fosforo_mg":55,"magnesio_mg":20}}'::jsonb,
  'Proteínas hidrolisada e isolada do soro de leite, café em pó (Coffea robusta), colágeno hidrolisado em peptídeos, cacau em pó, goma acácia, goma guar, aromas, espessante goma xantana e glicosídeos de esteviol. Não contém glúten. Alérgicos: contém derivados de leite e soja.','manufacturer-label','https://www.essentialnutrition.com.br/produtos/proteinas/whey/espresso-whey-protein-hidrolisado-e-isolado','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);
