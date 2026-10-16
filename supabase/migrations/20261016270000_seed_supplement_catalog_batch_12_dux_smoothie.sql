-- Batch 12: DUX Whey Protein Smoothie Dark Cookies, official product nutrition panel.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Whey Protein Smoothie Dark Cookies 900 g','DUX Human Health',null,'35 g (1 dosador); embalagem 900 g','100g',388.5714,57.1429,22.2857,7.1429,4.5714,null::numeric,7.1429,9.1429,454.2857,
  '{"rotulo_por_porcao_35g":{"energia_kcal":136,"carboidratos_g":7.8,"acucares_totais_g":3.2,"acucares_adicionados_g":0.1,"proteinas_g":20,"gorduras_totais_g":2.5,"gorduras_saturadas_g":1.6,"fibras_g":2.5,"sodio_mg":159}}'::jsonb,
  'Proteína de soro do leite concentrada, biscoito (cookies), cacau em pó, aromatizantes, goma guar, sucralose e acessulfame de potássio. Alérgicos: contém derivados de soja e leite; pode conter trigo, centeio, cevada, aveia, ovos, peixes, amendoim, amêndoa, avelãs, castanha-de-caju, castanha-do-Pará, macadâmias, nozes, pistaches e castanhas. Contém lactose e glúten.','manufacturer-label','https://www.duxhumanhealth.com/whey-protein-smoothie-pote-900g/','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);
