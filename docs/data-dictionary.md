# VittMitra Data Dictionary & Entity Reference

This document outlines the planned database entities and data specifications across the VittMitra ecosystem.

---

## Core Entities

### 1. `users`
Represents platform user accounts.
- `id` (UUID, Primary Key)
- `phone_number` (VARCHAR, Unique, Indexed)
- `email` (VARCHAR, Nullable, Indexed)
- `full_name` (VARCHAR)
- `preferred_language` (VARCHAR, e.g., 'hi', 'en', 'mr', 'ta')
- `role` (ENUM: 'entrepreneur', 'channel_partner', 'admin')
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

### 2. `entrepreneur_profiles`
Detailed demographic and socio-economic profile of the entrepreneur.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `users.id`)
- `age` (INTEGER)
- `gender` (ENUM: 'female', 'male', 'transgender', 'prefer_not_to_say')
- `social_category` (ENUM: 'SC', 'ST', 'OBC', 'General', 'Minority', 'SpeciallyAbled')
- `education_level` (VARCHAR)
- `annual_family_income` (NUMERIC)
- `prior_business_experience_years` (INTEGER)
- `has_edp_training` (BOOLEAN, Entrepreneurship Development Programme)

---

### 3. `locations`
Geographic and spatial attributes leveraging PostGIS.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `users.id`)
- `state` (VARCHAR, Indexed)
- `district` (VARCHAR, Indexed)
- `sub_district_block` (VARCHAR)
- `pincode` (VARCHAR)
- `area_type` (ENUM: 'rural', 'urban', 'semi_urban', 'aspirational_district', 'ner_hilly')
- `coordinates` (GEOMETRY(Point, 4326))

---

### 4. `businesses`
Enterprise concept, sector, and operational parameters.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `users.id`)
- `business_name` (VARCHAR)
- `sector` (ENUM: 'manufacturing', 'services', 'trading', 'agro_allied', 'handicrafts')
- `sub_sector` (VARCHAR)
- `stage` (ENUM: 'idea', 'new_enterprise', 'expansion')
- `ownership_type` (ENUM: 'sole_proprietorship', 'partnership', 'shg', 'cooperative')

---

### 5. `schemes`
Master repository of government schemes.
- `id` (UUID, Primary Key)
- `code` (VARCHAR, Unique, e.g., 'PMEGP', 'MUDRA_TARUN', 'STANDUP_INDIA')
- `name` (VARCHAR)
- `nodal_ministry` (VARCHAR)
- `target_beneficiaries` (ARRAY / JSONB)
- `max_project_cost` (NUMERIC)
- `subsidy_percentage_general` (NUMERIC)
- `subsidy_percentage_special` (NUMERIC, SC/ST/Women/NER)
- `own_contribution_percentage` (NUMERIC)
- `official_portal_url` (VARCHAR)
- `is_active` (BOOLEAN)
- `last_verified_at` (TIMESTAMPTZ)

---

### 6. `scheme_eligibility_rules`
Structured deterministic rule criteria for automated evaluation.
- `id` (UUID, Primary Key)
- `scheme_id` (UUID, Foreign Key -> `schemes.id`)
- `min_age` (INTEGER)
- `max_age` (INTEGER)
- `allowed_genders` (ARRAY)
- `allowed_categories` (ARRAY)
- `allowed_sectors` (ARRAY)
- `allowed_area_types` (ARRAY)
- `min_education_qualification` (VARCHAR)
- `rule_expression_json` (JSONB)

---

### 7. `financial_profiles`
Structured project cost and funding breakdown.
- `id` (UUID, Primary Key)
- `business_id` (UUID, Foreign Key -> `businesses.id`)
- `capital_expenditure` (NUMERIC)
- `working_capital` (NUMERIC)
- `total_project_cost` (NUMERIC)
- `own_contribution_amount` (NUMERIC)
- `subsidy_amount` (NUMERIC)
- `bank_loan_amount` (NUMERIC)
- `estimated_monthly_emi` (NUMERIC)
- `estimated_monthly_revenue` (NUMERIC)

---

### 8. `applications`
Application tracking and documentation repository.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `users.id`)
- `scheme_id` (UUID, Foreign Key -> `schemes.id`)
- `status` (ENUM: 'draft', 'documents_pending', 'submitted', 'under_scrutiny', 'bank_sanctioned', 'disbursed', 'rejected')
- `application_reference_number` (VARCHAR)
- `channel_partner_id` (UUID, Nullable)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
