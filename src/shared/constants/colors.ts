// UserRequest: 카테고리 색상을 18개에서 14개로 축소 후 13개로 조정하여 7x2 그리드 배치
// UserRequest: 7개씩 2줄로 일정한 간격, 중앙 정렬하여 시각적 균형 유지
// UserRequest: 마지막 칸을 색상 팔레트 모드 전환 버튼으로 활용하여 다양한 색상 조합 제공
// UserRequest: 5가지 색상 팔레트 모드 제공 (Vibrant, Pastel, Deep, Soft, Muted)
// UserRequest: 팔레트 이름을 영어로 표기하여 국제화 대응
// UserRequest: 다이얼로그를 열 때마다 기본(Vibrant) 모드로 초기화하여 일관성 유지

// 카테고리 색상 팔레트 상수 정의 - 5가지 모드로 다양한 색상 조합 제공
// 사용 위치: features/categories (add-category-dialog, edit-category-dialog), shared/stores/settings-store
export const COLOR_PALETTES = {
  vibrant: [
    // 첫 번째 줄 - 따뜻한 색상 (빨강 → 주황 → 노랑 → 초록) - 생동감 있는 색상
    '#EF4444', // red
    '#F97316', // deep orange
    '#F59E0B', // orange
    '#84CC16', // lime
    '#22C55E', // green bright
    '#10B981', // green
    '#14B8A6', // teal
    // 두 번째 줄 - 차가운 색상 (청록 → 파랑 → 보라 → 분홍) - 시원하고 차분한 색상
    '#06B6D4', // cyan
    '#3B82F6', // sky blue
    '#2563EB', // blue
    '#6E59A5', // purple
    '#8B5CF6', // violet
    '#D946EF', // fuchsia
  ],
  pastel: [
    // 파스텔 톤 - 부드럽고 밝은 색상으로 편안한 느낌 제공
    '#FCA5A5', // pastel red
    '#FDBA74', // pastel orange
    '#FCD34D', // pastel yellow
    '#BEF264', // pastel lime
    '#86EFAC', // pastel green
    '#6EE7B7', // pastel emerald
    '#5EEAD4', // pastel teal
    '#7DD3FC', // pastel cyan
    '#93C5FD', // pastel blue
    '#A5B4FC', // pastel indigo
    '#C4B5FD', // pastel purple
    '#D8B4FE', // pastel violet
    '#F0ABFC', // pastel fuchsia
  ],
  deep: [
    // 진한 색상 - 깊고 강렬한 색상으로 선명한 대비 효과
    '#B91C1C', // deep red
    '#C2410C', // deep orange
    '#B45309', // deep amber
    '#65A30D', // deep lime
    '#16A34A', // deep green
    '#059669', // deep emerald
    '#0F766E', // deep teal
    '#0E7490', // deep cyan
    '#0369A1', // deep sky
    '#1D4ED8', // deep blue
    '#4C1D95', // deep purple
    '#6B21A8', // deep violet
    '#A21CAF', // deep fuchsia
  ],
  soft: [
    // 부드러운 색상 - 중간 톤으로 눈에 편안하고 세련된 느낌
    '#FB7185', // soft rose
    '#FB923C', // soft orange
    '#FBBF24', // soft amber
    '#A3E635', // soft lime
    '#4ADE80', // soft green
    '#34D399', // soft emerald
    '#2DD4BF', // soft teal
    '#22D3EE', // soft cyan
    '#38BDF8', // soft sky
    '#60A5FA', // soft blue
    '#818CF8', // soft indigo
    '#A78BFA', // soft purple
    '#E879F9', // soft fuchsia
  ],
  muted: [
    // 차분한 색상 - vibrant보다 약간 어두운 톤으로 침착한 분위기
    '#DC2626', // muted red
    '#EA580C', // muted orange
    '#D97706', // muted amber
    '#84CC16', // muted lime
    '#16A34A', // muted green
    '#10B981', // muted emerald
    '#14B8A6', // muted teal
    '#0891B2', // muted cyan
    '#0284C7', // muted sky
    '#2563EB', // muted blue
    '#7C3AED', // muted purple
    '#9333EA', // muted violet
    '#C026D3', // muted fuchsia
  ],
} as const;

// 팔레트 모드 타입 정의
export type PaletteMode = keyof typeof COLOR_PALETTES;

// 팔레트 모드별 표시 이름 - UI에 표시할 영문명
export const PALETTE_NAMES: Record<PaletteMode, string> = {
  vibrant: 'Vibrant',
  pastel: 'Pastel',
  deep: 'Deep',
  soft: 'Soft',
  muted: 'Muted',
};

// 선택한 모드의 전체 색상 배열 반환
export const getCategoryColors = (mode: PaletteMode = 'vibrant'): readonly string[] => {
  return COLOR_PALETTES[mode];
};

export type CategoryColor = string;

// 인덱스를 기반으로 색상 반환 - 인덱스가 배열 크기를 초과하면 순환하여 색상 할당
export const getCategoryColor = (index: number, mode: PaletteMode = 'vibrant'): CategoryColor => {
  const colors = COLOR_PALETTES[mode];
  return colors[index % colors.length];
};
