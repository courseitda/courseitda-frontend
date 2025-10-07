export const CATEGORY_COLORS = [
  // 첫 번째 줄 - 따뜻한 색상 (빨강 → 주황 → 노랑 → 초록)
  '#EF4444', // red
  '#F43F5E', // rose
  '#F97316', // deep orange
  '#F59E0B', // orange
  '#FBBF24', // amber
  '#84CC16', // lime
  '#22C55E', // green bright
  '#10B981', // green
  '#14B8A6', // teal
  // 두 번째 줄 - 차가운 색상 (청록 → 파랑 → 보라 → 분홍)
  '#06B6D4', // cyan
  '#0EA5E9', // light blue
  '#3B82F6', // sky blue
  '#2563EB', // blue
  '#6E59A5', // purple
  '#8B5CF6', // violet
  '#A855F7', // purple bright
  '#D946EF', // fuchsia
  '#EC4899', // pink
] as const;

export type CategoryColor = typeof CATEGORY_COLORS[number];

export const getCategoryColor = (index: number): CategoryColor => {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
};
