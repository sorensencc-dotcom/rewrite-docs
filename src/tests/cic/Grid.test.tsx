/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { render } from "@testing-library/react";
import { Grid } from "../../components/cic/Grid";

const renderWithTheme = (component: React.ReactElement, theme: "light" | "dark" = "light") => {
  const { container, ...rest } = render(
    <div data-theme={theme} style={{ padding: "20px" }}>
      {component}
    </div>
  );
  return { container, ...rest };
};

describe("Grid", () => {
  it("renders grid with children", () => {
    const { container } = render(
      <Grid>
        <div>Item</div>
      </Grid>
    );
    expect(container.querySelector(".cic-grid")).toBeInTheDocument();
  });

  it("applies cols prop", () => {
    const { container } = render(<Grid cols={6}>Content</Grid>);
    const grid = container.querySelector(".cic-grid");
    expect(grid).toHaveStyle("grid-template-columns: repeat(6, 1fr)");
  });

  it("defaults to 12 columns", () => {
    const { container } = render(<Grid>Content</Grid>);
    const grid = container.querySelector(".cic-grid");
    expect(grid).toHaveStyle("grid-template-columns: repeat(12, 1fr)");
  });

  it("forwards ref", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Grid ref={ref}>Content</Grid>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("accepts className", () => {
    const { container } = render(<Grid className="custom">Content</Grid>);
    expect(container.querySelector(".cic-grid.custom")).toBeInTheDocument();
  });

  it("has data-cic-component attribute", () => {
    const { container } = render(<Grid>Content</Grid>);
    expect(container.querySelector('[data-cic-component="grid"]')).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    const { getByText } = render(
      <Grid>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </Grid>
    );
    expect(getByText("Item 1")).toBeInTheDocument();
    expect(getByText("Item 2")).toBeInTheDocument();
    expect(getByText("Item 3")).toBeInTheDocument();
  });

  it("supports different column counts", () => {
    const { container: c1 } = render(<Grid cols={1}>Content</Grid>);
    const { container: c2 } = render(<Grid cols={2}>Content</Grid>);
    const { container: c3 } = render(<Grid cols={4}>Content</Grid>);

    expect(c1.querySelector(".cic-grid")).toHaveStyle("grid-template-columns: repeat(1, 1fr)");
    expect(c2.querySelector(".cic-grid")).toHaveStyle("grid-template-columns: repeat(2, 1fr)");
    expect(c3.querySelector(".cic-grid")).toHaveStyle("grid-template-columns: repeat(4, 1fr)");
  });

  describe("light mode snapshots", () => {
    it("renders default grid snapshot", () => {
      const { container } = renderWithTheme(
        <Grid>
          <div>Item</div>
        </Grid>,
        "light"
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders grid with custom cols snapshot", () => {
      const { container } = renderWithTheme(
        <Grid cols={6}>
          <div>Item</div>
        </Grid>,
        "light"
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders multiple items snapshot", () => {
      const { container } = renderWithTheme(
        <Grid cols={3}>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </Grid>,
        "light"
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("dark mode snapshots", () => {
    it("renders default grid in dark mode", () => {
      const { container } = renderWithTheme(
        <Grid>
          <div>Item</div>
        </Grid>,
        "dark"
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders grid with custom cols in dark mode", () => {
      const { container } = renderWithTheme(
        <Grid cols={6}>
          <div>Item</div>
        </Grid>,
        "dark"
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders multiple items in dark mode", () => {
      const { container } = renderWithTheme(
        <Grid cols={3}>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </Grid>,
        "dark"
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("responsive", () => {
    const sizes: Array<{
      name: string;
      width: number;
      height: number;
      cols: 1 | 2 | 3 | 4 | 6 | 12;
    }> = [
      { name: "mobile", width: 375, height: 667, cols: 1 },
      { name: "tablet", width: 768, height: 1024, cols: 2 },
      { name: "desktop", width: 1920, height: 1080, cols: 4 },
    ];

    test.each(sizes)(
      "renders $name layout ($width×$height with $cols cols)",
      ({ width, height, cols }) => {
        window.innerWidth = width;
        window.innerHeight = height;
        const { container } = render(<Grid cols={cols}>Content</Grid>);
        expect(container.querySelector(".cic-grid")).toHaveStyle(
          `grid-template-columns: repeat(${cols}, 1fr)`
        );
      }
    );
  });
});
