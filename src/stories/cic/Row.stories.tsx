import type { Meta, StoryObj } from '@storybook/react';
import { Row } from '../../components/cic/Row';
import DensityWrapper from './DensityWrapper';
import DarkModeWrapper from '../utils/DarkModeWrapper';

const meta = {
  title: 'CIC/Row',
  component: Row,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Row>;

export default meta;
type Story = StoryObj<typeof meta>;

// Golden path
export const Default: Story = {
  args: {},
  render: () => (
    <DarkModeWrapper>
      <Row>Row content</Row>
    </DarkModeWrapper>
  ),
};

export const Selected: Story = {
  args: {},
  render: () => (
    <DarkModeWrapper>
      <Row selected>Selected row</Row>
    </DarkModeWrapper>
  ),
};

export const MultipleCells: Story = {
  args: {},
  render: () => (
    <DarkModeWrapper>
      <Row>
        <span>Cell 1</span>
        <span>Cell 2</span>
        <span>Cell 3</span>
      </Row>
    </DarkModeWrapper>
  ),
};

// Edge cases
export const LongContent: Story = {
  args: {},
  render: () => (
    <DarkModeWrapper>
      <Row style={{ maxWidth: '400px' }}>
        This is a row with very long content that might wrap to multiple lines depending on the
        container width
      </Row>
    </DarkModeWrapper>
  ),
};

export const Interactive: Story = {
  args: {},
  render: () => (
    <DarkModeWrapper>
      <Row onClick={() => {}} className="hover:bg-gray-100 cursor-pointer">
        Click me to interact
      </Row>
    </DarkModeWrapper>
  ),
};

export const SelectedWithContent: Story = {
  args: {},
  render: () => (
    <DarkModeWrapper>
      <Row selected>
        <span>Selected Cell 1</span>
        <span>Selected Cell 2</span>
      </Row>
    </DarkModeWrapper>
  ),
};

export const MinimalContent: Story = {
  args: {},
  render: () => (
    <DarkModeWrapper>
      <Row>X</Row>
    </DarkModeWrapper>
  ),
};

// Density testing
export const Density: Story = {
  args: {},
  render: () => (
    <DensityWrapper>
      <Row>Density test</Row>
    </DensityWrapper>
  ),
};

// Series of rows
export const RowSeries: Story = {
  args: {},
  render: () => (
    <DarkModeWrapper>
      <div>
        <Row>Row 1</Row>
        <Row selected>Row 2 (selected)</Row>
        <Row>Row 3</Row>
        <Row>Row 4</Row>
      </div>
    </DarkModeWrapper>
  ),
};

// Keyboard interaction
export const KeyboardFocusable: Story = {
  args: {},
  render: () => (
    <DarkModeWrapper>
      <Row tabIndex={0}>
        Focus me with Tab key
      </Row>
    </DarkModeWrapper>
  ),
};
