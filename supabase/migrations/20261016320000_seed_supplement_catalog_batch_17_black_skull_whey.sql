-- Batch 17: Black Skull Whey Blend Chocolate 900 g.
-- Nutritional values transcribed from the product label image linked on the official brand page.
-- Per-25-g serving values are preserved in JSON; searchable macros are normalized to 100 g.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Whey Protein Blend Chocolate 900 g (WPI, WPC, WPH)','Black Skull',null,'25 g (1 dosador); 36 porções por embalagem de 900 g','100g',404,44,48,4,4,0,0,48,556,
  '{"rotulo_por_porcao_25g":{"energia_kcal":101,"carboidratos_g":12,"acucares_totais_g":12,"acucares_adicionados_g":0,"proteinas_g":11,"gorduras_totais_g":1,"gorduras_saturadas_g":1,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":139,"calcio_mg":170}}'::jsonb,
  'Proteína concentrada do soro do leite, proteína isolada do soro do leite, proteína hidrolisada do soro do leite, cacau em pó, saborizante e edulcorante sucralose. Alérgicos: contém derivados de leite. Contém lactose. Não contém glúten.',
  'manufacturer-label','https://www.blackskullusa.com.br/whey-protein-refil-black-skull--900g-wpi-wpc-wph/p?skuId=21','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);
