import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '../../components/cic/Checkbox';
import DensityWrapper from './DensityWrapper';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Accept terms' },
};

export const WithDescription: Story = {
  args: { label: 'Enable notifications', description: 'Get updates about new features and improvements' },
};

export const Checked: Story = {
  args: { label: 'Remember me', defaultChecked: true },
};

export const Group: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Checkbox label="Option 1" />
      <Checkbox label="Option 2" />
      <Checkbox label="Option 3" />
    </div>
  ),
};

export const DensityModes: Story = {
  render: () => (
    <DensityWrapper>
      <Checkbox label="Select item" />
    </DensityWrapper>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Light</div>
        <Checkbox label="Accept terms" />
      </div>
      <div style={{ padding: '1rem', background: '#1a1a1a', color: '#fff', borderRadius: '4px' }} data-theme="dark">
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Dark</div>
        <Checkbox label="Accept terms" />
      </div>
    </div>
  ),
};
