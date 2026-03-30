export type SharedSavedCategoryMock = {
  id: string;
  title: string;
  uploaderNickname: string;
  uploadedAt: string;
  isImmutableSnapshot: true;
  liked?: boolean;
  likeCount: number;
  placeCount: number;
  places: Array<{
    id: string;
    // UserRequest: 공유 카테고리 장소 목업에 위치/주소/URL 필드 포함
    name: string;
    placeUrl: string;
    roadAddressName: string;
    addressName: string;
    latitude: number;
    longitude: number;
  }>;
};

// 커뮤니티 공유 카테고리 목업 데이터 생성 함수 - MSW 응답에서 재사용
export const createSharedSavedCategoryMocks = (): SharedSavedCategoryMock[] => [
    {
        id: 'shared-1',
        title: '잠실 점심 식당',
        uploaderNickname: 'lucas',
        uploadedAt: new Date().toISOString(),
        isImmutableSnapshot: true,
        liked: false,
        likeCount: 12,
        placeCount: 3,
        places: [
            {
                id: 'p-1',
                name: '을지로 을지면옥',
                placeUrl: 'https://map.naver.com/p/entry/place/2001',
                roadAddressName: '서울 중구 을지로14길 29',
                addressName: '서울 중구 을지로 14길 29',
                latitude: 37.5665,
                longitude: 126.993,
            },
            {
                id: 'p-2',
                name: '윤씨밀방',
                placeUrl: 'https://map.naver.com/p/entry/place/2002',
                roadAddressName: '서울 마포구 와우산로 66',
                addressName: '서울 마포구 와우산로 66',
                latitude: 37.5542,
                longitude: 126.9223,
            },
            {
                id: 'p-3',
                name: '마포진짜원조최모리곰탕',
                placeUrl: 'https://map.naver.com/p/entry/place/2003',
                roadAddressName: '서울 마포구 만리재옛길 45',
                addressName: '서울 마포구 만리재옛길 45',
                latitude: 37.5499,
                longitude: 126.9522,
            },
        ],
    },
    {
        id: 'shared-2',
        title: '건대 카페',
        uploaderNickname: 'selena',
        uploadedAt: new Date().toISOString(),
        isImmutableSnapshot: true,
        liked: false,
        likeCount: 7,
        placeCount: 3,
        places: [
            {
                id: 'p-4',
                name: '어니언 한남',
                placeUrl: 'https://map.naver.com/p/entry/place/2004',
                roadAddressName: '서울 용산구 대사관로 35',
                addressName: '서울 용산구 대사관로 35',
                latitude: 37.5336,
                longitude: 127.004,
            },
            {
                id: 'p-5',
                name: '펠트 안국',
                placeUrl: 'https://map.naver.com/p/entry/place/2005',
                roadAddressName: '서울 종로구 윤보선길 29',
                addressName: '서울 종로구 윤보선길 29',
                latitude: 37.5766,
                longitude: 126.9847,
            },
            {
                id: 'p-6',
                name: '웨이브온 커피',
                placeUrl: 'https://map.naver.com/p/entry/place/2006',
                roadAddressName: '경기 성남시 분당구 불정로 76',
                addressName: '경기 성남시 분당구 불정로 76',
                latitude: 37.3695,
                longitude: 127.1086,
            },
        ],
    },
    {
        id: 'shared-3',
        title: '한강 산책 코스',
        uploaderNickname: 'hana',
        uploadedAt: new Date().toISOString(),
        isImmutableSnapshot: true,
        liked: false,
        likeCount: 18,
        placeCount: 3,
        places: [
            {
                id: 'p-7',
                name: '뚝섬 한강공원',
                placeUrl: 'https://map.naver.com/p/entry/place/2007',
                roadAddressName: '서울 광진구 강변북로 139',
                addressName: '서울 광진구 강변북로 139',
                latitude: 37.5297,
                longitude: 127.0714,
            },
            {
                id: 'p-8',
                name: '반포 한강공원',
                placeUrl: 'https://map.naver.com/p/entry/place/2008',
                roadAddressName: '서울 서초구 신반포로11길 40',
                addressName: '서울 서초구 신반포로11길 40',
                latitude: 37.5111,
                longitude: 126.9944,
            },
            {
                id: 'p-9',
                name: '이촌 한강공원',
                placeUrl: 'https://map.naver.com/p/entry/place/2009',
                roadAddressName: '서울 용산구 이촌동 302-14',
                addressName: '서울 용산구 이촌동 302-14',
                latitude: 37.5229,
                longitude: 126.9684,
            },
        ],
    },
    // UserRequest: 커뮤니티 공유 카테고리 목업 데이터 3개 추가
    {
        id: 'shared-4',
        title: '홍대 감성 카페',
        uploaderNickname: 'mori',
        uploadedAt: new Date().toISOString(),
        isImmutableSnapshot: true,
        liked: false,
        likeCount: 31,
        placeCount: 6,
        places: [
            {
                id: 'p-10',
                name: '카페 레이어드',
                placeUrl: 'https://map.naver.com/p/entry/place/2010',
                roadAddressName: '서울 마포구 성미산로 161',
                addressName: '서울 마포구 성미산로 161',
                latitude: 37.5565,
                longitude: 126.9212,
            },
            {
                id: 'p-11',
                name: '테일러 커피',
                placeUrl: 'https://map.naver.com/p/entry/place/2011',
                roadAddressName: '서울 마포구 어울마당로 87',
                addressName: '서울 마포구 어울마당로 87',
                latitude: 37.5531,
                longitude: 126.9221,
            },
            {
                id: 'p-12',
                name: '프릳츠 상수',
                placeUrl: 'https://map.naver.com/p/entry/place/2012',
                roadAddressName: '서울 마포구 독막로 19',
                addressName: '서울 마포구 독막로 19',
                latitude: 37.5475,
                longitude: 126.9229,
            },
        ],
    },
    {
        id: 'shared-5',
        title: '부산 바다 코스',
        uploaderNickname: 'jun',
        uploadedAt: new Date().toISOString(),
        isImmutableSnapshot: true,
        liked: false,
        likeCount: 22,
        placeCount: 4,
        places: [
            {
                id: 'p-13',
                name: '광안리 해수욕장',
                placeUrl: 'https://map.naver.com/p/entry/place/2013',
                roadAddressName: '부산 수영구 광안해변로 219',
                addressName: '부산 수영구 광안해변로 219',
                latitude: 35.1532,
                longitude: 129.1185,
            },
            {
                id: 'p-14',
                name: '송정 해수욕장',
                placeUrl: 'https://map.naver.com/p/entry/place/2014',
                roadAddressName: '부산 해운대구 송정해변로 62',
                addressName: '부산 해운대구 송정해변로 62',
                latitude: 35.1786,
                longitude: 129.1999,
            },
            {
                id: 'p-15',
                name: '해운대 해수욕장',
                placeUrl: 'https://map.naver.com/p/entry/place/2015',
                roadAddressName: '부산 해운대구 해운대해변로 264',
                addressName: '부산 해운대구 해운대해변로 264',
                latitude: 35.1587,
                longitude: 129.1604,
            },
        ],
    },
    {
        id: 'shared-6',
        title: '을지로 저녁 맛집',
        uploaderNickname: 'mina',
        uploadedAt: new Date().toISOString(),
        isImmutableSnapshot: true,
        liked: false,
        likeCount: 15,
        placeCount: 7,
        places: [
            {
                id: 'p-16',
                name: '창화당',
                placeUrl: 'https://map.naver.com/p/entry/place/2016',
                roadAddressName: '서울 중구 수표로 24',
                addressName: '서울 중구 수표로 24',
                latitude: 37.5663,
                longitude: 126.9897,
            },
            {
                id: 'p-17',
                name: '우래옥',
                placeUrl: 'https://map.naver.com/p/entry/place/2017',
                roadAddressName: '서울 중구 창경궁로 62-29',
                addressName: '서울 중구 창경궁로 62-29',
                latitude: 37.5682,
                longitude: 126.9965,
            },
            {
                id: 'p-18',
                name: '을지다락',
                placeUrl: 'https://map.naver.com/p/entry/place/2018',
                roadAddressName: '서울 중구 수표로 42-19',
                addressName: '서울 중구 수표로 42-19',
                latitude: 37.566,
                longitude: 126.9888,
            },
        ],
    },
];
