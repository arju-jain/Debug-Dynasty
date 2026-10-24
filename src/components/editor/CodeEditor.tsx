import React, { Suspense, lazy } from 'react';

import { Issue } from '../../types/api';

// Dynamically import Monaco Editor to allow graceful fallback in non-browser/test environments
const MonacoEditorComponent = lazy(() => import('@monaco-editor/react').then(mod => ({ default: mod.default })));

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: string;
  readOnly?: boolean;
  height?: string;
  placeholder?: string;
  highlightLine?: number | null;
  highlightColumn?: number | null;
  issues?: Issue[];
  onMount?: (editor: any, monaco: any) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  readOnly = false,
  height = '340px',
  placeholder = '// Enter your code here...',
  highlightLine = null,
  highlightColumn = null,
  issues = [],
  onMount,
}) => {
  const editorRef = React.useRef<any>(null);
  const monacoRef = React.useRef<any>(null);
  const decorationsRef = React.useRef<string[]>([]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    if (onMount) onMount(editor, monaco);

    if (highlightLine && highlightLine > 0) {
      editor.revealLineInCenter(highlightLine);
      editor.setPosition({ lineNumber: highlightLine, column: highlightColumn || 1 });
      editor.focus();
    }
  };

  // Jump to highlightLine when it changes
  React.useEffect(() => {
    if (editorRef.current && highlightLine && highlightLine > 0) {
      editorRef.current.revealLineInCenter(highlightLine);
      editorRef.current.setPosition({ lineNumber: highlightLine, column: highlightColumn || 1 });
      editorRef.current.focus();

      // Add temporary highlight decoration if monaco is available
      if (monacoRef.current) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
          {
            range: new monacoRef.current.Range(highlightLine, 1, highlightLine, 1),
            options: {
              isWholeLine: true,
              className: 'bg-rose-500/20 border-l-4 border-rose-500',
              glyphMarginClassName: 'text-rose-500'
            }
          }
        ]);
      }
    }
  }, [highlightLine, highlightColumn]);

  // Synchronize Monaco editor content whenever value prop changes externally (e.g., Apply Fix)
  React.useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Normalize language for Monaco
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

  // Modern developer workspace: Dark code editor surface inside light application
  const monacoTheme = 'vs-dark';

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-700/80 bg-[#1e1e1e] font-mono text-sm shadow-md transition">
      <Suspense
        fallback={
          <div className="w-full flex items-center justify-center bg-[#1e1e1e] text-slate-400 text-xs font-mono" style={{ height }}>
            Loading Code Engine...
          </div>
        }
      >
        {typeof window !== 'undefined' && (
          <MonacoEditorComponent
            height={height}
            language={getMonacoLanguage(language)}
            value={value}
            theme={monacoTheme}
            onMount={handleEditorDidMount}
            onChange={(val) => onChange && onChange(val || '')}
            options={{
              readOnly,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 4,
              padding: { top: 12, bottom: 12 },
              renderLineHighlight: 'line',
              overviewRulerBorder: false,
              cursorBlinking: 'smooth',
            }}
          />
        )}
      </Suspense>

      {/* Accessible fallback for test environments or non-JS */}
      <noscript>
        <textarea
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          readOnly={readOnly}
          style={{ height }}
          placeholder={placeholder}
          className="w-full bg-[#1e1e1e] text-slate-100 p-4 font-mono text-xs resize-none"
        />
      </noscript>
    </div>
  );
};
