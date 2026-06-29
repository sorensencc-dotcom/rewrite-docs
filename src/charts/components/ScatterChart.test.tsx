import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScatterChart } from './ScatterChart';

const mockData = [
  { x: 10, y: 20 },
  { x: 15, y: 25 },
  { x: 12, y: 18 },
  { x: 18, y: 30 },
  { x: 22, y: 28 },
];

describe('ScatterChart', () => {
  it('renders chart with data', () => {
    const { container } = render(
      <ScatterChart data={mockData} title="Memory Distribution" />
    );
    expect(screen.getByText('Memory Distribution')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<ScatterChart data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders with custom accessors', () => {
    const customData = [
      { cluster: 1, dist: 50, id: 'a' },
      { cluster: 2, dist: 75, id: 'b' },
    ];
    const { container } = render(
      <ScatterChart
        data={customData as any}
        xAccessor={(d) => d.cluster}
        yAccessor={(d) => d.dist}
      />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('displays axis labels', () => {
    const { container } = render(
      <ScatterChart
        data={mockData}
        xLabel="CPU Usage"
        yLabel="Memory (GB)"
      />
    );
    expect(container.textContent).toContain('CPU Usage');
    expect(container.textContent).toContain('Memory (GB)');
  });
});
