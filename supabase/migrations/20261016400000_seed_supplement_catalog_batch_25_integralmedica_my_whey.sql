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
