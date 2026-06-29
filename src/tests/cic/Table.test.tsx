import React from "react";
import { render } from "@testing-library/react";
import { Table } from "../../components/cic/Table";

const renderWithTheme = (component: React.ReactElement, theme: "light" | "dark" = "light") => {
  const { container, ...rest } = render(
    <div data-theme={theme} style={{ padding: "20px" }}>
      {component}
    </div>
  );
  return { container, ...rest };
};

describe("Table", () => {
  it("renders without crashing", () => {
    const { getByText } = render(<Table>Hello</Table>);
    expect(getByText("Hello")).toBeInTheDocument();
  });

  it("accepts className prop", () => {
    const { container } = render(<Table className="custom">Test</Table>);
    expect(container.querySelector(".cic-table.custom")).toBeInTheDocument();
  });

  it("renders children", () => {
    const { getByText } = render(
      <Table>
        <span>Child content</span>
      </Table>
    );
    expect(getByText("Child content")).toBeInTheDocument();
  });

  describe("light mode snapshots", () => {
    it("renders table in light mode", () => {
      const { container } = renderWithTheme(<Table>Content</Table>, "light");
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("dark mode snapshots", () => {
    it("renders table in dark mode", () => {
      const { container } = renderWithTheme(<Table>Content</Table>, "dark");
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
