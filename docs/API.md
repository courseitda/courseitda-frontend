# Edge Functions API Documentation

This document describes the mock Edge Functions API for 코스잇다 (Courseitda).

## Principles

- **All business logic MUST be in Edge Functions**
- **Database layer MUST only perform atomic CRUD operations**
- **No sorting, validation, or complex logic in the DB layer**

## Authentication

### registerUser

Create a new user account.

```typescript
registerUser(input: {
  email: string;
  password: string;
  nickname: string;
}): Promise<{ user?: User; error?: string }>
```

**Validation:**
- Email format validation
- Password minimum 6 characters
- Check for duplicate email

### loginUser

Authenticate a user and return a session token.

```typescript
loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user?: User; token?: string; error?: string }>
```

### verifyToken

Verify a session token and return the user ID.

```typescript
verifyToken(token: string): Promise<{ userId?: string; error?: string }>
```

## Workspace Management

### createWorkspace

Create a new workspace.

```typescript
createWorkspace(input: {
  ownerId: string;
  title: string;
  headcount: number;
  date: string;
}): Promise<{ workspace?: Workspace; error?: string }>
```

**Business Logic:**
- Title validation (non-empty)
- Headcount minimum 1

### updateWorkspace

Update workspace details.

```typescript
updateWorkspace(
  id: string,
  updates: Partial<Pick<Workspace, 'title' | 'headcount' | 'date'>>
): Promise<{ error?: string }>
```

### deleteWorkspace

Delete a workspace and all related data.

```typescript
deleteWorkspace(id: string): Promise<{ error?: string }>
```

**Business Logic:**
- Cascade delete categories
- Cascade delete category-place relationships

### getWorkspacesByOwner

Get all workspaces for a user.

```typescript
getWorkspacesByOwner(ownerId: string): Promise<Workspace[]>
```

## Category Management

### addCategory

Add a new category to a workspace.

```typescript
addCategory(input: {
  workspaceId: string;
  name: string;
}): Promise<{ category?: Category; error?: string }>
```

**Business Logic:**
- Automatic color assignment (round-robin from palette)
- Automatic sortOrder calculation (based on existing count)

### updateCategory

Update category name or color.

```typescript
updateCategory(
  id: string,
  updates: Partial<Pick<Category, 'name' | 'color'>>
): Promise<{ error?: string }>
```

### deleteCategory

Delete a category and its relationships.

```typescript
deleteCategory(id: string): Promise<{ error?: string }>
```

**Business Logic:**
- Cascade delete category-place relationships

### reorderCategories

Update the sort order of categories.

```typescript
reorderCategories(
  workspaceId: string,
  orderedIds: string[]
): Promise<{ error?: string }>
```

**Business Logic:**
- Calculates new sortOrder values (0, 1, 2, ...)
- Updates all categories in workspace

### setRepresentativePlace

Set or unset the representative place for a category.

```typescript
setRepresentativePlace(
  categoryId: string,
  placeId: string | null
): Promise<{ error?: string }>
```

**Business Logic:**
- Validates place belongs to category
- Triggers route recalculation

## Place Management

### addPlaceToCategory

Add a Kakao place to a category.

```typescript
addPlaceToCategory(input: {
  workspaceId: string;
  categoryId: string;
  kakaoPlace: KakaoPlace;
}): Promise<{ place?: Place; error?: string }>
```

**Business Logic:**
- Duplicate check (same kakaoPlaceId in workspace)
- Creates place if doesn't exist
- Links place to category

### removePlace

Remove a place from a category.

```typescript
removePlace(
  placeId: string,
  categoryId: string
): Promise<{ error?: string }>
```

**Business Logic:**
- Removes category-place link
- Deletes place if not used elsewhere
- Unsets as representative if applicable

### getPlacesByCategory

Get all places in a category.

```typescript
getPlacesByCategory(categoryId: string): Promise<Place[]>
```

## Usage Flow

### User Registration & Login

1. User submits registration form
2. `registerUser` validates and creates user
3. User submits login form
4. `loginUser` validates credentials and returns token
5. Token stored in localStorage
6. `verifyToken` used on app load to restore session

### Creating a Course

1. User creates workspace via `createWorkspace`
2. User adds categories via `addCategory` (colors assigned automatically)
3. User searches places via Kakao Local API (client-side)
4. User adds places via `addPlaceToCategory`
5. User sets representative places via `setRepresentativePlace`
6. Route automatically updates on map

### Reordering Categories

1. User drags categories in UI
2. New order sent to `reorderCategories`
3. sortOrder values recalculated
4. Map route updates based on new order

## Error Handling

All Edge Functions return errors in the format:

```typescript
{ error?: string }
```

Common error messages:
- "모든 필드를 입력해주세요." - Missing required fields
- "이미 사용 중인 이메일입니다." - Duplicate email
- "유효하지 않은 카테고리입니다." - Invalid category
- "이미 이 카테고리에 추가된 장소입니다." - Duplicate place in category
