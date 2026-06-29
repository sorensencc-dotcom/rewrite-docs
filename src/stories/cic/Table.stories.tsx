import type { Meta, StoryObj } from '@storybook/react';
import { Table } from '../../components/cic/Table';
import DensityWrapper from './DensityWrapper';

const meta = {
  title: 'Components/Table',
  component: Table,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <table className="cic-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr className="cic-table-row" style={{ borderBottom: '1px solid var(--cic-color-border)' }}>
          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Role</th>
          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr className="cic-table-row" style={{ borderBottom: '1px solid var(--cic-color-border)' }}>
          <td style={{ padding: '0.5rem' }}>Alice</td>
          <td style={{ padding: '0.5rem' }}>Developer</td>
          <td style={{ padding: '0.5rem' }}>Active</td>
        </tr>
        <tr className="cic-table-row" style={{ borderBottom: '1px solid var(--cic-color-border)' }}>
          <td style={{ padding: '0.5rem' }}>Bob</td>
          <td style={{ padding: '0.5rem' }}>Designer</td>
          <td style={{ padding: '0.5rem' }}>Active</td>
        </tr>
        <tr className="cic-table-row">
          <td style={{ padding: '0.5rem' }}>Charlie</td>
          <td style={{ padding: '0.5rem' }}>Manager</td>
          <td style={{ padding: '0.5rem' }}>Away</td>
        </tr>
      </tbody>
    </table>
  ),
};

export const DensityModes: Story = {
  render: () => (
    <DensityWrapper>
      <table className="cic-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr className="cic-table-row" style={{ borderBottom: '1px solid var(--cic-color-border)' }}>
            <th style={{ textAlign: 'left', padding: '0.25rem' }}>Item</th>
            <th style={{ textAlign: 'left', padding: '0.25rem' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr className="cic-table-row" style={{ borderBottom: '1px solid var(--cic-color-border)' }}>
            <td style={{ padding: '0.25rem' }}>Row 1</td>
            <td style={{ padding: '0.25rem' }}>Data 1</td>
          </tr>
          <tr className="cic-table-row" style={{ borderBottom: '1px solid var(--cic-color-border)' }}>
            <td style={{ padding: '0.25rem' }}>Row 2</td>
            <td style={{ padding: '0.25rem' }}>Data 2</td>
          </tr>
        </tbody>
      </table>
    </DensityWrapper>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Light</div>
        <table className="cic-table" style={{ borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr className="cic-table-row" style={{ borderBottom: '1px solid var(--cic-color-border)' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="cic-table-row">
              <td style={{ padding: '0.5rem' }}>Item 1</td>
              <td style={{ padding: '0.5rem' }}>Active</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ padding: '1rem', background: '#1a1a1a', color: '#fff', borderRadius: '4px' }} data-theme="dark">
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Dark</div>
        <table className="cic-table" style={{ borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr className="cic-table-row" style={{ borderBottom: '1px solid var(--cic-color-border)' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="cic-table-row">
              <td style={{ padding: '0.5rem' }}>Item 1</td>
              <td style={{ padding: '0.5rem' }}>Active</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  ),
};
