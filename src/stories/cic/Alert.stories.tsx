import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '../../components/cic/Alert';
import DensityWrapper from './DensityWrapper';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'This is an alert message' },
};

export const Success: Story = {
  args: { children: 'Operation completed successfully!' },
};

export const Warning: Story = {
  args: { children: 'Please review this warning before proceeding.' },
};

export const Error: Story = {
  args: { children: 'An error occurred while processing your request.' },
};

export const WithLongContent: Story = {
  args: {
    children: 'This is a longer alert message that might span multiple lines. It provides more context about the alert and what the user should do next.',
  },
};

export const DensityModes: Story = {
  render: () => (
    <DensityWrapper>
      <div style={{ width: '300px' }}>
        <Alert>Alert message in density mode</Alert>
      </div>
    </DensityWrapper>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Light</div>
        <div style={{ width: '300px' }}>
          <Alert>Alert in light mode</Alert>
        </div>
      </div>
      <div style={{ padding: '1rem', background: '#1a1a1a', color: '#fff', borderRadius: '4px' }} data-theme="dark">
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Dark</div>
        <div style={{ width: '300px' }}>
          <Alert>Alert in dark mode</Alert>
        </div>
      </div>
    </div>
  ),
};
