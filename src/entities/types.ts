// 도메인 엔티티 타입 정의 파일
// 사용 위치: 전체 애플리케이션 (stores, edge-functions, pages, features)

// 사용자 타입 - 회원가입 및 로그인 정보를 저장
// 백엔드 Member 엔티티와 매핑
export type User = {
  id: string; // Long -> string (JSON 직렬화)
  nickname: string; // 2-20자
  email: string; // 이메일 형식
  password: string; // hashed (mock) - 실제 운영에서는 bcrypt 등 사용
  createdAt: string; // Timestamp
  updatedAt: string; // Timestamp
};

// 워크스페이스 타입 - 여행 계획이나 코스 단위의 최상위 컨테이너
// 백엔드 Workspace 엔티티와 매핑
export type Workspace = {
  id: string; // Long -> string (JSON 직렬화)
  identifier: string; // UUID - 워크스페이스 고유 식별자
  ownerId: string; // 워크스페이스를 생성한 사용자 ID (Member FK)
  title: string; // 워크스페이스 제목 (예: "홍대 데이트 코스") - 최대 20자
  createdAt: string; // Timestamp
  updatedAt: string; // Timestamp
};

// 카테고리 타입 - 워크스페이스 내에서 장소들을 그룹화하는 단위
// 백엔드 Category 엔티티와 매핑
export type Category = {
  id: string; // Long -> string (JSON 직렬화)
  workspaceId: string; // 소속된 워크스페이스 ID (Workspace FK)
  name: string; // 카테고리 이름 (예: "점심", "카페") - 최대 10자
  color: string; // 카테고리 색상 (#RRGGBB 형식) - 지도 마커 및 UI 구분용
  sequence: number; // 카테고리 표시 순서 (드래그앤드롭으로 변경 가능)
  representativePlaceId?: string | null; // 대표 장소 ID (경로 생성에 사용) - CategoryPlace 참조
  createdAt: string; // Timestamp
  updatedAt: string; // Timestamp
};

// 장소 타입 - Kakao API로 검색한 실제 장소 정보
// 백엔드 Place 엔티티와 매핑
export type Place = {
  id: string; // Long -> string (JSON 직렬화)
  name: string; // 장소 이름
  addressName: string; // 지번 주소
  roadAddressName: string | null; // 도로명 주소 (nullable)
  latitude: number; // 위도 (-90 ~ 90)
  longitude: number; // 경도 (-180 ~ 180)
  placeUrl: string | null; // Kakao 장소 상세 URL (nullable)
  createdAt: string; // Timestamp
  updatedAt: string; // Timestamp
};

// 카테고리-장소 연결 타입 - 다대다 관계를 위한 중간 테이블
// 백엔드 CategoryPlace 엔티티와 매핑
export type CategoryPlace = {
  id: string; // Long -> string (JSON 직렬화)
  categoryId: string; // 연결된 카테고리 ID (Category FK)
  placeId: string; // 연결된 장소 ID (Place FK)
  createdAt: string; // Timestamp
  updatedAt: string; // Timestamp
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
