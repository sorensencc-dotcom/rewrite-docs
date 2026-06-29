# Phase 3: UI Integration Testing — Browser-Based Verification

## Test Scope

Browser-based integration testing for Phase 2 Tier 2 components:
- Panel v2
- Card
- Row v2
- Grid

## Test Categories

### 1. Golden Path (Happy Path)

**Panel:**
- [ ] Renders default content
- [ ] Renders with header
- [ ] Renders with footer
- [ ] Renders with header + footer
- [ ] Renders with loading state

**Card:**
- [ ] Renders with default variant
- [ ] Renders with subtle variant
- [ ] Accepts and displays multiple children
- [ ] Responds to click events

**Row:**
- [ ] Renders unselected by default
- [ ] Renders selected when prop is true
- [ ] Displays multiple cells
- [ ] Keyboard focusable (tabindex)

**Grid:**
- [ ] 12-column layout renders
- [ ] 6-column layout renders
- [ ] 4-column layout renders
- [ ] 2-column layout renders
- [ ] 1-column (full-width) layout renders
- [ ] Items span correctly

### 2. Edge Cases

**Panel:**
- [ ] Long content doesn't break layout
- [ ] No padding variant applies correctly
- [ ] No elevation variant applies correctly
- [ ] Loading state visual feedback

**Card:**
- [ ] Nested cards render without issue
- [ ] Very long text wraps correctly
- [ ] Multiple children are all visible
- [ ] Custom CSS classes apply

**Row:**
- [ ] Single character content
- [ ] Multi-line text wraps
- [ ] Selected state styling differs from unselected
- [ ] Series of rows displays correctly

**Grid:**
- [ ] Uneven column spans (8+4, 3+9, etc.)
- [ ] Many items (12+) in grid
- [ ] Empty grid renders
- [ ] Custom gap spacing applies

### 3. Responsive Behavior

**All Components:**
- [ ] Mobile viewport (375×667)
- [ ] Tablet viewport (768×1024)
- [ ] Desktop viewport (1920×1080)
- [ ] Viewport resizing doesn't break layout

### 4. Visual & Styling

**Colors & Theming:**
- [ ] Light mode rendering
- [ ] Dark mode rendering
- [ ] Token compliance (spacing, elevation, density)

**Typography:**
- [ ] Text content displays correctly
- [ ] Font sizes match design tokens
- [ ] Line heights are appropriate

**Spacing:**
- [ ] Padding is consistent
- [ ] Margins are correct
- [ ] Gap between grid items is correct

### 5. Accessibility

**Keyboard Navigation:**
- [ ] Tab order is logical
- [ ] Row component is focusable
- [ ] Focus indicators are visible

**Semantic HTML:**
- [ ] Panel renders as <section>
- [ ] Card renders as <div> with proper role
- [ ] Row renders as <div> with proper role
- [ ] Grid renders as <div> with grid layout

### 6. Interaction & State

**User Interactions:**
- [ ] Hovering on interactive rows shows feedback
- [ ] Clicking buttons inside cards works
- [ ] Selected rows show visual distinction
- [ ] Nested components interact correctly

## Test Execution Plan

1. Start Storybook: `npm run storybook`
2. Navigate to each component story
3. Verify golden path stories
4. Test edge case stories
5. Resize viewport and test responsive behavior
6. Toggle dark mode (if DarkModeWrapper supports it)
7. Check console for any warnings/errors

## Expected Results

- All stories render without errors
- No console warnings
- Layouts remain intact across viewport sizes
- Visual consistency with design tokens
- No accessibility violations
- All interactions work as expected

## Browser Compatibility

- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)

## Documentation

Stories located in: `src/stories/cic/`
- Panel.stories.tsx
- Card.stories.tsx
- Row.stories.tsx
- Grid.stories.tsx

Each story includes:
- Default/golden path
- Edge cases
- Density variants
- Dark mode variants
- Responsive tests
