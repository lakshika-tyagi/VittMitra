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
  Menu,
  X,
  CheckCircle2,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

interface AppLayoutProps {
  children: React.ReactNode;
}

const STORAGE_COLLAPSED_KEY = 'vittmitra_sidebar_collapsed';

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { activeProfileId, activeProfile, availableProfiles, setActiveProfileId } = useProfile();

  // Desktop sidebar collapsed state (default: false / static expanded)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  // Mobile sidebar drawer open state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  // Profile dropdown open state
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load collapsed preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_COLLAPSED_KEY);
      if (stored === 'true') {
        setIsCollapsed(true);
      }
    }
  }, []);

  // Toggle collapsed state and persist
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_COLLAPSED_KEY, String(next));
      }
      return next;
    });
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  const navLinks = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      desc: 'Aggregated Intelligence',
    },
    {
      label: 'Schemes For You',
      href: '/schemes',
      icon: Compass,
      desc: 'Personalized Schemes',
    },
    {
      label: 'Location Feasibility',
      href: '/feasibility',
      icon: MapPin,
      desc: 'Spatial MSME Density',
    },
    {
      label: 'Applications',
      href: '/applications',
      icon: FileText,
      desc: 'Timeline & Tracking',
    },
    {
      label: 'Compare Schemes',
      href: '/schemes/compare',
      icon: SlidersHorizontal,
      desc: 'Side-by-side Amortization',
    },
    {
      label: 'Onboarding & Profile',
      href: '/onboarding',
      icon: UserPlus,
      desc: 'Create or Edit Details',
    },
  ];

  const currentEntrepreneur = activeProfile?.entrepreneur;

  // Sidebar width constants
  const sidebarWidth = isCollapsed ? 72 : 260;

  // Get current section name for breadcrumb
  const currentNav = navLinks.find((l) =>
    l.href === '/dashboard' ? pathname === '/dashboard' || pathname === '/' : pathname?.startsWith(l.href)
  );
  const pageTitle = currentNav ? currentNav.label : 'VittMitra Platform';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex">
      {/* ========================================================================= */}
      {/* 1. LEFT STATIC / COLLAPSIBLE DESKTOP SIDEBAR                              */}
      {/* ========================================================================= */}
      <aside
        style={{
          width: `${sidebarWidth}px`,
          minWidth: `${sidebarWidth}px`,
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 90,
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          boxShadow: '1px 0 3px rgba(0, 0, 0, 0.02)',
        }}
        className="hidden md:flex"
      >
        {/* Sidebar Brand Header */}
        <div
          style={{
            height: '64px',
            padding: isCollapsed ? '0 0.75rem' : '0 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: '0.5rem',
          }}
        >
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
              overflow: 'hidden',
            }}
            title="VittMitra Dashboard"
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={20} color="#ffffff" />
            </div>

            {!isCollapsed && (
              <div style={{ whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    VittMitra
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                    (वित्तमित्र)
                  </span>
                </div>
                <div style={{ fontSize: '0.62rem', color: '#0284c7', fontWeight: 700, letterSpacing: '0.04em' }}>
                  INTELLIGENT SCHEMES
                </div>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapse}
              style={{
                padding: '0.35rem',
                borderRadius: '6px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              title="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {/* Active Entrepreneur Summary (when expanded) */}
        {!isCollapsed && currentEntrepreneur && (
          <div
            style={{
              margin: '0.85rem 1rem 0.35rem 1rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Profile
              </div>
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentEntrepreneur.full_name}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                {currentEntrepreneur.category || 'General'} • {currentEntrepreneur.district || 'Location N/A'}
              </div>
            </div>

            <Link
              href="/onboarding?edit=true"
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.68rem',
                fontWeight: 600,
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#2563eb',
                textDecoration: 'none',
                border: '1px solid #bfdbfe',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
              title="Edit active profile"
            >
              Edit
            </Link>
          </div>
        )}

        {/* Navigation Items List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isCollapsed ? '0.75rem 0.5rem' : '0.75rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          {!isCollapsed && (
            <div
              style={{
                fontSize: '0.68rem',
                color: '#94a3b8',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '0.35rem 0.6rem 0.15rem 0.6rem',
              }}
            >
              Navigation
            </div>
          )}

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === '/dashboard'
                ? pathname === '/dashboard' || pathname === '/'
                : pathname?.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: isCollapsed ? '0.65rem 0' : '0.65rem 0.85rem',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderRadius: '10px',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                  color: isActive ? '#2563eb' : '#475569',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
                title={isCollapsed ? `${link.label} — ${link.desc}` : undefined}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? '#2563eb' : '#64748b',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={19} />
                </div>

                {!isCollapsed && (
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#1e3a8a' : '#334155',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {link.label}
                    </div>
                  </div>
                )}

                {!isCollapsed && isActive && (
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#2563eb',
                      boxShadow: '0 0 6px rgba(37, 99, 235, 0.4)',
                      flexShrink: 0,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer & Collapse Toggle */}
        <div
          style={{
            padding: isCollapsed ? '0.75rem 0.5rem' : '0.85rem 1rem',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {/* Quick Onboard Action Button */}
          <Link
            href="/onboarding"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#059669',
              fontSize: '0.78rem',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            title="Onboard New Entrepreneur"
          >
            <UserPlus size={16} />
            {!isCollapsed && <span>+ Onboard Profile</span>}
          </Link>

          {/* Expand Toggle Button (when collapsed) */}
          {isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapse}
              style={{
                width: '100%',
                padding: '0.45rem 0',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              title="Expand sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MOBILE OVERLAY DRAWER SIDEBAR                                          */}
      {/* ========================================================================= */}
      {mobileDrawerOpen && (
        <>
          <div
            onClick={() => setMobileDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 998,
            }}
          />

          <aside
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '280px',
              backgroundColor: '#ffffff',
              borderRight: '1px solid #e2e8f0',
              boxShadow: '8px 0 35px rgba(0, 0, 0, 0.12)',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeInDrawer 0.2s ease-out forwards',
            }}
          >
            {/* Mobile Drawer Header */}
            <div
              style={{
                height: '64px',
                padding: '0 1.25rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={18} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    VittMitra
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 600 }}>
                    PLATFORM NAVIGATION
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  padding: '0.4rem',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Nav Items */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.href === '/dashboard'
                    ? pathname === '/dashboard' || pathname === '/'
                    : pathname?.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      backgroundColor: isActive ? '#eff6ff' : 'transparent',
                      border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                      color: isActive ? '#2563eb' : '#334155',
                      textDecoration: 'none',
                    }}
                  >
                    <Icon size={18} />
                    <span style={{ fontSize: '0.88rem', fontWeight: isActive ? 700 : 500 }}>
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </aside>
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT AREA & TOP HEADER BAR                                     */}
      {/* ========================================================================= */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: `${sidebarWidth}px`,
          transition: 'margin-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="main-content-wrapper"
      >
        {/* Sticky Top Header Bar */}
        <header
          style={{
            height: '64px',
            position: 'sticky',
            top: 0,
            zIndex: 80,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
        >
          {/* Left Side: Sidebar Toggle & Page Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Desktop Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              style={{
                display: 'none',
                padding: '0.45rem',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              className="md:flex items-center justify-center hover:bg-slate-100 hover:text-slate-900"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              style={{
                display: 'flex',
                padding: '0.45rem',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                cursor: 'pointer',
              }}
              className="md:hidden items-center justify-center"
              title="Open Navigation"
            >
              <Menu size={18} />
            </button>

            {/* Page Title / Section Indicator */}
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                {pageTitle}
              </div>
            </div>
          </div>

          {/* Right Side: Active Profile Selector Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: currentEntrepreneur
                    ? 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)'
                    : '#e2e8f0',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {currentEntrepreneur ? currentEntrepreneur.full_name.charAt(0).toUpperCase() : <User size={14} color="#64748b" />}
              </div>
              <div style={{ textAlign: 'left', maxWidth: '140px' }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: '#0f172a',
                  }}
                >
                  {currentEntrepreneur ? currentEntrepreneur.full_name : 'Select Profile'}
                </div>
                {currentEntrepreneur?.district && (
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {currentEntrepreneur.district}, {currentEntrepreneur.state || ''}
                  </div>
                )}
              </div>
              <ChevronDown size={14} color="#64748b" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '270px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
                  padding: '0.5rem',
                  zIndex: 200,
                }}
              >
                <div
                  style={{
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 700,
                    borderBottom: '1px solid #f1f5f9',
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
                          setProfileDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.6rem',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                          border: isSelected ? '1px solid #bfdbfe' : '1px solid transparent',
                          color: isSelected ? '#2563eb' : '#1e293b',
                          cursor: 'pointer',
                          textAlign: 'left',
                          marginBottom: '0.25rem',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.full_name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            ID #{p.id} • {p.district || 'Location N/A'}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={16} color="#2563eb" />}
                      </button>
                    );
                  })}
                  {availableProfiles.length === 0 && (
                    <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                      No profiles found in system
                    </div>
                  )}
                </div>

                <div
                  style={{
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '0.4rem',
                    marginTop: '0.4rem',
                  }}
                >
                  <Link
                    href="/onboarding"
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.6rem',
                      borderRadius: '8px',
                      color: '#059669',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      backgroundColor: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    <UserPlus size={15} />
                    <span>+ Onboard New Entrepreneur</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Children Content */}
        <main style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
