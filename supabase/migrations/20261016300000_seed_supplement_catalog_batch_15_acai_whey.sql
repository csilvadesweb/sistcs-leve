-- Batch 15: Essential Nutrition Acai Whey, official nutrition panel.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Açaí Whey Protein com Açaí e Banana 360 g','Essential Nutrition',null,'30 g (2 colheres-medidas); embalagem 360 g','100g',386.6667,73.3333,10,5.6667,1.6667,0,3.3333,4.6667,320,
  '{"rotulo_por_porcao_30g":{"energia_kcal":116,"carboidratos_g":3,"acucares_totais_g":1.4,"acucares_adicionados_g":0.1,"poliois_g":0,"proteinas_g":22,"gorduras_totais_g":1.7,"gorduras_saturadas_g":0.5,"gorduras_trans_g":0,"gorduras_monoinsaturadas_g":0.9,"omega_9_g":0.8,"gorduras_poliinsaturadas_g":0.2,"omega_6_g":0.1,"fibras_g":1,"sodio_mg":96,"vitamina_E_mg":10,"vitamina_C_mg":45,"calcio_mg":212,"fosforo_mg":117,"magnesio_mg":20}}'::jsonb,
  'Proteínas hidrolisada e isolada do soro do leite, açaí e banana liofilizados e outros ingredientes conforme rótulo oficial; conferir a lista integral na página do fabricante antes de uso por alérgicos.','manufacturer-label','https://www.essentialnutrition.com.br/produtos/proteinas/whey/acai-whey-protein-acai-com-banana-sache','label_transcribed'),
 ('Açaí Whey Protein Sachê 30 g','Essential Nutrition',null,'30 g (1 sachê); embalagem unitária','100g',386.6667,73.3333,10,5.6667,1.6667,0,3.3333,4.6667,320,
  '{"rotulo_por_sache_30g":{"energia_kcal":116,"carboidratos_g":3,"acucares_totais_g":1.4,"acucares_adicionados_g":0.1,"poliois_g":0,"proteinas_g":22,"gorduras_totais_g":1.7,"gorduras_saturadas_g":0.5,"gorduras_trans_g":0,"gorduras_monoinsaturadas_g":0.9,"omega_9_g":0.8,"gorduras_poliinsaturadas_g":0.2,"omega_6_g":0.1,"fibras_g":1,"sodio_mg":96,"vitamina_E_mg":10,"vitamina_C_mg":45,"calcio_mg":212,"fosforo_mg":117,"magnesio_mg":20}}'::jsonb,
  'Ver lista integral de ingredientes e alergênicos no rótulo oficial do sachê.','manufacturer-label','https://www.essentialnutrition.com.br/produtos/acai-whey-sache-avulso','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);
