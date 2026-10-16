-- Batch 03: imported Optimum Nutrition Gold Standard whey variants with traceable label sources.
-- Product nutrition is kept per 100 g; original serving size and label source are retained.
-- No barcode is added unless verified from the package/official importer.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Gold Standard 100% Whey Double Rich Chocolate 909 g','Optimum Nutrition',null,'30.4 g (1 colher-medida)','100g',384.8684,78.9474,13.1579,4.9342,1.6447,0,0,3.2895,427.6316,'{"sódio_informado_na_ficha":"130 mg por porção de 30.4 g","açúcares_adicionados":"Não declarado na ficha consultada"}'::jsonb,'Proteína do soro do leite isolada, proteína do soro do leite concentrada, peptídeos do soro do leite, cacau, sal, aromas natural e artificial, lecitina de soja, sucralose e acessulfame de potássio. A ficha informa contém glúten.','importer-label','https://d26lpennugtm8s.cloudfront.net/stores/520/767/rte/WHEY%20GOLD%20OPTIMUM2.pdf','label_transcribed'),
 ('Gold Standard 100% Whey French Vanilla Creme 900 g','Optimum Nutrition',null,'30 g (1 scoop)','100g',376,79,5.2,4.2,1.4,0,null,3.3,196,'{"sal_por_100g":"0.49 g; sódio convertido pela relação sal/sódio"}'::jsonb,'Whey protein blend (whey protein isolate, whey protein concentrate, hydrolysed whey protein isolate), emulsifier soy lecithin, flavourings, sodium chloride, thickener xanthan gum, sweetener sucralose, colour curcumin. Consulte o rótulo importado para alergênicos.','manufacturer-label','https://www.optimumnutrition.com/en-gb/products/gold-standard-100-whey-protein-powder-eu?variant=52105832890635','label_transcribed'),
 ('Gold Standard 100% Whey Cookies and Cream 896 g','Optimum Nutrition',null,'32 g (1 scoop)','100g',373,74,9.7,4.2,1.4,0,null,3.7,204,'{"sal_por_100g":"0.51 g; sódio convertido pela relação sal/sódio"}'::jsonb,null,'retailer-label-transcription','https://www.optimumnutritionbrasil.com/products/optimum-nutrition-gold-standard-100-whey-protein-powder-cookies-cream-896-grams-28-servings-brasil-cj6715039-p-14.html','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
  select 1 from public.supplement_catalog s
  where s.name = p.name and coalesce(s.brand,'') = coalesce(p.brand,'') and coalesce(s.source_url,'') = coalesce(p.source_url,'')
);
