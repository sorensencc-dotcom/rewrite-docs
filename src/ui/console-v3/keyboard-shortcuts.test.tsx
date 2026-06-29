/**
 * Phase 3.6 Stream B: Keyboard Shortcuts Tests
 * Contract: 5/5 workflows complete via keyboard, no browser conflicts
 */

import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  parseKeyboardShortcut,
  parsePipelineNumber,
  installKeyboardHook,
  KEYBOARD_SHORTCUTS,
  getKeyboardReference,
} from './keyboard-shortcuts';

describe('Keyboard Shortcuts (Phase 3.6 Stream B)', () => {
  describe('parseKeyboardShortcut', () => {
    it('parses Ctrl+R (refresh health)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true,
        bubbles: true,
      });

      const action = parseKeyboardShortcut(event);
      expect(action).toBe('POST /api/health');
    });

    it('parses Ctrl+Shift+R (refresh all)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });

      const action = parseKeyboardShortcut(event);
      expect(action).toBe('POST /api/health + /api/pipelines + /api/alerts');
    });

    it('parses A (acknowledge alert)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true,
      });

      const action = parseKeyboardShortcut(event);
      expect(action).toBe('POST /api/alerts/{id}/acknowledge');
    });

    it('parses / (focus search)', () => {
      const event = new KeyboardEvent('keydown', {
        key: '/',
        bubbles: true,
      });

      const action = parseKeyboardShortcut(event);
      expect(action).toBe('focus-search-input');
    });

    it('parses [ (previous panel)', () => {
      const event = new KeyboardEvent('keydown', {
        key: '[',
        bubbles: true,
      });

      const action = parseKeyboardShortcut(event);
      expect(action).toBe('focus-prev-panel');
    });

    it('parses ] (next panel)', () => {
      const event = new KeyboardEvent('keydown', {
        key: ']',
        bubbles: true,
      });

      const action = parseKeyboardShortcut(event);
      expect(action).toBe('focus-next-panel');
    });

    it('parses P (pipeline base action)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'p',
        bubbles: true,
      });

      const action = parseKeyboardShortcut(event);
      expect(action).toBe('pause-pipeline:n');
    });

    it('parses Shift+P (restart pipeline base)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'p',
        shiftKey: true,
        bubbles: true,
      });

      const action = parseKeyboardShortcut(event);
      expect(action).toBe('restart-pipeline:n');
    });

    it('returns null for unrecognized keys', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        bubbles: true,
      });

      const action = parseKeyboardShortcut(event);
      expect(action).toBeNull();
    });

    it('is case-insensitive for key matching', () => {
      const eventLower = new KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true,
      });

      const eventUpper = new KeyboardEvent('keydown', {
        key: 'A',
        bubbles: true,
      });

      expect(parseKeyboardShortcut(eventLower)).toBe(parseKeyboardShortcut(eventUpper));
    });
  });

  describe('parsePipelineNumber', () => {
    it('extracts pipeline number from pause action + digit', () => {
      const event = new KeyboardEvent('keydown', {
        key: '3',
        bubbles: true,
      });

      const result = parsePipelineNumber('pause-pipeline:n', event);
      expect(result).toBe('pause-pipeline:3');
    });

    it('extracts pipeline number from restart action + digit', () => {
      const event = new KeyboardEvent('keydown', {
        key: '5',
        bubbles: true,
      });

      const result = parsePipelineNumber('restart-pipeline:n', event);
      expect(result).toBe('restart-pipeline:5');
    });

    it('returns null for non-pipeline actions', () => {
      const event = new KeyboardEvent('keydown', {
        key: '1',
        bubbles: true,
      });

      const result = parsePipelineNumber('refresh-health', event);
      expect(result).toBeNull();
    });

    it('returns null for non-digit keys', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true,
      });

      const result = parsePipelineNumber('pause-pipeline:n', event);
      expect(result).toBeNull();
    });
  });

  describe('installKeyboardHook', () => {
    it('calls onRefresh("health") for Ctrl+R', () => {
      const mock = { onRefresh: jest.fn() };
      const uninstall = installKeyboardHook(mock);

      const event = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true,
        bubbles: true,
      });

      document.dispatchEvent(event);
      expect(mock.onRefresh).toHaveBeenCalledWith('health');

      uninstall();
    });

    it('calls onRefresh("all") for Ctrl+Shift+R', () => {
      const mock = { onRefresh: jest.fn() };
      const uninstall = installKeyboardHook(mock);

      const event = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });

      document.dispatchEvent(event);
      expect(mock.onRefresh).toHaveBeenCalledWith('all');

      uninstall();
    });

    it('calls onAcknowledge for A key', () => {
      const mock = { onAcknowledge: jest.fn() };
      const uninstall = installKeyboardHook(mock);

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true,
      });

      document.dispatchEvent(event);
      expect(mock.onAcknowledge).toHaveBeenCalled();

      uninstall();
    });

    it('calls onFocusSearch for / key', () => {
      const mock = { onFocusSearch: jest.fn() };
      const uninstall = installKeyboardHook(mock);

      const event = new KeyboardEvent('keydown', {
        key: '/',
        bubbles: true,
      });

      document.dispatchEvent(event);
      expect(mock.onFocusSearch).toHaveBeenCalled();

      uninstall();
    });

    it('calls onNavigatePanel("prev") for [ key', () => {
      const mock = { onNavigatePanel: jest.fn() };
      const uninstall = installKeyboardHook(mock);

      const event = new KeyboardEvent('keydown', {
        key: '[',
        bubbles: true,
      });

      document.dispatchEvent(event);
      expect(mock.onNavigatePanel).toHaveBeenCalledWith('prev');

      uninstall();
    });

    it('calls onNavigatePanel("next") for ] key', () => {
      const mock = { onNavigatePanel: jest.fn() };
      const uninstall = installKeyboardHook(mock);

      const event = new KeyboardEvent('keydown', {
        key: ']',
        bubbles: true,
      });

      document.dispatchEvent(event);
      expect(mock.onNavigatePanel).toHaveBeenCalledWith('next');

      uninstall();
    });

    it('handles P+1 sequence (pause pipeline 1)', () => {
      const mock = { onPipeline: jest.fn() };
      const uninstall = installKeyboardHook(mock);

      // Press P
      const pEvent = new KeyboardEvent('keydown', {
        key: 'p',
        bubbles: true,
      });
      document.dispatchEvent(pEvent);

      // Press 1
      const numEvent = new KeyboardEvent('keydown', {
        key: '1',
        bubbles: true,
      });
      document.dispatchEvent(numEvent);

      expect(mock.onPipeline).toHaveBeenCalledWith('pause', 1);

      uninstall();
    });

    it('handles Shift+P+2 sequence (restart pipeline 2)', () => {
      const mock = { onPipeline: jest.fn() };
      const uninstall = installKeyboardHook(mock);

      // Press Shift+P
      const shiftPEvent = new KeyboardEvent('keydown', {
        key: 'p',
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(shiftPEvent);

      // Press 2
      const numEvent = new KeyboardEvent('keydown', {
        key: '2',
        bubbles: true,
      });
      document.dispatchEvent(numEvent);

      expect(mock.onPipeline).toHaveBeenCalledWith('restart', 2);

      uninstall();
    });

    it('prevents default browser behavior for shortcuts', () => {
      const mock = { onRefresh: jest.fn() };
      const uninstall = installKeyboardHook(mock);

      const event = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();

      uninstall();
    });

    it('cleanup function removes event listener', () => {
      const mock = { onRefresh: jest.fn() };
      const uninstall = installKeyboardHook(mock);

      uninstall();

      const event = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true,
        bubbles: true,
      });

      document.dispatchEvent(event);
      expect(mock.onRefresh).not.toHaveBeenCalled();
    });
  });

  describe('KEYBOARD_SHORTCUTS config', () => {
    it('has 8 shortcuts defined', () => {
      expect(Object.keys(KEYBOARD_SHORTCUTS)).toHaveLength(8);
    });

    it('each shortcut has required fields', () => {
      for (const shortcut of Object.values(KEYBOARD_SHORTCUTS)) {
        expect(shortcut).toHaveProperty('key');
        expect(shortcut).toHaveProperty('action');
        expect(shortcut).toHaveProperty('description');
      }
    });

    it('Ctrl+R and Ctrl+Shift+R do not conflict', () => {
      const ctrlR = KEYBOARD_SHORTCUTS['refresh-health'];
      const ctrlShiftR = KEYBOARD_SHORTCUTS['refresh-all'];

      expect(ctrlR.key).toBe('r');
      expect(ctrlR.ctrl).toBe(true);
      expect(ctrlR.shift).toBeUndefined();

      expect(ctrlShiftR.key).toBe('r');
      expect(ctrlShiftR.ctrl).toBe(true);
      expect(ctrlShiftR.shift).toBe(true);
    });
  });

  describe('getKeyboardReference', () => {
    it('returns markdown formatted keyboard reference', () => {
      const ref = getKeyboardReference();

      expect(ref).toContain('# Operator Console Keyboard Shortcuts');
      expect(ref).toContain('| A | Acknowledge Alert |');
      expect(ref).toContain('| Ctrl+R | Refresh Health |');
      expect(ref).toContain('| P + 1..9 | Pause Pipeline N |');
    });

    it('includes all 5 main workflows', () => {
      const ref = getKeyboardReference();

      expect(ref).toContain('Acknowledge');
      expect(ref).toContain('Refresh');
      expect(ref).toContain('Pause Pipeline');
      expect(ref).toContain('Focus Search');
      expect(ref).toContain('Navigate');
    });

    it('reference is suitable for OPERATOR_KB.md', () => {
      const ref = getKeyboardReference();

      // Should be valid markdown
      expect(ref).toMatch(/^# /m);
      expect(ref).toContain('|');
      expect(ref).toContain('---');
    });
  });
});
