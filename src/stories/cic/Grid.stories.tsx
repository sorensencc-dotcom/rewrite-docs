import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from '../../components/cic/Grid';
import { Card } from '../../components/cic/Card';
import DensityWrapper from './DensityWrapper';
import DarkModeWrapper from '../utils/DarkModeWrapper';

const meta = {
  title: 'CIC/Grid',
  component: Grid,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

// Golden path - 12 column (default)
export const TwelveColumn: Story = {
  render: () => (
    <DarkModeWrapper>
      <Grid cols={12}>
        <div style={{ gridColumn: 'span 6' }}>
          <Card>6 columns</Card>
        </div>
        <div style={{ gridColumn: 'span 6' }}>
          <Card>6 columns</Card>
        </div>
      </Grid>
    </DarkModeWrapper>
  ),
};

export const SixColumn: Story = {
  render: () => (
    <DarkModeWrapper>
      <Grid cols={6}>
        <div style={{ gridColumn: 'span 3' }}>
          <Card>3 columns</Card>
        </div>
        <div style={{ gridColumn: 'span 3' }}>
          <Card>3 columns</Card>
        </div>
      </Grid>
    </DarkModeWrapper>
  ),
};

export const FourColumn: Story = {
  render: () => (
    <DarkModeWrapper>
      <Grid cols={4}>
        <Card>1/4</Card>
        <Card>1/4</Card>
        <Card>1/4</Card>
        <Card>1/4</Card>
      </Grid>
    </DarkModeWrapper>
  ),
};

export const TwoColumn: Story = {
  render: () => (
    <DarkModeWrapper>
      <Grid cols={2}>
        <Card>50%</Card>
        <Card>50%</Card>
      </Grid>
    </DarkModeWrapper>
  ),
};

export const SingleColumn: Story = {
  render: () => (
    <DarkModeWrapper>
      <Grid cols={1}>
        <Card>100%</Card>
        <Card>100%</Card>
        <Card>100%</Card>
      </Grid>
    </DarkModeWrapper>
  ),
};

// Edge cases
export const ManyItems: Story = {
  render: () => (
    <DarkModeWrapper>
      <Grid cols={3}>
        {Array.from({ length: 12 }, (_, i) => (
          <Card key={i}>Item {i + 1}</Card>
        ))}
      </Grid>
    </DarkModeWrapper>
  ),
};

export const UnevenSpans: Story = {
  render: () => (
    <DarkModeWrapper>
      <Grid cols={12}>
        <div style={{ gridColumn: 'span 12' }}>
          <Card>Full width</Card>
        </div>
        <div style={{ gridColumn: 'span 8' }}>
          <Card>8 columns</Card>
        </div>
        <div style={{ gridColumn: 'span 4' }}>
          <Card>4 columns</Card>
        </div>
        <div style={{ gridColumn: 'span 3' }}>
          <Card>3 columns</Card>
        </div>
        <div style={{ gridColumn: 'span 9' }}>
          <Card>9 columns</Card>
        </div>
      </Grid>
    </DarkModeWrapper>
  ),
};

export const EmptyGrid: Story = {
  render: () => (
    <DarkModeWrapper>
      <Grid cols={4}>
        {/* Empty grid */}
      </Grid>
    </DarkModeWrapper>
  ),
};

// Density testing
export const Density: Story = {
  render: () => (
    <DensityWrapper>
      <Grid cols={12}>
        <div style={{ gridColumn: 'span 4' }}>
          <Card>Density test</Card>
        </div>
        <div style={{ gridColumn: 'span 4' }}>
          <Card>Density test</Card>
        </div>
        <div style={{ gridColumn: 'span 4' }}>
          <Card>Density test</Card>
        </div>
      </Grid>
    </DensityWrapper>
  ),
};

// Responsive grid layout
export const ResponsiveLayout: Story = {
  render: () => (
    <DarkModeWrapper>
      <div style={{ maxWidth: '900px' }}>
        <Grid cols={12}>
          <div style={{ gridColumn: 'span 12' }}>
            <Card>Header (full width)</Card>
          </div>
          <div style={{ gridColumn: 'span 8' }}>
            <Card>Main content (8 cols)</Card>
          </div>
          <div style={{ gridColumn: 'span 4' }}>
            <Card>Sidebar (4 cols)</Card>
          </div>
        </Grid>
      </div>
    </DarkModeWrapper>
  ),
};

// Gap and spacing
export const WithCustomGap: Story = {
  render: () => (
    <DarkModeWrapper>
      <Grid cols={3} style={{ gap: '20px' }}>
        <Card>Large gap</Card>
        <Card>Large gap</Card>
        <Card>Large gap</Card>
      </Grid>
    </DarkModeWrapper>
  ),
};
