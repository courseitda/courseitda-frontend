// 색상 팔레트 모드
export const COLOR_PALETTES = {
  vibrant: [
    // 첫 번째 줄 - 따뜻한 색상 (빨강 → 주황 → 노랑 → 초록)
    '#EF4444', // red
    '#F97316', // deep orange
    '#F59E0B', // orange
    '#84CC16', // lime
    '#22C55E', // green bright
    '#10B981', // green
    '#14B8A6', // teal
    // 두 번째 줄 - 차가운 색상 (청록 → 파랑 → 보라 → 분홍)
    '#06B6D4', // cyan
    '#3B82F6', // sky blue
    '#2563EB', // blue
    '#6E59A5', // purple
    '#8B5CF6', // violet
    '#D946EF', // fuchsia
  ],
  pastel: [
    // 파스텔 톤
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
    // 진한 색상
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
    // 부드러운 색상
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
    // 차분한 색상
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

export type PaletteMode = keyof typeof COLOR_PALETTES;

export const PALETTE_NAMES: Record<PaletteMode, string> = {
  vibrant: 'Vibrant',
  pastel: 'Pastel',
  deep: 'Deep',
  soft: 'Soft',
  muted: 'Muted',
};

export const getCategoryColors = (mode: PaletteMode = 'vibrant') => {
  return COLOR_PALETTES[mode];
};

export type CategoryColor = string;

export const getCategoryColor = (index: number, mode: PaletteMode = 'vibrant'): CategoryColor => {
  const colors = COLOR_PALETTES[mode];
  return colors[index % colors.length];
};
