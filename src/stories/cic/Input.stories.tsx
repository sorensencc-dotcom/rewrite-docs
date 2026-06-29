import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../../components/cic/Input';
import DensityWrapper from './DensityWrapper';

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'number'] },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    error: { control: 'boolean' },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: 'Enter text...', size: 'medium' },
};

export const WithLabel: Story = {
  args: { placeholder: 'Enter text...', label: 'Email Address', type: 'email', size: 'medium' },
};

export const WithError: Story = {
  args: { placeholder: 'Enter text...', label: 'Username', error: true, size: 'medium' },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
      <Input size="small" placeholder="Small input" />
      <Input size="medium" placeholder="Medium input" />
      <Input size="large" placeholder="Large input" />
    </div>
  ),
};

export const DensityModes: Story = {
  render: () => (
    <DensityWrapper>
      <div style={{ width: '200px' }}>
        <Input placeholder="Enter text..." label="Input" />
      </div>
    </DensityWrapper>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Light</div>
        <div style={{ width: '250px' }}>
          <Input label="Email" type="email" placeholder="you@example.com" />
        </div>
      </div>
      <div style={{ padding: '1rem', background: '#1a1a1a', color: '#fff', borderRadius: '4px' }} data-theme="dark">
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Dark</div>
        <div style={{ width: '250px' }}>
          <Input label="Email" type="email" placeholder="you@example.com" />
        </div>
      </div>
    </div>
  ),
};
