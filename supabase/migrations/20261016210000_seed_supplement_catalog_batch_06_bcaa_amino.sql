-- Batch 06: official-label BCAA and amino-acid products.
-- No inferred barcodes; each variant is tied to the matching official technical sheet.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('BCAA Powder Guaraná com Açaí 200 g','Integralmédica','7896311764556','3.2 g (1 scoop); embalagem 200 g','100g',312.5,0,0,0,0,0,0,0,0,
  '{"rotulo_por_porcao_3_2g":{"energia_kcal":10,"vitamina_B6_mg":1.3,"leucina_mg":1730,"isoleucina_mg":432,"valina_mg":432},"ingredientes":"Leucina, isoleucina, valina, vitamina B6, aromas, ácido cítrico, acessulfame-K, sucralose e dióxido de silício"}'::jsonb,
  'Leucina, isoleucina, valina, vitamina B6 (piridoxina), aromas, ácido cítrico, acessulfame-K, sucralose e dióxido de silício. Não contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76455.pdf','label_transcribed'),
 ('BCAA Energy Lemon Line 240 g','Integralmédica',null,'10 g (2,5 dosadores); embalagem 240 g','100g',270,0,11,0,0,0,0,1,0,
  '{"rotulo_por_porcao_10g":{"energia_kcal":27,"carboidratos_g":1.1,"acucares_totais_g":0.1,"acucares_adicionados_g":0.1,"proteinas_g":0,"arginina_mg":500,"leucina_mg":3106,"isoleucina_mg":1043,"valina_mg":1030,"vitamina_B6_mg":0.26,"taurina_mg":1117,"cafeina_mg":200}}'::jsonb,
  'L-leucina, taurina, L-isoleucina, L-valina, L-arginina, cafeína, cloridrato de piridoxina, aromatizantes, ácido cítrico, sucralose, dióxido de silício e corantes. Alérgicos: contém derivados de soja. Não contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76688.pdf','label_transcribed'),
 ('BCAA Energy Morango com Limão 240 g','Integralmédica',null,'10 g (2,5 dosadores); embalagem 240 g','100g',270,0,11,0,0,0,0,1,0,
  '{"rotulo_por_porcao_10g":{"energia_kcal":27,"carboidratos_g":1.1,"acucares_totais_g":0.1,"acucares_adicionados_g":0.1,"proteinas_g":0,"arginina_mg":500,"leucina_mg":3106,"isoleucina_mg":1043,"valina_mg":1030,"vitamina_B6_mg":0.26,"taurina_mg":1117,"cafeina_mg":200}}'::jsonb,
  'L-leucina, taurina, L-isoleucina, L-valina, L-arginina, cafeína, cloridrato de piridoxina, aromatizantes, ácido cítrico, sucralose, dióxido de silício e corantes. Alérgicos: contém derivados de soja. Não contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76688.pdf','label_transcribed'),
 ('BCAA Fix 120 Tabletes 180 g','Integralmédica','7896311709168','4.5 g (3 tabletes); embalagem 180 g','100g',133.3333,0,0,0,0,0,0,0,0,
  '{"rotulo_por_porcao_4_5g":{"energia_kcal":6,"vitamina_B6_mg":1.3,"leucina_mg":1602,"isoleucina_mg":1148,"valina_mg":1148}}'::jsonb,
  'Leucina, isoleucina, valina, piridoxina (vitamina B6), polietilenoglicol, celulose microcristalina, hidroxipropilmetilcelulose e dióxido de silício. Não contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76305.pdf','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);
