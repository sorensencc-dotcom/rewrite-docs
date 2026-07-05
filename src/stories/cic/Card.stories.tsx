import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '../../components/cic/Card';
import DensityWrapper from './DensityWrapper';
import DarkModeWrapper from '../utils/DarkModeWrapper';

const meta = {
  title: 'CIC/Card',
  component: Card,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Golden path
export const Default: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Card>Default card</Card>
    </DarkModeWrapper>
  ),
};

export const Subtle: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Card variant="subtle">Subtle card</Card>
    </DarkModeWrapper>
  ),
};

export const WithTitle: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Card>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Card Title</div>
        <p>Card content with structured layout</p>
      </Card>
    </DarkModeWrapper>
  ),
};

// Edge cases
export const Interactive: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Card className="hover:shadow-lg cursor-pointer">
        <button className="w-full p-2 bg-blue-600 text-white rounded">
          Click me
        </button>
      </Card>
    </DarkModeWrapper>
  ),
};

export const MultipleChildren: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Card>
        <span>Child 1</span>
        <span>Child 2</span>
        <span>Child 3</span>
      </Card>
    </DarkModeWrapper>
  ),
};

export const NestedContent: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Card>
        <Card variant="subtle">
          Nested card
        </Card>
      </Card>
    </DarkModeWrapper>
  ),
};

export const LongText: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Card style={{ maxWidth: '300px' }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </Card>
    </DarkModeWrapper>
  ),
};

// Density testing
export const Density: Story = {
  args: { children: null },
  render: () => (
    <DensityWrapper>
      <Card>Density test</Card>
    </DensityWrapper>
  ),
};

// Dark mode variations
export const DefaultDark: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Card>Default in dark mode</Card>
    </DarkModeWrapper>
  ),
};

export const SubtleDark: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Card variant="subtle">Subtle in dark mode</Card>
    </DarkModeWrapper>
  ),
};
