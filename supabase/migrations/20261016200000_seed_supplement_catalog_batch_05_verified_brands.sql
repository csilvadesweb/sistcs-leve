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
