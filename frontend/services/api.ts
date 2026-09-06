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
