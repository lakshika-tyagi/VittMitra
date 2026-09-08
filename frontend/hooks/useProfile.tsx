'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { listProfiles, getUnifiedProfile } from '@/services/api';
import { Entrepreneur, UnifiedProfileResponse } from '@/types';

interface ProfileContextType {
  activeProfileId: number | null;
  activeProfile: UnifiedProfileResponse | null;
  availableProfiles: Entrepreneur[];
  loading: boolean;
  error: string | null;
  setActiveProfileId: (id: number | null) => void;
  refreshProfiles: () => Promise<void>;
  selectNextProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const STORAGE_KEY = 'vittmitra_active_profile_id';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfileId, setActiveProfileIdState] = useState<number | null>(null);
  const [activeProfile, setActiveProfile] = useState<UnifiedProfileResponse | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<Entrepreneur[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfilesList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profiles = await listProfiles(0, 100);
      setAvailableProfiles(profiles);

      let targetId: number | null = null;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && !isNaN(Number(stored))) {
          const storedNum = Number(stored);
          if (profiles.some((p) => p.id === storedNum)) {
            targetId = storedNum;
          }
        }
      }

      if (!targetId && profiles.length > 0) {
        targetId = profiles[0].id;
      }

      if (targetId) {
        setActiveProfileIdState(targetId);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, String(targetId));
        }
        const profileData = await getUnifiedProfile(targetId);
        setActiveProfile(profileData);
      } else {
        setActiveProfileIdState(null);
        setActiveProfile(null);
      }
    } catch (err: any) {
      console.error('Failed to load profiles:', err);
      setError(err.message || 'Failed to load entrepreneur profiles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfilesList();
  }, [fetchProfilesList]);

  const setActiveProfileId = useCallback(async (id: number | null) => {
    setActiveProfileIdState(id);
    if (typeof window !== 'undefined') {
      if (id !== null) {
        localStorage.setItem(STORAGE_KEY, String(id));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (id !== null) {
      try {
        const profileData = await getUnifiedProfile(id);
        setActiveProfile(profileData);
      } catch (err) {
        console.error(`Failed to fetch profile ID ${id}:`, err);
        setActiveProfile(null);
      }
    } else {
      setActiveProfile(null);
    }
  }, []);

  const selectNextProfile = useCallback(() => {
    if (availableProfiles.length === 0) return;
    const currentIndex = availableProfiles.findIndex((p) => p.id === activeProfileId);
    const nextIndex = (currentIndex + 1) % availableProfiles.length;
    const nextProfile = availableProfiles[nextIndex];
    if (nextProfile) {
      setActiveProfileId(nextProfile.id);
    }
  }, [availableProfiles, activeProfileId, setActiveProfileId]);

  return (
    <ProfileContext.Provider
      value={{
        activeProfileId,
        activeProfile,
        availableProfiles,
        loading,
        error,
        setActiveProfileId,
        refreshProfiles: fetchProfilesList,
        selectNextProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
