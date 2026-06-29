import type { Meta, StoryObj } from "@storybook/react";
import { AgentDetailPanel } from "../../components/agents/AgentDetailPanel";
import { DarkModeWrapper } from "../utils/DarkModeWrapper";

const meta = {
  title: "Panels/AgentDetail",
  component: AgentDetailPanel,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    agentId: "agent-1",
  },
} satisfies Meta<typeof AgentDetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OverviewTab: Story = {
  args: { agentId: "agent-1" },
  render: (args) => (
    <DarkModeWrapper>
      <div style={{ width: "100%", maxWidth: "900px" }}>
        <AgentDetailPanel {...args} />
      </div>
    </DarkModeWrapper>
  ),
};

export const LogsTab: Story = {
  args: { agentId: "agent-1" },
  render: (args) => (
    <DarkModeWrapper>
      <div style={{ width: "100%", maxWidth: "900px" }}>
        <AgentDetailPanel {...args} />
      </div>
    </DarkModeWrapper>
  ),
};

export const ExecutionsTab: Story = {
  args: { agentId: "agent-1" },
  render: (args) => (
    <DarkModeWrapper>
      <div style={{ width: "100%", maxWidth: "900px" }}>
        <AgentDetailPanel {...args} />
      </div>
    </DarkModeWrapper>
  ),
};

export const SystemTab: Story = {
  args: { agentId: "agent-1" },
  render: (args) => (
    <DarkModeWrapper>
      <div style={{ width: "100%", maxWidth: "900px" }}>
        <AgentDetailPanel {...args} />
      </div>
    </DarkModeWrapper>
  ),
};

export const DarkMode: Story = {
  args: { agentId: "agent-1" },
  render: (args) => (
    <div data-theme="dark" style={{ padding: "2rem", background: "#1a1a1a" }}>
      <div style={{ width: "100%", maxWidth: "900px" }}>
        <AgentDetailPanel {...args} />
      </div>
    </div>
  ),
};

export const DegradedAgent: Story = {
  args: { agentId: "agent-3" },
  render: (args) => (
    <DarkModeWrapper>
      <div style={{ width: "100%", maxWidth: "900px" }}>
        <AgentDetailPanel {...args} />
      </div>
    </DarkModeWrapper>
  ),
};

export const ResponsiveTest: Story = {
  args: { agentId: "agent-1" },
  render: (args) => (
    <DarkModeWrapper>
      <div style={{ width: "100%", resize: "both", overflow: "auto", border: "1px solid #999" }}>
        <div style={{ minWidth: "400px" }}>
          <AgentDetailPanel {...args} />
        </div>
      </div>
    </DarkModeWrapper>
  ),
};
