# Bubble Data Model Audit

Source: `https://nexus-77465.bubbleapps.io/version-test/materialscatalog_page?v=materials` runtime `dynamic.js`.

Boundary: this was extracted from the public Bubble runtime payload, not the Bubble editor UI. It exposes data type and option-set metadata shipped to the browser. It does not prove backend workflows, privacy rules, or actual database rows unless values are present in the runtime payload.

## App metadata

- App ID: `nexus-77465`
- App version: `test`
- Last change: `58100047696`

## Data types

### `user` — User

- `dob_date`: DOB - deleted — `date` (deleted)
- `dob1_date`: DOB — `date`
- `name_text`: First Name — `text`
- `avatar_image`: avatar — `image`
- `job_title_text`: Job Title — `text`
- `last_name_text`: Last Name — `text`
- `phone_number_text`: phone number — `text`
- `phone_number_number`: Phone Number - deleted — `number` (deleted)
- `workspace_role_option_workspace_role`: Workspace Role — `option.workspace_role`
- `company_address__custom_company_information`: Company Address  — `custom.company_information`
- `onboarded_companies_option_onboarded_companies`: Onboarded Companies — `option.onboarded_companies`

### `quote` — Quotes

- `notes_text`: Notes — `text`
- `quote_id_text`: Quote ID - deleted — `text` (deleted)
- `part_name_text`: Part Name — `text`
- `quote_id_number`: Quote ID — `number`
- `valid_unitl_date`: Valid Unitl — `date`
- `total_price_number`: Total Price — `number`
- `number_of_parts_number`: Quantity — `number`
- `yes_no_testing_boolean`: YES NO TESTING - deleted — `boolean` (deleted)
- `related_cad_file_custom_cadfile`: Related CAD File — `custom.cadfile`
- `lead_time__business_days___number`: Lead Time (business days)  — `number`
- `quote_status__option_quote_status`: Status — `option.quote_status`
- `company_option_onboarded_companies`: Company — `option.onboarded_companies`
- `quote_line_items_custom_quote_line_items`: Quote Line Items - deleted — `custom.quote_line_items` (deleted)
- `quote_line_items1_custom_quote_line_items`: Quote Line Items — `custom.quote_line_items`
- `quote_line_items_list_custom_quote_line_items`: Quote Line Items - deleted — `list.custom.quote_line_items` (deleted)
- `quote_line_items1_list_custom_quote_line_items`: Quote Line Items - deleted — `list.custom.quote_line_items` (deleted)

### `orders` — Orders

- `total_price_number`: Total Price — `number`
- `related_quote_custom_quote`: Related Quote — `custom.quote`

### `cadfile` — Part

- `file_file`: cad_file — `file`
- `glb_url_text`: glb_url — `text`
- `file_name_text`: cad_filename — `text`
- `description_text`: description — `text`
- `phone_number_text`: phone number - deleted — `text` (deleted)
- `file_extension_text`: file_extension — `text`
- `phone_number_number`: Phone Number - deleted — `number` (deleted)
- `conversion_error_text`: conversion_error — `text`
- `thumbnail_image_image`: thumbnail_image — `image`
- `conversion_job_id_text`: conversion_job_id — `text`
- `conversion_status_text`: conversion_status — `text`
- `file_size_bytes_number`: file_size_bytes — `number`
- `preview_image_url_text`: preview_image_url — `text`
- `uploaded_by_user_id_text`: uploaded_by_user_id — `text`

### `material` — Materials

- `specs_text`: Specs — `text`
- `density_text`: Density - deleted — `text` (deleted)
- `image__image`: Image  — `image`
- `material__text`: Material Name — `text`
- `density__number`: Density  — `number`
- `hardness_number`: Hardness — `number`
- `material_type__text`: Material Type  - deleted — `text` (deleted)
- `secondary_name_text`: Secondary Name — `text`
- `tensile_strength__number`: Tensile Strength  — `number`
- `industry_tags__option_tags`: Industry Tags  — `option.tags`
- `alternate_designations__text`: Alternate Designations  — `text`
- `material_cost__option_material_cost`: Material Cost  — `option.material_cost`
- `material_type__option_material_category`: Material Type  — `option.material_category`
- `machining_difficulty_option_machining_difficulty`: Machining Difficulty — `option.machining_difficulty` (default `medium`)

### `transaction` — Transaction

- `user_user`: user — `user`
- `amount_number`: amount — `number`

### `notification` — Notification

- `body_text`: Body — `text`
- `seen_boolean`: Seen — `boolean`
- `recipient_user`: Recipient — `user`

### `quotecounter` — Quotecounter

- `year_number`: year — `number`
- `counter_number`: counter — `number`

### `order_line_items` — Order Line Items

- `qty_number`: Qty — `number`

### `quote_line_items` — Quote Line Items

- `part_name_text`: Part Name — `text`
- `part_files_file`: Part Files (CAD) — `file`
- `quantity_number`: Quantity — `number`
- `threads__boolean`: Threads? — `boolean`
- `unit_price_number`: Unit Price — `number`
- `quote_custom_quote`: Parent Quote — `custom.quote`
- `total_price_number`: Total Price — `number`
- `part_file__pdf__file`: Part File (PDF) — `file`
- `part_markings_boolean`: Part Markings — `boolean`
- `engineering_fits_boolean`: Engineering Fits — `boolean`
- `material_custom_material`: Material (revisit if spotted in automation)  — `custom.material`
- `part_file__pdf__url_text`: Part File (PDF) URL — `text`
- `quote_line_item_id_number`: Quote_line_Item_ID - deleted — `number` (deleted)
- `sharp_internal_corners__boolean`: Sharp Internal Corners  — `boolean`
- `surface_finish_option_surface_finish`: Surface Finish - deleted — `option.surface_finish` (deleted)
- `material__option_set__option_materials`: Material (option set) - deleted — `option.materials` (deleted)
- `materials__option_set__option_materials`: Materials (option set) — `option.materials`
- `general_tolerance__option_general_tolerance`: General Tolerance  — `option.general_tolerance`
- `surface_finish_option_surface_finish_options`: Surface Finish — `option.surface_finish_options`
- `linear_tolerance_tighter_than_general_tolerance_boolean`: Linear Tolerance Tighter Than General Tolerance — `boolean`
- `quality_documentation_list_option_quality_documentation`: Quality Documentation — `list.option.quality_documentation`

### `company_information` — Company Information

- `city_text`: City — `text`
- `zip_code_number`: Zip Code — `number`
- `state_option_state`: State — `option.state`
- `street_address_text`: Street Address — `text`

## Option sets

### `tags` — Tags

- `maritime`: Maritime [Bubble id `bTIAK`, sort 1] 
- `oil___gas`: Oil & Gas [Bubble id `bTIAL`, sort 2] 
- `space`: Space [Bubble id `bTIAP`, sort 3] 
- `aerospace`: Aerospace [Bubble id `bTIAQ`, sort 4] 
- `plastic`: Plastic [Bubble id `bTIBL`, sort 5] 

### `state` — State

- No values exposed in runtime payload.

### `materials` — Materials

- `pvc`: PVC [Bubble id `bTKTt`, sort 1] 
- `in_625`: IN 625 [Bubble id `bTKTu`, sort 2] 
- `ss_303`: SS 303 [Bubble id `bTKTv`, sort 3] 
- `ss_304`: SS 304 [Bubble id `bTKTz`, sort 4] 
- `ss_316`: SS 316 [Bubble id `bTKUA`, sort 5] 
- `ss_300`: SS 300 [Bubble id `bTKUF`, sort 6] 

### `quote_status` — Quote Status

- `draft`: Draft [Bubble id `bTKCF`, sort 1] 
- `requested`: Requested [Bubble id `bTIoq0`, sort 2] 
- `in_review`: Under Review [Bubble id `bTIor0`, sort 3] 
- `purchased`: Purchased [Bubble id `bTIov0`, sort 4] 
- `priced`: Priced [Bubble id `bTKCG`, sort 5]  (deleted)

### `material_cost` — Material Cost

- `_`: $ [Bubble id `bTIAD`, sort 1] 
- `__`: $$ [Bubble id `bTIAE`, sort 2] 
- `___`: $$$ [Bubble id `bTIAF`, sort 3] 
- `____`: $$$$ [Bubble id `bTIAJ`, sort 4] 

### `surface_finish` — Surface Finish — deleted

- No values exposed in runtime payload.

### `workspace_role` — Workspace Role

- `owner`: Owner [Bubble id `bTJNh0`, sort 1] 
- `admin`: Admin [Bubble id `bTJOD0`, sort 2] 
- `member`: Member [Bubble id `bTJOE0`, sort 3] 

### `general_tolerance` — General Tolerance

- `iso_2768_medium__m_`: ISO 2768 Medium (m) [Bubble id `bTKGC`, sort 1] 
- `iso_2768_fine__f_`: ISO 2768 Fine (f) [Bubble id `bTKGD`, sort 2] 

### `material_category` — Material Category

Attributes:
- `%d3`: Description — `text`

- `aluminum`: Aluminum [Bubble id `bTHzl`, sort 1]  — has description
- `stainless_steel`: Stainless steel [Bubble id `bTHzm`, sort 2]  — has description
- `mild_steel`: Mild steel [Bubble id `bTHzn`, sort 3]  — has description
- `brass`: Brass [Bubble id `bTHzr`, sort 4]  — has description
- `copper`: Copper [Bubble id `bTHzs`, sort 5]  — has description
- `alloy_steel`: Alloy steel [Bubble id `bTHzt`, sort 6]  — has description
- `tool_steel`: Tool steel [Bubble id `bTHzx`, sort 7]  — has description
- `titanium`: Titanium [Bubble id `bTHzy`, sort 8]  — has description
- `inconel_incoloy`: Inconel/Incoloy [Bubble id `bTHzz`, sort 9]  — has description

### `general_tolerances` — General Tolerances — deleted

- No values exposed in runtime payload.

### `onboarded_companies` — Onboarded Companies

- `amogy`: Amogy Inc. [Bubble id `bTIsm`, sort 1] 

### `user_email_settings` — User Email Settings

- `roadmap_updates`: Roadmap Updates [Bubble id `bTJXV`, sort 1] 
- `offers`: Offers [Bubble id `bTJXW`, sort 2] 
- `order_updates`: Order Updates [Bubble id `bTJXX`, sort 3] 
- `vendor_comms`: Vendor Comms [Bubble id `bTJXb`, sort 4] 
- `marketing`: Marketing [Bubble id `bTJXc`, sort 5] 

### `machining_difficulty` — Machining Difficulty

- `easy`: Easy [Bubble id `bTIAV`, sort 1] 
- `medium`: Medium [Bubble id `bTIAW`, sort 2] 
- `hard`: Hard [Bubble id `bTIAX`, sort 3] 

### `quality_documentation` — Quality Documentation

- `cmm`: Standard Inspection  [Bubble id `bTKkm`, sort 1] 
- `dimensional_inspection_report`: Dimensional Inspection Report [Bubble id `bTKkn`, sort 2] 
- `coc`: Formal Inspection with Dimensional Report [Bubble id `bTKkr`, sort 3] 
- `fai`: CMM Inspection with Dimensional Report [Bubble id `bTKnx`, sort 4] 
- `fat`: First Article Inspection Report (FAIR AS9102) [Bubble id `bTKny`, sort 5] 
- `reach_compliance_declaration`: Source Inspection [Bubble id `bTKnz`, sort 6] 
- `iso_90001`: Build and Hold First Article Inspection [Bubble id `bTKoD`, sort 7] 
- `custom_inspection`: Custom Inspection [Bubble id `bTKoP`, sort 8] 
- `material_test_report__mtr_`: Material Test Report (MTR) [Bubble id `bTKoQ`, sort 9] 

### `fabrication_capability` — Fabrication Capability

Attributes:
- `active`: Active — `boolean`

- `cnc_milling`: CNC Milling [Bubble id `bTIpa0`, sort 1]  (active `True`)
- `cnc_turning`: CNC Turning [Bubble id `bTIpb0`, sort 2]  (active `True`)
- `sheet_metal_fabrication`: Sheet Metal Fabrication [Bubble id `bTIrv0`, sort 3] 
- `injection_molding_services`: Injection Molding Services [Bubble id `bTIrw0`, sort 4] 
- `selective_laser_sintering__sls_`: Selective Laser Sintering (SLS) [Bubble id `bTIrx0`, sort 5] 
- `fused_deposition_modeling__fdm_`: Fused Deposition Modeling (FDM) [Bubble id `bTIsB0`, sort 6] 

### `surface_finish_options` — Surface Finish Options

- `as_machined__ra_3_2__m___ra_126__in_`: As machined (Ra 3.2 µm / Ra 126 µin) [Bubble id `bTKFX`, sort 1] 
- `as_machined___anodized_type_ii`: As machined + Anodized type II [Bubble id `bTKFY`, sort 2] 
- `bead_blasted___anodized_type_ii__matte_`: Bead blasted + Anodized type II (Matte) [Bubble id `bTKFZ`, sort 3] 
- `chromate_conversion_coating`: Chromate Conversion Coating [Bubble id `bTKFd`, sort 4] 
- `smooth_machining__ra_1_6__m___ra_63__in_`: Smooth machining (Ra 1.6 µm / Ra 63 µin) [Bubble id `bTKFe`, sort 5] 
- `bead_blasted`: Bead blasted [Bubble id `bTKFf`, sort 6] 
- `as_machined___anodized_type_iii__hardcoat_`: As machined + Anodized type III (Hardcoat) [Bubble id `bTKFj`, sort 7] 
- `bead_blasted___anodized_type_ii__glossy_`: Bead Blasted + Anodized type II (Glossy) [Bubble id `bTKFk`, sort 8] 
- `brushed__ra_1_2__m___ra_47__in_`: Brushed (Ra 1.2 µm / Ra 47 µin) [Bubble id `bTKFl`, sort 9] 
- `brushed___anodized_type_ii__glossy_`: Brushed + Anodized type II (Glossy) [Bubble id `bTKFp`, sort 10] 
- `powder_coated`: Powder coated [Bubble id `bTKFq`, sort 11] 
- `polishing__ra_0_8__m___ra_32__in_`: Polishing (Ra 0.8 µm / Ra 32 µin) [Bubble id `bTKFr`, sort 12] 
- `electroless_nickel_plating`: Electroless Nickel Plating [Bubble id `bTKFv`, sort 13] 
- `fine_machining__ra_0_8__m___ra_32__in_`: Fine machining (Ra 0.8 µm / Ra 32 µin) [Bubble id `bTKFw`, sort 14] 
- `bead_blasted___anodized_type_iii__hardcoat_`: Bead Blasted + Anodized type III (Hardcoat) [Bubble id `bTKFx`, sort 15] 
- `bead_blasted___chromate_conversion_coating`: Bead Blasted + Chromate Conversion Coating [Bubble id `bTKGB`, sort 16] 

## Local emulation recommendation

- Keep Bubble option sets as stable string enums/lookup tables in owned code; do not preserve opaque Bubble IDs except in migration/reference metadata.
- Convert `quote`, `quote_line_items`, `orders`, `cadfile`, `material`, `company_information`, and `user` into Prisma models once persistence becomes the focus.
- Treat deleted Bubble fields/options as migration notes only; do not build new UI around them.
- The current local `Request` / `RequestLineItem` model overlaps most closely with Bubble `quote` / `quote_line_items`; a later migration should either rename local concepts or add explicit Quote/Order models to preserve Bubble vocabulary.
