import React, { Suspense, lazy, useState } from 'react';
import { Columns, AlignJustify } from 'lucide-react';

const MonacoDiffEditorComponent = lazy(() =>
  import('@monaco-editor/react').then((mod) => ({ default: mod.DiffEditor }))
);

interface DiffViewerProps {
  originalCode: string;
  correctedCode: string;
  language: string;
  height?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalCode,
  correctedCode,
  language,
  height = '380px',
}) => {
  const [sideBySide, setSideBySide] = useState<boolean>(true);

  const getMonacoLanguage = (lang: string): string => {
    switch (lang.toLowerCase()) {
      case 'c++':
      case 'cpp':
        return 'cpp';
      case 'javascript':
      case 'js':
      case 'node':
        return 'javascript';
      case 'python':
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      default:
        return 'plaintext';
    }
  };

  // Dark diff surface inside light app
  const monacoTheme = 'vs-dark';

  return (
    <div className="flex flex-col w-full rounded-xl overflow-hidden border border-slate-700/80 bg-[#1e1e1e] shadow-md">
      {/* Diff Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#252526] border-b border-slate-700 text-xs">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 text-rose-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Original (Buggy)</span>
          </span>
          <span className="text-slate-500 font-mono">→</span>
          <span className="flex items-center space-x-1.5 text-emerald-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Corrected (Proposed Fix)</span>
          </span>
        </div>

        <button
          onClick={() => setSideBySide(!sideBySide)}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#333333] hover:bg-[#3e3e42] text-slate-200 text-[11px] font-mono transition border border-slate-600 shadow-xs"
          title={sideBySide ? 'Switch to inline diff view' : 'Switch to side-by-side diff view'}
        >
          {sideBySide ? (
            <>
              <AlignJustify className="w-3.5 h-3.5 text-blue-400" />
              <span>Inline</span>
            </>
          ) : (
            <>
              <Columns className="w-3.5 h-3.5 text-blue-400" />
              <span>Side-by-Side</span>
            </>
          )}
        </button>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center text-slate-400 text-xs font-mono bg-[#1e1e1e]" style={{ height }}>
            Calculating code difference...
          </div>
        }
      >
        <div data-testid="diff-editor-container">
          <MonacoDiffEditorComponent
            height={height}
            original={originalCode}
            modified={correctedCode}
            language={getMonacoLanguage(language)}
            theme={monacoTheme}
            options={{
              readOnly: true,
              renderSideBySide: sideBySide,
              fontSize: 13,
              fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
              lineNumbers: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              diffWordWrap: 'on',
            }}
          />
        </div>
      </Suspense>
    </div>
  );
};
