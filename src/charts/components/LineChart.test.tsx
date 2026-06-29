import React from 'react';
import { render, screen } from '@testing-library/react';
import { LineChart } from './LineChart';

const mockData = [
  { x: 0, y: 10 },
  { x: 1, y: 15 },
  { x: 2, y: 12 },
  { x: 3, y: 18 },
  { x: 4, y: 20 },
];

describe('LineChart', () => {
  it('renders chart with data', () => {
    const { container } = render(
      <LineChart data={mockData} title="Test Line Chart" />
    );
    expect(screen.getByText('Test Line Chart')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<LineChart data={[]} title="Empty Chart" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders with custom labels', () => {
    const { container } = render(
      <LineChart
        data={mockData}
        xLabel="Time (minutes)"
        yLabel="Temperature (°C)"
      />
    );
    expect(container.textContent).toContain('Time (minutes)');
    expect(container.textContent).toContain('Temperature (°C)');
  });

  it('accepts custom dimensions', () => {
    const { container } = render(
      <LineChart data={mockData} height={500} />
    );
    const wrapper = container.querySelector('.chart-wrapper');
    expect(wrapper).toHaveStyle('height: 500px');
  });
});
