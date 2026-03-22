export type SavedCategoryMock = {
    id: string;
    title: string;
    modifiedAt: string;
    placeCount: number;
    places: Array<{
        id: string;
        // UserRequest: 보관 카테고리 장소 목업에 위치/주소/URL 필드 포함
        name: string;
        placeUrl: string;
        roadAddressName: string;
        addressName: string;
        latitude: number;
        longitude: number;
    }>;
};

// UserRequest: 보관 카테고리 color 필드 제거 적용 범위 — src/mocks/factories/my-storage.factory.ts, src/services/api/my-storage.service.ts, src/shared/hooks/use-my-storage.ts, src/entities/types.ts
// 내 보관함(보관 카테고리) 목업 데이터 생성 함수 - MSW 응답에서 재사용
export const createSavedCategoryMocks = (): SavedCategoryMock[] => [
    {
        id: 'cat-1',
        title: '점심 맛집',
        modifiedAt: new Date().toISOString(),
        placeCount: 2,
        places: [
            {
                id: 'p-1',
                name: '봉추찜닭 강남점',
                placeUrl: 'https://map.naver.com/p/entry/place/1001',
                roadAddressName: '서울 강남구 테헤란로 123',
                addressName: '서울시 강남구 테헤란로 123',
                latitude: 37.5001,
                longitude: 127.0362,
            },
            {
                id: 'p-2',
                name: '멘야하나비',
                placeUrl: 'https://map.naver.com/p/entry/place/1002',
                roadAddressName: '서울 강남구 역삼로 45',
                addressName: '서울시 강남구 역삼로 45',
                latitude: 37.4992,
                longitude: 127.0369,
            },
        ],
    },
    {
        id: 'cat-2',
        title: '카페 탐방',
        modifiedAt: new Date().toISOString(),
        placeCount: 2,
        places: [
            {
                id: 'p-3',
                name: '어니언 안국',
                placeUrl: 'https://map.naver.com/p/entry/place/1003',
                roadAddressName: '서울 종로구 율곡로 83',
                addressName: '서울시 종로구 율곡로 83',
                latitude: 37.5776,
                longitude: 126.9866,
            },
            {
                id: 'p-4',
                name: '펠트 한남',
                placeUrl: 'https://map.naver.com/p/entry/place/1004',
                roadAddressName: '서울 용산구 대사관로 35',
                addressName: '서울시 용산구 대사관로 35',
                latitude: 37.5343,
                longitude: 126.9996,
            },
        ],
    },
];
