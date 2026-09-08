'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createUnifiedProfile } from '@/services/api';
import { UnifiedProfileCreatePayload, UnifiedProfileResponse } from '@/types';
import { useProfile } from '@/hooks/useProfile';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Puducherry'
];

const SECTORS = [
  { value: 'manufacturing', label: 'Manufacturing (Production & Processing)' },
  { value: 'services', label: 'Services (IT, Repair, Hospitality, Professional)' },
  { value: 'trading', label: 'Trading & Retail (Shopkeepers, Wholesale)' },
  { value: 'handicrafts', label: 'Artisan & Handicrafts (Vishwakarma Trades)' },
  { value: 'agro_allied', label: 'Agro-Allied (Food Processing, Dairy)' },
  { value: 'street_vendor', label: 'Street Vending (Urban/Peri-Urban Micro-vending)' },
];

export default function OnboardingPage() {
  const { setActiveProfileId, refreshProfiles } = useProfile();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdProfile, setCreatedProfile] = useState<UnifiedProfileResponse | null>(null);

  // Form State
  const [formData, setFormData] = useState<UnifiedProfileCreatePayload>({
    entrepreneur: {
      full_name: '',
      age: 28,
      gender: 'female',
      category: 'OBC',
      preferred_language: 'en',
      phone_number: '',
      email: '',
      state: 'Maharashtra',
      district: 'Pune',
      city: 'Pune',
      pincode: '411001',
      area_type: 'urban',
    },
    business: {
      business_name: '',
      business_type: 'proprietorship',
      sector: 'manufacturing',
      sub_sector: 'food_processing',
      business_stage: 'new_enterprise',
      business_description: '',
      existing_business_vintage_years: 0,
      is_greenfield: true,
      has_vending_proof: false,
      is_notified_trade: false,
      is_single_family_applicant: true,
      has_govt_employee_in_family: false,
      availed_pmegp_mudra_last_5yr: false,
      is_non_farm_income_generating: true,
      is_defaulter: false,
    },
    financial: {
      project_cost: 1500000,
      own_contribution: 250000,
      loan_requirement: 1250000,
      monthly_income: 45000,
      existing_monthly_obligations: 5000,
      machinery_equipment_cost: 1000000,
      infrastructure_cost: 300000,
      working_capital_cost: 200000,
      other_expenses_cost: 0,
    },
  });

  const updateEntrepreneur = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      entrepreneur: { ...prev.entrepreneur, [field]: value }
    }));
  };

  const updateBusiness = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      business: prev.business ? { ...prev.business, [field]: value } : { [field]: value }
    }));
  };

  const updateFinancial = (field: string, value: any) => {
    const numericVal = value === '' ? null : Number(value);
    setFormData(prev => ({
      ...prev,
      financial: prev.financial ? { ...prev.financial, [field]: numericVal } : { [field]: numericVal }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await createUnifiedProfile(formData);
      setCreatedProfile(response);
      if (response.entrepreneur?.id) {
        setActiveProfileId(response.entrepreneur.id);
        await refreshProfiles();
      }
      setCurrentStep(5);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save profile. Please check input values.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <Link href="/dashboard" style={{ fontSize: '0.875rem', color: '#64748b', display: 'inline-block', marginBottom: '0.75rem' }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
          Entrepreneur <span className="gradient-text">Onboarding</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
          Step-by-step profile creation to unlock explainable government credit & subsidy matching.
        </p>
      </div>

      {/* Stepper Indicator */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
          {[
            { step: 1, title: '1. Personal' },
            { step: 2, title: '2. Location' },
            { step: 3, title: '3. Business' },
            { step: 4, title: '4. Finance' },
            { step: 5, title: '5. Summary' },
          ].map(s => {
            const isActive = currentStep === s.step;
            const isDone = currentStep > s.step || (createdProfile !== null && s.step === 5);
            return (
              <div
                key={s.step}
                onClick={() => {
                  if (s.step < currentStep || createdProfile !== null) setCurrentStep(s.step);
                }}
                style={{
                  cursor: (s.step < currentStep || createdProfile) ? 'pointer' : 'default',
                  borderBottom: isActive ? '3px solid #2563eb' : isDone ? '3px solid #059669' : '3px solid #e2e8f0',
                  paddingBottom: '0.5rem',
                  color: isActive ? '#2563eb' : isDone ? '#059669' : '#64748b',
                  fontWeight: isActive || isDone ? 700 : 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                }}
              >
                {s.title}
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.85rem',
        color: '#1e3a8a'
      }}>
        <span style={{ fontSize: '1.2rem' }}>🔒</span>
        <span>
          <strong>Zero Sensitive PII Policy:</strong> VittMitra does not collect or store Aadhaar numbers, PAN cards, passwords, or bank account credentials. All evaluations are fully deterministic.
        </span>
      </div>

      {errorMessage && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#991b1b',
          fontSize: '0.9rem'
        }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Form Steps */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>

          {/* STEP 1: Personal & Demographics */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a' }}>
                Step 1: Personal & Demographic Information
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.entrepreneur.full_name}
                    onChange={e => updateEntrepreneur('full_name', e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Age (Years) *
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    required
                    value={formData.entrepreneur.age ?? ''}
                    onChange={e => updateEntrepreneur('age', parseInt(e.target.value) || null)}
                    placeholder="e.g. 28"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Gender *
                  </label>
                  <select
                    value={formData.entrepreneur.gender ?? 'female'}
                    onChange={e => updateEntrepreneur('gender', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other / Non-Binary</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Social Category *
                  </label>
                  <select
                    value={formData.entrepreneur.category ?? 'OBC'}
                    onChange={e => updateEntrepreneur('category', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC (Other Backward Classes)</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                    <option value="Minorities">Minorities</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Preferred Language
                  </label>
                  <select
                    value={formData.entrepreneur.preferred_language ?? 'en'}
                    onChange={e => updateEntrepreneur('preferred_language', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  >
                    <option value="en">English (English)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.entrepreneur.phone_number ?? ''}
                    onChange={e => updateEntrepreneur('phone_number', e.target.value)}
                    placeholder="e.g. 9876543210"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setCurrentStep(2)}
                  disabled={!formData.entrepreneur.full_name || !formData.entrepreneur.age}
                >
                  Next: Location Details →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Geographic Location */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a' }}>
                Step 2: Location & Geographic Details
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    State / UT *
                  </label>
                  <select
                    value={formData.entrepreneur.state ?? 'Maharashtra'}
                    onChange={e => updateEntrepreneur('state', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  >
                    {INDIAN_STATES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    District
                  </label>
                  <input
                    type="text"
                    value={formData.entrepreneur.district ?? ''}
                    onChange={e => updateEntrepreneur('district', e.target.value)}
                    placeholder="e.g. Pune"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    City / Town / Village
                  </label>
                  <input
                    type="text"
                    value={formData.entrepreneur.city ?? ''}
                    onChange={e => updateEntrepreneur('city', e.target.value)}
                    placeholder="e.g. Haveli"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Area Type *
                  </label>
                  <select
                    value={formData.entrepreneur.area_type ?? 'rural'}
                    onChange={e => updateEntrepreneur('area_type', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  >
                    <option value="rural">Rural (Qualifies for higher PMEGP subsidies)</option>
                    <option value="urban">Urban</option>
                    <option value="peri_urban">Peri-Urban</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    PIN Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.entrepreneur.pincode ?? ''}
                    onChange={e => updateEntrepreneur('pincode', e.target.value)}
                    placeholder="e.g. 411001"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn-secondary" onClick={() => setCurrentStep(1)}>
                  ← Back
                </button>
                <button type="button" className="btn-primary" onClick={() => setCurrentStep(3)}>
                  Next: Business Details →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Business Details */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a' }}>
                Step 3: Enterprise & Business Activity
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Business / Trade Name
                  </label>
                  <input
                    type="text"
                    value={formData.business?.business_name ?? ''}
                    onChange={e => updateBusiness('business_name', e.target.value)}
                    placeholder="e.g. Sahyadri Agro Food Products"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Industry Sector *
                  </label>
                  <select
                    value={formData.business?.sector ?? 'manufacturing'}
                    onChange={e => updateBusiness('sector', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  >
                    {SECTORS.map(sec => (
                      <option key={sec.value} value={sec.value}>{sec.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Business Stage *
                  </label>
                  <select
                    value={formData.business?.business_stage ?? 'new_enterprise'}
                    onChange={e => updateBusiness('business_stage', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  >
                    <option value="idea">Idea Stage / Project Formulation</option>
                    <option value="new_enterprise">New Greenfield Enterprise (First time setup)</option>
                    <option value="expansion">Existing Business Expansion / Modernization</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Constitution Type
                  </label>
                  <select
                    value={formData.business?.business_type ?? 'proprietorship'}
                    onChange={e => updateBusiness('business_type', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  >
                    <option value="proprietorship">Sole Proprietorship</option>
                    <option value="partnership">Partnership Firm</option>
                    <option value="self_employed">Individual / Self-Employed</option>
                    <option value="pvt_ltd">Private Limited Company</option>
                  </select>
                </div>
              </div>

              {/* Specific Qualification Checkboxes */}
              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.business?.is_greenfield ?? true}
                    onChange={e => updateBusiness('is_greenfield', e.target.checked)}
                  />
                  Greenfield (New Business) Project
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.business?.has_vending_proof ?? false}
                    onChange={e => updateBusiness('has_vending_proof', e.target.checked)}
                  />
                  Has Street Vending ID / ULB Certificate (PM SVANidhi)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.business?.is_notified_trade ?? false}
                    onChange={e => updateBusiness('is_notified_trade', e.target.checked)}
                  />
                  Artisan / Traditional Craft Trade (PM Vishwakarma)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.business?.is_defaulter ?? false}
                    onChange={e => updateBusiness('is_defaulter', e.target.checked)}
                  />
                  Any Past Bank Loan Default History
                </label>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn-secondary" onClick={() => setCurrentStep(2)}>
                  ← Back
                </button>
                <button type="button" className="btn-primary" onClick={() => setCurrentStep(4)}>
                  Next: Financial Inputs →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Financial Inputs */}
          {currentStep === 4 && (
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a' }}>
                Step 4: Financial & Investment Parameters
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Total Project Cost (₹) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={formData.financial?.project_cost ?? ''}
                    onChange={e => updateFinancial('project_cost', e.target.value)}
                    placeholder="e.g. 1500000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Own Equity Contribution (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.financial?.own_contribution ?? ''}
                    onChange={e => updateFinancial('own_contribution', e.target.value)}
                    placeholder="e.g. 250000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Net Monthly Income (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.financial?.monthly_income ?? ''}
                    onChange={e => updateFinancial('monthly_income', e.target.value)}
                    placeholder="e.g. 45000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Existing Monthly Loan EMIs (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.financial?.existing_monthly_obligations ?? ''}
                    onChange={e => updateFinancial('existing_monthly_obligations', e.target.value)}
                    placeholder="e.g. 5000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn-secondary" onClick={() => setCurrentStep(3)}>
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || !formData.financial?.project_cost}
                >
                  {isSubmitting ? 'Saving Profile...' : 'Save Profile & Calculate Completeness →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Summary & Next Steps */}
          {currentStep === 5 && createdProfile && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669', marginBottom: '0.25rem' }}>
                  Profile Created Successfully!
                </h2>
                <p style={{ color: '#64748b' }}>
                  Profile ID: #{createdProfile.entrepreneur.id} • {createdProfile.entrepreneur.full_name}
                </p>
              </div>

              {/* Completeness Card */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>
                    Profile Completeness
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.9rem', padding: '0.35rem 0.85rem' }}>
                    {createdProfile.completeness.completion_percentage}% Complete
                  </span>
                </div>

                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#e2e8f0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: `${createdProfile.completeness.completion_percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0284c7 0%, #059669 100%)',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease-out',
                  }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {Object.entries(createdProfile.completeness.section_breakdown).map(([sectionName, sec]) => (
                    <div key={sectionName} style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: sec.is_complete ? '#ecfdf5' : '#fef2f2',
                      border: `1px solid ${sec.is_complete ? '#a7f3d0' : '#fecaca'}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize', color: sec.is_complete ? '#047857' : '#991b1b' }}>
                        <span>{sectionName}</span>
                        <span>{sec.is_complete ? '✅ Complete' : '⚠️ Missing Data'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  href={`/dashboard?profile_id=${createdProfile.entrepreneur.id}`}
                  className="btn-primary"
                >
                  Go to Entrepreneur Dashboard →
                </Link>
                <Link
                  href={`/schemes?profile_id=${createdProfile.entrepreneur.id}`}
                  className="btn-secondary"
                >
                  View Personalized Scheme Matches
                </Link>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
