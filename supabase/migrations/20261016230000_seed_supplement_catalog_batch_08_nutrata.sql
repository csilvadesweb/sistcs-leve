-- Batch 08: Nutrata Plasma ioWhey Chocolate Cream, transcribed from the official technical sheet.
with products(name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,trans_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source,source_url,data_status) as (
 values
 ('Plasma ioWHEY Chocolate Cream 432 g','Nutrata / Nature Real Nutrition','7898599214983','24 g (2 colheres dosadoras); embalagem 432 g','100g',429.1667,70.8333,14.5833,9.5833,5.8333,0,null,null,null,
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
