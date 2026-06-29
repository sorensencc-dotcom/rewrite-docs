import React from "react";
import { render } from "@testing-library/react";
import { Alert } from "../../components/cic/Alert";

const renderWithTheme = (component: React.ReactElement, theme: "light" | "dark" = "light") => {
  const { container, ...rest } = render(
    <div data-theme={theme} style={{ padding: "20px" }}>
      {component}
    </div>
  );
  return { container, ...rest };
};

describe("Alert", () => {
  it("renders without crashing", () => {
    const { getByText } = render(<Alert>Hello</Alert>);
    expect(getByText("Hello")).toBeInTheDocument();
  });

  it("accepts className prop", () => {
    const { container } = render(<Alert className="custom">Test</Alert>);
    expect(container.querySelector(".cic-alert.custom")).toBeInTheDocument();
  });

  it("renders children", () => {
    const { getByText } = render(
      <Alert>
        <span>Child content</span>
      </Alert>
    );
    expect(getByText("Child content")).toBeInTheDocument();
  });

  describe("light mode snapshots", () => {
    it("renders alert in light mode", () => {
      const { container } = renderWithTheme(<Alert>Content</Alert>, "light");
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("dark mode snapshots", () => {
    it("renders alert in dark mode", () => {
      const { container } = renderWithTheme(<Alert>Content</Alert>, "dark");
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
