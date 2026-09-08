'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="glass-panel" style={{ padding: '3rem 2rem', maxWidth: '540px', width: '100%' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
          Page Not Found
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
          The government scheme, page, or service you are looking for does not exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>
            Go to Dashboard →
          </Link>
          <Link href="/schemes" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Browse Schemes
          </Link>
        </div>
      </div>
    </div>
  );
}
