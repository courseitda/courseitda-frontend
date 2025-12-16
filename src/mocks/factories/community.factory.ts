export type SharedSavedCategoryMock = {
  id: string;
  title: string;
  uploaderNickname: string;
  uploadedAt: string;
  placeCount: number;
  places: Array<{
    id: string;
    name: string;
    addressName: string;
  }>;
};

// 커뮤니티 공유 카테고리 목업 데이터 생성 함수 - MSW 응답에서 재사용
export const createSharedSavedCategoryMocks = (): SharedSavedCategoryMock[] => [
  {
    id: 'shared-1',
    title: '잠실 점심 식당',
    uploaderNickname: 'lucas',
    uploadedAt: new Date().toISOString(),
    placeCount: 8,
    places: [
      { id: 'p-1', name: '을지로 을지면옥', addressName: '서울 중구 을지로 14길 29' },
      { id: 'p-2', name: '윤씨밀방', addressName: '서울 마포구 와우산로 66' },
      { id: 'p-3', name: '마포진짜원조최모리곰탕', addressName: '서울 마포구 만리재옛길 45' },
    ],
  },
  {
    id: 'shared-2',
    title: '건대 카페',
    uploaderNickname: 'selena',
    uploadedAt: new Date().toISOString(),
    placeCount: 12,
    places: [
      { id: 'p-4', name: '어니언 한남', addressName: '서울 용산구 대사관로 35' },
      { id: 'p-5', name: '펠트 안국', addressName: '서울 종로구 윤보선길 29' },
      { id: 'p-6', name: '웨이브온 커피', addressName: '경기 성남시 분당구 불정로 76' },
    ],
  },
  {
    id: 'shared-3',
    title: '한강 산책 코스',
    uploaderNickname: 'hana',
    uploadedAt: new Date().toISOString(),
    placeCount: 5,
    places: [
      { id: 'p-7', name: '뚝섬 한강공원', addressName: '서울 광진구 강변북로 139' },
      { id: 'p-8', name: '반포 한강공원', addressName: '서울 서초구 신반포로11길 40' },
      { id: 'p-9', name: '이촌 한강공원', addressName: '서울 용산구 이촌동 302-14' },
    ],
  },
];

