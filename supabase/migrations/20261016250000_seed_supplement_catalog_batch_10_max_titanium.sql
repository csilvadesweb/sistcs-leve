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
