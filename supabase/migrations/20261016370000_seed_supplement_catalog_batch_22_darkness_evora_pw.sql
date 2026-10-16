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
