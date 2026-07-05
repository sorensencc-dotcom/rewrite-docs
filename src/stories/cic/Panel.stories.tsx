import type { Meta, StoryObj } from '@storybook/react';
import { Panel } from '../../components/cic/Panel';
import DensityWrapper from './DensityWrapper';
import { DarkModeWrapper } from '../utils/DarkModeWrapper';

const meta = {
  title: 'CIC/Panel',
  component: Panel,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Golden path
export const Default: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Panel>Panel content</Panel>
    </DarkModeWrapper>
  ),
};

export const WithHeader: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Panel header="Panel Title">Content goes here</Panel>
    </DarkModeWrapper>
  ),
};

export const WithFooter: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Panel footer="Footer text">Main content</Panel>
    </DarkModeWrapper>
  ),
};

export const WithHeaderAndFooter: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Panel header="Title" footer="Footer">
        Content in the middle
      </Panel>
    </DarkModeWrapper>
  ),
};

// Edge cases
export const NoPadding: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Panel padding="none">No padding</Panel>
    </DarkModeWrapper>
  ),
};

export const NoElevation: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Panel elevation="none">Flat panel</Panel>
    </DarkModeWrapper>
  ),
};

export const Loading: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Panel loading>Content loading...</Panel>
    </DarkModeWrapper>
  ),
};

export const LongContent: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <Panel header="Long Content" style={{ maxWidth: '400px' }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat.
      </Panel>
    </DarkModeWrapper>
  ),
};

// Density testing
export const Density: Story = {
  args: { children: null },
  render: () => (
    <DensityWrapper>
      <Panel>Density test</Panel>
    </DensityWrapper>
  ),
};

// Responsive test wrapper
export const ResponsiveTest: Story = {
  args: { children: null },
  render: () => (
    <DarkModeWrapper>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <Panel header="Responsive Panel">
          This panel should adapt to container width
        </Panel>
      </div>
    </DarkModeWrapper>
  ),
};
