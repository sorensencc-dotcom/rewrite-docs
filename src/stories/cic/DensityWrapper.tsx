import React from 'react';

interface DensityWrapperProps {
  children: React.ReactNode;
}

export default function DensityWrapper({ children }: DensityWrapperProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', padding: '1rem' }}>
      <div data-density="compact" style={{ border: '1px solid var(--cic-color-border)', padding: '1rem', borderRadius: '4px' }}>
        <div style={{ fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600, color: 'var(--cic-color-text-muted)' }}>
          Compact (0.8x)
        </div>
        {children}
      </div>
      <div data-density="cozy" style={{ border: '1px solid var(--cic-color-border)', padding: '1rem', borderRadius: '4px' }}>
        <div style={{ fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600, color: 'var(--cic-color-text-muted)' }}>
          Cozy (1.0x)
        </div>
        {children}
      </div>
      <div data-density="comfortable" style={{ border: '1px solid var(--cic-color-border)', padding: '1rem', borderRadius: '4px' }}>
        <div style={{ fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600, color: 'var(--cic-color-text-muted)' }}>
          Comfortable (1.4x)
        </div>
        {children}
      </div>
    </div>
  );
}
