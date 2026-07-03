import type { StorybookConfig } from '@storybook/react';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  },
  stories: ['../src/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-docs'],
  docs: {
    autodocs: true,
  },
  staticDirs: ['./public'],
  typescript: {
    check: false,
    checkOptions: {},
  },
  webpackFinal: async (config) => {
    config.module = config.module || { rules: [] };
    config.module.rules = config.module.rules || [];

    config.module.rules.unshift({
      test: /\.(ts|tsx)$/,
      use: {
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          configFile: 'tsconfig.json',
          compilerOptions: {
            jsx: 'react-jsx',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          },
        },
      },
      exclude: /node_modules/,
    });

    return config;
  },
};

export default config;
