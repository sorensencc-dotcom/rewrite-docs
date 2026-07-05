export interface ComponentConfig {
    name: string;
    variants: string[];
    sizes?: string[];
    states?: string[];
}
export declare function generateComponentMeta(config: ComponentConfig): {
    title: string;
    component: string;
    argTypes: {
        disabled?: {
            control: string;
            description: string;
        } | undefined;
        size?: {
            control: string;
            options: string[];
            description: string;
        } | undefined;
        variant: {
            control: string;
            options: string[];
            description: string;
        };
    };
};
//# sourceMappingURL=generator.d.ts.map