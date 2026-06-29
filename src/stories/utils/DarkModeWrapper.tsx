import React, { ReactNode } from 'react';

interface DarkModeWrapperProps {
  children: ReactNode;
}

export const DarkModeWrapper: React.FC<DarkModeWrapperProps> = ({ children }) => (
  <div style={{ display: 'flex', gap: '2rem', padding: '1rem' }}>
    <div data-theme="light" style={{ flex: 1 }}>
      <h4>Light</h4>
      {children}
    </div>
    <div data-theme="dark" style={{ flex: 1, background: '#1a1a1a', padding: '1rem' }}>
      <h4 style={{ color: '#fff' }}>Dark</h4>
      {children}
    </div>
  </div>
);

export default DarkModeWrapper;
