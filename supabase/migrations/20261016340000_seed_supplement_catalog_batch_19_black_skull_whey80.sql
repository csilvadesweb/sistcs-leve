-- Batch 19: Black Skull Whey Protein Concentrado 80% HD Morango 900 g.
-- Nutrition label transcribed from the official product-page label image.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Whey Protein Concentrado 80% HD Morango 900 g','Black Skull','7908808001980','30 g (1 dosador); 30 porções por embalagem de 900 g','100g',416.6667,76.6667,13.3333,6.3333,3.3333,0,0,13.3333,233.3333,
  '{"rotulo_por_porcao_30g":{"energia_kcal":125,"carboidratos_g":4,"acucares_totais_g":4,"acucares_adicionados_g":0,"proteinas_g":23,"gorduras_totais_g":1.9,"gorduras_saturadas_g":1,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":70}}'::jsonb,
  'Proteína concentrada do soro do leite, aromatizante, emulsificante goma xantana, corante beterraba, acidulante ácido cítrico e edulcorante sucralose. Alérgicos: contém derivados do leite. Contém lactose. Não contém glúten.',
  'manufacturer-label','https://www.blackskullusa.com.br/whey-80-hd-caveira-preta-1/p','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);
