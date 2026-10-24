import { useEffect } from 'react';

interface ShortcutHandlers {
  onDebug?: () => void;
  onCopyCorrectedCode?: () => void;
}

export function useKeyboardShortcuts({ onDebug, onCopyCorrectedCode }: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + Enter: Trigger Debug
      if (isCmdOrCtrl && e.key === 'Enter' && !e.shiftKey) {
        if (onDebug) {
          e.preventDefault();
          onDebug();
        }
      }

      // Ctrl/Cmd + Shift + C: Copy corrected code
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        if (onCopyCorrectedCode) {
          e.preventDefault();
          onCopyCorrectedCode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDebug, onCopyCorrectedCode]);
}
