import axios, { type AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';
import {
  DEFAULT_ERROR_MESSAGE,
  resolveErrorMessage,
} from '@/shared/utils/error-message';

const isoTimestamp = () => new Date().toISOString();

type ErrorPayload = {
  code?: string;
  message?: string;
  detail?: string;
  title?: string;
  status?: number;
  details?: Record<string, unknown>;
  type?: string;
  instance?: string;
  fieldErrors?: Record<string, string>;
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
  fallbackMessage = DEFAULT_ERROR_MESSAGE
): ApiResponse<never> => {
  if (axios.isAxiosError(error)) {
    return fromAxiosError(error, fallbackCode, fallbackMessage);
  }

  const explicitMessage =
    error instanceof Error ? error.message : undefined;

  const message = resolveErrorMessage(fallbackCode, explicitMessage, fallbackMessage);
  return {
    success: false,
    error: {
      code: fallbackCode,
      message,
      details: explicitMessage
        ? {
            reason: explicitMessage,
          }
        : undefined,
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
  const explicitMessage = payload.detail ?? payload.message;
  const message = resolveErrorMessage(
    code,
    explicitMessage,
    fallbackMessage
  );

  const status = payload.status ?? error.response?.status;
  const derivedDetails =
    explicitMessage ||
    payload.title ||
    payload.type ||
    payload.fieldErrors
      ? Object.fromEntries(
          Object.entries({
            title: payload.title,
            detail: payload.detail,
            message: payload.message,
            type: payload.type,
            instance: payload.instance,
            fieldErrors: payload.fieldErrors,
          }).filter(([, value]) => value !== undefined && value !== null)
        )
      : undefined;

  const normalizedDetails =
    payload.details && derivedDetails
      ? { ...derivedDetails, ...payload.details }
      : payload.details ?? derivedDetails;

  return {
    success: false,
    error: {
      code,
      message,
      status,
      details: normalizedDetails,
    },
    timestamp: isoTimestamp(),
  };
};
