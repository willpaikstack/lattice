// Extracted from Bubble runtime dynamic.js for nexus-77465/version-test.
// Source route inspected: /version-test/materialscatalog_page?v=materials
// Keep this as a local reference model while translating Bubble data structures into owned code.

export type BubbleField = {
  display: string;
  valueType: string;
  defaultValue?: string | number | boolean;
  deleted?: true;
};

export type BubbleOptionValue = {
  id: string;
  display: string;
  dbValue?: string;
  sortFactor?: number;
  description?: string;
  deleted?: true;
  active?: boolean;
};

export type BubbleDataType = {
  display: string;
  fields: Record<string, BubbleField>;
};

export type BubbleOptionSet = {
  display: string;
  deleted?: true;
  attributes?: Record<string, BubbleField>;
  values: BubbleOptionValue[];
};

export const bubbleSchema = {
  "appId": "nexus-77465",
  "appVersion": "test",
  "lastChange": "58100047696",
  "dataTypes": {
    "user": {
      "display": "User",
      "fields": {
        "dob_date": {
          "display": "DOB - deleted",
          "valueType": "date",
          "deleted": true
        },
        "dob1_date": {
          "display": "DOB",
          "valueType": "date"
        },
        "name_text": {
          "display": "First Name",
          "valueType": "text"
        },
        "avatar_image": {
          "display": "avatar",
          "valueType": "image"
        },
        "job_title_text": {
          "display": "Job Title",
          "valueType": "text"
        },
        "last_name_text": {
          "display": "Last Name",
          "valueType": "text"
        },
        "phone_number_text": {
          "display": "phone number",
          "valueType": "text"
        },
        "phone_number_number": {
          "display": "Phone Number - deleted",
          "valueType": "number",
          "deleted": true
        },
        "workspace_role_option_workspace_role": {
          "display": "Workspace Role",
          "valueType": "option.workspace_role"
        },
        "company_address__custom_company_information": {
          "display": "Company Address ",
          "valueType": "custom.company_information"
        },
        "onboarded_companies_option_onboarded_companies": {
          "display": "Onboarded Companies",
          "valueType": "option.onboarded_companies"
        }
      }
    },
    "quote": {
      "display": "Quotes",
      "fields": {
        "notes_text": {
          "display": "Notes",
          "valueType": "text"
        },
        "quote_id_text": {
          "display": "Quote ID - deleted",
          "valueType": "text",
          "deleted": true
        },
        "part_name_text": {
          "display": "Part Name",
          "valueType": "text"
        },
        "quote_id_number": {
          "display": "Quote ID",
          "valueType": "number"
        },
        "valid_unitl_date": {
          "display": "Valid Unitl",
          "valueType": "date"
        },
        "total_price_number": {
          "display": "Total Price",
          "valueType": "number"
        },
        "number_of_parts_number": {
          "display": "Quantity",
          "valueType": "number"
        },
        "yes_no_testing_boolean": {
          "display": "YES NO TESTING - deleted",
          "valueType": "boolean",
          "deleted": true
        },
        "related_cad_file_custom_cadfile": {
          "display": "Related CAD File",
          "valueType": "custom.cadfile"
        },
        "lead_time__business_days___number": {
          "display": "Lead Time (business days) ",
          "valueType": "number"
        },
        "quote_status__option_quote_status": {
          "display": "Status",
          "valueType": "option.quote_status"
        },
        "company_option_onboarded_companies": {
          "display": "Company",
          "valueType": "option.onboarded_companies"
        },
        "quote_line_items_custom_quote_line_items": {
          "display": "Quote Line Items - deleted",
          "valueType": "custom.quote_line_items",
          "deleted": true
        },
        "quote_line_items1_custom_quote_line_items": {
          "display": "Quote Line Items",
          "valueType": "custom.quote_line_items"
        },
        "quote_line_items_list_custom_quote_line_items": {
          "display": "Quote Line Items - deleted",
          "valueType": "list.custom.quote_line_items",
          "deleted": true
        },
        "quote_line_items1_list_custom_quote_line_items": {
          "display": "Quote Line Items - deleted",
          "valueType": "list.custom.quote_line_items",
          "deleted": true
        }
      }
    },
    "orders": {
      "display": "Orders",
      "fields": {
        "total_price_number": {
          "display": "Total Price",
          "valueType": "number"
        },
        "related_quote_custom_quote": {
          "display": "Related Quote",
          "valueType": "custom.quote"
        }
      }
    },
    "cadfile": {
      "display": "Part",
      "fields": {
        "file_file": {
          "display": "cad_file",
          "valueType": "file"
        },
        "glb_url_text": {
          "display": "glb_url",
          "valueType": "text"
        },
        "file_name_text": {
          "display": "cad_filename",
          "valueType": "text"
        },
        "description_text": {
          "display": "description",
          "valueType": "text"
        },
        "phone_number_text": {
          "display": "phone number - deleted",
          "valueType": "text",
          "deleted": true
        },
        "file_extension_text": {
          "display": "file_extension",
          "valueType": "text"
        },
        "phone_number_number": {
          "display": "Phone Number - deleted",
          "valueType": "number",
          "deleted": true
        },
        "conversion_error_text": {
          "display": "conversion_error",
          "valueType": "text"
        },
        "thumbnail_image_image": {
          "display": "thumbnail_image",
          "valueType": "image"
        },
        "conversion_job_id_text": {
          "display": "conversion_job_id",
          "valueType": "text"
        },
        "conversion_status_text": {
          "display": "conversion_status",
          "valueType": "text"
        },
        "file_size_bytes_number": {
          "display": "file_size_bytes",
          "valueType": "number"
        },
        "preview_image_url_text": {
          "display": "preview_image_url",
          "valueType": "text"
        },
        "uploaded_by_user_id_text": {
          "display": "uploaded_by_user_id",
          "valueType": "text"
        }
      }
    },
    "material": {
      "display": "Materials",
      "fields": {
        "specs_text": {
          "display": "Specs",
          "valueType": "text"
        },
        "density_text": {
          "display": "Density - deleted",
          "valueType": "text",
          "deleted": true
        },
        "image__image": {
          "display": "Image ",
          "valueType": "image"
        },
        "material__text": {
          "display": "Material Name",
          "valueType": "text"
        },
        "density__number": {
          "display": "Density ",
          "valueType": "number"
        },
        "hardness_number": {
          "display": "Hardness",
          "valueType": "number"
        },
        "material_type__text": {
          "display": "Material Type  - deleted",
          "valueType": "text",
          "deleted": true
        },
        "secondary_name_text": {
          "display": "Secondary Name",
          "valueType": "text"
        },
        "tensile_strength__number": {
          "display": "Tensile Strength ",
          "valueType": "number"
        },
        "industry_tags__option_tags": {
          "display": "Industry Tags ",
          "valueType": "option.tags"
        },
        "alternate_designations__text": {
          "display": "Alternate Designations ",
          "valueType": "text"
        },
        "material_cost__option_material_cost": {
          "display": "Material Cost ",
          "valueType": "option.material_cost"
        },
        "material_type__option_material_category": {
          "display": "Material Type ",
          "valueType": "option.material_category"
        },
        "machining_difficulty_option_machining_difficulty": {
          "display": "Machining Difficulty",
          "valueType": "option.machining_difficulty",
          "defaultValue": "medium"
        }
      }
    },
    "transaction": {
      "display": "Transaction",
      "fields": {
        "user_user": {
          "display": "user",
          "valueType": "user"
        },
        "amount_number": {
          "display": "amount",
          "valueType": "number"
        }
      }
    },
    "notification": {
      "display": "Notification",
      "fields": {
        "body_text": {
          "display": "Body",
          "valueType": "text"
        },
        "seen_boolean": {
          "display": "Seen",
          "valueType": "boolean"
        },
        "recipient_user": {
          "display": "Recipient",
          "valueType": "user"
        }
      }
    },
    "quotecounter": {
      "display": "Quotecounter",
      "fields": {
        "year_number": {
          "display": "year",
          "valueType": "number"
        },
        "counter_number": {
          "display": "counter",
          "valueType": "number"
        }
      }
    },
    "order_line_items": {
      "display": "Order Line Items",
      "fields": {
        "qty_number": {
          "display": "Qty",
          "valueType": "number"
        }
      }
    },
    "quote_line_items": {
      "display": "Quote Line Items",
      "fields": {
        "part_name_text": {
          "display": "Part Name",
          "valueType": "text"
        },
        "part_files_file": {
          "display": "Part Files (CAD)",
          "valueType": "file"
        },
        "quantity_number": {
          "display": "Quantity",
          "valueType": "number"
        },
        "threads__boolean": {
          "display": "Threads?",
          "valueType": "boolean"
        },
        "unit_price_number": {
          "display": "Unit Price",
          "valueType": "number"
        },
        "quote_custom_quote": {
          "display": "Parent Quote",
          "valueType": "custom.quote"
        },
        "total_price_number": {
          "display": "Total Price",
          "valueType": "number"
        },
        "part_file__pdf__file": {
          "display": "Part File (PDF)",
          "valueType": "file"
        },
        "part_markings_boolean": {
          "display": "Part Markings",
          "valueType": "boolean"
        },
        "engineering_fits_boolean": {
          "display": "Engineering Fits",
          "valueType": "boolean"
        },
        "material_custom_material": {
          "display": "Material (revisit if spotted in automation) ",
          "valueType": "custom.material"
        },
        "part_file__pdf__url_text": {
          "display": "Part File (PDF) URL",
          "valueType": "text"
        },
        "quote_line_item_id_number": {
          "display": "Quote_line_Item_ID - deleted",
          "valueType": "number",
          "deleted": true
        },
        "sharp_internal_corners__boolean": {
          "display": "Sharp Internal Corners ",
          "valueType": "boolean"
        },
        "surface_finish_option_surface_finish": {
          "display": "Surface Finish - deleted",
          "valueType": "option.surface_finish",
          "deleted": true
        },
        "material__option_set__option_materials": {
          "display": "Material (option set) - deleted",
          "valueType": "option.materials",
          "deleted": true
        },
        "materials__option_set__option_materials": {
          "display": "Materials (option set)",
          "valueType": "option.materials"
        },
        "general_tolerance__option_general_tolerance": {
          "display": "General Tolerance ",
          "valueType": "option.general_tolerance"
        },
        "surface_finish_option_surface_finish_options": {
          "display": "Surface Finish",
          "valueType": "option.surface_finish_options"
        },
        "linear_tolerance_tighter_than_general_tolerance_boolean": {
          "display": "Linear Tolerance Tighter Than General Tolerance",
          "valueType": "boolean"
        },
        "quality_documentation_list_option_quality_documentation": {
          "display": "Quality Documentation",
          "valueType": "list.option.quality_documentation"
        }
      }
    },
    "company_information": {
      "display": "Company Information",
      "fields": {
        "city_text": {
          "display": "City",
          "valueType": "text"
        },
        "zip_code_number": {
          "display": "Zip Code",
          "valueType": "number"
        },
        "state_option_state": {
          "display": "State",
          "valueType": "option.state"
        },
        "street_address_text": {
          "display": "Street Address",
          "valueType": "text"
        }
      }
    }
  },
  "optionSets": {
    "tags": {
      "display": "Tags",
      "values": [
        {
          "id": "bTIAK",
          "display": "Maritime",
          "dbValue": "maritime",
          "sortFactor": 1
        },
        {
          "id": "bTIAL",
          "display": "Oil & Gas",
          "dbValue": "oil___gas",
          "sortFactor": 2
        },
        {
          "id": "bTIAP",
          "display": "Space",
          "dbValue": "space",
          "sortFactor": 3
        },
        {
          "id": "bTIAQ",
          "display": "Aerospace",
          "dbValue": "aerospace",
          "sortFactor": 4
        },
        {
          "id": "bTIBL",
          "display": "Plastic",
          "dbValue": "plastic",
          "sortFactor": 5
        }
      ]
    },
    "state": {
      "display": "State",
      "values": []
    },
    "materials": {
      "display": "Materials",
      "values": [
        {
          "id": "bTKTt",
          "display": "PVC",
          "dbValue": "pvc",
          "sortFactor": 1
        },
        {
          "id": "bTKTu",
          "display": "IN 625",
          "dbValue": "in_625",
          "sortFactor": 2
        },
        {
          "id": "bTKTv",
          "display": "SS 303",
          "dbValue": "ss_303",
          "sortFactor": 3
        },
        {
          "id": "bTKTz",
          "display": "SS 304",
          "dbValue": "ss_304",
          "sortFactor": 4
        },
        {
          "id": "bTKUA",
          "display": "SS 316",
          "dbValue": "ss_316",
          "sortFactor": 5
        },
        {
          "id": "bTKUF",
          "display": "SS 300",
          "dbValue": "ss_300",
          "sortFactor": 6
        }
      ]
    },
    "quote_status": {
      "display": "Quote Status",
      "values": [
        {
          "id": "bTKCF",
          "display": "Draft",
          "dbValue": "draft",
          "sortFactor": 1
        },
        {
          "id": "bTIoq0",
          "display": "Requested",
          "dbValue": "requested",
          "sortFactor": 2
        },
        {
          "id": "bTIor0",
          "display": "Under Review",
          "dbValue": "in_review",
          "sortFactor": 3
        },
        {
          "id": "bTIov0",
          "display": "Purchased",
          "dbValue": "purchased",
          "sortFactor": 4
        },
        {
          "id": "bTKCG",
          "display": "Priced",
          "dbValue": "priced",
          "sortFactor": 5,
          "deleted": true
        }
      ]
    },
    "material_cost": {
      "display": "Material Cost",
      "values": [
        {
          "id": "bTIAD",
          "display": "$",
          "dbValue": "_",
          "sortFactor": 1
        },
        {
          "id": "bTIAE",
          "display": "$$",
          "dbValue": "__",
          "sortFactor": 2
        },
        {
          "id": "bTIAF",
          "display": "$$$",
          "dbValue": "___",
          "sortFactor": 3
        },
        {
          "id": "bTIAJ",
          "display": "$$$$",
          "dbValue": "____",
          "sortFactor": 4
        }
      ]
    },
    "surface_finish": {
      "display": "Surface Finish",
      "deleted": true,
      "values": []
    },
    "workspace_role": {
      "display": "Workspace Role",
      "values": [
        {
          "id": "bTJNh0",
          "display": "Owner",
          "dbValue": "owner",
          "sortFactor": 1
        },
        {
          "id": "bTJOD0",
          "display": "Admin",
          "dbValue": "admin",
          "sortFactor": 2
        },
        {
          "id": "bTJOE0",
          "display": "Member",
          "dbValue": "member",
          "sortFactor": 3
        }
      ]
    },
    "general_tolerance": {
      "display": "General Tolerance",
      "values": [
        {
          "id": "bTKGC",
          "display": "ISO 2768 Medium (m)",
          "dbValue": "iso_2768_medium__m_",
          "sortFactor": 1
        },
        {
          "id": "bTKGD",
          "display": "ISO 2768 Fine (f)",
          "dbValue": "iso_2768_fine__f_",
          "sortFactor": 2
        }
      ]
    },
    "material_category": {
      "display": "Material Category",
      "attributes": {
        "%d3": {
          "display": "Description",
          "valueType": "text"
        }
      },
      "values": [
        {
          "id": "bTHzl",
          "display": "Aluminum",
          "dbValue": "aluminum",
          "sortFactor": 1,
          "description": "Aluminum alloys offer an exceptional strength-to-weight ratio, corrosion resistance, and excellent machinability, making them ideal for aerospace, automotive, energy, and industrial applications. Lattice provides access to common and high-performance grades including 6061, 7075, 2024, and other specification-driven variants.\\n\\nMaterials are sourced directly from vetted mills and authorized distributors, supplied with full mill certifications and traceability to meet ASTM, AMS, and project-specific requirements.\\n"
        },
        {
          "id": "bTHzm",
          "display": "Stainless steel",
          "dbValue": "stainless_steel",
          "sortFactor": 2,
          "description": "Stainless steels are corrosion-resistant, high-strength alloys widely used across oil & gas, energy, food processing, and industrial equipment applications. Lattice provides access to a broad range of austenitic, martensitic, and specialty stainless grades — including 303, 304, 316, and other specification-driven variants — sourced directly from vetted mills and authorized distributors.\\n\\nAll materials are supplied with full mill certifications and traceability to meet ASTM, ASME, and project-specific compliance requirements, ensuring reliability in demanding fabrication environments."
        },
        {
          "id": "bTHzn",
          "display": "Mild steel",
          "dbValue": "mild_steel",
          "sortFactor": 3,
          "description": "Mild steels provide reliable strength, weldability, and cost-efficiency for structural, industrial, and general fabrication applications. Commonly used in frames, supports, and heavy equipment components, these grades balance mechanical performance with economic scalability.\\n\\nLattice sources certified carbon steel grades with full traceability and compliance documentation to meet ASTM and structural specification requirements.\\n"
        },
        {
          "id": "bTHzr",
          "display": "Brass",
          "dbValue": "brass",
          "sortFactor": 4,
          "description": "Brass alloys offer excellent machinability, corrosion resistance, and electrical conductivity, making them well-suited for fittings, valves, instrumentation, and precision components. Known for dimensional stability and surface finish quality, brass is widely used in fluid handling and electrical applications.\\n\\nAll materials are sourced from qualified distributors and supplied with traceable mill certifications to ensure consistency and performance in production environments.\\n"
        },
        {
          "id": "bTHzs",
          "display": "Copper",
          "dbValue": "copper",
          "sortFactor": 5,
          "description": "Copper provides superior electrical and thermal conductivity, along with strong corrosion resistance in industrial environments. It is commonly used in electrical systems, heat exchangers, bus bars, and high-conductivity components.\\n\\nLattice supplies certified copper grades sourced directly from authorized mills and distributors, ensuring material integrity, traceability, and compliance for demanding applications.\\n"
        },
        {
          "id": "bTHzt",
          "display": "Alloy steel",
          "dbValue": "alloy_steel",
          "sortFactor": 6,
          "description": "Alloy steels are engineered for enhanced strength, toughness, and fatigue resistance compared to standard carbon steels. Frequently used in shafts, gears, fasteners, and high-load components, these grades are selected where mechanical performance is critical.\\n\\nLattice provides access to specification-driven alloy steel grades with full certification and traceability to meet ASTM and application-specific standards.\\n"
        },
        {
          "id": "bTHzx",
          "display": "Tool steel",
          "dbValue": "tool_steel",
          "sortFactor": 7,
          "description": "Tool steels are designed for high hardness, wear resistance, and dimensional stability under demanding operating conditions. Commonly used in dies, molds, cutting tools, and forming equipment, these materials support precision manufacturing and long service life.\\n\\nLattice sources certified tool steel grades through established supply channels, providing traceable documentation and reliable availability for production and prototyping needs.\\n"
        },
        {
          "id": "bTHzy",
          "display": "Titanium",
          "dbValue": "titanium",
          "sortFactor": 8,
          "description": "Titanium alloys combine high strength, low density, and exceptional corrosion resistance, making them ideal for aerospace, energy, marine, and high-performance industrial applications. These materials deliver superior strength-to-weight performance in critical environments.\\n\\nLattice supplies certified titanium grades with full traceability and compliance documentation, sourced directly from trusted mills and distributors.\\n"
        },
        {
          "id": "bTHzz",
          "display": "Inconel/Incoloy",
          "dbValue": "inconel_incoloy",
          "sortFactor": 9,
          "description": "Nickel-based superalloys such as Inconel and Incoloy are engineered for extreme temperature, pressure, and corrosion environments. Commonly used in oil & gas, energy, aerospace, and chemical processing applications, these materials maintain mechanical integrity under severe operating conditions.\\n\\nLattice provides access to specification-driven nickel alloy grades with certified mill documentation and full traceability, ensuring compliance in critical service environments.\\n"
        }
      ]
    },
    "general_tolerances": {
      "display": "General Tolerances",
      "deleted": true,
      "values": []
    },
    "onboarded_companies": {
      "display": "Onboarded Companies",
      "values": [
        {
          "id": "bTIsm",
          "display": "Amogy Inc.",
          "dbValue": "amogy",
          "sortFactor": 1
        }
      ]
    },
    "user_email_settings": {
      "display": "User Email Settings",
      "values": [
        {
          "id": "bTJXV",
          "display": "Roadmap Updates",
          "dbValue": "roadmap_updates",
          "sortFactor": 1
        },
        {
          "id": "bTJXW",
          "display": "Offers",
          "dbValue": "offers",
          "sortFactor": 2
        },
        {
          "id": "bTJXX",
          "display": "Order Updates",
          "dbValue": "order_updates",
          "sortFactor": 3
        },
        {
          "id": "bTJXb",
          "display": "Vendor Comms",
          "dbValue": "vendor_comms",
          "sortFactor": 4
        },
        {
          "id": "bTJXc",
          "display": "Marketing",
          "dbValue": "marketing",
          "sortFactor": 5
        }
      ]
    },
    "machining_difficulty": {
      "display": "Machining Difficulty",
      "values": [
        {
          "id": "bTIAV",
          "display": "Easy",
          "dbValue": "easy",
          "sortFactor": 1
        },
        {
          "id": "bTIAW",
          "display": "Medium",
          "dbValue": "medium",
          "sortFactor": 2
        },
        {
          "id": "bTIAX",
          "display": "Hard",
          "dbValue": "hard",
          "sortFactor": 3
        }
      ]
    },
    "quality_documentation": {
      "display": "Quality Documentation",
      "values": [
        {
          "id": "bTKkm",
          "display": "Standard Inspection ",
          "dbValue": "cmm",
          "sortFactor": 1
        },
        {
          "id": "bTKkn",
          "display": "Dimensional Inspection Report",
          "dbValue": "dimensional_inspection_report",
          "sortFactor": 2
        },
        {
          "id": "bTKkr",
          "display": "Formal Inspection with Dimensional Report",
          "dbValue": "coc",
          "sortFactor": 3
        },
        {
          "id": "bTKnx",
          "display": "CMM Inspection with Dimensional Report",
          "dbValue": "fai",
          "sortFactor": 4
        },
        {
          "id": "bTKny",
          "display": "First Article Inspection Report (FAIR AS9102)",
          "dbValue": "fat",
          "sortFactor": 5
        },
        {
          "id": "bTKnz",
          "display": "Source Inspection",
          "dbValue": "reach_compliance_declaration",
          "sortFactor": 6
        },
        {
          "id": "bTKoD",
          "display": "Build and Hold First Article Inspection",
          "dbValue": "iso_90001",
          "sortFactor": 7
        },
        {
          "id": "bTKoP",
          "display": "Custom Inspection",
          "dbValue": "custom_inspection",
          "sortFactor": 8
        },
        {
          "id": "bTKoQ",
          "display": "Material Test Report (MTR)",
          "dbValue": "material_test_report__mtr_",
          "sortFactor": 9
        }
      ]
    },
    "fabrication_capability": {
      "display": "Fabrication Capability",
      "attributes": {
        "active": {
          "display": "Active",
          "valueType": "boolean"
        }
      },
      "values": [
        {
          "id": "bTIpa0",
          "display": "CNC Milling",
          "dbValue": "cnc_milling",
          "sortFactor": 1,
          "active": true
        },
        {
          "id": "bTIpb0",
          "display": "CNC Turning",
          "dbValue": "cnc_turning",
          "sortFactor": 2,
          "active": true
        },
        {
          "id": "bTIrv0",
          "display": "Sheet Metal Fabrication",
          "dbValue": "sheet_metal_fabrication",
          "sortFactor": 3
        },
        {
          "id": "bTIrw0",
          "display": "Injection Molding Services",
          "dbValue": "injection_molding_services",
          "sortFactor": 4
        },
        {
          "id": "bTIrx0",
          "display": "Selective Laser Sintering (SLS)",
          "dbValue": "selective_laser_sintering__sls_",
          "sortFactor": 5
        },
        {
          "id": "bTIsB0",
          "display": "Fused Deposition Modeling (FDM)",
          "dbValue": "fused_deposition_modeling__fdm_",
          "sortFactor": 6
        }
      ]
    },
    "surface_finish_options": {
      "display": "Surface Finish Options",
      "values": [
        {
          "id": "bTKFX",
          "display": "As machined (Ra 3.2 µm / Ra 126 µin)",
          "dbValue": "as_machined__ra_3_2__m___ra_126__in_",
          "sortFactor": 1
        },
        {
          "id": "bTKFY",
          "display": "As machined + Anodized type II",
          "dbValue": "as_machined___anodized_type_ii",
          "sortFactor": 2
        },
        {
          "id": "bTKFZ",
          "display": "Bead blasted + Anodized type II (Matte)",
          "dbValue": "bead_blasted___anodized_type_ii__matte_",
          "sortFactor": 3
        },
        {
          "id": "bTKFd",
          "display": "Chromate Conversion Coating",
          "dbValue": "chromate_conversion_coating",
          "sortFactor": 4
        },
        {
          "id": "bTKFe",
          "display": "Smooth machining (Ra 1.6 µm / Ra 63 µin)",
          "dbValue": "smooth_machining__ra_1_6__m___ra_63__in_",
          "sortFactor": 5
        },
        {
          "id": "bTKFf",
          "display": "Bead blasted",
          "dbValue": "bead_blasted",
          "sortFactor": 6
        },
        {
          "id": "bTKFj",
          "display": "As machined + Anodized type III (Hardcoat)",
          "dbValue": "as_machined___anodized_type_iii__hardcoat_",
          "sortFactor": 7
        },
        {
          "id": "bTKFk",
          "display": "Bead Blasted + Anodized type II (Glossy)",
          "dbValue": "bead_blasted___anodized_type_ii__glossy_",
          "sortFactor": 8
        },
        {
          "id": "bTKFl",
          "display": "Brushed (Ra 1.2 µm / Ra 47 µin)",
          "dbValue": "brushed__ra_1_2__m___ra_47__in_",
          "sortFactor": 9
        },
        {
          "id": "bTKFp",
          "display": "Brushed + Anodized type II (Glossy)",
          "dbValue": "brushed___anodized_type_ii__glossy_",
          "sortFactor": 10
        },
        {
          "id": "bTKFq",
          "display": "Powder coated",
          "dbValue": "powder_coated",
          "sortFactor": 11
        },
        {
          "id": "bTKFr",
          "display": "Polishing (Ra 0.8 µm / Ra 32 µin)",
          "dbValue": "polishing__ra_0_8__m___ra_32__in_",
          "sortFactor": 12
        },
        {
          "id": "bTKFv",
          "display": "Electroless Nickel Plating",
          "dbValue": "electroless_nickel_plating",
          "sortFactor": 13
        },
        {
          "id": "bTKFw",
          "display": "Fine machining (Ra 0.8 µm / Ra 32 µin)",
          "dbValue": "fine_machining__ra_0_8__m___ra_32__in_",
          "sortFactor": 14
        },
        {
          "id": "bTKFx",
          "display": "Bead Blasted + Anodized type III (Hardcoat)",
          "dbValue": "bead_blasted___anodized_type_iii__hardcoat_",
          "sortFactor": 15
        },
        {
          "id": "bTKGB",
          "display": "Bead Blasted + Chromate Conversion Coating",
          "dbValue": "bead_blasted___chromate_conversion_coating",
          "sortFactor": 16
        }
      ]
    }
  }
} as const satisfies {
  appId: string;
  appVersion: string;
  lastChange: string;
  dataTypes: Record<string, BubbleDataType>;
  optionSets: Record<string, BubbleOptionSet>;
};

export const bubbleDataTypes = bubbleSchema.dataTypes;
export const bubbleOptionSets = bubbleSchema.optionSets;
