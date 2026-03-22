// 두 색상 간 선형 보간을 통해 그라데이션 색상 생성 - 경로에 부드러운 색상 전환 효과 적용
export const interpolateColor = (color1: string, color2: string, ratio: number = 0.5): string => {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  // 첫 번째 색상의 RGB 값 추출
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);

  // 두 번째 색상의 RGB 값 추출
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);

  // 비율에 따라 RGB 각 채널의 중간 값 계산
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  // 계산된 RGB를 다시 HEX 색상 코드로 변환하여 반환
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};
