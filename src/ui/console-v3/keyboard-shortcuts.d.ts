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
export declare const KEYBOARD_SHORTCUTS: ShortcutConfig;
/**
 * Keyboard event handler for console shortcuts
 * Returns matched action or null if no match
 */
export declare function parseKeyboardShortcut(event: KeyboardEvent): string | null;
/**
 * Pipeline number parser: P+1..9 or Shift+P+1..9
 * Used for multi-key shortcuts like P+1 (pause pipeline 1)
 */
export declare function parsePipelineNumber(baseAction: string, event: KeyboardEvent): string | null;
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
export declare function installKeyboardHook(callbacks: KeyboardHookCallbacks, options?: {
    target?: EventTarget;
    skipDefaults?: string[];
}): () => void;
/**
 * Get keyboard reference doc
 * Formatted for OPERATOR_KB.md
 */
export declare function getKeyboardReference(): string;
//# sourceMappingURL=keyboard-shortcuts.d.ts.map