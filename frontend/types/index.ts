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
