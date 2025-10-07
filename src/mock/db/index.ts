import Dexie, { Table } from 'dexie';
import type { User, Workspace, Category, Place, CategoryPlace } from '@/entities/types';

export class CourseitdaDB extends Dexie {
  users!: Table<User, string>;
  workspaces!: Table<Workspace, string>;
  categories!: Table<Category, string>;
  places!: Table<Place, string>;
  categoryPlaces!: Table<CategoryPlace, string>;

  constructor() {
    super('CourseitdaDB');
    
    this.version(1).stores({
      users: 'id, email',
      workspaces: 'id, ownerId',
      categories: 'id, workspaceId, sortOrder',
      places: 'id, kakaoPlaceId',
      categoryPlaces: 'id, [categoryId+placeId], categoryId, placeId',
    });
  }
}

export const db = new CourseitdaDB();
