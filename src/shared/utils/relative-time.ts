// 날짜 차이를 한국어 상대시간으로 변환하는 유틸리티
export const formatRelativeTimeKorean = (dateInput: string | Date): string => {
  const targetDate = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const targetTime = targetDate.getTime();

  // 유효하지 않은 날짜가 들어오면 안전하게 기본 문구를 반환
  if (Number.isNaN(targetTime)) {
    return '-';
  }

  const now = Date.now();
  const diffMs = now - targetTime;
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 60) return '방금 전';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
};

