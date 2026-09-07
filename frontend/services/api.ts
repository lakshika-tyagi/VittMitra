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

import {
  FeasibilityInputContext,
  FeasibilityAnalysisResponse,
  DistrictEcosystem,
  NearbyCluster,
} from '@/types';

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
