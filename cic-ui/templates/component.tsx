import "./{{name}}.css";

export function {{Name}}(props) {
  const { className = "", children, ...rest } = props;

  return (
    <div
      data-cic-component="{{name}}"
      className={`cic-{{name}} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
