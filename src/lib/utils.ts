import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind CSS 클래스를 병합하는 유틸리티 함수 - 조건부 클래스와 충돌 해결
// 사용 위치: components/ui (전체 UI 컴포넌트)
export function cn(...inputs: ClassValue[]) {
  // clsx로 조건부 클래스를 처리한 후 twMerge로 Tailwind 충돌 클래스 병합
  return twMerge(clsx(inputs));
}
