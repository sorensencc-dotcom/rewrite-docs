import React from "react";
import { render, screen } from "@testing-library/react";
import { Input } from "../../components/cic/Input";

const renderWithTheme = (component: React.ReactElement, theme: "light" | "dark" = "light") => {
  const { container, ...rest } = render(
    <div data-theme={theme} style={{ padding: "20px" }}>
      {component}
    </div>
  );
  return { container, ...rest };
};

describe("Input Component", () => {
  test("renders input with type", () => {
    render(<Input type="text" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "text");
  });

  test("renders with label", () => {
    render(<Input label="Email" type="email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  test("applies error class", () => {
    const { container } = render(<Input error />);
    const input = container.querySelector(".cic-input--error");
    expect(input).toBeInTheDocument();
  });

  test("applies size class", () => {
    const { container } = render(<Input size="large" />);
    const input = container.querySelector(".cic-input--large");
    expect(input).toBeInTheDocument();
  });

  test("forwards ref", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  test("respects disabled prop", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  test("default size is medium", () => {
    const { container } = render(<Input />);
    const input = container.querySelector(".cic-input--medium");
    expect(input).toBeInTheDocument();
  });

  describe("light mode snapshots", () => {
    it("renders input in light mode", () => {
      const { container } = renderWithTheme(<Input type="text" id="test-input-1" />, "light");
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders input with label in light mode", () => {
      const { container } = renderWithTheme(
        <Input label="Email" type="email" id="test-input-2" />,
        "light"
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders error input in light mode", () => {
      const { container } = renderWithTheme(<Input error id="test-input-3" />, "light");
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("dark mode snapshots", () => {
    it("renders input in dark mode", () => {
      const { container } = renderWithTheme(<Input type="text" id="test-input-4" />, "dark");
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders input with label in dark mode", () => {
      const { container } = renderWithTheme(
        <Input label="Email" type="email" id="test-input-5" />,
        "dark"
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders error input in dark mode", () => {
      const { container } = renderWithTheme(<Input error id="test-input-6" />, "dark");
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
