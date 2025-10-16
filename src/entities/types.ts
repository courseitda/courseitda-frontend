// 도메인 엔티티 타입 정의 파일
// 사용 위치: 전체 애플리케이션 (stores, edge-functions, pages, features)

// 사용자 타입 - 회원가입 및 로그인 정보를 저장
export type User = {
  id: string;
  nickname: string;
  email: string;
  password: string; // hashed (mock) - 실제 운영에서는 bcrypt 등 사용
  createdAt: string;
};

// 워크스페이스 타입 - 여행 계획이나 코스 단위의 최상위 컨테이너
export type Workspace = {
  id: string;
  ownerId: string; // 워크스페이스를 생성한 사용자 ID
  title: string; // 워크스페이스 제목 (예: "홍대 데이트 코스")
  headcount?: number; // 인원수 (선택 사항)
  date?: string; // 예정 날짜 (선택 사항)
  createdAt: string;
  updatedAt: string;
};

// 카테고리 타입 - 워크스페이스 내에서 장소들을 그룹화하는 단위
export type Category = {
  id: string;
  workspaceId: string; // 소속된 워크스페이스 ID
  name: string; // 카테고리 이름 (예: "점심", "카페")
  color: string; // 카테고리 색상 (지도 마커 및 UI 구분용)
  sortOrder: number; // 카테고리 표시 순서 (드래그앤드롭으로 변경 가능)
  representativePlaceId?: string | null; // 대표 장소 ID (경로 생성에 사용)
  createdAt: string;
  updatedAt: string;
};

// 장소 타입 - Kakao API로 검색한 실제 장소 정보
export type Place = {
  id: string;
  kakaoPlaceId: string; // Kakao API의 장소 고유 ID
  name: string; // 장소 이름
  address: string; // 지번 주소
  roadAddress: string; // 도로명 주소
  lat: number; // 위도
  lng: number; // 경도
  phone?: string; // 전화번호 (선택 사항)
  url?: string; // Kakao 장소 상세 URL (선택 사항)
  createdAt: string;
};

// 카테고리-장소 연결 타입 - 다대다 관계를 위한 중간 테이블
export type CategoryPlace = {
  id: string;
  placeId: string; // 연결된 장소 ID
  categoryId: string; // 연결된 카테고리 ID
  createdAt: string;
};

// Kakao Local API 응답 타입 정의
// Kakao API 장소 검색 결과의 개별 장소 정보
export type KakaoPlace = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  x: string; // longitude (경도)
  y: string; // latitude (위도)
};

// Kakao API 장소 검색 응답 전체 구조
export type KakaoSearchResponse = {
  documents: KakaoPlace[]; // 검색 결과 장소 목록
  meta: {
    total_count: number; // 전체 검색 결과 수
    pageable_count: number; // 페이징 가능한 결과 수
    is_end: boolean; // 마지막 페이지 여부
  };
};
