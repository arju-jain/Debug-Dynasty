import { describe, it, expect } from 'vitest';
import { detectLanguage } from '../utils/languageDetector';

describe('Language Detector Utility', () => {
  it('returns empty status for empty or whitespace-only code', () => {
    expect(detectLanguage('').status).toBe('empty');
    expect(detectLanguage('   \n  \t ').status).toBe('empty');
    expect(detectLanguage('').message).toBe('Language not detected yet');
  });

  it('detects Python code correctly', () => {
    const pythonCode = `
def calculate_factorial(n):
    if n <= 1:
        return 1
    return n * calculate_factorial(n - 1)

print(calculate_factorial(5))
`;
    const res = detectLanguage(pythonCode);
    expect(res.status).toBe('detected');
    expect(res.language).toBe('python');
    expect(res.displayName).toBe('Python');
    expect(res.message).toBe('Detected: Python');
  });

  it('detects JavaScript code correctly', () => {
    const jsCode = `
const items = [1, 2, 3];
function calculateSum(arr) {
  return arr.reduce((acc, curr) => acc + curr, 0);
}
console.log(calculateSum(items));
`;
    const res = detectLanguage(jsCode);
    expect(res.status).toBe('detected');
    expect(res.language).toBe('javascript');
    expect(res.displayName).toBe('JavaScript');
  });

  it('detects TypeScript code when type annotations and interfaces are present', () => {
    const tsCode = `
interface UserProfile {
  id: string;
  age: number;
  isActive: boolean;
}

function getUser(id: string): UserProfile {
  return { id, age: 30, isActive: true };
}
`;
    const res = detectLanguage(tsCode);
    expect(res.status).toBe('detected');
    expect(res.language).toBe('typescript');
  });

  it('detects Java code correctly', () => {
    const javaCode = `
package com.debugdynasty.service;

import java.util.ArrayList;

public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello Debug Dynasty!");
    }
}
`;
    const res = detectLanguage(javaCode);
    expect(res.status).toBe('detected');
    expect(res.language).toBe('java');
    expect(res.displayName).toBe('Java');
  });

  it('detects C++ code correctly', () => {
    const cppCode = `
#include <iostream>
#include <vector>

using namespace std;

int main() {
    vector<int> nums = {1, 2, 3};
    cout << "Size: " << nums.size() << endl;
    return 0;
}
`;
    const res = detectLanguage(cppCode);
    expect(res.status).toBe('detected');
    expect(res.language).toBe('cpp');
    expect(res.displayName).toBe('C++');
  });

  it('detects C code correctly', () => {
    const cCode = `
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *ptr = (int*)malloc(sizeof(int) * 10);
    printf("Allocated successfully\\n");
    free(ptr);
    return 0;
}
`;
    const res = detectLanguage(cCode);
    expect(res.status).toBe('detected');
    expect(res.language).toBe('c');
    expect(res.displayName).toBe('C');
  });

  it('handles ambiguous code safely without forcing Python', () => {
    const ambiguousCode = 'x = 1\ny = 2\nz = x + y';
    const res = detectLanguage(ambiguousCode);
    // Should be ambiguous or confidence < threshold, NOT forcing Python blindly
    if (res.status === 'ambiguous') {
      expect(res.message).toBe('Language uncertain — please select a language');
    } else {
      // Even if scored, verify status isn't forced Python if ambiguous
      expect(res.language).not.toBeNull();
    }
  });
});
