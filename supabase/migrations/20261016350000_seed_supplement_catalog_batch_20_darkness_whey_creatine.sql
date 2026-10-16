-- Batch 20: Darkness products transcribed from the official manufacturer/store nutrition tables.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Dark Whey Proteína Concentrada Baunilha 900 g','Darkness',null,'40 g (2 dosadores); cerca de 23 porções por embalagem de 900 g','100g',400,75,10.5,6.5,3.25,0,0,5.75,207.5,
  '{"rotulo_por_porcao_40g":{"energia_kcal":160,"carboidratos_g":4.2,"acucares_totais_g":2.3,"acucares_adicionados_g":0,"proteinas_g":30,"histidina_mg":556,"isoleucina_mg":1759,"leucina_mg":3072,"lisina_mg":2708,"cisteina_mg":645,"metionina_mg":627,"tirosina_mg":938,"fenilalanina_mg":1004,"treonina_mg":2048,"triptofano_mg":529,"valina_mg":1720,"acido_aspartico_mg":3108,"serina_mg":1544,"acido_glutamico_mg":5302,"glicina_mg":559,"alanina_mg":1421,"arginina_mg":798,"prolina_mg":1775,"gorduras_totais_g":2.6,"gorduras_saturadas_g":1.3,"gorduras_trans_g":0,"fibras_g":0,"sodio_mg":83}}'::jsonb,
  'Proteína de soro do leite concentrada, aromatizante e edulcorante sucralose. Alérgicos: contém derivados de leite e soja. Contém lactose. Não contém glúten.',
  'manufacturer-label','https://www.darkness.com.br/whey-protein-concentrado-900g-darkness/p?sabor=Baunilha&tamanho=900g','label_transcribed'),
 ('Creatina Monohidratada Darkness 300 g','Darkness',null,'3 g (1 dosador); embalagem 300 g','100g',null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,
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
