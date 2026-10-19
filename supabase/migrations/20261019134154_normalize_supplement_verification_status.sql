-- Correct verification status for rows missing source or core nutrition fields.
-- This keeps incomplete labels out of the ready-to-search catalog.
update public.supplement_catalog
set data_status = 'needs_verified_product_data',
    updated_at = now()
where data_status = 'label_transcribed'
  and (
    source_url is null or btrim(source_url) = ''
    or calories_kcal is null
    or protein_g is null
    or carbohydrates_g is null
    or total_fat_g is null
  );
