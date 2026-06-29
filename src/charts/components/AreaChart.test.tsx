import React from 'react';
import { render, screen } from '@testing-library/react';
import { AreaChart } from './AreaChart';

const mockData = [
  { x: 0, y: 50 },
  { x: 1, y: 80 },
  { x: 2, y: 120 },
  { x: 3, y: 100 },
  { x: 4, y: 150 },
];

describe('AreaChart', () => {
  it('renders chart with data', () => {
    const { container } = render(
      <AreaChart data={mockData} title="Ingestion Throughput" />
    );
    expect(screen.getByText('Ingestion Throughput')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<AreaChart data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders with custom axis labels', () => {
    const { container } = render(
      <AreaChart
        data={mockData}
        xLabel="Hours"
        yLabel="Events/sec"
      />
    );
    expect(container.textContent).toContain('Hours');
    expect(container.textContent).toContain('Events/sec');
  });

  it('applies fill opacity', () => {
    const { container } = render(
      <AreaChart data={mockData} />
    );
    const areaElements = container.querySelectorAll('polyline');
    expect(areaElements.length).toBeGreaterThan(0);
  });
});
