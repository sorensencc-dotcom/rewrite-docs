import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../../components/cic/Button';
import DensityWrapper from './DensityWrapper';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'danger', 'ghost'] },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { children: 'Button', variant: 'primary', size: 'medium' } };
export const Secondary: Story = { args: { children: 'Button', variant: 'secondary', size: 'medium' } };
export const Danger: Story = { args: { children: 'Button', variant: 'danger', size: 'medium' } };
export const Ghost: Story = { args: { children: 'Button', variant: 'ghost', size: 'medium' } };

export const AllSizes: Story = {
  args: {},
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </div>
  ),
};

export const DensityModes: Story = {
  args: {},
  render: () => (
    <DensityWrapper>
      <Button variant="primary">Click me</Button>
    </DensityWrapper>
  ),
};

export const DarkMode: Story = {
  args: {},
  render: () => (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Light</div>
        <Button variant="primary">Primary</Button>
      </div>
      <div style={{ padding: '1rem', background: '#1a1a1a', color: '#fff', borderRadius: '4px' }} data-theme="dark">
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Dark</div>
        <Button variant="primary">Primary</Button>
      </div>
    </div>
  ),
};
