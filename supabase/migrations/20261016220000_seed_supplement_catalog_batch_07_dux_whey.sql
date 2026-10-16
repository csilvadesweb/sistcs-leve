-- Batch 07: DUX whey isolate and hydro variants from the brand's published nutrition tables.
-- Variant-specific source values are preserved per serving in JSON; normalized macros are per 100 g.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Whey Protein Isolado Neutro 900 g','DUX Human Health',null,'28 g (1 dosador); embalagem 900 g','100g',375,85.7143,2.8571,2.1429,1.0714,null,null,2.1429,421.4286,
  '{"rotulo_por_porcao_28g":{"energia_kcal":105,"carboidratos_g":0.8,"acucares_totais_g":0.6,"proteinas_g":24,"gorduras_totais_g":0.6,"gorduras_saturadas_g":0.3,"sodio_mg":118},"aminograma_mg_por_porcao_28g":{"histidina":400,"isoleucina":1400,"leucina":2500,"lisina":2200,"cisteina":500,"metionina":500,"tirosina":700,"fenilalanina":700,"treonina":1600,"triptofano":400,"valina":1300,"aspartato":2500,"serina":1000,"glutamina":4100,"glicina":400,"alanina":1100,"arginina":500,"prolina":1400}}'::jsonb,
  'Proteína de soro do leite isolada. Alérgicos: contém derivados de soja e leite; pode conter trigo, aveia, peixes, amendoim, amêndoa, avelãs, castanha-de-caju, nozes e pistaches. Contém lactose e glúten.','manufacturer-label','https://www.duxhumanhealth.com/wheyproteinisolado-pote900g/p','label_transcribed'),
 ('Whey Protein Hydro Baunilha 900 g','DUX Human Health',null,'30 g (1 dosador); embalagem 900 g','100g',373.3333,83.3333,5.3333,2,1,null,null,1.6667,323.3333,
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
