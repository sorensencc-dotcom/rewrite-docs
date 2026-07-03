# CIC Component Generator (v1.0)

Token-driven, deterministic component factory for CIC.

## Usage

```bash
npm run cic-ui add <component>
```

Example:

```bash
npm run cic-ui add button
npm run cic-ui add table
npm run cic-ui add panel
```

## What it generates

Each component generates:

- `src/components/cic/<ComponentName>.tsx` — React component
- `src/components/cic/<componentname>.css` — Token-driven styles
- `src/stories/cic/<ComponentName>.stories.tsx` — Storybook story
- `src/tests/cic/<ComponentName>.test.tsx` — Jest unit test
- `src/visual/cic/<ComponentName>.spec.ts` — Playwright snapshot test
- `docs/tokens/usage/<ComponentName>.md` — Token usage documentation

## Configuration

Edit `cic-ui/config.json` to customize output directories.

## Requirements

- Component names must be **PascalCase** (button, table, panel, etc.)
- All generated components use CIC tokens (no inline styles)
- All generated components pass ESLint token rules
- All generated tests follow Jest conventions

## Integration

Generated components:

- Import canonical CIC tokens via `--cic-*` CSS variables
- Export via barrel export at `src/components/cic/index.ts`
- Automatically appear in Storybook
- Automatically have Playwright visual tests
- Automatically have Jest unit test stubs

## Roadmap

Next features:

- props interface scaffolding  
- TypeScript props validation  
- Accessibility (aria-*) injection  
- Dark mode state management  
- Density system integration  
