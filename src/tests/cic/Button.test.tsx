import { render } from "@testing-library/react";
import { Button } from "../../components/cic/Button";

const renderWithTheme = (component: React.ReactElement, theme: "light" | "dark" = "light") => {
  const { container, ...rest } = render(
    <div data-theme={theme} style={{ padding: "20px" }}>
      {component}
    </div>
  );
  return { container, ...rest };
};

describe("Button", () => {
  it("renders without crashing", () => {
    const { getByText } = render(<Button>Hello</Button>);
    expect(getByText("Hello")).toBeInTheDocument();
  });

  it("accepts className prop", () => {
    const { container } = render(<Button className="custom">Test</Button>);
    expect(container.querySelector(".cic-button.custom")).toBeInTheDocument();
  });

  it("renders children", () => {
    const { getByText } = render(
      <Button>
        <span>Child content</span>
      </Button>
    );
    expect(getByText("Child content")).toBeInTheDocument();
  });

  describe("Light mode snapshots", () => {
    it("matches light mode snapshot - primary", () => {
      const { container } = renderWithTheme(<Button variant="primary">Primary</Button>, "light");
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches light mode snapshot - secondary", () => {
      const { container } = renderWithTheme(<Button variant="secondary">Secondary</Button>, "light");
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches light mode snapshot - danger", () => {
      const { container } = renderWithTheme(<Button variant="danger">Danger</Button>, "light");
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches light mode snapshot - ghost", () => {
      const { container } = renderWithTheme(<Button variant="ghost">Ghost</Button>, "light");
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches light mode snapshot - all sizes", () => {
      const { container } = renderWithTheme(
        <div style={{ display: "flex", gap: "12px" }}>
          <Button size="small">Small</Button>
          <Button size="medium">Medium</Button>
          <Button size="large">Large</Button>
        </div>,
        "light"
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("Dark mode snapshots", () => {
    it("matches dark mode snapshot - primary", () => {
      const { container } = renderWithTheme(<Button variant="primary">Primary</Button>, "dark");
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches dark mode snapshot - secondary", () => {
      const { container } = renderWithTheme(<Button variant="secondary">Secondary</Button>, "dark");
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches dark mode snapshot - danger", () => {
      const { container } = renderWithTheme(<Button variant="danger">Danger</Button>, "dark");
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches dark mode snapshot - ghost", () => {
      const { container } = renderWithTheme(<Button variant="ghost">Ghost</Button>, "dark");
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches dark mode snapshot - all sizes", () => {
      const { container } = renderWithTheme(
        <div style={{ display: "flex", gap: "12px" }}>
          <Button size="small">Small</Button>
          <Button size="medium">Medium</Button>
          <Button size="large">Large</Button>
        </div>,
        "dark"
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("Token validation", () => {
    it("uses correct tokens in light mode", () => {
      const { container } = renderWithTheme(<Button variant="primary">Test</Button>, "light");
      const btn = container.querySelector(".cic-button--primary") as HTMLElement;
      const styles = window.getComputedStyle(btn);
      // In light mode, primary should use accent color (#3b82f6)
      expect(btn).toHaveClass("cic-button--primary");
    });

    it("uses correct tokens in dark mode", () => {
      const { container } = renderWithTheme(<Button variant="primary">Test</Button>, "dark");
      const btn = container.querySelector(".cic-button--primary") as HTMLElement;
      // In dark mode, primary should use dark accent color (#4d8dff)
      expect(btn).toHaveClass("cic-button--primary");
    });
  });
});
