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
