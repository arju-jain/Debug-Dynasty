import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { extractErrorMessage, ApiClientError, API_BASE_URL } from '../api/client';

describe('API Client & Error Handler', () => {
  it('reads API_BASE_URL correctly from environment or default', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe('string');
  });

  it('correctly handles ApiClientError instance', () => {
    const customErr = new ApiClientError('Custom error message', 400);
    expect(extractErrorMessage(customErr)).toBe('Custom error message');
  });

  it('extracts FastAPI array validation errors (422) with field and message', () => {
    const mockAxiosError = {
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          detail: [
            { loc: ['body', 'code'], msg: 'Field required' },
            { loc: ['body', 'language'], msg: 'Invalid language identifier' },
          ],
        },
      },
    } as any;

    const formatted = extractErrorMessage(mockAxiosError);
    expect(formatted).toContain('code: Field required');
    expect(formatted).toContain('language: Invalid language identifier');
  });

  it('extracts string detail from backend response', () => {
    const mockAxiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          detail: 'Syntax error detected in input string',
        },
      },
    } as any;

    expect(extractErrorMessage(mockAxiosError)).toBe('Syntax error detected in input string');
  });

  it('handles network disconnection / server offline gracefully', () => {
    const mockNetworkError = {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
    } as any;

    const errorMsg = extractErrorMessage(mockNetworkError);
    expect(errorMsg).toContain('Unable to reach backend server');
    expect(errorMsg).toContain(API_BASE_URL);
  });

  it('handles request timeout gracefully', () => {
    const mockTimeoutError = {
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout of 30000ms exceeded',
    } as any;

    const errorMsg = extractErrorMessage(mockTimeoutError);
    expect(errorMsg).toContain('timed out');
  });

  it('formats standard HTTP status codes correctly', () => {
    const mock404 = {
      isAxiosError: true,
      response: { status: 404, data: {} },
    } as any;
    expect(extractErrorMessage(mock404)).toContain('Not Found');

    const mock429 = {
      isAxiosError: true,
      response: { status: 429, data: {} },
    } as any;
    expect(extractErrorMessage(mock429)).toContain('Too Many Requests');

    const mock500 = {
      isAxiosError: true,
      response: { status: 500, data: {} },
    } as any;
    expect(extractErrorMessage(mock500)).toContain('Internal Server Error');
  });
});
