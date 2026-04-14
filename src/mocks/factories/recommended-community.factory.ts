export type RecommendedCategoryMock = {
  id: string;
  imageUrl: string;
  sharedCategoryId: string;
  name: string;
  authorNickname: string;
  createdAt: string;
  placeCount: number;
  likeCount: number;
};

// UserRequest: 추천 카테고리 목업 데이터를 추천 API 계약에 맞춰 별도 파일로 분리
export const createRecommendedSharedCategoryMocks = (): RecommendedCategoryMock[] => [
  {
    id: '1',
    imageUrl: 'https://courseitda-bucket.s3.ap-northeast-2.amazonaws.com/recommended/hongdae.jpg',
    sharedCategoryId: 'shared-4',
    name: '홍대 감성 카페',
    authorNickname: 'mori',
    createdAt: new Date().toISOString(),
    placeCount: 6,
    likeCount: 31,
  },
  {
    id: '2',
    imageUrl: 'https://courseitda-bucket.s3.ap-northeast-2.amazonaws.com/recommended/busan.jpg',
    sharedCategoryId: 'shared-5',
    name: '부산 바다 코스',
    authorNickname: 'jun',
    createdAt: new Date().toISOString(),
    placeCount: 4,
    likeCount: 22,
  },
  {
    id: '3',
    imageUrl: '',
    sharedCategoryId: 'shared-6',
    name: '을지로 저녁 맛집',
    authorNickname: 'mina',
    createdAt: new Date().toISOString(),
    placeCount: 7,
    likeCount: 15,
  },
];
