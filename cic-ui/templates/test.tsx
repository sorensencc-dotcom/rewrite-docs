import { render } from "@testing-library/react";
import { {{Name}} } from "../../components/cic/{{Name}}";

describe("{{Name}}", () => {
  it("renders without crashing", () => {
    const { getByText } = render(<{{Name}}>Hello</{{Name}}>);
    expect(getByText("Hello")).toBeInTheDocument();
  });

  it("accepts className prop", () => {
    const { container } = render(<{{Name}} className="custom">Test</{{Name}}>);
    expect(container.querySelector(".cic-{{name}}.custom")).toBeInTheDocument();
  });

  it("renders children", () => {
    const { getByText } = render(
      <{{Name}}>
        <span>Child content</span>
      </{{Name}}>
    );
    expect(getByText("Child content")).toBeInTheDocument();
  });
});
