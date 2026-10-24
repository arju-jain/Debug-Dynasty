import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';
import React from 'react';

beforeEach(() => {
  localStorage.clear();
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// Mock window.confirm and alert for jsdom
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn().mockReturnValue(true),
});

Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
});

// Mock anchor tag click in jsdom to avoid "Not implemented: navigation"
HTMLAnchorElement.prototype.click = vi.fn();

// Mock @monaco-editor/react for headless jsdom test runner without JSX in .ts
vi.mock('@monaco-editor/react', () => {
  return {
    default: ({ value, onChange, placeholder }: any) => {
      return React.createElement('textarea', {
        'data-testid': 'monaco-mock',
        value: value || '',
        placeholder: placeholder,
        onChange: (e: any) => onChange && onChange(e.target.value),
      });
    },
    DiffEditor: ({ original, modified }: any) => {
      return React.createElement(
        'div',
        { 'data-testid': 'diff-monaco-mock' },
        React.createElement('div', { 'data-testid': 'diff-original' }, original),
        React.createElement('div', { 'data-testid': 'diff-modified' }, modified)
      );
    },
  };
});
