/**
 * Phase 3.6 Stream B: Keyboard Shortcuts Manager
 * Operator Console keyboard-only workflows
 * Bindings: Ctrl+R (refresh), P+N (pause/restart), A (acknowledge), / (search), [ / ] (nav)
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: string;
  description: string;
}

export interface ShortcutConfig {
  'refresh-health': KeyboardShortcut;
  'refresh-all': KeyboardShortcut;
  'pause-pipeline': KeyboardShortcut;
  'restart-pipeline': KeyboardShortcut;
  'acknowledge-alert': KeyboardShortcut;
  'focus-search': KeyboardShortcut;
  'next-panel': KeyboardShortcut;
  'prev-panel': KeyboardShortcut;
}

/**
 * Canonical keyboard shortcuts for Operator Console v3
 * All workflows completable via keyboard
 */
export const KEYBOARD_SHORTCUTS: ShortcutConfig = {
  'refresh-health': {
    key: 'r',
    ctrl: true,
    action: 'POST /api/health',
    description: 'Refresh health panel (Ctrl+R)',
  },
  'refresh-all': {
    key: 'r',
    ctrl: true,
    shift: true,
    action: 'POST /api/health + /api/pipelines + /api/alerts',
    description: 'Refresh all panels (Ctrl+Shift+R)',
  },
  'pause-pipeline': {
    key: 'p',
    action: 'pause-pipeline:n',
    description: 'Pause pipeline N: Press P then 1..9 (P+1 pauses Pipeline 1)',
  },
  'restart-pipeline': {
    key: 'p',
    shift: true,
    action: 'restart-pipeline:n',
    description: 'Restart pipeline N: Press Shift+P then 1..9',
  },
  'acknowledge-alert': {
    key: 'a',
    action: 'POST /api/alerts/{id}/acknowledge',
    description: 'Acknowledge focused alert (A)',
  },
  'focus-search': {
    key: '/',
    action: 'focus-search-input',
    description: 'Focus search input, auto-clear (Slash /)',
  },
  'next-panel': {
    key: ']',
    action: 'focus-next-panel',
    description: 'Navigate to next panel (Right Bracket ])',
  },
  'prev-panel': {
    key: '[',
    action: 'focus-prev-panel',
    description: 'Navigate to previous panel (Left Bracket [)',
  },
};

/**
 * Keyboard event handler for console shortcuts
 * Returns matched action or null if no match
 */
export function parseKeyboardShortcut(event: KeyboardEvent): string | null {
  const key = event.key.toLowerCase();
  const ctrl = event.ctrlKey || event.metaKey;
  const shift = event.shiftKey;
  const alt = event.altKey;

  for (const [action, shortcut] of Object.entries(KEYBOARD_SHORTCUTS)) {
    const keyMatch = key === shortcut.key.toLowerCase();
    const ctrlMatch = ctrl === (shortcut.ctrl ?? false);
    const shiftMatch = shift === (shortcut.shift ?? false);
    const altMatch = alt === (shortcut.alt ?? false);

    if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
      return shortcut.action;
    }
  }

  return null;
}

/**
 * Pipeline number parser: P+1..9 or Shift+P+1..9
 * Used for multi-key shortcuts like P+1 (pause pipeline 1)
 */
export function parsePipelineNumber(baseAction: string, event: KeyboardEvent): string | null {
  if (!baseAction.startsWith('pause-pipeline:') && !baseAction.startsWith('restart-pipeline:')) {
    return null;
  }

  const key = event.key;
  if (/^\d$/.test(key)) {
    return `${baseAction.split(':')[0]}:${key}`;
  }

  return null;
}

/**
 * Console keyboard hook: Install global listener
 * Callbacks receive action string + event context
 */
export interface KeyboardHookCallbacks {
  onRefresh?: (target: 'health' | 'all') => void;
  onPipeline?: (action: 'pause' | 'restart', pipelineNumber: number) => void;
  onAcknowledge?: () => void;
  onFocusSearch?: () => void;
  onNavigatePanel?: (direction: 'next' | 'prev') => void;
}

let globalShortcutListener: ((event: KeyboardEvent) => void) | null = null;

export function installKeyboardHook(
  callbacks: KeyboardHookCallbacks,
  options?: { target?: EventTarget; skipDefaults?: string[] }
): () => void {
  const skipDefaults = options?.skipDefaults ?? [];
  const target = options?.target ?? document;

  let pipelineBuffer: 'pause' | 'restart' | '' = '';
  let pipelineTimeout: NodeJS.Timeout | null = null;

  const listener = (event: KeyboardEvent) => {
    // Don't intercept if typing in input (unless it's / for search)
    const isInput =
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement;
    if (isInput && event.key !== '/') return;

    const action = parseKeyboardShortcut(event);

    if (action === 'POST /api/health') {
      event.preventDefault();
      callbacks.onRefresh?.('health');
    } else if (action === 'POST /api/health + /api/pipelines + /api/alerts') {
      event.preventDefault();
      callbacks.onRefresh?.('all');
    } else if (action?.startsWith('pause-pipeline:') || action?.startsWith('restart-pipeline:')) {
      // Start pipeline buffer: track action type (pause vs restart)
      pipelineBuffer = action.startsWith('pause-pipeline:') ? 'pause' : 'restart';
      event.preventDefault();

      // Clear old timeout
      if (pipelineTimeout) clearTimeout(pipelineTimeout);

      // Set new timeout: clear buffer after 2s if no number pressed
      pipelineTimeout = setTimeout(() => {
        pipelineBuffer = '';
      }, 2000);
    } else if (pipelineBuffer && /^\d$/.test(event.key)) {
      const pipelineNumber = parseInt(event.key, 10);

      callbacks.onPipeline?.(pipelineBuffer, pipelineNumber);
      pipelineBuffer = '';
      if (pipelineTimeout) clearTimeout(pipelineTimeout);
      event.preventDefault();
    } else if (action === 'POST /api/alerts/{id}/acknowledge') {
      event.preventDefault();
      callbacks.onAcknowledge?.();
    } else if (action === 'focus-search-input') {
      event.preventDefault();
      callbacks.onFocusSearch?.();
    } else if (action === 'focus-next-panel') {
      event.preventDefault();
      callbacks.onNavigatePanel?.('next');
    } else if (action === 'focus-prev-panel') {
      event.preventDefault();
      callbacks.onNavigatePanel?.('prev');
    }
  };

  globalShortcutListener = listener;
  target.addEventListener('keydown', listener as EventListener);

  // Return cleanup function
  return () => {
    target.removeEventListener('keydown', listener as EventListener);
    if (pipelineTimeout) clearTimeout(pipelineTimeout);
    globalShortcutListener = null;
  };
}

/**
 * Get keyboard reference doc
 * Formatted for OPERATOR_KB.md
 */
export function getKeyboardReference(): string {
  const lines: string[] = [
    '# Operator Console Keyboard Shortcuts',
    '',
    '## Single-Key Workflows',
    '',
  ];

  lines.push('| Key | Action | Workflow |');
  lines.push('|---|---|---|');

  lines.push('| A | Acknowledge Alert | Focus alert, press A to acknowledge |');
  lines.push('| / | Focus Search | Press / to jump to search input |');
  lines.push('| [ | Previous Panel | Navigate to previous panel |');
  lines.push('| ] | Next Panel | Navigate to next panel |');
  lines.push('', '## Ctrl+Key Workflows', '');

  lines.push('| Ctrl+Key | Action | Workflow |');
  lines.push('|---|---|---|');
  lines.push('| Ctrl+R | Refresh Health | Update health panel only |');
  lines.push('| Ctrl+Shift+R | Refresh All | Update all panels |');
  lines.push('', '## Multi-Key Workflows (Sequence)', '');

  lines.push('| Sequence | Action | Example |');
  lines.push('|---|---|---|');
  lines.push('| P + 1..9 | Pause Pipeline N | P+1 pauses Pipeline 1 |');
  lines.push('| Shift+P + 1..9 | Restart Pipeline N | Shift+P+2 restarts Pipeline 2 |');
  lines.push('', '## Tips', '');
  lines.push('- All workflows completable without mouse');
  lines.push('- Multi-key shortcuts (P+N) have 2-second window');
  lines.push('- Search focus (/) auto-clears input');
  lines.push('- Panel navigation wraps at edges');

  return lines.join('\n');
}
