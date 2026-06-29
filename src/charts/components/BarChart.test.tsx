import React from 'react';
import { render, screen } from '@testing-library/react';
import { BarChart } from './BarChart';

const mockData = [
  { x: 'Agent A', y: 25 },
  { x: 'Agent B', y: 18 },
  { x: 'Agent C', y: 32 },
  { x: 'Agent D', y: 21 },
];

describe('BarChart', () => {
  it('renders chart with data', () => {
    const { container } = render(
      <BarChart data={mockData} title="Agent Stats" />
    );
    expect(screen.getByText('Agent Stats')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<BarChart data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders with category and value labels', () => {
    const { container } = render(
      <BarChart
        data={mockData}
        xLabel="Agent"
        yLabel="Throughput"
      />
    );
    expect(container.textContent).toContain('Agent');
    expect(container.textContent).toContain('Throughput');
  });

  it('handles custom height', () => {
    const { container } = render(
      <BarChart data={mockData} height={600} />
    );
    const wrapper = container.querySelector('.chart-wrapper');
    expect(wrapper).toHaveStyle('height: 600px');
  });
});
