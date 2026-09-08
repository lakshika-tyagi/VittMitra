'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  LayoutDashboard,
  Compass,
  MapPin,
  FileText,
  UserPlus,
  User,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

export function Navbar() {
  const pathname = usePathname();
  const { activeProfileId, activeProfile, availableProfiles, setActiveProfileId, loading } = useProfile();

  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Schemes For You', href: '/schemes', icon: Compass },
    { label: 'Location Feasibility', href: '/feasibility', icon: MapPin },
    { label: 'Applications', href: '/applications', icon: FileText },
    { label: 'Onboarding', href: '/onboarding', icon: UserPlus },
  ];

  const currentEntrepreneur = activeProfile?.entrepreneur;

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0.75rem 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                VittMitra
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                (वित्तमित्र)
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600, letterSpacing: '0.02em' }}>
              INTELLIGENT SCHEME PLATFORM
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="desktop-nav">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  textDecoration: 'none',
                }}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Controls: Profile Switcher & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Active Profile Switcher Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: currentEntrepreneur
                    ? 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {currentEntrepreneur ? currentEntrepreneur.full_name.charAt(0).toUpperCase() : <User size={14} />}
              </div>
              <div style={{ textAlign: 'left', maxWidth: '140px' }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentEntrepreneur ? currentEntrepreneur.full_name : 'Select Profile'}
                </div>
                {currentEntrepreneur?.district && (
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {currentEntrepreneur.district}, {currentEntrepreneur.state || ''}
                  </div>
                )}
              </div>
              <ChevronDown size={14} color="#94a3b8" />
            </button>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '260px',
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                  padding: '0.5rem',
                  zIndex: 200,
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div
                  style={{
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 700,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: '0.4rem',
                  }}
                >
                  Active Entrepreneur Profiles
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {availableProfiles.map((p) => {
                    const isSelected = p.id === activeProfileId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setActiveProfileId(p.id);
                          setDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.6rem',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                          border: isSelected ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                          color: isSelected ? '#38bdf8' : '#e2e8f0',
                          cursor: 'pointer',
                          textAlign: 'left',
                          marginBottom: '0.25rem',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.full_name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            ID #{p.id} • {p.district || 'Location N/A'}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={16} color="#38bdf8" />}
                      </button>
                    );
                  })}
                  {availableProfiles.length === 0 && (
                    <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                      No profiles found in system
                    </div>
                  )}
                </div>

                <div
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '0.4rem',
                    marginTop: '0.4rem',
                  }}
                >
                  <Link
                    href="/onboarding"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.6rem',
                      borderRadius: '8px',
                      color: '#34d399',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <UserPlus size={15} />
                    <span>+ Onboard New Entrepreneur</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '0.4rem',
              color: '#f8fafc',
              cursor: 'pointer',
            }}
            className="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1rem 0',
            marginTop: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
          className="mobile-nav-panel"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#38bdf8' : '#e2e8f0',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  textDecoration: 'none',
                }}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
