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
