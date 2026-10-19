-- Consolidated, idempotent seed for supplement catalog batches 04–25.
-- Each source CTE inserts only products not already present by the batch's stable identity.
-- Data rows with needs_verified_product_data intentionally remain excluded by frontend search.
-- This migration is additive: no UPDATE/DELETE/TRUNCATE/DROP statements.
-- Source batch: supabase/migrations/20261016190000_seed_supplement_catalog_batch_04_whey100pure.sql
-- Batch 04: twelve package/barcode variants of Integralmédica Whey 100% Pure.
-- Every nutrition value is transcribed from the official manufacturer technical sheet.
-- Macro fields are normalized to 100 g for app calculations; original 30 g label serving and its full amino-acid table are retained in micronutrients JSON.
-- Additive and idempotent: never deletes or overwrites existing product data.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Whey 100% Pure Baunilha 900 g Pote','Integralmédica','7896311709984','30 g (2 dosadores); embalagem 900 g','100g',406.6667,70,17,6.3333,3.3333,0,0,12.6667,216.6667,
 '{"rotulo_por_porcao_30g":{"energia_kcal":122,"carboidratos_g":5.1,"acucares_totais_g":3.8,"acucares_adicionados_g":0,"proteinas_g":21,"gorduras_totais_g":1.9,"gorduras_saturadas_g":1,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":65},"aminograma_mg_por_porcao_30g":{"histidina":353,"isoleucina":1196,"leucina":2030,"lisina":1802,"cisteina":445,"metionina":417,"tirosina":584,"fenilalanina":634,"treonina":1383,"triptofano":353,"valina":1151,"acido_aspartico":2124,"serina":1017,"acido_glutamico":3365,"glicina":374,"alanina":964,"arginina":516,"prolina":1141}}'::jsonb,
 'Proteína de soro do leite concentrada, aromatizante e edulcorante sucralose. Alérgicos: contém derivados de leite e soja; contém lactose. Não contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76637.pdf','label_transcribed'),
 ('Whey 100% Pure Baunilha 900 g Pouch','Integralmédica','7896311761708','30 g (2 dosadores); embalagem 900 g','100g',406.6667,70,17,6.3333,3.3333,0,0,12.6667,216.6667,
 '{"rotulo_por_porcao_30g":{"energia_kcal":122,"carboidratos_g":5.1,"acucares_totais_g":3.8,"acucares_adicionados_g":0,"proteinas_g":21,"gorduras_totais_g":1.9,"gorduras_saturadas_g":1,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":65},"aminograma_mg_por_porcao_30g":{"histidina":353,"isoleucina":1196,"leucina":2030,"lisina":1802,"cisteina":445,"metionina":417,"tirosina":584,"fenilalanina":634,"treonina":1383,"triptofano":353,"valina":1151,"acido_aspartico":2124,"serina":1017,"acido_glutamico":3365,"glicina":374,"alanina":964,"arginina":516,"prolina":1141}}'::jsonb,
 'Proteína de soro do leite concentrada, aromatizante e edulcorante sucralose. Alérgicos: contém derivados de leite e soja; contém lactose. Não contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76637.pdf','label_transcribed'),
 ('Whey 100% Pure Morango 900 g Pote','Integralmédica','7896311710010','30 g (2 dosadores); embalagem 900 g','100g',403.3333,70,17,6,3,0,0,11.6667,190,
 '{"rotulo_por_porcao_30g":{"energia_kcal":121,"carboidratos_g":5.1,"acucares_totais_g":3.5,"acucares_adicionados_g":0,"proteinas_g":21,"gorduras_totais_g":1.8,"gorduras_saturadas_g":0.9,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":57},"aminograma_mg_por_porcao_30g":{"histidina":372,"isoleucina":1261,"leucina":2141,"lisina":1899,"cisteina":469,"metionina":441,"tirosina":617,"fenilalanina":669,"treonina":1459,"triptofano":373,"valina":1215,"acido_aspartico":2239,"serina":1073,"acido_glutamico":3549,"glicina":394,"alanina":1017,"arginina":544,"prolina":1205}}'::jsonb,
 'Proteína de soro do leite concentrada, aromatizante, acidulante ácido cítrico, edulcorante sucralose e corantes naturais carmim e artificial bordeaux S. Alérgicos: contém derivados de leite e soja; contém lactose. Não contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76637.pdf','label_transcribed'),
 ('Whey 100% Pure Morango 900 g Pouch','Integralmédica','7896311761715','30 g (2 dosadores); embalagem 900 g','100g',403.3333,70,17,6,3,0,0,11.6667,190,
 '{"rotulo_por_porcao_30g":{"energia_kcal":121,"carboidratos_g":5.1,"acucares_totais_g":3.5,"acucares_adicionados_g":0,"proteinas_g":21,"gorduras_totais_g":1.8,"gorduras_saturadas_g":0.9,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":57},"aminograma_mg_por_porcao_30g":{"histidina":372,"isoleucina":1261,"leucina":2141,"lisina":1899,"cisteina":469,"metionina":441,"tirosina":617,"fenilalanina":669,"treonina":1459,"triptofano":373,"valina":1215,"acido_aspartico":2239,"serina":1073,"acido_glutamico":3549,"glicina":394,"alanina":1017,"arginina":544,"prolina":1205}}'::jsonb,
 'Proteína de soro do leite concentrada, aromatizante, acidulante ácido cítrico, edulcorante sucralose e corantes naturais carmim e artificial bordeaux S. Alérgicos: contém derivados de leite e soja; contém lactose. Não contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76637.pdf','label_transcribed'),
 ('Whey 100% Pure Chocolate 900 g Pote','Integralmédica','7896311709991','30 g (2 dosadores); embalagem 900 g','100g',403.3333,66.6667,20,6.6667,3.3333,0,0,12,206.6667,
 '{"rotulo_por_porcao_30g":{"energia_kcal":121,"carboidratos_g":6,"acucares_totais_g":3.6,"acucares_adicionados_g":0,"proteinas_g":20,"gorduras_totais_g":2,"gorduras_saturadas_g":1,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":62},"aminograma_mg_por_porcao_30g":{"histidina":353,"isoleucina":1196,"leucina":2030,"lisina":1802,"cisteina":445,"metionina":417,"tirosina":584,"fenilalanina":634,"treonina":1383,"triptofano":353,"valina":1151,"acido_aspartico":2124,"serina":1017,"acido_glutamico":3365,"glicina":374,"alanina":964,"arginina":516,"prolina":1141}}'::jsonb,
 'Proteína de soro do leite concentrada, cacau em pó, aromatizante e edulcorante sucralose. Alérgicos: contém derivados de leite e soja; contém lactose. Não contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76637.pdf','label_transcribed'),
 ('Whey 100% Pure Chocolate 900 g Pouch','Integralmédica','7896311761722','30 g (2 dosadores); embalagem 900 g','100g',403.3333,66.6667,20,6.6667,3.3333,0,0,12,206.6667,
 '{"rotulo_por_porcao_30g":{"energia_kcal":121,"carboidratos_g":6,"acucares_totais_g":3.6,"acucares_adicionados_g":0,"proteinas_g":20,"gorduras_totais_g":2,"gorduras_saturadas_g":1,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":62},"aminograma_mg_por_porcao_30g":{"histidina":353,"isoleucina":1196,"leucina":2030,"lisina":1802,"cisteina":445,"metionina":417,"tirosina":584,"fenilalanina":634,"treonina":1383,"triptofano":353,"valina":1151,"acido_aspartico":2124,"serina":1017,"acido_glutamico":3365,"glicina":374,"alanina":964,"arginina":516,"prolina":1141}}'::jsonb,
 'Proteína de soro do leite concentrada, cacau em pó, aromatizante e edulcorante sucralose. Alérgicos: contém derivados de leite e soja; contém lactose. Não contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76637.pdf','label_transcribed'),
 ('Whey 100% Pure Cookies 900 g Pote','Integralmédica','7896311766376','30 g (2 dosadores); embalagem 900 g','100g',403.3333,66.6667,21,6,3,0,0,10.6667,220,
 '{"rotulo_por_porcao_30g":{"energia_kcal":121,"carboidratos_g":6.3,"acucares_totais_g":3.2,"acucares_adicionados_g":0.4,"proteinas_g":20,"gorduras_totais_g":1.8,"gorduras_saturadas_g":0.9,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":66},"aminograma_mg_por_porcao_30g":{"histidina":346,"isoleucina":1176,"leucina":1994,"lisina":1765,"cisteina":438,"metionina":412,"tirosina":576,"fenilalanina":623,"treonina":1357,"triptofano":350,"valina":1133,"acido_aspartico":2081,"serina":999,"acido_glutamico":3305,"glicina":367,"alanina":948,"arginina":507,"prolina":1126}}'::jsonb,
 'Proteína de soro do leite concentrada, cookies, aromatizante, espessante goma xantana e edulcorante sucralose. Alérgicos: contém derivados de leite e soja; contém lactose; contém cevada, pode conter aveia, centeio e trigo; contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76637.pdf','label_transcribed'),
 ('Whey 100% Pure Cookies 900 g Pouch','Integralmédica','7896311767397','30 g (2 dosadores); embalagem 900 g','100g',403.3333,66.6667,21,6,3,0,0,10.6667,220,
 '{"rotulo_por_porcao_30g":{"energia_kcal":121,"carboidratos_g":6.3,"acucares_totais_g":3.2,"acucares_adicionados_g":0.4,"proteinas_g":20,"gorduras_totais_g":1.8,"gorduras_saturadas_g":0.9,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":66},"aminograma_mg_por_porcao_30g":{"histidina":346,"isoleucina":1176,"leucina":1994,"lisina":1765,"cisteina":438,"metionina":412,"tirosina":576,"fenilalanina":623,"treonina":1357,"triptofano":350,"valina":1133,"acido_aspartico":2081,"serina":999,"acido_glutamico":3305,"glicina":367,"alanina":948,"arginina":507,"prolina":1126}}'::jsonb,
 'Proteína de soro do leite concentrada, cookies, aromatizante, espessante goma xantana e edulcorante sucralose. Alérgicos: contém derivados de leite e soja; contém lactose; contém cevada, pode conter aveia, centeio e trigo; contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76637.pdf','label_transcribed'),
 ('Whey 100% Pure Coco 900 g Pote','Integralmédica','7896311769827','30 g (2 dosadores); embalagem 900 g','100g',403.3333,70,17,6,3,0,0,10.3333,216.6667,
 '{"rotulo_por_porcao_30g":{"energia_kcal":121,"carboidratos_g":5.1,"acucares_totais_g":3.1,"acucares_adicionados_g":0,"proteinas_g":21,"gorduras_totais_g":1.8,"gorduras_saturadas_g":0.9,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":65},"aminograma_mg_por_porcao_30g":{"histidina":369,"isoleucina":1256,"leucina":2130,"lisina":1884,"cisteina":468,"metionina":440,"tirosina":616,"fenilalanina":665,"treonina":1450,"triptofano":374,"valina":1211,"acido_aspartico":2222,"serina":1067,"acido_glutamico":3531,"glicina":392,"alanina":1013,"arginina":541,"prolina":1203}}'::jsonb,
 'Proteína de soro do leite concentrada, aromatizante, espessante goma xantana e edulcorante sucralose. Alérgicos: contém derivados de leite e soja; contém lactose. Não contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76637.pdf','label_transcribed'),
 ('Whey 100% Pure Coco 900 g Pouch','Integralmédica','7896311769803','30 g (2 dosadores); embalagem 900 g','100g',403.3333,70,17,6,3,0,0,10.3333,216.6667,
 '{"rotulo_por_porcao_30g":{"energia_kcal":121,"carboidratos_g":5.1,"acucares_totais_g":3.1,"acucares_adicionados_g":0,"proteinas_g":21,"gorduras_totais_g":1.8,"gorduras_saturadas_g":0.9,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":65},"aminograma_mg_por_porcao_30g":{"histidina":369,"isoleucina":1256,"leucina":2130,"lisina":1884,"cisteina":468,"metionina":440,"tirosina":616,"fenilalanina":665,"treonina":1450,"triptofano":374,"valina":1211,"acido_aspartico":2222,"serina":1067,"acido_glutamico":3531,"glicina":392,"alanina":1013,"arginina":541,"prolina":1203}}'::jsonb,
 'Proteína de soro do leite concentrada, aromatizante, espessante goma xantana e edulcorante sucralose. Alérgicos: contém derivados de leite e soja; contém lactose. Não contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76637.pdf','label_transcribed'),
 ('Whey 100% Pure Chocolate Maltado 900 g Pote','Integralmédica','7896311769834','30 g (2 dosadores); embalagem 900 g','100g',400,66.6667,17.6667,6.3333,3,0,2.6667,8.6667,200,
 '{"rotulo_por_porcao_30g":{"energia_kcal":120,"carboidratos_g":5.3,"acucares_totais_g":2.6,"acucares_adicionados_g":0.8,"proteinas_g":20,"gorduras_totais_g":1.9,"gorduras_saturadas_g":0.9,"gorduras_trans_g":0,"fibras_g":0.8,"sodio_mg":60},"aminograma_mg_por_porcao_30g":{"histidina":343,"isoleucina":1174,"leucina":1986,"lisina":1749,"cisteina":440,"metionina":414,"tirosina":579,"fenilalanina":620,"treonina":1351,"triptofano":354,"valina":1134,"acido_aspartico":2064,"serina":994,"acido_glutamico":3294,"glicina":365,"alanina":947,"arginina":505,"prolina":1130}}'::jsonb,
 'Proteína de soro do leite concentrada, extrato de malte, cacau em pó, aromatizante, espessante goma xantana e edulcorante sucralose. Alérgicos: contém derivados de leite e soja; contém lactose; contém cevada, pode conter aveia, centeio e trigo; contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76637.pdf','label_transcribed'),
 ('Whey 100% Pure Chocolate Maltado 900 g Pouch','Integralmédica','7896311769810','30 g (2 dosadores); embalagem 900 g','100g',400,66.6667,17.6667,6.3333,3,0,2.6667,8.6667,200,
 '{"rotulo_por_porcao_30g":{"energia_kcal":120,"carboidratos_g":5.3,"acucares_totais_g":2.6,"acucares_adicionados_g":0.8,"proteinas_g":20,"gorduras_totais_g":1.9,"gorduras_saturadas_g":0.9,"gorduras_trans_g":0,"fibras_g":0.8,"sodio_mg":60},"aminograma_mg_por_porcao_30g":{"histidina":343,"isoleucina":1174,"leucina":1986,"lisina":1749,"cisteina":440,"metionina":414,"tirosina":579,"fenilalanina":620,"treonina":1351,"triptofano":354,"valina":1134,"acido_aspartico":2064,"serina":994,"acido_glutamico":3294,"glicina":365,"alanina":947,"arginina":505,"prolina":1130}}'::jsonb,
 'Proteína de soro do leite concentrada, extrato de malte, cacau em pó, aromatizante, espessante goma xantana e edulcorante sucralose. Alérgicos: contém derivados de leite e soja; contém lactose; contém cevada, pode conter aveia, centeio e trigo; contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76637.pdf','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (select 1 from public.supplement_catalog s where s.barcode = p.barcode)
  and not exists (select 1 from public.supplement_catalog s where s.name = p.name and coalesce(s.brand,'') = p.brand);

-- Source batch: supabase/migrations/20261016200000_seed_supplement_catalog_batch_05_verified_brands.sql
-- Batch 05: additional brand/product families transcribed from official manufacturer labels/pages.
-- All macro fields are normalized to 100 g where the label gives a measurable serving.
-- Unknown EANs are intentionally NULL; never infer barcodes. Idempotent, additive only.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Nutri Whey Protein Cookies 900 g','Integralmédica',null,'120 g (2 scoops); embalagem 900 g','100g',364.1667,25,61.6667,1.8333,0.8333,0,0,21.6667,177.5,
  '{"rotulo_por_porcao_120g":{"energia_kcal":437,"carboidratos_g":74,"acucares_totais_g":26,"acucares_adicionados_g":15,"proteinas_g":30,"gorduras_totais_g":2.2,"gorduras_saturadas_g":1,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":213},"vitaminas_minerais_por_porcao_120g":{"vitamina_A_ug":135,"vitamina_D_ug":3,"vitamina_E_mg":2.3,"vitamina_C_mg":14,"vitamina_B1_mg":0.2,"vitamina_B2_mg":0.22,"vitamina_B3_mg":2.4,"vitamina_B5_mg":0.75,"vitamina_B6_mg":0.26,"biotina_ug":4.5,"acido_folico_ug":60,"vitamina_B12_ug":0.4,"calcio_mg":230,"cromo_ug":5.3,"ferro_mg":2.7,"fosforo_mg":113,"iodo_ug":23,"magnesio_mg":63,"manganes_mg":0.36,"molibdenio_ug":6.8,"selenio_ug":8.3}}'::jsonb,
  'Ficha técnica oficial: sabor Cookies and Cream. A lista completa de ingredientes/alergênicos deve ser consultada no rótulo da variante antes do uso individual.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/77278.pdf','label_transcribed'),
 ('Super Whey Protein Matrix Chocolate 907 g','Integralmédica / Darkness',null,'30 g (2 scoops); embalagem 907 g','100g',396.6667,73.3333,11.3333,6.3333,5.6667,0,0,0,240,
  '{"rotulo_por_porcao_30g":{"energia_kcal":119,"carboidratos_g":3.4,"proteinas_g":22,"gorduras_totais_g":1.9,"gorduras_saturadas_g":1.7,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":72},"aminograma_mg_por_porcao_30g":{"alanina":1083,"arginina":519,"acido_aspartico":2265,"acido_glutamico":3698,"cisteina":487,"glicina":388,"histidina":382,"isoleucina":1343,"leucina":2263,"lisina":1992,"metionina":459,"fenilalanina":688,"prolina":1328,"serina":1127,"treonina":1503,"tirosina":635,"triptofano":383,"valina":1305}}'::jsonb,
  'Proteína concentrada do soro de leite, proteína isolada do soro de leite, cacau em pó, proteína hidrolisada do soro de leite, aromas, goma xantana e sucralose. Alérgicos: contém derivados de leite e soja. Não contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76102.pdf','label_transcribed'),
 ('Creatina 100% Pura Pouch 1 kg','Integralmédica',null,'5 g (1 scoop); embalagem 1 kg','100g',0,0,0,0,0,0,0,0,0,
  '{"rotulo_por_porcao_5g":{"energia_kcal":0,"proteinas_g":0,"gorduras_totais_g":0,"gorduras_saturadas_g":0,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":0,"creatina_mg":5000},"ingredientes":"Creatina monohidratada"}'::jsonb,
  'Creatina monohidratada. Alérgicos: não contém glúten.','manufacturer-label','https://www.integralmedica.com.br/creatina-100-pura-1kg/p?Sabor=Neutro&Tamanho=1Kg&sabor=Neutro&tamanho=1Kg','label_transcribed'),
 ('Creatine Pure Creatine Monohydrate Powder 300 g','Darkness',null,'3 g (1 dosador); embalagem de 300 g conforme apresentação consultada','100g',0,0,0,0,0,0,0,0,0,
  '{"rotulo_por_porcao_3g":{"creatina_mg":3000,"energia_kcal":0,"carboidratos_g":0,"acucares_totais_g":0,"acucares_adicionados_g":0,"proteinas_g":0,"gorduras_totais_g":0,"gorduras_saturadas_g":0,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":0},"ingredientes":"Creatina monohidratada"}'::jsonb,
  'Creatina monohidratada. Não contém glúten. A ficha consultada não confirmou EAN para esta apresentação; barcode mantido nulo.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/76765.pdf','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);

-- Source batch: supabase/migrations/20261016210000_seed_supplement_catalog_batch_06_bcaa_amino.sql
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

-- Source batch: supabase/migrations/20261016220000_seed_supplement_catalog_batch_07_dux_whey.sql
-- Batch 07: DUX whey isolate and hydro variants from the brand's published nutrition tables.
-- Variant-specific source values are preserved per serving in JSON; normalized macros are per 100 g.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Whey Protein Isolado Neutro 900 g','DUX Human Health',null,'28 g (1 dosador); embalagem 900 g','100g',375,85.7143,2.8571,2.1429,1.0714,null::numeric,null::numeric,2.1429,421.4286,
  '{"rotulo_por_porcao_28g":{"energia_kcal":105,"carboidratos_g":0.8,"acucares_totais_g":0.6,"proteinas_g":24,"gorduras_totais_g":0.6,"gorduras_saturadas_g":0.3,"sodio_mg":118},"aminograma_mg_por_porcao_28g":{"histidina":400,"isoleucina":1400,"leucina":2500,"lisina":2200,"cisteina":500,"metionina":500,"tirosina":700,"fenilalanina":700,"treonina":1600,"triptofano":400,"valina":1300,"aspartato":2500,"serina":1000,"glutamina":4100,"glicina":400,"alanina":1100,"arginina":500,"prolina":1400}}'::jsonb,
  'Proteína de soro do leite isolada. Alérgicos: contém derivados de soja e leite; pode conter trigo, aveia, peixes, amendoim, amêndoa, avelãs, castanha-de-caju, nozes e pistaches. Contém lactose e glúten.','manufacturer-label','https://www.duxhumanhealth.com/wheyproteinisolado-pote900g/p','label_transcribed'),
 ('Whey Protein Hydro Baunilha 900 g','DUX Human Health',null,'30 g (1 dosador); embalagem 900 g','100g',373.3333,83.3333,5.3333,2,1,null::numeric,null::numeric,1.6667,323.3333,
  '{"rotulo_por_porcao_30g":{"energia_kcal":112,"carboidratos_g":1.6,"acucares_totais_g":0.5,"acucares_adicionados_g":0,"proteinas_g":25,"gorduras_totais_g":0.6,"gorduras_saturadas_g":0.3,"sodio_mg":97},"aminograma_mg_por_porcao_30g":{"histidina":400,"isoleucina":1500,"leucina":2600,"lisina":2500,"cisteina":600,"metionina":500,"tirosina":700,"fenilalanina":800,"treonina":1700,"triptofano":400,"valina":1300,"aspartato":2600,"serina":1100,"glutamina":4400,"glicina":400,"alanina":1200,"arginina":500,"prolina":1500}}'::jsonb,
  'Proteína de soro do leite hidrolisada, proteína de soro do leite isolada, aromatizantes, sucralose e acessulfame de potássio. Alérgicos: contém derivados de soja e leite; pode conter trigo, centeio, cevada, aveia, ovos, amendoim, amêndoa, avelãs, castanha-de-caju e pistaches. Contém lactose e glúten.','manufacturer-label','https://www.duxhumanhealth.com/wheyproteinhydro-pote900g/p','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);

-- Source batch: supabase/migrations/20261016230000_seed_supplement_catalog_batch_08_nutrata.sql
-- Batch 08: Nutrata Plasma ioWhey Chocolate Cream, transcribed from the official technical sheet.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Plasma ioWHEY Chocolate Cream 432 g','Nutrata / Nature Real Nutrition','7898599214983','24 g (2 colheres dosadoras); embalagem 432 g','100g',429.1667,70.8333,14.5833,9.5833,5.8333,0,null::numeric,null::numeric,null::numeric,
  '{"rotulo_por_porcao_24g":{"energia_kcal":103,"carboidratos_g":3.5,"proteinas_g":17,"gorduras_totais_g":2.3,"gorduras_saturadas_g":1.4},"rotulo_declara":"sem gordura trans","aminograma_e_demais_nutrientes":"Não informados na ficha consultada"}'::jsonb,
  'ioWhey Protein (WPC-CFM-PLM), cacau natural em pó, aroma natural de chocolate, goma xantana, carragena, glicosídeos de esteviol, taumatina e dióxido de silício. Não contém glúten. Contém lactose. Alérgicos: contém derivados de leite e soja.','manufacturer-label','https://ioprotein.nutrata.com.br/fichas-tecnicas/nature-plasma-iowhey.pdf','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);

-- Source batch: supabase/migrations/20261016240000_seed_supplement_catalog_batch_09_probiotica_nutrata_whey.sql
-- Batch 09: Probiótica and Nutrata whey labels transcribed from published retailer nutrition panels.
-- Source type is explicit because a manufacturer technical sheet was not found for these exact variants.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('100% Pure Whey Doce de Leite 900 g','Probiótica',null,'30 g (2 dosadores); embalagem 900 g','100g',403.3333,66.6667,19.6667,6.3333,4,0,0,15.6667,333.3333,
  '{"rotulo_por_porcao_30g":{"energia_kcal":121,"carboidratos_g":5.9,"acucares_totais_g":4.7,"acucares_adicionados_g":0,"proteinas_g":20,"gorduras_totais_g":1.9,"gorduras_saturadas_g":1.2,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":100},"nota":"Valores de rótulo publicados por varejista; confirmar no rótulo físico antes de uso clínico."}'::jsonb,
  null,'retailer-label-transcription','https://www.biosuplementosbc.com.br/produto/100-pure-whey-900g---vencimento-24122026/2476018','label_transcribed'),
 ('100% Whey Chocolate 900 g','Nutrata',null,'30 g (2 colheres dosadoras); embalagem 900 g','100g',400,63.3333,19,8,4.3333,0,0,10,306.6667,
  '{"rotulo_por_porcao_30g":{"energia_kcal":120,"carboidratos_g":5.7,"acucares_totais_g":3,"acucares_adicionados_g":0,"proteinas_g":19,"gorduras_totais_g":2.4,"gorduras_saturadas_g":1.3,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":92}}'::jsonb,
  'Proteína concentrada do soro do leite (CFM), cacau em pó, aroma de chocolate, goma xantana, ácido cítrico, dióxido de silício e sucralose. Contém lactose. Alérgicos: contém derivados de leite e soja. Não contém glúten.','retailer-label-transcription','https://www.nutrisuplementar.com.br/produto/100-whey-900g/2467105','label_transcribed'),
 ('100% Whey Cookies and Cream 900 g','Nutrata',null,'30 g (2 colheres dosadoras); embalagem 900 g','100g',380,66.6667,13.3333,6.6667,3.3333,0,0,8.3333,306.6667,
  '{"rotulo_por_porcao_30g":{"energia_kcal":114,"carboidratos_g":4,"acucares_totais_g":2.5,"acucares_adicionados_g":0,"proteinas_g":20,"gorduras_totais_g":2,"gorduras_saturadas_g":1,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":92},"aminograma_mg_por_porcao_30g":{"acido_aspartico":2115,"treonina":1399,"serina":1022,"acido_glutamico":3580,"glicina":369,"alanina":1006,"valina":1176,"isoleucina":1154,"leucina":2175,"tirosina":510,"fenilalanina":550,"histidina":312,"lisina":1663,"arginina":486,"prolina":1016,"cistina":369,"metionina":402,"triptofano":294}}'::jsonb,
  'Proteína concentrada do soro do leite (CFM), cookies, aromas, goma xantana, dióxido de silício e sucralose. Contém lactose. Alérgicos: contém derivados de leite e soja. Não contém glúten.','retailer-label-transcription','https://www.nutrisuplementar.com.br/produto/100-whey-900g/2467105','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);

-- Source batch: supabase/migrations/20261016250000_seed_supplement_catalog_batch_10_max_titanium.sql
-- Batch 10: Max Titanium whey labels transcribed from published retailer nutrition panels.
-- Exact flavor/product variant is named; sodium and other macros are normalized per 100 g.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('100% Whey Chocolate 900 g','Max Titanium',null,'40 g (2 dosadores); embalagem 900 g','100g',325,50,32.5,6.5,4,0,0,12.75,262.5,
  '{"rotulo_por_porcao_40g":{"energia_kcal":130,"carboidratos_g":13,"acucares_totais_g":5.1,"acucares_adicionados_g":0.1,"proteinas_g":20,"gorduras_totais_g":2.6,"gorduras_saturadas_g":1.6,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":105}}'::jsonb,
  'Proteína concentrada do soro do leite (WPC), cacau em pó, aromatizantes, lecitina de soja e sucralose. Contém lactose. Alérgicos: contém derivados de leite e soja; pode conter derivados de ovo, amendoim, aveia, avelã, castanha de caju, castanha do Pará, centeio, cevada, macadâmia e nozes.','retailer-label-transcription','https://www.nutrisuplementar.com.br/produto/100-whey-900g/2453315','label_transcribed'),
 ('Top Whey 3W + Sabor 900 g','Max Titanium',null,'40 g (1 dosador de medida); embalagem 900 g','100g',390,62.5,22.5,4.75,2.75,0,2.75,13.75,347.5,
  '{"rotulo_por_porcao_40g":{"energia_kcal":156,"carboidratos_g":9,"acucares_totais_g":5.5,"acucares_adicionados_g":1,"proteinas_g":25,"gorduras_totais_g":1.9,"gorduras_saturadas_g":1.1,"gorduras_trans_g":0,"fibras_g":1.1,"sodio_mg":139,"calcio_mg":138},"aminograma_mg_por_porcao_40g":{"alanina":1255,"arginina":753,"acido_aspartico":2517,"cisteina":1353,"acido_glutamico":4188,"glicina":493,"histidina":587,"isoleucina":1363,"leucina":2614,"lisina":2773,"metionina":464,"fenilalanina":798,"prolina":902,"serina":1337,"treonina":1707,"triptofano":334,"tirosina":713,"valina":1473}}'::jsonb,
  'Blend de proteína concentrada do soro do leite, proteína isolada e proteína hidrolisada do soro do leite; ingredientes aromatizantes variam por sabor. Verificar alergênicos e ingredientes na embalagem da variante escolhida.','retailer-label-transcription','https://www.nutrisuplementar.com.br/produto/top-whey-3w-900g/2450000','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);

-- Source batch: supabase/migrations/20261016260000_seed_supplement_catalog_batch_11_essential_nutrition.sql
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

-- Source batch: supabase/migrations/20261016270000_seed_supplement_catalog_batch_12_dux_smoothie.sql
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

-- Source batch: supabase/migrations/20261016280000_seed_supplement_catalog_batch_13_nutrify_creatine_hmb.sql
-- Batch 13: Nutrify Creatine HMB, official technical sheet with EAN and active compounds.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Creatine HMB Morango 300 g','Nutrify','7896311777631','10 g (1 dosador); embalagem 300 g','100g',380,0,94,0,0,0,0,13,0,
  '{"rotulo_por_porcao_10g":{"energia_kcal":38,"carboidratos_g":9.4,"acucares_totais_g":1.3,"acucares_adicionados_g":1.1,"vitamina_D_ug":22,"vitamina_K_ug":33,"calcio_mg":466,"selenio_ug":60,"zinco_mg":11,"creatina_mg":3000,"coenzima_Q10_mg":100,"HMB_g":3},"observacao":"Rótulo declara quantidades não significativas de proteínas, gorduras, fibras e sódio."}'::jsonb,
  'Hidroximetilbutirato de cálcio, creatina monohidratada, polpa de frutas vermelhas, concentrado de rabanete e cenoura, coenzima Q10, mix de vitaminas e minerais (bisglicinato de zinco, levedura enriquecida com selênio, menaquinona-7 e colecalciferol), aromatizantes, ácido cítrico, glicosídeos de esteviol e ácido málico. Não contém glúten.','manufacturer-label','https://loca.integralmedica.com.br/WebTrade/Produtos/FichaTecnica/77763.pdf','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.barcode=p.barcode
) and not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);

-- Source batch: supabase/migrations/20261016290000_seed_supplement_catalog_batch_14_omega_preworkout.sql
-- Batch 14: official label records for omega-3 and pre-workout/energy products.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('DHA TG Ômega-3 Ultraconcentrado 90 Cápsulas','Essential Nutrition',null,'4.3 g (3 cápsulas); embalagem 90 cápsulas','100g',627.907,0,0,69.7674,0,0,0,0,0,
  '{"rotulo_por_porcao_4_3g":{"energia_kcal":27,"gorduras_totais_g":3,"gorduras_saturadas_g":0,"gorduras_trans_g":0,"gorduras_poli_insaturadas_g":2.8,"omega_3_mg":1950,"EPA_mg":450,"DHA_mg":1500,"vitamina_E_mg":9},"ingredientes":"Óleo de peixe (Pronova Pure ômega-3 TG) e D-alfa-tocoferol; cápsula de gelatina, água purificada e glicerina","alergenicos":"Contém derivados de peixe; pode conter soja. Não contém glúten."}'::jsonb,
  'Óleo de peixe (Pronova Pure ômega-3 TG) e D-alfa-tocoferol. Cápsula: gelatina, água purificada e umectante glicerina. Alérgicos: contém derivados de peixe; pode conter soja. Não contém glúten.','manufacturer-label','https://www.essentialnutrition.com.br/produtos/omega-3/dha-tg-omega-3-ultraconcentrado','label_transcribed'),
 ('Booster Energético Pré-Treino Red Lemonade 269 ml','Integralmédica',null,'269 ml (1 lata); embalagem unitária','100ml',1.8587,null::numeric,0.4461,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,13.7546,
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

-- Source batch: supabase/migrations/20261016300000_seed_supplement_catalog_batch_15_acai_whey.sql
-- Batch 15: Essential Nutrition Acai Whey, official nutrition panel.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Açaí Whey Protein com Açaí e Banana 360 g','Essential Nutrition',null,'30 g (2 colheres-medidas); embalagem 360 g','100g',386.6667,73.3333,10,5.6667,1.6667,0,3.3333,4.6667,320,
  '{"rotulo_por_porcao_30g":{"energia_kcal":116,"carboidratos_g":3,"acucares_totais_g":1.4,"acucares_adicionados_g":0.1,"poliois_g":0,"proteinas_g":22,"gorduras_totais_g":1.7,"gorduras_saturadas_g":0.5,"gorduras_trans_g":0,"gorduras_monoinsaturadas_g":0.9,"omega_9_g":0.8,"gorduras_poliinsaturadas_g":0.2,"omega_6_g":0.1,"fibras_g":1,"sodio_mg":96,"vitamina_E_mg":10,"vitamina_C_mg":45,"calcio_mg":212,"fosforo_mg":117,"magnesio_mg":20}}'::jsonb,
  'Proteínas hidrolisada e isolada do soro de leite (Thermax 690 e Provon 292), colágeno hidrolisado em peptídeos (Peptan), açaí liofilizado em pó, banana liofilizada em pó, polpa de açaí em pó, goma guar, ácido ascórbico, palmitato de ascorbila, acetato de tocoferol, antiumectantes fosfato tricálcico e dióxido de silício, aroma natural e edulcorante glicosídeos de esteviol. Não contém glúten. Alérgicos: contém derivados de leite e soja.','manufacturer-label','https://www.essentialnutrition.com.br/produtos/proteinas/whey/acai-whey-protein-acai-com-banana-sache','label_transcribed'),
 ('Açaí Whey Protein Sachê 30 g','Essential Nutrition',null,'30 g (1 sachê); embalagem unitária','100g',386.6667,73.3333,10,5.6667,1.6667,0,3.3333,4.6667,320,
  '{"rotulo_por_sache_30g":{"energia_kcal":116,"carboidratos_g":3,"acucares_totais_g":1.4,"acucares_adicionados_g":0.1,"poliois_g":0,"proteinas_g":22,"gorduras_totais_g":1.7,"gorduras_saturadas_g":0.5,"gorduras_trans_g":0,"gorduras_monoinsaturadas_g":0.9,"omega_9_g":0.8,"gorduras_poliinsaturadas_g":0.2,"omega_6_g":0.1,"fibras_g":1,"sodio_mg":96,"vitamina_E_mg":10,"vitamina_C_mg":45,"calcio_mg":212,"fosforo_mg":117,"magnesio_mg":20}}'::jsonb,
  'Proteínas hidrolisada e isolada do soro de leite (Thermax 690 e Provon 292), colágeno hidrolisado em peptídeos (Peptan), açaí liofilizado em pó, banana liofilizada em pó, polpa de açaí em pó, goma guar, ácido ascórbico, palmitato de ascorbila, acetato de tocoferol, antiumectantes fosfato tricálcico e dióxido de silício, aroma natural e edulcorante glicosídeos de esteviol. Não contém glúten. Alérgicos: contém derivados de leite e soja.','manufacturer-label','https://www.essentialnutrition.com.br/produtos/acai-whey-sache-avulso','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);

-- Source batch: supabase/migrations/20261016310000_seed_supplement_catalog_batch_16_nutrify_whey.sql
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

-- Source batch: supabase/migrations/20261016320000_seed_supplement_catalog_batch_17_black_skull_whey.sql
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

-- Source batch: supabase/migrations/20261016330000_seed_supplement_catalog_batch_18_black_skull_creatine.sql
-- Batch 18: Black Skull creatine variants listed by the official manufacturer.
-- The manufacturer page confirms ingredients and serving directions, but not a machine-readable nutrition panel.
-- Do not infer energy/macronutrient values: keep them NULL and mark records for label verification.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Creatine Monohidratada 300 g — Sem Sabor','Black Skull',null,'5 g (1 dosador); embalagem 300 g','100g',null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,
  '{"ativo_declarado":"creatina monohidratada","porcao_declarada_g":5,"nota":"Tabela nutricional completa não transcrita; confirmar rótulo físico antes de preencher macros."}'::jsonb,
  'Creatina monohidratada. Não contém glúten.','manufacturer-product-page','https://www.blackskullusa.com.br/creatine-creatina-monohidratada-300g/p','needs_verified_product_data'),
 ('Creatine Monohidratada 300 g — Laranja','Black Skull',null,'6 g (1 dosador); embalagem 300 g','100g',null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,
  '{"ativo_declarado":"creatina monohidratada","porcao_declarada_g":6,"nota":"Tabela nutricional completa não transcrita; confirmar rótulo físico antes de preencher macros."}'::jsonb,
  'Creatina monohidratada, acidulante ácido málico, antiumectante dióxido de silício, aromatizante, corante extrato de urucum/base norbixina e edulcorante sucralose. Não contém glúten.','manufacturer-product-page','https://www.blackskullusa.com.br/creatine-creatina-monohidratada-300g/p','needs_verified_product_data'),
 ('Creatine Monohidratada 300 g — Limão','Black Skull',null,'6 g (1 dosador); embalagem 300 g','100g',null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,
  '{"ativo_declarado":"creatina monohidratada","porcao_declarada_g":6,"nota":"Tabela nutricional completa não transcrita; confirmar rótulo físico antes de preencher macros."}'::jsonb,
  'Creatina monohidratada, acidulante ácido málico, antiumectante dióxido de silício, aromatizante, corante sais de potássio e sódio de complexos cúpricos de clorofilinas e edulcorante sucralose. Não contém glúten.','manufacturer-product-page','https://www.blackskullusa.com.br/creatine-creatina-monohidratada-300g/p','needs_verified_product_data')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);

-- Source batch: supabase/migrations/20261016340000_seed_supplement_catalog_batch_19_black_skull_whey80.sql
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

-- Source batch: supabase/migrations/20261016350000_seed_supplement_catalog_batch_20_darkness_whey_creatine.sql
-- Batch 20: Darkness products transcribed from the official manufacturer/store nutrition tables.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Dark Whey Proteína Concentrada Baunilha 900 g','Darkness',null,'40 g (2 dosadores); cerca de 23 porções por embalagem de 900 g','100g',400,75,10.5,6.5,3.25,0,0,5.75,207.5,
  '{"rotulo_por_porcao_40g":{"energia_kcal":160,"carboidratos_g":4.2,"acucares_totais_g":2.3,"acucares_adicionados_g":0,"proteinas_g":30,"histidina_mg":556,"isoleucina_mg":1759,"leucina_mg":3072,"lisina_mg":2708,"cisteina_mg":645,"metionina_mg":627,"tirosina_mg":938,"fenilalanina_mg":1004,"treonina_mg":2048,"triptofano_mg":529,"valina_mg":1720,"acido_aspartico_mg":3108,"serina_mg":1544,"acido_glutamico_mg":5302,"glicina_mg":559,"alanina_mg":1421,"arginina_mg":798,"prolina_mg":1775,"gorduras_totais_g":2.6,"gorduras_saturadas_g":1.3,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":83}}'::jsonb,
  'Proteína de soro do leite concentrada, aromatizante e edulcorante sucralose. Alérgicos: contém derivados de leite e soja. Contém lactose. Não contém glúten.',
  'manufacturer-label','https://www.darkness.com.br/whey-protein-concentrado-900g-darkness/p?sabor=Baunilha&tamanho=900g','label_transcribed'),
 ('Creatina Monohidratada Darkness 300 g','Darkness',null,'3 g (1 dosador); embalagem 300 g','100g',null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,
  '{"rotulo_por_porcao_3g":{"creatina_mg":3000},"nota":"A tabela oficial declara creatina por porção; macros/energia não foram informados na tabela publicada."}'::jsonb,
  'Creatina monohidratada.','manufacturer-label','https://www.darkness.com.br/creatina-pura-300g-darkness/p?sabor=Sem+sabor&tamanho=300g','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);

-- Source batch: supabase/migrations/20261016360000_seed_supplement_catalog_batch_21_darkness_carnibol.sql
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

-- Source batch: supabase/migrations/20261016370000_seed_supplement_catalog_batch_22_darkness_evora_pw.sql
-- Batch 22: Darkness Évora PW pre-workout, official Frutas Amarelas label.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Pré-Treino Évora PW Frutas Amarelas 300 g','Darkness',null,'5 g (1 dosador); 60 porções por embalagem de 300 g','100g',240,0,18,null::numeric,null::numeric,null::numeric,null::numeric,10,0,
  '{"rotulo_por_porcao_5g":{"energia_kcal":12,"carboidratos_g":0.9,"acucares_totais_g":0.5,"acucares_adicionados_g":0.5,"proteinas_g":0,"beta_alanina_mg":2000,"taurina_mg":1200,"cafeina_mg":200},"sodio_mg":0}'::jsonb,
  'Beta-alanina, taurina, isomaltulose (Palatinose), cafeína, aromatizante, acidulante ácido cítrico, antiumectante dióxido de silício, edulcorante sucralose e corante artificial tartrazina. Não contém glúten.',
  'manufacturer-label','https://www.darkness.com.br/pre-treino-evora/p?sabor=Frutas+Amarelas&tamanho=300g','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);

-- Source batch: supabase/migrations/20261016380000_seed_supplement_catalog_batch_23_dux_whey_sachet.sql
-- Batch 23: DUX Whey Protein Concentrado sachet, official 30 g nutrition table.
-- The page exposes a flavor selector and the following label table; do not extrapolate it to other flavors.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Whey Protein Concentrado DUX Sachê 30 g — Baunilha','DUX',null,'30 g (1 sachê); embalagem unitária','100g',406.6667,66.6667,19,7,4.3333,null::numeric,null::numeric,16.6667,380,
  '{"rotulo_por_sache_30g":{"energia_kcal":122,"carboidratos_g":5.7,"acucares_totais_g":5,"acucares_adicionados_g":0,"proteinas_g":20,"gorduras_totais_g":2.1,"gorduras_saturadas_g":1.3,"sodio_mg":114},"nota":"Trans fats and dietary fiber are not specified in the published table."}'::jsonb,
  null::text,'manufacturer-label','https://www.duxhumanhealth.com/wheyproteinconcentrado-1sache/p?idsku=2883','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);

-- Source batch: supabase/migrations/20261016390000_seed_supplement_catalog_batch_24_integralmedica_creapure.sql
-- Batch 24: Integralmédica Creatina Creapure 300 g, official table of nutrition.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Creatina Creapure 300 g — Neutro','Integralmédica',null,'5 g (1 dosador); embalagem 300 g','100g',null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,
  '{"rotulo_por_porcao_5g":{"creatina_mg":5000},"nota":"Tabela oficial publica creatina por porção; energia e macros não aparecem como valores declarados."}'::jsonb,
  'Creatina monohidratada. Alérgicos: pode conter leite, soja e ovo. Não contém glúten.',
  'manufacturer-label','https://www.integralmedica.com.br/creatina-creapure-300g/p','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);

-- Source batch: supabase/migrations/20261016400000_seed_supplement_catalog_batch_25_integralmedica_my_whey.sql
-- Batch 25: Integralmédica MY WHEY 900 g; flavor-specific official tables and amino acid profiles.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('MY WHEY Integralmedica Shake de Chocolate 900 g','Integralmédica',null,'40 g (2 dosadores); 23 porções por embalagem de 900 g','100g',380,52.5,30,5,3,0,2.75,25,385,
  '{"rotulo_por_porcao_40g":{"energia_kcal":152,"carboidratos_g":12,"acucares_totais_g":10,"acucares_adicionados_g":0,"proteinas_g":21,"histidina_mg":352,"isoleucina_mg":1210,"leucina_mg":2104,"lisina_mg":1902,"cisteina_mg":448,"metionina_mg":457,"tirosina_mg":605,"fenilalanina_mg":676,"treonina_mg":1457,"triptofano_mg":336,"valina_mg":1169,"acido_aspartico_mg":2243,"serina_mg":1100,"acido_glutamico_mg":3512,"glicina_mg":404,"alanina_mg":989,"arginina_mg":538,"prolina_mg":1167,"gorduras_totais_g":2,"gorduras_saturadas_g":1.2,"gorduras_trans_g":0,"fibras_g":1.1,"sodio_mg":154}}'::jsonb,
  'Proteína de soro de leite concentrada, cacau em pó solúvel, cloreto de sódio, cloreto de potássio, aromatizantes, goma xantana, goma guar e sucralose. Alérgicos: contém derivados de leite e soja. Contém lactose. Não contém glúten.',
  'manufacturer-label','https://www.integralmedica.com.br/my-whey-po-pote/p?sabor=Shake+de+Chocolate&tamanho=900g','label_transcribed'),
 ('MY WHEY Integralmedica Shake de Baunilha 900 g','Integralmédica',null,'40 g (2 dosadores); 23 porções por embalagem de 900 g','100g',385,52.5,32.5,4.75,3,0,1.25,30,315,
  '{"rotulo_por_porcao_40g":{"energia_kcal":154,"carboidratos_g":13,"acucares_totais_g":12,"acucares_adicionados_g":0,"proteinas_g":21,"histidina_mg":362,"isoleucina_mg":1233,"leucina_mg":2149,"lisina_mg":1952,"cisteina_mg":454,"metionina_mg":462,"tirosina_mg":613,"fenilalanina_mg":691,"treonina_mg":1490,"triptofano_mg":338,"valina_mg":1189,"acido_aspartico_mg":2301,"serina_mg":1123,"acido_glutamico_mg":3585,"glicina_mg":412,"alanina_mg":1008,"arginina_mg":549,"prolina_mg":1183,"gorduras_totais_g":1.9,"gorduras_saturadas_g":1.2,"gorduras_trans_g":0,"fibras_g":0.5,"sodio_mg":126}}'::jsonb,
  'Proteína de soro de leite concentrada, aromatizantes, goma xantana, goma guar e sucralose. Alérgicos: contém leite, derivados de leite e soja. Contém lactose. Não contém glúten.',
  'manufacturer-label','https://www.integralmedica.com.br/my-whey-po-pote/p?sabor=Shake+de+Baunilha&tamanho=900g','label_transcribed'),
 ('MY WHEY Integralmedica Shake de Morango 900 g','Integralmédica',null,'40 g (2 dosadores); 23 porções por embalagem de 900 g','100g',382.5,52.5,32.5,4.5,2.75,0,1.25,27.5,312.5,
  '{"rotulo_por_porcao_40g":{"energia_kcal":153,"carboidratos_g":13,"acucares_totais_g":11,"acucares_adicionados_g":0,"proteinas_g":21,"histidina_mg":362,"isoleucina_mg":1234,"leucina_mg":2151,"lisina_mg":1954,"cisteina_mg":454,"metionina_mg":463,"tirosina_mg":613,"fenilalanina_mg":692,"treonina_mg":1491,"triptofano_mg":338,"valina_mg":1189,"acido_aspartico_mg":2303,"serina_mg":1124,"acido_glutamico_mg":3588,"glicina_mg":413,"alanina_mg":1008,"arginina_mg":550,"prolina_mg":1183,"gorduras_totais_g":1.8,"gorduras_saturadas_g":1.1,"gorduras_trans_g":0,"fibras_g":0.5,"sodio_mg":125}}'::jsonb,
  'Proteína de soro de leite concentrada, aromatizantes, goma xantana, goma guar, sucralose e corantes carmim e bordeaux S. Alérgicos: contém derivados de leite e soja. Contém lactose. Não contém glúten.',
  'manufacturer-label','https://www.integralmedica.com.br/my-whey-po-pote/p?sabor=Shake+de+Morango&tamanho=900g','label_transcribed')
)
insert into public.supplement_catalog
(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status,verified_at)
select p.name,p.brand,p.barcode,p.serving_size,p.nutrition_basis,p.calories_kcal,p.protein_g,p.carbohydrates_g,p.total_fat_g,p.saturated_fat_g,p.trans_fat_g,p.fiber_g,p.sugars_g,p.sodium_mg,p.micronutrients,p.ingredients,p.source,p.source_url,p.data_status,now()
from products p
where not exists (
 select 1 from public.supplement_catalog s
 where s.name=p.name and coalesce(s.brand,'')=coalesce(p.brand,'') and coalesce(s.source_url,'')=coalesce(p.source_url,'')
);
