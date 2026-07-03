import { {{Name}} } from "../../../components/cic/{{Name}}";

export default {
  title: "CIC/{{Name}}",
  component: {{Name}},
};

export const Default = () => <{{Name}}>Example</{{Name}}>;

export const Hover = () => (
  <div style={{ cursor: "pointer" }}>
    <{{Name}}>Hover me</{{Name}}>
  </div>
);

export const Disabled = () => <{{Name}} disabled>Disabled</{{Name}}>;
