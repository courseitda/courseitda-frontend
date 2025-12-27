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
  // UserRequest: 커뮤니티 공유 카테고리 목업 데이터 3개 추가
  {
    id: 'shared-4',
    title: '홍대 감성 카페',
    uploaderNickname: 'mori',
    uploadedAt: new Date().toISOString(),
    placeCount: 6,
    places: [
      { id: 'p-10', name: '카페 레이어드', addressName: '서울 마포구 성미산로 161' },
      { id: 'p-11', name: '테일러 커피', addressName: '서울 마포구 어울마당로 87' },
      { id: 'p-12', name: '프릳츠 상수', addressName: '서울 마포구 독막로 19' },
    ],
  },
  {
    id: 'shared-5',
    title: '부산 바다 코스',
    uploaderNickname: 'jun',
    uploadedAt: new Date().toISOString(),
    placeCount: 4,
    places: [
      { id: 'p-13', name: '광안리 해수욕장', addressName: '부산 수영구 광안해변로 219' },
      { id: 'p-14', name: '송정 해수욕장', addressName: '부산 해운대구 송정해변로 62' },
      { id: 'p-15', name: '해운대 해수욕장', addressName: '부산 해운대구 해운대해변로 264' },
    ],
  },
  {
    id: 'shared-6',
    title: '을지로 저녁 맛집',
    uploaderNickname: 'mina',
    uploadedAt: new Date().toISOString(),
    placeCount: 7,
    places: [
      { id: 'p-16', name: '창화당', addressName: '서울 중구 수표로 24' },
      { id: 'p-17', name: '우래옥', addressName: '서울 중구 창경궁로 62-29' },
      { id: 'p-18', name: '을지다락', addressName: '서울 중구 수표로 42-19' },
    ],
  },
];
