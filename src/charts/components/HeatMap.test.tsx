import React from 'react';
import { render, screen } from '@testing-library/react';
import { HeatMap } from './HeatMap';

const mockData = [
  { row: 'Service A', col: 'Query 1', value: 0.8 },
  { row: 'Service A', col: 'Query 2', value: 0.5 },
  { row: 'Service B', col: 'Query 1', value: 0.3 },
  { row: 'Service B', col: 'Query 2', value: 0.9 },
];

describe('HeatMap', () => {
  it('renders heatmap with data', () => {
    const { container } = render(
      <HeatMap data={mockData} title="Token Coverage" />
    );
    expect(screen.getByText('Token Coverage')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<HeatMap data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders cells for each data point', () => {
    const { container } = render(<HeatMap data={mockData} />);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThan(0);
  });

  it('renders row and column labels', () => {
    const { container } = render(<HeatMap data={mockData} />);
    const textElements = container.querySelectorAll('text');
    expect(textElements.length).toBeGreaterThan(0);
  });

  it('applies custom color scale', () => {
    const customColorScale = (v: number) => `rgba(255, 0, 0, ${v})`;
    const { container } = render(
      <HeatMap data={mockData} colorScale={customColorScale} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
