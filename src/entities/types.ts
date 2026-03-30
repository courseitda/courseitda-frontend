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

// 장소 타입 - 백엔드 Place 엔티티와 매핑
export type Place = {
  id: string; // Long -> string (JSON 직렬화)
  name: string; // 장소 이름
  addressName: string; // 지번 주소
  roadAddressName: string | null; // 도로명 주소 (nullable)
  latitude: number; // 위도 (-90 ~ 90)
  longitude: number; // 경도 (-180 ~ 180)
  placeUrl: string; // 장소 상세 URL
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

// 장소 검색 API 응답 타입 - 백엔드 SearchedPlace DTO와 매핑
export type SearchedPlace = {
  id: string; // 프론트엔드에서 생성하는 임시 식별자
  name: string;
  addressName: string;
  roadAddressName: string | null;
  latitude: number;
  longitude: number;
  placeUrl: string; // 검색 결과에서 제공되는 장소 상세 URL
};

// 보관 카테고리 장소 타입 - 내 보관함에 저장된 카테고리의 장소
// 백엔드 SavedCategoryPlace(또는 유사 DTO)와 매핑
export type SavedCategoryPlace = {
  id: string; // Long -> string (JSON 직렬화)
  // UserRequest: 보관 카테고리 장소에 위치/주소/URL 필드 포함
  name: string; // 장소 이름
  placeUrl: string; // 장소 상세 URL
  roadAddressName: string; // 도로명 주소
  addressName: string; // 지번 주소
  latitude: number; // 위도
  longitude: number; // 경도
};

// 보관 카테고리 타입 - 내 보관함에서 조회하는 카테고리
// 백엔드 SavedCategory 엔티티와 매핑
export type SavedCategory = {
  id: string; // Long -> string (JSON 직렬화)
  title: string; // 카테고리 제목(이름)
  updatedAt: string; // 수정일시 (ISO 8601)
  placeCount: number; // 포함된 장소 수
  places: SavedCategoryPlace[]; // 상세 표시용 장소 목록(간략)
};

// 공유 카테고리 장소 타입 - 커뮤니티에 공유된 카테고리의 장소
// 백엔드 SharedSavedCategoryPlace(또는 유사 DTO)와 매핑
export type SharedSavedCategoryPlace = {
  id: string; // Long -> string (JSON 직렬화)
  // UserRequest: 공유 카테고리 장소에 위치/주소/URL 필드 포함
  name: string; // 장소 이름
  placeUrl: string; // 장소 상세 URL
  roadAddressName: string; // 도로명 주소
  addressName: string; // 지번 주소
  latitude: number; // 위도
  longitude: number; // 경도
};

// 공유 카테고리 타입 - 커뮤니티에서 조회하는 공유 카테고리
// 백엔드 SharedSavedCategory 엔티티와 매핑
export type SharedSavedCategory = {
  id: string; // Long -> string (JSON 직렬화)
  title: string; // 공유 카테고리 제목
  uploader: string; // 업로더 닉네임
  uploadedAt: string; // 업로드 일시 (ISO 8601)
  isImmutableSnapshot: true; // 공유 카테고리는 publish 시점의 스냅샷으로 취급
  isDeleted?: boolean; // 원본 공유 카테고리 삭제 여부
  liked?: boolean; // 현재 로그인한 사용자의 찜 여부
  likeCount?: number; // 공유 컬렉션 찜 수
  placeCount: number; // 포함된 장소 수
  places: SharedSavedCategoryPlace[]; // 상세 표시용 장소 목록(간략)
};

// 내 공유 카테고리 타입 - 어떤 보관 카테고리에서 publish 되었는지 출처를 함께 보존
export type MySharedCategory = SharedSavedCategory & {
  publishedFromSavedCategoryId: string;
};
