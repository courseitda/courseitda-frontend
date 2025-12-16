export type SavedCategoryMock = {
  id: string;
  title: string;
  color: string;
  modifiedAt: string;
  placeCount: number;
  places: Array<{
    id: string;
    name: string;
    addressName: string;
  }>;
};

// 내 보관함(보관 카테고리) 목업 데이터 생성 함수 - MSW 응답에서 재사용
export const createSavedCategoryMocks = (): SavedCategoryMock[] => [
  {
    id: 'cat-1',
    title: '점심 맛집',
    color: '#4F46E5',
    modifiedAt: new Date().toISOString(),
    placeCount: 12,
    places: [
      { id: 'p-1', name: '봉추찜닭 강남점', addressName: '서울시 강남구 테헤란로 123' },
      { id: 'p-2', name: '멘야하나비', addressName: '서울시 강남구 역삼로 45' },
    ],
  },
  {
    id: 'cat-2',
    title: '카페 탐방',
    color: '#10B981',
    modifiedAt: new Date().toISOString(),
    placeCount: 8,
    places: [
      { id: 'p-3', name: '어니언 안국', addressName: '서울시 종로구 율곡로 83' },
      { id: 'p-4', name: '펠트 한남', addressName: '서울시 용산구 대사관로 35' },
    ],
  },
  {
    id: 'cat-3',
    title: '산책 코스',
    color: '#F59E0B',
    modifiedAt: new Date().toISOString(),
    placeCount: 5,
    places: [
      { id: 'p-5', name: '서울숲', addressName: '서울시 성동구 뚝섬로 273' },
      { id: 'p-6', name: '반포 한강공원', addressName: '서울시 서초구 신반포로 11길 40' },
    ],
  },
];

