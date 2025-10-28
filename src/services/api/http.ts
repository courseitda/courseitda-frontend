import axios, { type AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';

const isoTimestamp = () => new Date().toISOString();

type ErrorPayload = {
  code?: string;
  message?: string;
  status?: number;
  details?: Record<string, unknown>;
};

export const toSuccess = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
  timestamp: isoTimestamp(),
});

export const toError = (
  error: unknown,
  fallbackCode: string,
  fallbackMessage = '요청 처리 중 오류가 발생했습니다.'
): ApiResponse<never> => {
  if (axios.isAxiosError(error)) {
    return fromAxiosError(error, fallbackCode, fallbackMessage);
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return {
    success: false,
    error: {
      code: fallbackCode,
      message,
    },
    timestamp: isoTimestamp(),
  };
};

const fromAxiosError = (
  error: AxiosError,
  fallbackCode: string,
  fallbackMessage: string
): ApiResponse<never> => {
  const payload = (error.response?.data ?? {}) as ErrorPayload;
  const code = payload.code || fallbackCode;
  const message = payload.message || fallbackMessage;

  return {
    success: false,
    error: {
      code,
      message,
      status: payload.status ?? error.response?.status,
      details: payload.details,
    },
    timestamp: isoTimestamp(),
  };
};
