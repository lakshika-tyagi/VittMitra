import { SystemHealthResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchHealth(): Promise<SystemHealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`API health check failed with status: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to connect to backend API:', error);
    return {
      status: 'offline',
      app_name: 'VittMitra API',
      version: '1.0.0',
      environment: 'disconnected',
    };
  }
}

import {
  UnifiedProfileCreatePayload,
  UnifiedProfileResponse,
  Entrepreneur,
  BusinessProfile,
  FinancialProfile,
  SchemeListResponse,
  SchemeDetailResponse,
  SchemeMatchingResponse,
  EligibilityCheckResponse,
  FinancialCalculationResponse,
  FeasibilityInputContext,
  FeasibilityAnalysisResponse,
  DistrictEcosystem,
  NearbyCluster,
  ChannelPartner,
  SchemePartner,
  ApplicationAssistance,
  Application,
  ApplicationCreatePayload,
  ApplicationStatusUpdatePayload,
} from '@/types';

export async function createUnifiedProfile(payload: UnifiedProfileCreatePayload): Promise<UnifiedProfileResponse> {
  const res = await fetch(`${API_BASE_URL}/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create profile (Status: ${res.status})`);
  }
  return await res.json();
}

export async function listProfiles(skip = 0, limit = 50): Promise<Entrepreneur[]> {
  const res = await fetch(`${API_BASE_URL}/profiles?skip=${skip}&limit=${limit}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to list profiles (Status: ${res.status})`);
  }
  return await res.json();
}

export async function getUnifiedProfile(profileId: number): Promise<UnifiedProfileResponse> {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch profile ID ${profileId}`);
  }
  return await res.json();
}

export async function fetchSchemes(sector?: string, beneficiary?: string): Promise<SchemeListResponse[]> {
  let url = `${API_BASE_URL}/schemes`;
  const params = new URLSearchParams();
  if (sector) params.append('sector', sector);
  if (beneficiary) params.append('beneficiary', beneficiary);
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch schemes (Status: ${res.status})`);
  }
  return await res.json();
}

export async function fetchSchemeDetail(schemeIdentifier: string | number): Promise<SchemeDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/schemes/${encodeURIComponent(schemeIdentifier)}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Scheme '${schemeIdentifier}' not found (Status: ${res.status})`);
  }
  return await res.json();
}

export async function getProfileMatching(
  profileId: number,
  limit = 10,
  includeIneligible = true
): Promise<SchemeMatchingResponse> {
  const res = await fetch(
    `${API_BASE_URL}/profiles/${profileId}/matching?limit=${limit}&include_ineligible=${includeIneligible}`,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch scheme matching for profile ID ${profileId}`);
  }
  return await res.json();
}

export async function getProfileFinanceSummary(
  profileId: number,
  schemeCode?: string,
  rate?: number,
  tenure?: number
): Promise<FinancialCalculationResponse> {
  const params = new URLSearchParams();
  if (schemeCode) params.append('scheme_code', schemeCode);
  if (rate) params.append('interest_rate', rate.toString());
  if (tenure) params.append('tenure_months', tenure.toString());

  const url = params.toString()
    ? `${API_BASE_URL}/profiles/${profileId}/finance/summary?${params.toString()}`
    : `${API_BASE_URL}/profiles/${profileId}/finance/summary`;

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch financial summary for profile ID ${profileId}`);
  }
  return await res.json();
}

export async function getProfileEligibility(
  profileId: number,
  schemeId: string | number
): Promise<EligibilityCheckResponse> {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/eligibility/${encodeURIComponent(schemeId)}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to check eligibility for scheme ${schemeId}`);
  }
  return await res.json();
}

export async function analyzeFeasibility(
  context: FeasibilityInputContext
): Promise<FeasibilityAnalysisResponse> {
  const res = await fetch(`${API_BASE_URL}/feasibility/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Feasibility analysis failed (Status: ${res.status})`);
  }
  return await res.json();
}

export async function getProfileFeasibility(
  profileId: number
): Promise<FeasibilityAnalysisResponse> {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/feasibility`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch feasibility for profile ID ${profileId}`);
  }
  return await res.json();
}

export async function fetchLocationIntelligence(
  district: string,
  state: string
): Promise<DistrictEcosystem> {
  const params = new URLSearchParams({ district, state });
  const res = await fetch(`${API_BASE_URL}/locations/intelligence?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch location intelligence for ${district}, ${state}`);
  }
  return await res.json();
}

export async function fetchNearbyClusters(
  district: string,
  state: string,
  sector?: string
): Promise<NearbyCluster[]> {
  const params = new URLSearchParams({ district, state });
  if (sector) params.append('sector', sector);

  const res = await fetch(`${API_BASE_URL}/locations/nearby-clusters?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch nearby clusters for ${district}, ${state}`);
  }
  return await res.json();
}

// -------------------------------------------------------------
// Step 10: Channel Partners & Application Tracking API Methods
// -------------------------------------------------------------

export async function fetchPartners(params?: {
  state?: string;
  district?: string;
  partner_type?: string;
  skip?: number;
  limit?: number;
}): Promise<ChannelPartner[]> {
  const query = new URLSearchParams();
  if (params?.state) query.append('state', params.state);
  if (params?.district) query.append('district', params.district);
  if (params?.partner_type) query.append('partner_type', params.partner_type);
  if (params?.skip !== undefined) query.append('skip', params.skip.toString());
  if (params?.limit !== undefined) query.append('limit', params.limit.toString());

  const res = await fetch(`${API_BASE_URL}/partners?${query.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch channel partners (Status: ${res.status})`);
  }
  return await res.json();
}

export async function fetchSchemePartners(
  schemeId: number | string,
  params?: {
    state?: string;
    district?: string;
    lat?: number;
    lon?: number;
    limit?: number;
  }
): Promise<SchemePartner[]> {
  const query = new URLSearchParams();
  if (params?.state) query.append('state', params.state);
  if (params?.district) query.append('district', params.district);
  if (params?.lat !== undefined) query.append('lat', params.lat.toString());
  if (params?.lon !== undefined) query.append('lon', params.lon.toString());
  if (params?.limit !== undefined) query.append('limit', params.limit.toString());

  const res = await fetch(`${API_BASE_URL}/schemes/${schemeId}/partners?${query.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch partners for scheme ${schemeId} (Status: ${res.status})`);
  }
  return await res.json();
}

export async function fetchNearbyPartners(params: {
  lat: number;
  lon: number;
  radius_km?: number;
  scheme_id?: number;
  partner_type?: string;
}): Promise<SchemePartner[]> {
  const query = new URLSearchParams({
    lat: params.lat.toString(),
    lon: params.lon.toString(),
  });
  if (params.radius_km !== undefined) query.append('radius_km', params.radius_km.toString());
  if (params.scheme_id !== undefined) query.append('scheme_id', params.scheme_id.toString());
  if (params.partner_type) query.append('partner_type', params.partner_type);

  const res = await fetch(`${API_BASE_URL}/partners/nearby?${query.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch nearby partners (Status: ${res.status})`);
  }
  return await res.json();
}

export async function fetchPartnerDetail(partnerId: number): Promise<ChannelPartner> {
  const res = await fetch(`${API_BASE_URL}/partners/${partnerId}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch channel partner ID ${partnerId} (Status: ${res.status})`);
  }
  return await res.json();
}

export async function fetchApplicationAssistance(
  entrepreneurId: number,
  schemeId: number
): Promise<ApplicationAssistance> {
  const query = new URLSearchParams({
    entrepreneur_id: entrepreneurId.toString(),
    scheme_id: schemeId.toString(),
  });
  const res = await fetch(`${API_BASE_URL}/applications/assistance?${query.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch application assistance package (Status: ${res.status})`);
  }
  return await res.json();
}

export async function createApplication(
  payload: ApplicationCreatePayload
): Promise<Application> {
  const res = await fetch(`${API_BASE_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create application (Status: ${res.status})`);
  }
  return await res.json();
}

export async function listApplications(entrepreneurId: number): Promise<Application[]> {
  const res = await fetch(`${API_BASE_URL}/applications?entrepreneur_id=${entrepreneurId}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to list applications for entrepreneur ${entrepreneurId} (Status: ${res.status})`);
  }
  return await res.json();
}

export async function getApplicationDetail(applicationId: number): Promise<Application> {
  const res = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch application ID ${applicationId} (Status: ${res.status})`);
  }
  return await res.json();
}

export async function updateApplicationStatus(
  applicationId: number,
  payload: ApplicationStatusUpdatePayload
): Promise<Application> {
  const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update application status (Status: ${res.status})`);
  }
  return await res.json();
}

// -------------------------------------------------------------
// Step 11: Grounded AI & RAG Client Functions
// -------------------------------------------------------------

export async function getAIHealth(): Promise<import('../types').AIServiceHealth> {
  const res = await fetch(`${API_BASE_URL}/ai/health`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch AI health status (Status: ${res.status})`);
  }
  return await res.json();
}

export async function sendChatMessage(
  request: import('../types').GroundedChatRequest
): Promise<import('../types').GroundedChatResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `AI chat request failed (Status: ${res.status})`);
  }
  return await res.json();
}

export async function explainEligibilityAI(
  profileId: string,
  schemeCode: string
): Promise<import('../types').GroundedChatResponse> {
  const params = new URLSearchParams({
    profile_id: profileId,
    scheme_code: schemeCode,
  });
  const res = await fetch(`${API_BASE_URL}/ai/explain/eligibility?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `AI eligibility explanation failed (Status: ${res.status})`);
  }
  return await res.json();
}

export async function explainFinanceAI(
  profileId: string,
  schemeCode: string
): Promise<import('../types').GroundedChatResponse> {
  const params = new URLSearchParams({
    profile_id: profileId,
    scheme_code: schemeCode,
  });
  const res = await fetch(`${API_BASE_URL}/ai/explain/finance?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `AI finance explanation failed (Status: ${res.status})`);
  }
  return await res.json();
}

export async function explainFeasibilityAI(
  profileId: string
): Promise<import('../types').GroundedChatResponse> {
  const params = new URLSearchParams({
    profile_id: profileId,
  });
  const res = await fetch(`${API_BASE_URL}/ai/explain/feasibility?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `AI feasibility explanation failed (Status: ${res.status})`);
  }
  return await res.json();
}

export async function explainSchemeAI(
  schemeCode: string
): Promise<import('../types').GroundedChatResponse> {
  const params = new URLSearchParams({
    scheme_code: schemeCode,
  });
  const res = await fetch(`${API_BASE_URL}/ai/explain/scheme?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `AI scheme explanation failed (Status: ${res.status})`);
  }
  return await res.json();
}


