# Database Documentation

This document describes the database schema and principles for 코스잇다 (Courseitda).

## Critical Principle

**THE DATABASE LAYER MUST ONLY PERFORM ATOMIC CRUD OPERATIONS**

- ❌ NO sorting logic in DB
- ❌ NO validation in DB
- ❌ NO complex queries with joins
- ❌ NO business logic in DB
- ✅ ONLY simple CRUD: get, add, update, delete, bulkGet

All business logic MUST be in Edge Functions.

## Technology

- **IndexedDB** via Dexie.js
- **Local storage** for authentication tokens and settings

## Schema

### users

```typescript
{
  id: string (primary key)
  email: string (indexed)
  password: string (hashed)
  nickname: string
  createdAt: string (ISO timestamp)
}
```

### workspaces

```typescript
{
  id: string (primary key)
  ownerId: string (indexed, foreign key to users)
  title: string
  headcount: number
  date: string (ISO date)
  createdAt: string (ISO timestamp)
  updatedAt: string (ISO timestamp)
}
```

### categories

```typescript
{
  id: string (primary key)
  workspaceId: string (indexed, foreign key to workspaces)
  name: string
  color: string (hex color)
  sortOrder: number (indexed, for ordering)
  representativePlaceId?: string | null (foreign key to places)
  createdAt: string (ISO timestamp)
  updatedAt: string (ISO timestamp)
}
```

### places

```typescript
{
  id: string (primary key)
  kakaoPlaceId: string (indexed, Kakao Maps ID)
  name: string
  address: string
  roadAddress: string
  lat: number
  lng: number
  phone?: string
  url?: string
  createdAt: string (ISO timestamp)
}
```

### categoryPlaces

Many-to-many relationship between categories and places.

```typescript
{
  id: string (primary key)
  placeId: string (compound indexed with categoryId)
  categoryId: string (compound indexed with placeId)
  createdAt: string (ISO timestamp)
}
```

## Indexes

```typescript
users: 'id, email'
workspaces: 'id, ownerId'
categories: 'id, workspaceId, sortOrder'
places: 'id, kakaoPlaceId'
categoryPlaces: 'id, [categoryId+placeId], categoryId, placeId'
```

## Good vs Bad Examples

### ❌ BAD: Business Logic in DB

```typescript
// DON'T DO THIS
async function getCategoriesSorted(workspaceId: string) {
  return await db.categories
    .where('workspaceId')
    .equals(workspaceId)
    .sortBy('sortOrder'); // ❌ Sorting in DB
}

// DON'T DO THIS
async function addCategoryWithValidation(name: string, workspaceId: string) {
  if (!name.trim()) { // ❌ Validation in DB layer
    throw new Error('Name required');
  }
  
  const count = await db.categories
    .where('workspaceId')
    .equals(workspaceId)
    .count(); // ❌ Complex calculation in DB
    
  await db.categories.add({
    // ...
    sortOrder: count, // ❌ Business logic in DB
  });
}
```

### ✅ GOOD: Atomic Operations Only

```typescript
// DB layer - ONLY atomic operations
async function getAllCategories(workspaceId: string) {
  return await db.categories
    .where('workspaceId')
    .equals(workspaceId)
    .toArray(); // ✅ Simple retrieval
}

// Edge Function - Business logic here
async function addCategory(input: { workspaceId: string; name: string }) {
  // ✅ Validation in Edge Function
  if (!input.name || input.name.trim().length === 0) {
    return { error: 'Name required' };
  }

  // ✅ Calculation in Edge Function
  const existing = await db.categories
    .where('workspaceId')
    .equals(input.workspaceId)
    .toArray();
  
  const sortOrder = existing.length;
  const color = getCategoryColor(sortOrder); // ✅ Business logic

  // ✅ Simple DB insert
  const category: Category = {
    id: crypto.randomUUID(),
    workspaceId: input.workspaceId,
    name: input.name.trim(),
    color,
    sortOrder,
    // ...
  };

  await db.categories.add(category);
  
  return { category };
}
```

## LocalStorage

Used for:
- Authentication token: `courseitda_token`
- User data: `courseitda_user`
- Kakao REST API key: `courseitda_kakao_rest_key`
- Kakao JS API key: `courseitda_kakao_js_key`

## Migration Strategy

When moving to a real backend (Supabase):

1. Replace Dexie calls with Supabase client
2. Edge Functions remain the same (business logic unchanged)
3. RLS policies handle authorization
4. Database triggers replace client-side cascade deletes

The separation of DB and business logic makes this migration straightforward.
