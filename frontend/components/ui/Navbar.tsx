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
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

export function Navbar() {
  const pathname = usePathname();
  const { activeProfileId, activeProfile, availableProfiles, setActiveProfileId, loading } = useProfile();

  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
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

  // Close sidebar on Escape key
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const navLinks = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      desc: 'Aggregated Intelligence & KPI Overview',
    },
    {
      label: 'Schemes For You',
      href: '/schemes',
      icon: Compass,
      desc: 'Personalized & Ranked Government Schemes',
    },
    {
      label: 'Location Feasibility',
      href: '/feasibility',
      icon: MapPin,
      desc: 'PostGIS Spatial MSME Clusters & Density',
    },
    {
      label: 'Applications',
      href: '/applications',
      icon: FileText,
      desc: 'Lifecycle Timeline & Partner Tracking',
    },
    {
      label: 'Compare Schemes',
      href: '/schemes/compare',
      icon: SlidersHorizontal,
      desc: 'Multi-Scheme Rules & Financial Amortization',
    },
    {
      label: 'Onboarding & Profile',
      href: '/onboarding',
      icon: UserPlus,
      desc: 'Register or Edit Entrepreneur Details',
    },
  ];

  const currentEntrepreneur = activeProfile?.entrepreneur;

  return (
    <>
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
          {/* Brand Logo (Left) */}
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

          {/* Right Controls: Profile Switcher & Right Sidebar Menu Button */}
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
                  padding: '0.45rem 0.85rem',
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
                    width: '270px',
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

            {/* Right Sidebar Menu Trigger Button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              title="Open Navigation Menu"
            >
              <Menu size={18} />
              <span style={{ fontSize: '0.85rem' }}>Menu</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Right Navigation Sidebar Drawer & Backdrop */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="nav-sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 9990,
            }}
          />

          {/* Right Sidebar Drawer Panel */}
          <div
            className="nav-sidebar-drawer"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '380px',
              height: '100vh',
              maxHeight: '100vh',
              backgroundColor: '#0a0f1d',
              borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.85)',
              zIndex: 9995,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Sidebar Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                background: 'linear-gradient(135deg, #111827 0%, #0a0f1d 100%)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <ShieldCheck size={18} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                    VittMitra Menu
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    Platform Navigation
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                style={{
                  padding: '0.4rem',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                title="Close Menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Active Profile Info Banner inside Sidebar */}
            {currentEntrepreneur && (
              <div
                style={{
                  margin: '1rem 1.25rem 0.5rem 1.25rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.06)',
                  border: '1px solid rgba(56, 189, 248, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Active Entrepreneur
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                    {currentEntrepreneur.full_name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {currentEntrepreneur.category || 'General'} • {currentEntrepreneur.district}, {currentEntrepreneur.state}
                  </div>
                </div>

                <Link
                  href="/onboarding?edit=true"
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#e2e8f0',
                    textDecoration: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Edit
                </Link>
              </div>
            )}

            {/* Navigation Links List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.75rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.5rem' }}>
                Modules & Workflows
              </div>

              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: isActive ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                      color: isActive ? '#38bdf8' : '#e2e8f0',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive ? '#38bdf8' : '#94a3b8',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: isActive ? 700 : 600 }}>
                        {link.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                        {link.desc}
                      </div>
                    </div>
                    {isActive ? (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                    ) : (
                      <ArrowRight size={14} color="#64748b" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Sidebar Bottom Action Footer */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              <Link
                href="/onboarding"
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.7rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <UserPlus size={16} />
                <span>+ Onboard New Entrepreneur</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}

