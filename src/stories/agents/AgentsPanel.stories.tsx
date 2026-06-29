import type { Meta, StoryObj } from "@storybook/react";
import { AgentsPanel } from "../../components/agents/AgentsPanel";
import { DarkModeWrapper } from "../utils/DarkModeWrapper";

const meta = {
  title: "Panels/Agents",
  component: AgentsPanel,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof AgentsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DarkModeWrapper>
      <div style={{ width: "100%", maxWidth: "1200px" }}>
        <AgentsPanel />
      </div>
    </DarkModeWrapper>
  ),
};

export const LightMode: Story = {
  render: () => (
    <div style={{ width: "100%", maxWidth: "1200px" }}>
      <AgentsPanel />
    </div>
  ),
};

export const DarkModeStory: Story = {
  render: () => (
    <div data-theme="dark" style={{ padding: "2rem", background: "#1a1a1a" }}>
      <div style={{ width: "100%", maxWidth: "1200px" }}>
        <AgentsPanel />
      </div>
    </div>
  ),
};

export const ResponsiveTest: Story = {
  render: () => (
    <DarkModeWrapper>
      <div style={{ width: "100%", resize: "both", overflow: "auto", border: "1px solid #999" }}>
        <AgentsPanel />
      </div>
    </DarkModeWrapper>
  ),
};
