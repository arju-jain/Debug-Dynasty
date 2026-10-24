export interface LanguageDetectionResult {
  language: string | null;
  status: 'empty' | 'detected' | 'ambiguous';
  displayName: string;
  message: string;
  confidence: number;
}

export const SUPPORTED_LANGUAGES_MAP: Record<string, { id: string; name: string; monacoId: string }> = {
  python: { id: 'python', name: 'Python', monacoId: 'python' },
  javascript: { id: 'javascript', name: 'JavaScript', monacoId: 'javascript' },
  typescript: { id: 'typescript', name: 'TypeScript', monacoId: 'typescript' },
  java: { id: 'java', name: 'Java', monacoId: 'java' },
  cpp: { id: 'cpp', name: 'C++', monacoId: 'cpp' },
  c: { id: 'c', name: 'C', monacoId: 'c' },
};

/**
 * Heuristic rules for syntax and pattern recognition
 */
interface DetectionRule {
  pattern: RegExp;
  weight: number;
}

const LANGUAGE_RULES: Record<string, DetectionRule[]> = {
  python: [
    { pattern: /\bdef\s+[a-zA-Z_]\w*\s*\(.*?\)\s*:/g, weight: 6 },
    { pattern: /\bclass\s+[a-zA-Z_]\w*(\(.*?\))?\s*:/g, weight: 5 },
    { pattern: /\bfrom\s+[a-zA-Z_][\w\.]*\s+import\s+/g, weight: 6 },
    { pattern: /\bimport\s+[a-zA-Z_][\w\.]*(\s+as\s+[a-zA-Z_]\w*)?/g, weight: 4 },
    { pattern: /\belif\s+.*?:/g, weight: 5 },
    { pattern: /\bif\s+.*?:(\s*#.*)?$/gm, weight: 4 },
    { pattern: /\bwhile\s+.*?:(\s*#.*)?$/gm, weight: 4 },
    { pattern: /\bfor\s+\w+\s+in\s+.*?:/g, weight: 5 },
    { pattern: /\bprint\s*\(/g, weight: 3 },
    { pattern: /\blen\s*\(/g, weight: 3 },
    { pattern: /\brange\s*\(/g, weight: 3 },
    { pattern: /\b(True|False|None)\b/g, weight: 3 },
    { pattern: /\bself\.[a-zA-Z_]\w*/g, weight: 4 },
    { pattern: /__init__|__name__|__main__/g, weight: 5 },
    { pattern: /"""[\s\S]*?"""|'''[\s\S]*?'''/g, weight: 4 },
    { pattern: /^\s*#\s+.*$/gm, weight: 2 },
  ],
  typescript: [
    { pattern: /\binterface\s+[A-Z]\w*\s*\{/g, weight: 7 },
    { pattern: /\btype\s+[A-Z]\w*\s*=\s*/g, weight: 6 },
    { pattern: /:\s*(string|number|boolean|any|void|unknown|never|Record<|Array<)\b/g, weight: 6 },
    { pattern: /\bas\s+[A-Z]\w*\b/g, weight: 4 },
    { pattern: /\bpublic\s+(readonly\s+)?[a-zA-Z_]\w*:\s*/g, weight: 5 },
    { pattern: /\bprivate\s+(readonly\s+)?[a-zA-Z_]\w*:\s*/g, weight: 5 },
    { pattern: /\benum\s+[A-Z]\w*\s*\{/g, weight: 5 },
  ],
  javascript: [
    { pattern: /\bconst\s+[a-zA-Z_$]\w*\s*=/g, weight: 4 },
    { pattern: /\blet\s+[a-zA-Z_$]\w*\s*=/g, weight: 4 },
    { pattern: /\bvar\s+[a-zA-Z_$]\w*\s*=/g, weight: 3 },
    { pattern: /\bfunction\s*[a-zA-Z_$]?\w*\s*\(.*?\)\s*\{/g, weight: 5 },
    { pattern: /=>\s*\{?/g, weight: 4 },
    { pattern: /\bconsole\.(log|error|warn|info)\s*\(/g, weight: 4 },
    { pattern: /===|!==/g, weight: 4 },
    { pattern: /\bimport\s+.*?\s+from\s+['"].*?['"]/g, weight: 4 },
    { pattern: /\bexport\s+(default\s+)?(function|const|let|class)?/g, weight: 4 },
    { pattern: /\brequire\s*\(['"].*?['"]\)/g, weight: 4 },
    { pattern: /\b(null|undefined)\b/g, weight: 2 },
    { pattern: /\bdocument\.(getElementById|querySelector)/g, weight: 5 },
  ],
  java: [
    { pattern: /\bpublic\s+class\s+[A-Z]\w*/g, weight: 7 },
    { pattern: /\bpublic\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]/g, weight: 8 },
    { pattern: /\bSystem\.(out|err)\.println\s*\(/g, weight: 6 },
    { pattern: /\bpackage\s+[a-zA-Z_][\w\.]*;/g, weight: 6 },
    { pattern: /\bimport\s+java\.[a-zA-Z_\.\*]+;/g, weight: 6 },
    { pattern: /@Override|@Autowired|@Component|@Service/g, weight: 5 },
    { pattern: /\b(public|private|protected)\s+(static\s+)?(final\s+)?(void|int|String|boolean|double|float|long)\s+[a-zA-Z_]\w*\s*\(/g, weight: 6 },
    { pattern: /\bnew\s+(ArrayList|HashMap|HashSet|LinkedList)<.*?>\s*\(/g, weight: 6 },
    { pattern: /\bthrows\s+[A-Z]\w*Exception/g, weight: 5 },
  ],
  cpp: [
    { pattern: /#include\s*<iostream>|#include\s*<vector>|#include\s*<string>|#include\s*<algorithm>|#include\s*<map>/g, weight: 7 },
    { pattern: /\busing\s+namespace\s+std;/g, weight: 7 },
    { pattern: /\bstd::(cout|cin|vector|string|endl|make_unique|make_shared)/g, weight: 6 },
    { pattern: /\bcout\s*<<|\bcin\s*>>/g, weight: 6 },
    { pattern: /\bnullptr\b/g, weight: 5 },
    { pattern: /\bconstexpr\b/g, weight: 5 },
    { pattern: /\btemplate\s*<\s*typename\s+\w+\s*>/g, weight: 6 },
    { pattern: /\bvector\s*<\s*[a-zA-Z_]\w*\s*>/g, weight: 5 },
    { pattern: /\bclass\s+[A-Z]\w*\s*\{[\s\S]*?(public:|private:)/g, weight: 6 },
    { pattern: /\bstruct\s+[A-Z]\w*\s*\{/g, weight: 4 },
  ],
  c: [
    { pattern: /#include\s*<stdio\.h>|#include\s*<stdlib\.h>|#include\s*<string\.h>/g, weight: 7 },
    { pattern: /\bprintf\s*\(|\bscanf\s*\(/g, weight: 6 },
    { pattern: /\bmalloc\s*\(|\bfree\s*\(|\bsizeof\s*\(/g, weight: 5 },
    { pattern: /\bint\s+main\s*\(\s*(void|int\s+argc)?\s*\)/g, weight: 4 },
    { pattern: /\bstruct\s+[a-zA-Z_]\w*\s*\{/g, weight: 3 },
  ],
};

/**
 * Detect language based on pattern analysis and confidence scoring
 */
export function detectLanguage(code: string): LanguageDetectionResult {
  const trimmed = code.trim();

  // 1. Empty Code
  if (!trimmed) {
    return {
      language: null,
      status: 'empty',
      displayName: '',
      message: 'Language not detected yet',
      confidence: 0,
    };
  }

  // 2. Compute scores per language
  const scores: Record<string, number> = {
    python: 0,
    typescript: 0,
    javascript: 0,
    java: 0,
    cpp: 0,
    c: 0,
  };

  for (const [lang, rules] of Object.entries(LANGUAGE_RULES)) {
    for (const rule of rules) {
      const matches = trimmed.match(rule.pattern);
      if (matches) {
        scores[lang] += matches.length * rule.weight;
      }
    }
  }

  // TypeScript inherits JS syntax; if TS has specific TS patterns, prioritize TS over JS
  if (scores.typescript >= 5) {
    scores.typescript += scores.javascript * 0.5;
  }

  // Python negative indicators: semicolons at end of lines and braces for blocks
  const semicolonsAtLineEnd = (trimmed.match(/;\s*$/gm) || []).length;
  const bracesCount = (trimmed.match(/[{}]/g) || []).length;

  if (semicolonsAtLineEnd > 2) {
    scores.python = Math.max(0, scores.python - semicolonsAtLineEnd * 2);
  }
  if (bracesCount > 3) {
    scores.python = Math.max(0, scores.python - bracesCount);
  }

  // Sort candidates by score
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topLang, topScore] = sorted[0];
  const secondScore = sorted[1] ? sorted[1][1] : 0;

  // 3. Ambiguous check:
  // If top score is too low (< 3) or top 2 scores are identical and low
  if (topScore < 3 || (topScore < 5 && topScore === secondScore)) {
    return {
      language: null,
      status: 'ambiguous',
      displayName: '',
      message: 'Language uncertain — please select a language',
      confidence: topScore,
    };
  }

  const resolvedLang = topLang;
  const meta = SUPPORTED_LANGUAGES_MAP[resolvedLang] || { id: resolvedLang, name: topLang.toUpperCase(), monacoId: resolvedLang };

  return {
    language: resolvedLang,
    status: 'detected',
    displayName: meta.name,
    message: `Detected: ${meta.name}`,
    confidence: topScore,
  };
}
