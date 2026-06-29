export interface ComponentConfig {
  name: string;
  variants: string[];
  sizes?: string[];
  states?: string[];
}

export function generateComponentMeta(config: ComponentConfig) {
  return {
    title: `CIC/${config.name}`,
    component: config.name,
    argTypes: {
      variant: {
        control: "select",
        options: config.variants,
        description: "Visual variant of the component",
      },
      ...(config.sizes && {
        size: {
          control: "select",
          options: config.sizes,
          description: "Size variant",
        },
      }),
      ...(config.states && {
        disabled: {
          control: "boolean",
          description: "Disabled state",
        },
      }),
    },
  };
}
