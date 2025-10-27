import Dexie, { Table } from 'dexie';
import type { User, Workspace, Category, Place, CategoryPlace } from '@/entities/types';

// IndexedDB 데이터베이스 클래스 정의 - 브라우저에 로컬 데이터 저장
// 사용 위치: mock/edge-functions (auth, category, place, workspace), features (카테고리, 장소 조회)
export class CourseitdaDB extends Dexie {
  users!: Table<User, string>;
  workspaces!: Table<Workspace, string>;
  categories!: Table<Category, string>;
  places!: Table<Place, string>;
  categoryPlaces!: Table<CategoryPlace, string>;

  constructor() {
    super('CourseitdaDB');
    
    // 버전 1: 초기 스키마 (레거시)
    this.version(1).stores({
      users: 'id, email, nickname',
      workspaces: 'id, ownerId',
      categories: 'id, workspaceId, sortOrder',
      places: 'id, kakaoPlaceId',
      categoryPlaces: 'id, [categoryId+placeId], categoryId, placeId',
    });

    // 버전 2: 백엔드 도메인과 동기화 - 스키마 변경 및 필드명 수정
    this.version(2).stores({
      users: 'id, email, nickname', // 이메일, 닉네임으로 사용자 검색
      workspaces: 'id, identifier, ownerId', // UUID 식별자, 소유자별 워크스페이스 조회
      categories: 'id, workspaceId, sequence', // 워크스페이스별, 순서별 조회
      places: 'id, name, addressName', // 이름, 주소로 검색
      categoryPlaces: 'id, [categoryId+placeId], categoryId, placeId', // 복합 키로 중복 방지
    }).upgrade(async (tx) => {
      // 기존 데이터 마이그레이션 - 필드명 변경
      // Categories: sortOrder -> sequence
      await tx.table('categories').toCollection().modify((category: any) => {
        if ('sortOrder' in category) {
          category.sequence = category.sortOrder;
          delete category.sortOrder;
        }
        // Timestamp 필드 추가
        if (!category.createdAt) {
          category.createdAt = new Date().toISOString();
          category.updatedAt = new Date().toISOString();
        }
      });

      // Places: 필드명 변경 (lat -> latitude, lng -> longitude, address -> addressName 등)
      await tx.table('places').toCollection().modify((place: any) => {
        if ('lat' in place) {
          place.latitude = place.lat;
          delete place.lat;
        }
        if ('lng' in place) {
          place.longitude = place.lng;
          delete place.lng;
        }
        if ('address' in place) {
          place.addressName = place.address;
          delete place.address;
        }
        if ('roadAddress' in place) {
          place.roadAddressName = place.roadAddress;
          delete place.roadAddress;
        }
        if ('url' in place) {
          place.placeUrl = place.url;
          delete place.url;
        }
        // 불필요한 필드 제거
        if ('kakaoPlaceId' in place) {
          delete place.kakaoPlaceId;
        }
        if ('phone' in place) {
          delete place.phone;
        }
        // Timestamp 필드 추가
        if (!place.createdAt) {
          place.createdAt = new Date().toISOString();
          place.updatedAt = new Date().toISOString();
        }
      });

      // Workspaces: identifier 추가
      await tx.table('workspaces').toCollection().modify((workspace: any) => {
        if (!workspace.identifier) {
          workspace.identifier = crypto.randomUUID();
        }
      });

      // Users: Timestamp 추가
      await tx.table('users').toCollection().modify((user: any) => {
        if (!user.createdAt) {
          user.createdAt = new Date().toISOString();
          user.updatedAt = new Date().toISOString();
        }
      });

      // CategoryPlaces: Timestamp 추가
      await tx.table('categoryPlaces').toCollection().modify((cp: any) => {
        if (!cp.createdAt) {
          cp.createdAt = new Date().toISOString();
          cp.updatedAt = new Date().toISOString();
        }
      });
    });

    // 버전 3: 레거시 데이터 보정 - identifier 누락된 워크스페이스에 UUID 채움
    this.version(3).stores({
      users: 'id, email, nickname',
      workspaces: 'id, identifier, ownerId',
      categories: 'id, workspaceId, sequence',
      places: 'id, name, addressName',
      categoryPlaces: 'id, [categoryId+placeId], categoryId, placeId',
    }).upgrade(async (tx) => {
      // 워크스페이스의 identifier가 비어있는 레코드를 찾아 UUID로 채움
      let fixedCount = 0;
      await tx.table('workspaces').toCollection().modify((workspace: any) => {
        if (!workspace.identifier || typeof workspace.identifier !== 'string' || workspace.identifier.trim().length === 0) {
          workspace.identifier = crypto.randomUUID();
          fixedCount += 1;
        }
        // updatedAt 누락 시 최소한의 타임스탬프 보정
        if (!workspace.updatedAt) {
          workspace.updatedAt = workspace.createdAt || new Date().toISOString();
        }
      });
      // 보정 결과 로그 출력 (개발자 진단용)
      if (fixedCount > 0) {
        console.info(`[DB v3] Backfilled workspace.identifier for ${fixedCount} record(s).`);
      }
    });
  }
}

// 전역 데이터베이스 인스턴스 - 앱 전체에서 동일한 DB 접근
export const db = new CourseitdaDB();
