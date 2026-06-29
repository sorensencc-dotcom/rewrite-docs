/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { render } from "@testing-library/react";
import { Card } from "../../components/cic/Card";

const renderWithTheme = (component: React.ReactElement, theme: "light" | "dark" = "light") => {
  const { container, ...rest } = render(
    <div data-theme={theme} style={{ padding: "20px" }}>
      {component}
    </div>
  );
  return { container, ...rest };
};

describe("Card", () => {
  it("renders card with children", () => {
    const { getByText } = render(<Card>Content</Card>);
    expect(getByText("Content")).toBeInTheDocument();
  });

  it("applies variant default", () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.querySelector('[data-variant="default"]')).toBeInTheDocument();
  });

  it("applies variant subtle", () => {
    const { container } = render(<Card variant="subtle">Test</Card>);
    expect(container.querySelector('[data-variant="subtle"]')).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref}>Test</Card>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("accepts className", () => {
    const { container } = render(<Card className="custom">Test</Card>);
    expect(container.querySelector(".cic-card.custom")).toBeInTheDocument();
  });

  it("renders with multiple children", () => {
    const { getByText } = render(
      <Card>
        <span>Child 1</span>
        <span>Child 2</span>
      </Card>
    );
    expect(getByText("Child 1")).toBeInTheDocument();
    expect(getByText("Child 2")).toBeInTheDocument();
  });

  it("has data-cic-component attribute", () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.querySelector('[data-cic-component="card"]')).toBeInTheDocument();
  });

  describe("light mode snapshots", () => {
    it("renders default card snapshot", () => {
      const { container } = renderWithTheme(<Card>Content</Card>, "light");
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders subtle variant snapshot", () => {
      const { container } = renderWithTheme(
        <Card variant="subtle">Content</Card>,
        "light"
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders with multiple children snapshot", () => {
      const { container } = renderWithTheme(
        <Card>
          <span>Child 1</span>
          <span>Child 2</span>
        </Card>,
        "light"
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("dark mode snapshots", () => {
    it("renders default card in dark mode", () => {
      const { container } = renderWithTheme(<Card>Content</Card>, "dark");
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders subtle variant in dark mode", () => {
      const { container } = renderWithTheme(
        <Card variant="subtle">Content</Card>,
        "dark"
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders with multiple children in dark mode", () => {
      const { container } = renderWithTheme(
        <Card>
          <span>Child 1</span>
          <span>Child 2</span>
        </Card>,
        "dark"
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("responsive", () => {
    const sizes = [
      { name: "mobile", width: 375, height: 667 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "desktop", width: 1920, height: 1080 },
    ];

    test.each(sizes)("renders at $name ($width×$height)", ({ width, height }) => {
      window.innerWidth = width;
      window.innerHeight = height;
      const { container } = render(<Card>Content</Card>);
      expect(container.querySelector(".cic-card")).toBeInTheDocument();
    });
  });
});
