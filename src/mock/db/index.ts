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
    
    // 데이터베이스 스키마 정의 - 테이블별 인덱스 설정으로 쿼리 성능 최적화
    this.version(1).stores({
      users: 'id, email', // 이메일로 사용자 검색
      workspaces: 'id, ownerId', // 소유자별 워크스페이스 조회
      categories: 'id, workspaceId, sortOrder', // 워크스페이스별, 순서별 조회
      places: 'id, kakaoPlaceId', // Kakao 장소 ID로 중복 검사
      categoryPlaces: 'id, [categoryId+placeId], categoryId, placeId', // 복합 키로 중복 방지
    });
  }
}

// 전역 데이터베이스 인스턴스 - 앱 전체에서 동일한 DB 접근
export const db = new CourseitdaDB();
