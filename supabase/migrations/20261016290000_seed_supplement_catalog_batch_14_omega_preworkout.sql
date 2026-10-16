-- Batch 14: official label records for omega-3 and pre-workout/energy products.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('DHA TG Ômega-3 Ultraconcentrado 90 Cápsulas','Essential Nutrition',null,'4.3 g (3 cápsulas); embalagem 90 cápsulas','100g',627.907,0,0,69.7674,0,0,0,0,0,
  '{"rotulo_por_porcao_4_3g":{"energia_kcal":27,"gorduras_totais_g":3,"gorduras_saturadas_g":0,"gorduras_trans_g":0,"gorduras_poli_insaturadas_g":2.8,"omega_3_mg":1950,"EPA_mg":450,"DHA_mg":1500,"vitamina_E_mg":9},"ingredientes":"Óleo de peixe (Pronova Pure ômega-3 TG) e D-alfa-tocoferol; cápsula de gelatina, água purificada e glicerina","alergenicos":"Contém derivados de peixe; pode conter soja. Não contém glúten."}'::jsonb,
  'Óleo de peixe (Pronova Pure ômega-3 TG) e D-alfa-tocoferol. Cápsula: gelatina, água purificada e umectante glicerina. Alérgicos: contém derivados de peixe; pode conter soja. Não contém glúten.','manufacturer-label','https://www.essentialnutrition.com.br/produtos/omega-3/dha-tg-omega-3-ultraconcentrado','label_transcribed'),
 ('Booster Energético Pré-Treino Red Lemonade 269 ml','Integralmédica',null,'269 ml (1 lata); embalagem unitária','100ml',1.8587,0,0.4461,0,0,0,0,0,13.7546,
  '{"rotulo_por_lata_269ml":{"energia_kcal":5,"carboidratos_g":1.2,"sodio_mg":37,"cafeina_mg":200,"taurina_mg":1100,"colina_mg":300,"vitamina_B3_mg":20,"vitamina_B5_mg":3.5,"vitamina_B6_mg":5,"vitamina_B12_ug":5}}'::jsonb,
  'Água gaseificada, taurina, bitartarato de colina, cafeína, nicotinamida, cloridrato de piridoxina, D-pantotenato de cálcio, cianocobalamina, ácido cítrico, aromatizantes, benzoato de sódio, sorbato de potássio, citrato de sódio, sucralose e corante ponceau 4R.','manufacturer-label','https://www.integralmedica.com.br/booster-energetico-pre-treino-unitario/p?skuId=1002390','label_transcribed'),
 ('Therma Pro Hardcore 60 Cápsulas','Integralmédica',null,'1.3 g (2 cápsulas); embalagem 60 cápsulas','100g',0,0,0,0,0,0,53.8462,0,0,
  '{"rotulo_por_porcao_1_3g":{"energia_kcal":0,"fibras_g":0.7,"cafeina_mg":285},"ingredientes":"Cafeína, celulose microcristalina, estearato de magnésio, dióxido de silício, gelatina e corantes"}'::jsonb,
  'Cafeína, estabilizante celulose microcristalina, lubrificante estearato de magnésio, antiumectante dióxido de silício, gelificante gelatina e corantes.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/70784.pdf','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);
