import { apiClient } from './client';
import { SupportedLanguage } from '../types/api';

// Fallback supported languages if backend /api/languages is unreachable or in setup
export const DEFAULT_LANGUAGES: SupportedLanguage[] = [
  {
    id: 'python',
    name: 'Python',
    sandbox_supported: true,
    version: '3.12',
    monaco_id: 'python',
    notes: 'Full execution sandbox and unit testing supported',
  },
  {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    sandbox_supported: false,
    version: 'Node 20',
    monaco_id: 'javascript',
    notes: 'Static analysis and AI fix supported; sandbox execution requires Docker runner on backend',
  },
  {
    id: 'java',
    name: 'Java',
    sandbox_supported: false,
    version: 'OpenJDK 17',
    monaco_id: 'java',
    notes: 'Static analysis and AI fix supported; sandbox execution requires Docker runner on backend',
  },
  {
    id: 'cpp',
    name: 'C++',
    sandbox_supported: false,
    version: 'GCC 12 / C++20',
    monaco_id: 'cpp',
    notes: 'Static analysis and AI fix supported; sandbox execution requires GCC runner on backend',
  },
];

export const getLanguages = async (): Promise<SupportedLanguage[]> => {
  try {
    const response = await apiClient.get<any>('/api/languages');
    let rawList: any[] = [];

    if (Array.isArray(response)) {
      rawList = response;
    } else if (response && Array.isArray(response.languages)) {
      rawList = response.languages;
    } else if (response && Array.isArray(response.supported_languages)) {
      rawList = response.supported_languages;
    } else {
      return DEFAULT_LANGUAGES;
    }

    if (rawList.length === 0) return DEFAULT_LANGUAGES;

    const mapped: SupportedLanguage[] = rawList.map((l: any): SupportedLanguage => ({
      id: l.id || 'python',
      name: l.name || l.id,
      sandbox_supported: l.sandbox_supported !== undefined ? Boolean(l.sandbox_supported) : Boolean(l.execution_supported),
      version: l.version || '',
      monaco_id: l.monaco_id || (l.id === 'cpp' ? 'cpp' : (l.id === 'javascript' ? 'javascript' : (l.id === 'java' ? 'java' : 'python'))),
      notes: l.notes || l.execution_limitations || ''
    }));

    // If backend only returns python, merge with defaults so UI remains fully capable
    const existingIds = new Set(mapped.map((m: any) => m.id));
    for (const def of DEFAULT_LANGUAGES) {
      if (!existingIds.has(def.id)) {
        mapped.push(def);
      }
    }

    return mapped;
  } catch (err) {
    console.warn('Failed to load supported languages from backend, using defaults', err);
    return DEFAULT_LANGUAGES;
  }
};
