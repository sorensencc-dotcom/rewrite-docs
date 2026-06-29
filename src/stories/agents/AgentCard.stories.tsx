import type { Meta, StoryObj } from "@storybook/react";
import { AgentCard } from "../../components/agents/AgentCard";
import { mockAgentsList } from "../../mocks/agents";
import { DarkModeWrapper } from "../utils/DarkModeWrapper";

const meta = {
  title: "Cards/AgentCard",
  component: AgentCard,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    agent: mockAgentsList[0],
  },
} satisfies Meta<typeof AgentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Healthy: Story = {
  args: { agent: mockAgentsList[0] },
  render: (args) => (
    <DarkModeWrapper>
      <div style={{ width: "300px" }}>
        <AgentCard {...args} />
      </div>
    </DarkModeWrapper>
  ),
};

export const Degraded: Story = {
  args: { agent: mockAgentsList[2] },
  render: (args) => (
    <DarkModeWrapper>
      <div style={{ width: "300px" }}>
        <AgentCard {...args} />
      </div>
    </DarkModeWrapper>
  ),
};

export const Offline: Story = {
  args: { agent: mockAgentsList[3] },
  render: (args) => (
    <DarkModeWrapper>
      <div style={{ width: "300px" }}>
        <AgentCard {...args} />
      </div>
    </DarkModeWrapper>
  ),
};

export const Starting: Story = {
  args: { agent: mockAgentsList[4] },
  render: (args) => (
    <DarkModeWrapper>
      <div style={{ width: "300px" }}>
        <AgentCard {...args} />
      </div>
    </DarkModeWrapper>
  ),
};

export const Grid: Story = {
  render: () => (
    <DarkModeWrapper>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", width: "900px" }}>
        {mockAgentsList.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </DarkModeWrapper>
  ),
};

export const DarkMode: Story = {
  args: { agent: mockAgentsList[0] },
  render: (args) => (
    <div data-theme="dark" style={{ padding: "2rem", background: "#1a1a1a" }}>
      <div style={{ width: "300px" }}>
        <AgentCard {...args} />
      </div>
    </div>
  ),
};

export const HighContrast: Story = {
  args: { agent: mockAgentsList[0] },
  render: (args) => (
    <div data-theme="dark" data-density="compact" style={{ padding: "2rem", background: "#0a0a0a" }}>
      <div style={{ width: "300px" }}>
        <AgentCard {...args} />
      </div>
    </div>
  ),
};
