import { UI_COPY } from '@/shared/constants/ui-copy';

// 날짜 차이를 한국어 상대시간으로 변환하는 유틸리티
export const formatRelativeTimeKorean = (dateInput: string | Date): string => {
  const targetDate = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const targetTime = targetDate.getTime();

  // 유효하지 않은 날짜가 들어오면 안전하게 기본 문구를 반환
  if (Number.isNaN(targetTime)) {
    return UI_COPY.relativeTime.invalid;
  }

  const now = Date.now();
  const diffMs = now - targetTime;
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 60) return UI_COPY.relativeTime.justNow;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return UI_COPY.relativeTime.minutesAgo(diffMinutes);

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return UI_COPY.relativeTime.hoursAgo(diffHours);

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return UI_COPY.relativeTime.daysAgo(diffDays);
  if (diffDays < 30) return UI_COPY.relativeTime.weeksAgo(Math.floor(diffDays / 7));
  if (diffDays < 365) return UI_COPY.relativeTime.monthsAgo(Math.floor(diffDays / 30));
  return UI_COPY.relativeTime.yearsAgo(Math.floor(diffDays / 365));
};
