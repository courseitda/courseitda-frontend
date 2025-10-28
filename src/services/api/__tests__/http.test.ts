import type { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { toError } from "@/services/api/http";
import { BackendErrorCode } from "@/shared/utils/error-message";

const createAxiosError = (payload: Record<string, unknown>): AxiosError => {
  return {
    isAxiosError: true,
    name: "AxiosError",
    message: payload.detail?.toString() ?? "Axios error",
    config: {},
    toJSON: () => ({}),
    response: {
      status: payload.status as number | undefined,
      statusText: payload.title?.toString() ?? "",
      headers: {},
      config: {},
      data: payload,
    },
  } as AxiosError;
};

describe("toError", () => {
  it("ProblemDetail 응답을 ApiResponse 에러로 변환한다", () => {
    const axiosError = createAxiosError({
      code: BackendErrorCode.WORKSPACE_NOT_FOUND,
      detail: "존재하지 않는 워크스페이스 입니다.",
      status: 404,
      title: "Not Found",
      type: "about:blank",
    });

    const response = toError(axiosError, "FALLBACK_CODE");

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe(BackendErrorCode.WORKSPACE_NOT_FOUND);
    expect(response.error?.message).toBe("존재하지 않는 워크스페이스입니다.");
    expect(response.error?.status).toBe(404);
    expect(response.error?.details).toMatchObject({
      title: "Not Found",
      detail: "존재하지 않는 워크스페이스 입니다.",
      type: "about:blank",
    });
  });

  it("요청 검증 실패 응답은 필드 에러 정보를 유지한다", () => {
    const axiosError = createAxiosError({
      code: BackendErrorCode.REQUEST_VALIDATION_FAILED,
      detail: "요청 데이터 검증에 실패했습니다.",
      status: 400,
      fieldErrors: {
        nickname: "공백일 수 없습니다.",
        password: "비밀번호는 6자 이상 20자 이하이어야 합니다.",
      },
    });

    const response = toError(axiosError, "FALLBACK_CODE");

    expect(response.error?.code).toBe(
      BackendErrorCode.REQUEST_VALIDATION_FAILED
    );
    expect(response.error?.message).toBe(
      "입력값이 올바르지 않습니다. 다시 확인해주세요."
    );
    expect(response.error?.details).toMatchObject({
      fieldErrors: {
        nickname: "공백일 수 없습니다.",
        password: "비밀번호는 6자 이상 20자 이하이어야 합니다.",
      },
    });
  });

  it("코드가 없으면 폴백 코드와 메시지를 사용한다", () => {
    const axiosError = createAxiosError({
      detail: "권한이 없습니다.",
    });

    const response = toError(
      axiosError,
      "CUSTOM_FALLBACK",
      "사용자 지정 폴백"
    );

    expect(response.error?.code).toBe("CUSTOM_FALLBACK");
    expect(response.error?.message).toBe("사용자 지정 폴백");
  });

  it("AxiosError 가 아니면 일반 예외 메시지를 details.reason 으로 보관한다", () => {
    const response = toError(new Error("네트워크가 불안정합니다."), "TEMP");

    expect(response.error?.code).toBe("TEMP");
    expect(response.error?.details).toMatchObject({
      reason: "네트워크가 불안정합니다.",
    });
  });
});
