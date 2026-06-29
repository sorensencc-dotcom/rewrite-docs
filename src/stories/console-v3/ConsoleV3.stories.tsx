import type { Meta, StoryObj } from '@storybook/react';
import { ConsoleV3 } from '../../ui/console-v3/ConsoleV3';

const meta = {
  title: 'ConsoleV3/Main',
  component: ConsoleV3,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ConsoleV3>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Main ConsoleV3 dashboard with 6 panels, keyboard navigation, and screen reader support
 * - Tier 1: Health (60%) + Pipelines (40%)
 * - Tier 2: Agents (33%) + Alerts (33%) + Workspace (33%)
 * - Tier 3: Controls (keyboard shortcuts reference)
 *
 * Keyboard shortcuts:
 * - Ctrl+R: Refresh health panel
 * - Ctrl+Shift+R: Refresh all panels
 * - P+N: Pause pipeline
 * - [ / ]: Navigate between panels
 *
 * Accessibility:
 * - ARIA live regions for status/alert/log announcements
 * - Full keyboard navigation support
 * - Focus order preserved across panels
 */
export const Default: Story = {
  render: () => <ConsoleV3 />,
};

/**
 * Dashboard with mock backend - simulates health/pipelines/alerts polling
 * Uses fallback mock data when API endpoints are unavailable
 */
export const MockMode: Story = {
  render: () => <ConsoleV3 />,
  parameters: {
    // Mock API endpoints via MSW or similar if added to Storybook
  },
};

/**
 * Accessibility-focused view - highlight keyboard and screen reader features
 */
export const AccessibilityTest: Story = {
  render: () => (
    <div data-testid="console-a11y-test">
      <h1>ConsoleV3 Accessibility Test</h1>
      <p>
        Use NVDA/JAWS to verify announcements. Press keyboard shortcuts to trigger state changes and hear live region updates.
      </p>
      <ConsoleV3 />
    </div>
  ),
};

/**
 * Dark mode variant
 */
export const DarkMode: Story = {
  render: () => (
    <div data-theme="dark" style={{ background: '#1a1a1a', minHeight: '100vh' }}>
      <ConsoleV3 />
    </div>
  ),
};
