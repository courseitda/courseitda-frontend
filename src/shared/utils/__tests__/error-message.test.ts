import { describe, expect, it } from "vitest";
import {
  BackendErrorCode,
  DEFAULT_ERROR_MESSAGE,
  resolveErrorMessage,
} from "../error-message";

describe("resolveErrorMessage", () => {
  it("모든 백엔드 에러 코드에 대한 메시지를 매핑한다", () => {
    const unmappedCodes = Object.values(BackendErrorCode).filter((code) => {
      const message = resolveErrorMessage(code);
      return message === DEFAULT_ERROR_MESSAGE;
    });

    expect(unmappedCodes).toHaveLength(0);
  });

  it("명시적인 메시지가 있어도 매핑된 메시지를 우선한다", () => {
    const message = resolveErrorMessage(
      BackendErrorCode.WORKSPACE_NOT_FOUND,
      "백엔드에서 전송한 에러"
    );

    expect(message).toBe("존재하지 않는 워크스페이스입니다.");
  });

  it("매핑되지 않은 코드라도 폴백 메시지를 반환한다", () => {
    const fallback = resolveErrorMessage(
      "UNKNOWN_CODE",
      undefined,
      "사용자 지정 폴백"
    );

    expect(fallback).toBe("사용자 지정 폴백");
  });

  it("명시 메시지와 폴백이 모두 없으면 기본 메시지를 반환한다", () => {
    const message = resolveErrorMessage("UNKNOWN_CODE");

    expect(message).toBe(DEFAULT_ERROR_MESSAGE);
  });
});
