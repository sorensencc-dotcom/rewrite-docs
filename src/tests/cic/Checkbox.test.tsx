import React from "react";
import { render, screen } from "@testing-library/react";
import { Checkbox } from "../../components/cic/Checkbox";

const renderWithTheme = (component: React.ReactElement, theme: "light" | "dark" = "light") => {
  const { container, ...rest } = render(
    <div data-theme={theme} style={{ padding: "20px" }}>
      {component}
    </div>
  );
  return { container, ...rest };
};

describe("Checkbox Component", () => {
  test("renders checkbox", () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
  });

  test("renders with label", () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByText("Accept terms")).toBeInTheDocument();
  });

  test("renders with description", () => {
    render(<Checkbox label="Test" description="This is a test" />);
    expect(screen.getByText("This is a test")).toBeInTheDocument();
  });

  test("can be checked", () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  test("forwards ref", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Checkbox ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  test("respects disabled prop", () => {
    render(<Checkbox disabled />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
  });

  test("generates unique id when not provided", () => {
    const { container: container1 } = render(<Checkbox label="One" />);
    const { container: container2 } = render(<Checkbox label="Two" />);

    const label1 = container1.querySelector(".cic-checkbox-label");
    const label2 = container2.querySelector(".cic-checkbox-label");

    expect(label1?.getAttribute("for")).not.toBe(
      label2?.getAttribute("for")
    );
  });

  describe("light mode snapshots", () => {
    it("renders checkbox in light mode", () => {
      const { container } = renderWithTheme(<Checkbox id="test-checkbox-1" />, "light");
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders checkbox with label in light mode", () => {
      const { container } = renderWithTheme(
        <Checkbox label="Accept terms" id="test-checkbox-2" />,
        "light"
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders checkbox with description in light mode", () => {
      const { container } = renderWithTheme(
        <Checkbox label="Test" description="This is a test" id="test-checkbox-3" />,
        "light"
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("dark mode snapshots", () => {
    it("renders checkbox in dark mode", () => {
      const { container } = renderWithTheme(<Checkbox id="test-checkbox-4" />, "dark");
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders checkbox with label in dark mode", () => {
      const { container } = renderWithTheme(
        <Checkbox label="Accept terms" id="test-checkbox-5" />,
        "dark"
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders checkbox with description in dark mode", () => {
      const { container } = renderWithTheme(
        <Checkbox label="Test" description="This is a test" id="test-checkbox-6" />,
        "dark"
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
