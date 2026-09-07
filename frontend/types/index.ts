/**
 * Shared Type Definitions for VittMitra Frontend
 */

export interface SystemHealthResponse {
  status: string;
  app_name: string;
  version: string;
  environment: string;
}

export type SocialCategory = 'SC' | 'ST' | 'OBC' | 'General' | 'Minority' | 'SpeciallyAbled';
export type Gender = 'female' | 'male' | 'transgender' | 'prefer_not_to_say';
export type SectorType = 'manufacturing' | 'services' | 'trading' | 'agro_allied' | 'handicrafts';
export type AreaType = 'rural' | 'urban' | 'semi_urban' | 'aspirational_district' | 'ner_hilly';

export interface WorkflowStage {
  id: number;
  title: string;
  description: string;
  isComplete: boolean;
  isCurrent: boolean;
}

export interface ProfileCompleteness {
  is_complete: boolean;
  completion_percentage: number;
  overall_percentage?: number;
  overall_completeness_pct?: number;
  missing_fields: string[];
  completed_sections: string[];
  section_breakdown: Record<string, {
    is_complete: boolean;
    required_fields: string[];
    missing_fields: string[];
  }>;
}

export interface Entrepreneur {
  id: number;
  full_name: string;
  date_of_birth?: string | null;
  age?: number | null;
  gender?: string | null;
  category?: string | null;
  preferred_language: string;
  phone_number?: string | null;
  email?: string | null;
  state?: string | null;
  district?: string | null;
  city?: string | null;
  pincode?: string | null;
  area_type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  id: number;
  entrepreneur_id: number;
  business_name?: string | null;
  business_type?: string | null;
  sector?: string | null;
  sub_sector?: string | null;
  business_stage?: string | null;
  business_description?: string | null;
  existing_business_vintage_years?: number | null;
  is_greenfield?: boolean | null;
  has_vending_proof?: boolean | null;
  is_notified_trade?: boolean | null;
  is_single_family_applicant?: boolean | null;
  has_govt_employee_in_family?: boolean | null;
  availed_pmegp_mudra_last_5yr?: boolean | null;
  is_non_farm_income_generating?: boolean | null;
  is_defaulter?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialProfile {
  id: number;
  entrepreneur_id: number;
  business_profile_id?: number | null;
  project_cost?: number | null;
  own_contribution?: number | null;
  loan_requirement?: number | null;
  annual_income?: number | null;
  monthly_income?: number | null;
  existing_monthly_obligations?: number | null;
  machinery_equipment_cost?: number | null;
  infrastructure_cost?: number | null;
  working_capital_cost?: number | null;
  other_expenses_cost?: number | null;
  created_at: string;
  updated_at: string;
}

export interface UnifiedProfileResponse {
  entrepreneur: Entrepreneur;
  business_profiles: BusinessProfile[];
  financial_profiles: FinancialProfile[];
  completeness: ProfileCompleteness;
}

export interface UnifiedProfileCreatePayload {
  entrepreneur: {
    full_name: string;
    date_of_birth?: string | null;
    age?: number | null;
    gender?: string | null;
    category?: string | null;
    preferred_language?: string;
    phone_number?: string | null;
    email?: string | null;
    state?: string | null;
    district?: string | null;
    city?: string | null;
    pincode?: string | null;
    area_type?: string | null;
  };
  business?: {
    business_name?: string | null;
    business_type?: string | null;
    sector?: string | null;
    sub_sector?: string | null;
    business_stage?: string | null;
    business_description?: string | null;
    existing_business_vintage_years?: number | null;
    is_greenfield?: boolean | null;
    has_vending_proof?: boolean | null;
    is_notified_trade?: boolean | null;
    is_single_family_applicant?: boolean | null;
    has_govt_employee_in_family?: boolean | null;
    availed_pmegp_mudra_last_5yr?: boolean | null;
    is_non_farm_income_generating?: boolean | null;
    is_defaulter?: boolean | null;
  } | null;
  financial?: {
    project_cost?: number | null;
    own_contribution?: number | null;
    loan_requirement?: number | null;
    annual_income?: number | null;
    monthly_income?: number | null;
    existing_monthly_obligations?: number | null;
    machinery_equipment_cost?: number | null;
    infrastructure_cost?: number | null;
    working_capital_cost?: number | null;
    other_expenses_cost?: number | null;
  } | null;
}

// ==============================================================================
// Step 8: Scheme Discovery, Matching, Explanation & Comparison Types
// ==============================================================================

export type MatchCategory = 'ELIGIBLE' | 'POTENTIALLY_RELEVANT' | 'NOT_ELIGIBLE';
export type EligibilityStatus = 'MATCHED' | 'FAILED' | 'UNVERIFIED';

export interface DimensionScore {
  factor: string;
  status: EligibilityStatus;
  weight: number;
  score_awarded: number;
  explanation: string;
}

export interface MatchReasons {
  positive?: string[];
  negative?: string[];
  unverified?: string[];
  positive_reasons?: string[];
  negative_reasons?: string[];
  unverified_warnings?: string[];
}

export interface EligibilitySummary {
  total_rules: number;
  matched_count: number;
  failed_count: number;
  unverified_count: number;
}

export interface CriterionResult {
  rule_id?: number;
  rule_code: string;
  criterion: string;
  criterion_name?: string;
  field_name?: string;
  status: EligibilityStatus;
  user_value?: any;
  applicant_value?: any;
  required_condition: string;
  operator?: string;
  threshold_value?: any;
  explanation: string;
  is_mandatory: boolean;
  source_id?: number;
  source_name?: string | null;
  source_url?: string | null;
  rule_version: string;
}

export interface EligibilityCheckResponse {
  scheme_id: number;
  scheme_code: string;
  scheme_name: string;
  overall_status: EligibilityStatus;
  evaluated_at: string;
  summary: EligibilitySummary;
  summary_message?: string;
  criteria: CriterionResult[];
  evaluated_criteria?: CriterionResult[];
  passed_criteria?: CriterionResult[];
  failed_criteria?: CriterionResult[];
  unverified_criteria?: CriterionResult[];
}

export interface LoanRepaymentSummary {
  principal?: number;
  annual_interest_rate?: number;
  tenure_months?: number;
  interest_rate_pct?: number;
  monthly_emi?: number;
  estimated_emi?: number;
  total_interest_payable?: number;
  estimated_total_interest?: number;
  estimated_total_repayment?: number;
  is_zero_interest?: boolean;
}

export interface AffordabilityIndicator {
  monthly_income?: number | null;
  estimated_emi?: number;
  debt_to_income_pct?: number | null;
  status?: string;
  notes?: string;
}

export interface FinancialCalculationResponse {
  project_cost?: {
    total_project_cost?: number;
    machinery_cost?: number;
    working_capital?: number;
  } | number;
  own_contribution?: number;
  own_contribution_pct?: number;
  financing_gap?: number;
  subsidy?: {
    subsidy_percentage?: number;
    subsidy_amount?: number;
    effective_margin_percentage?: number;
    effective_margin_amount?: number;
    net_bank_loan?: number;
  };
  loan?: LoanRepaymentSummary;
  repayment?: LoanRepaymentSummary;
  cost_breakdown?: any;
  affordability?: AffordabilityIndicator;
  calculation_notes?: string[];
  evaluated_at?: string;
}

export interface SchemeMatchResult {
  id?: number;
  rank: number;
  scheme_id: number;
  scheme_code: string;
  scheme_name: string;
  short_description?: string;
  nodal_ministry: string;
  geography_level?: string;
  sectors?: string[];
  match_category: MatchCategory;
  match_score: number;
  eligibility_status: EligibilityStatus;
  reasons: MatchReasons;
  score_breakdown: DimensionScore[];
  dimensions?: DimensionScore;
  eligibility_summary: EligibilitySummary;
  eligibility?: {
    unverified_criteria?: any[];
    failed_criteria?: any[];
  };
  financial_summary?: Record<string, any> | null;
  financial_benefits?: {
    max_subsidy_pct?: number;
    max_loan_amount?: number;
    margin_money_pct?: number;
  };
}

export interface SchemeMatchingResponse {
  total_schemes_evaluated: number;
  eligible_count: number;
  potentially_relevant_count: number;
  not_eligible_count: number;
  results: SchemeMatchResult[];
  matches?: SchemeMatchResult[];
  disclaimer: string;
  evaluated_at: string;
}

export interface SchemeSource {
  id?: number;
  source_name: string;
  source_publisher?: string;
  source_title?: string;
  source_type: string;
  official_url: string;
  source_url?: string;
  document_reference?: string | null;
  publication_date?: string | null;
  last_verified_at: string;
  version: string;
  notes?: string | null;
  is_active: boolean;
}

export interface SchemeEligibilityRule {
  id?: number;
  rule_code: string;
  field_name: string;
  operator: string;
  expected_value: any;
  description: string;
  source_id?: number | null;
  rule_version: string;
  is_mandatory: boolean;
  is_active: boolean;
}

export interface SchemeDocument {
  id?: number;
  document_code: string;
  document_name: string;
  description?: string | null;
  document_description?: string | null;
  issuing_authority?: string | null;
  purpose?: string | null;
  is_mandatory: boolean;
  source_id?: number | null;
}

export interface SchemeDetailResponse {
  id: number;
  scheme_code: string;
  scheme_name: string;
  short_description: string;
  nodal_ministry: string;
  nodal_department?: string | null;
  geography_level: string;
  target_beneficiaries: string[];
  purpose: string;
  benefits_summary: Record<string, any>;
  financial_specs?: {
    max_subsidy_pct?: number;
    max_loan_amount?: number;
    min_margin_money_pct?: number;
    moratorium_period_months?: number;
  };
  business_stages: string[];
  sectors: string[];
  data_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sources: SchemeSource[];
  eligibility_rules: SchemeEligibilityRule[];
  documents: SchemeDocument[];
}

export interface SchemeListResponse {
  id: number;
  scheme_code: string;
  scheme_name: string;
  short_description: string;
  nodal_ministry: string;
  geography_level: string;
  target_beneficiaries: string[];
  sectors: string[];
  data_status: string;
  is_active: boolean;
  last_verified_at?: string | null;
}

// ==============================================================================
// Step 9: Business & Location Intelligence + Feasibility Types
// ==============================================================================

export type SignalCategory =
  | 'LOCATION_SIGNAL'
  | 'SECTOR_SIGNAL'
  | 'BUSINESS_STAGE_SIGNAL'
  | 'FINANCIAL_FEASIBILITY_SIGNAL'
  | 'MARKET_CONTEXT_SIGNAL'
  | 'DATA_COMPLETENESS_SIGNAL'
  | 'RISK_SIGNAL';

export type DataConfidenceStatus =
  | 'VERIFIED'
  | 'ESTIMATED'
  | 'UNVERIFIED'
  | 'INSUFFICIENT_DATA';

export type FeasibilityOutcome =
  | 'FAVOURABLE'
  | 'CAUTION'
  | 'HIGH_RISK'
  | 'INSUFFICIENT_DATA';

export interface BusinessSignal {
  signal_type: SignalCategory;
  category?: SignalCategory;
  signal_code: string;
  title: string;
  status: DataConfidenceStatus;
  confidence_status?: DataConfidenceStatus;
  is_positive: boolean;
  is_risk?: boolean;
  interpretation: string;
  description?: string;
  explanation: string;
  evidence_notes?: string[];
  source_name?: string | null;
  source_url?: string | null;
  source_version?: string | null;
  raw_metric?: Record<string, any> | null;
}

export interface FeasibilityInputContext {
  entrepreneur_id?: number | null;
  full_name?: string | null;
  business_name?: string | null;
  sector?: string | null;
  sub_sector?: string | null;
  business_stage?: string | null;
  is_greenfield?: boolean | null;
  existing_business_vintage_years?: number | null;
  state?: string | null;
  district?: string | null;
  city?: string | null;
  pincode?: string | null;
  area_type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  project_cost?: number | null;
  own_contribution?: number | null;
  loan_requirement?: number | null;
  required_loan_amount?: number | null;
  annual_turnover?: number | null;
  monthly_income?: number | null;
  existing_monthly_obligations?: number | null;
  is_defaulter?: boolean | null;
}

export interface FeasibilityAnalysisResponse {
  overall_status: FeasibilityOutcome;
  overall_outcome?: FeasibilityOutcome;
  headline: string;
  summary_notes: string | string[];
  evaluated_at: string;
  profile_summary: {
    business_name?: string;
    sector?: string;
    sub_sector?: string;
    business_stage?: string;
    location?: string;
    area_type?: string;
    project_cost?: number | null;
    own_contribution?: number | null;
    loan_requirement?: number | null;
    [key: string]: any;
  };
  context?: FeasibilityInputContext;
  signals: BusinessSignal[];
  positive_signals: string[];
  positive_drivers?: string[];
  risk_signals: string[];
  risk_flags?: string[];
  missing_information: string[];
  missing_fields?: string[];
  recommendations: string[];
  actionable_recommendations?: string[];
  disclaimer: string;
  regulatory_disclaimer?: string;
}

export interface DistrictEcosystem {
  id: number;
  state: string;
  state_name?: string;
  district: string;
  district_name?: string;
  state_code?: string | null;
  district_code?: string | null;
  tier?: number | string;
  category?: string;
  industrial_density_score?: number;
  prominent_sectors: string[];
  thrust_sectors?: string[];
  industrial_areas_count: number;
  infrastructure_highlights?: string;
  lead_bank_name?: string | null;
  dic_office_address?: string | null;
  dic_contact_phone?: string | null;
  dic_contact_email?: string | null;
  raw_material_availability: string;
  market_connectivity: string;
  power_infrastructure: string;
  labor_availability: string;
  latitude?: number | null;
  longitude?: number | null;
  data_status: string;
  source_name: string;
  source_url?: string | null;
}

export interface NearbyCluster {
  id?: number;
  cluster_code: string;
  cluster_name: string;
  state: string;
  district: string;
  sector: string;
  sub_sector?: string | null;
  cluster_type?: string;
  specialization: string;
  key_products: string[];
  common_facility_centers: string[];
  latitude: number;
  longitude: number;
  distance_km?: number | null;
  raw_material_access: string;
  market_linkage: string;
  data_status: string;
  source_agency?: string;
  source_name: string;
  source_url?: string | null;
}

// -------------------------------------------------------------
// Step 10: Channel Partners & Application Tracking Types
// -------------------------------------------------------------

export type PartnerType =
  | 'NODAL_AGENCY'
  | 'IMPLEMENTING_AGENCY'
  | 'DISTRICT_INDUSTRIES_CENTRE'
  | 'PUBLIC_SECTOR_BANK'
  | 'RRB'
  | 'COOPERATIVE_BANK'
  | 'FACILITATION_CENTRE';

export type PartnerVerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'INACTIVE';

export type PartnerRoleType =
  | 'NODAL_AGENCY'
  | 'IMPLEMENTING_AGENCY'
  | 'FINANCING_BANK'
  | 'LOCAL_FACILITATION';

export interface ChannelPartner {
  id: number;
  partner_code: string;
  organization_name: string;
  partner_type: string;
  state: string;
  district: string;
  city?: string | null;
  pincode?: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number | null;
  services_offered: string[];
  contact_person?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  official_url?: string | null;
  verification_status: string;
  source_agency: string;
  source_url?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  supported_schemes?: Array<{
    scheme_id: number;
    scheme_code: string;
    scheme_name: string;
    role_type: string;
    service_scope?: string | null;
    is_primary: boolean;
  }>;
}

export interface SchemePartner {
  id: number;
  partner_code: string;
  organization_name: string;
  partner_type: string;
  state: string;
  district: string;
  city?: string | null;
  pincode?: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number | null;
  services_offered: string[];
  contact_person?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  official_url?: string | null;
  verification_status: string;
  source_agency: string;
  source_url?: string | null;
  role_type: string;
  service_scope?: string | null;
  is_primary_partner: boolean;
  why_this_partner?: string | null;
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'APPLICATION_STARTED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFORMATION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'UNKNOWN';

export type StatusSourceType =
  | 'USER_RECORDED'
  | 'OFFICIAL_ACKNOWLEDGEMENT'
  | 'PARTNER_VERIFIED'
  | 'PORTAL_RECEIPT';

export interface RequiredDocumentChecklist {
  document_code: string;
  document_name: string;
  description?: string | null;
  is_mandatory: boolean;
  issuing_authority?: string | null;
  purpose?: string | null;
}

export interface ApplicationAssistance {
  scheme_id: number;
  scheme_code: string;
  scheme_name: string;
  nodal_ministry?: string | null;
  short_description?: string | null;
  official_portal_url?: string | null;
  eligibility_status: string;
  eligibility_summary_message: string;
  project_cost?: number | string | null;
  own_contribution?: number | string | null;
  loan_requirement?: number | string | null;
  estimated_monthly_emi?: number | string | null;
  estimated_subsidy_amount?: number | string | null;
  required_documents: RequiredDocumentChecklist[];
  recommended_partners: SchemePartner[];
  application_steps: string[];
  important_prerequisites: string[];
  disclaimer: string;
}

export interface ApplicationStatusHistory {
  id: number;
  application_id: number;
  status: ApplicationStatus;
  status_note?: string | null;
  recorded_at: string;
  source_type: string;
}

export interface Application {
  id: number;
  entrepreneur_id: number;
  scheme_id: number;
  scheme_code: string;
  scheme_name: string;
  nodal_ministry?: string | null;
  channel_partner_id?: number | null;
  partner_name?: string | null;
  partner_type?: string | null;
  application_reference_number?: string | null;
  application_date?: string | null;
  current_status: ApplicationStatus;
  status_explanation: string;
  status_note?: string | null;
  target_loan_amount?: number | string | null;
  target_subsidy_amount?: number | string | null;
  official_portal_url?: string | null;
  source_type: string;
  last_updated_at: string;
  created_at: string;
  is_active: boolean;
  next_recommended_action?: string | null;
  status_history?: ApplicationStatusHistory[];
  channel_partner?: SchemePartner | null;
  disclaimer: string;
}

export interface ApplicationCreatePayload {
  entrepreneur_id: number;
  scheme_id: number;
  channel_partner_id?: number | null;
  application_reference_number?: string | null;
  application_date?: string | null;
  initial_status?: ApplicationStatus;
  status_note?: string | null;
  target_loan_amount?: number | null;
  target_subsidy_amount?: number | null;
  official_portal_url?: string | null;
}

export interface ApplicationStatusUpdatePayload {
  status: ApplicationStatus;
  status_note?: string | null;
  source_type?: StatusSourceType;
}

// -------------------------------------------------------------
// Step 11: Grounded AI & RAG Types
// -------------------------------------------------------------

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';

export interface CitationSource {
  source_id?: number | null;
  source_name: string;
  source_type: string;
  official_url?: string | null;
  document_reference?: string | null;
  section_type?: string | null;
  last_verified_at?: string | null;
}

export interface GroundedChatRequest {
  message: string;
  profile_id?: string | null;
  scheme_id?: string | null;
  topic?: string;
  context?: Record<string, any>;
  conversation_history?: Array<{ role: string; content: string }>;
}

export interface GroundedChatResponse {
  answer: string;
  grounded: boolean;
  confidence: ConfidenceLevel;
  sources: CitationSource[];
  limitations: string[];
  suggested_actions: string[];
  disclaimer: string;
  evaluated_at: string;
}

export interface GroundedExplainRequest {
  profile_id?: string | null;
  scheme_code?: string | null;
  topic: string;
  custom_query?: string | null;
  context?: Record<string, any>;
}

export interface AIServiceHealth {
  status: string;
  provider: string;
  model: string;
  is_live_configured: boolean;
  capabilities: string[];
}


