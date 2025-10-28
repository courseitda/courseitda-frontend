# Edge Functions API Documentation

> ⚙️ **Integration Note**  
> Backend HTTP requests are routed through the shared Axios client (`src/lib/axios.ts`).  
> The base URL is configured via `VITE_API_BASE_URL` (default: `http://localhost:8080`) and all protected endpoints must receive an `Authorization: Bearer {accessToken}` header.

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
- Password minimum 8 characters
- Check for duplicate email

**Backend API Mapping:**
- Mock: Direct Edge Function call
- Backend: `POST /api/members`

---

### loginUser

Authenticate a user and return a session token.

```typescript
loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user?: User; token?: string; error?: string }>
```

**Returns:**
- Mock: `{ user, token }`
- Backend: `{ tokenType: "Bearer", accessToken }`

**Backend API Mapping:**
- Mock: Direct Edge Function call
- Backend: `POST /api/auth/login`

**Note:** In production, user information is NOT returned in login response. Use `getProfileInfo` or `getNavigatorInfo` to fetch user data.

---

### verifyToken

Verify a session token and return the user ID.

```typescript
verifyToken(token: string): Promise<{ userId?: string; error?: string }>
```

**Backend API Mapping:**
- Mock: Direct Edge Function call
- Backend: Not available (token validation happens on each API call)

---

### getUserById

Get user information by user ID.

```typescript
getUserById(userId: string): Promise<{ user?: User; error?: string }>
```

**Backend API Mapping:**
- Mock: Direct Edge Function call
- Backend: `GET /api/users/{userId}` (internal use only)

---

### getNavigatorInfo

Get user nickname for display in navigation header.

```typescript
getNavigatorInfo(token: string): Promise<{ nickname?: string; error?: string }>
```

**Backend API Mapping:**
- Mock: Direct Edge Function call
- Backend: `GET /api/me/navigator`
- Headers: `Authorization: Bearer {token}`

---

### getProfileInfo

Get full user profile information.

```typescript
getProfileInfo(token: string): Promise<{ user?: User; error?: string }>
```

**Backend API Mapping:**
- Mock: Direct Edge Function call
- Backend: `GET /api/me/profile`
- Headers: `Authorization: Bearer {token}`

---

### checkEmailDuplicate

Check if an email is already registered.

```typescript
checkEmailDuplicate(email: string): Promise<{ isDuplicate: boolean; error?: string }>
```

**Backend API Mapping:**
- Mock: Direct Edge Function call
- Backend: `GET /api/members/validations/email?value={email}`
- Response field: `isDuplicated` (note the 'd' at the end)

---

### checkNicknameDuplicate

Check if a nickname is already taken.

```typescript
checkNicknameDuplicate(nickname: string): Promise<{ isDuplicate: boolean; error?: string }>
```

**Backend API Mapping:**
- Mock: Direct Edge Function call
- Backend: `GET /api/members/validations/nickname?value={nickname}`
- Response field: `isDuplicated` (note the 'd' at the end)

## Workspace Management

### createWorkspace

Create a new workspace.

```typescript
createWorkspace(input: {
  ownerId: string;
  title: string;
}): Promise<{ workspace?: Workspace; error?: string }>
```

**Business Logic:**
- Title validation (non-empty)

**Backend API Mapping:**
- Mock: Direct Edge Function call
- Backend: `POST /api/workspaces`
- Request: `{ title: string }`
- Response: `{ identifier: string, title: string, modifiedAt: string }`

### getWorkspaceByIdentifier

Get a single workspace by its identifier.

```typescript
getWorkspaceByIdentifier(identifier: string): Promise<{ workspace?: Workspace; error?: string }>
```

**Backend API Mapping:**
- Mock: Direct Edge Function call (queries IndexedDB by `identifier` field)
- Backend: `GET /api/workspaces/{identifier}`
- Response: `{ identifier: string, title: string, modifiedAt: string }`

### updateWorkspace

Update workspace details.

```typescript
updateWorkspace(
  id: string,
  updates: Partial<Pick<Workspace, 'title'>>
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

### getCategoryById

Get a single category by its ID.

```typescript
getCategoryById(categoryId: string): Promise<{ category?: Category; error?: string }>
```

**Backend API Mapping:**
- Mock: Direct Edge Function call (queries IndexedDB by category ID)
- Backend: `GET /api/categories/{categoryId}`
- Response: Includes category details, sequence, representativePlaceId, and categoryPlaces list

---

### addCategory

Add a new category to a workspace.

```typescript
addCategory(input: {
  workspaceId: string;
  name: string;
  color: string;
}): Promise<{ category?: Category; error?: string }>
```

**Business Logic:**
- Automatic sortOrder calculation (based on existing count)

**Backend API Mapping:**
- Mock: Direct Edge Function call
- Backend: `POST /api/categories`
- Request: `{ name: string, color: string }`
- Response: `{ id: number, name: string, color: string, sequence: number }`

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
  categories: Array<{ id: string; sequence: number }>
): Promise<{ 
  categories?: Array<{ id: string; sequence: number }>; 
  error?: string 
}>
```

**Business Logic:**
- Updates sequence for each category
- Updates all categories in workspace

**Backend API Mapping:**
- Mock: Direct Edge Function call
- Backend: `POST /api/workspaces/{identifier}/categories/sequence`
- Request: `{ categories: Array<{ id: number, sequence: number }> }`
- Response: `{ categories: Array<{ id: number, sequence: number }> }`
- Note: Backend sequence starts from 1, frontend uses 0-based index

### setRepresentativePlace

Set the representative place for a category.

```typescript
setRepresentativePlace(
  categoryId: string,
  placeId: string
): Promise<{ error?: string }>
```

**Business Logic:**
- Validates place belongs to category
- Triggers route recalculation

**Backend API Mapping:**
- Mock: Direct Edge Function call
- Backend: `PUT /api/categories/{categoryId}/representative-place`
- Request: `{ categoryPlaceId: number }`
- Response: `{ id: number, representativeCategoryPlaceId: number }`

### unsetRepresentativePlace

Unset the representative place for a category.

```typescript
unsetRepresentativePlace(
  categoryId: string
): Promise<{ error?: string }>
```

**Backend API Mapping:**
- Mock: Direct Edge Function call
- Backend: `DELETE /api/categories/{categoryId}/representative-place`
- Response: 204 No Content

## Place Management

### searchPlaces

Search places using Kakao Local API.

```typescript
searchPlaces(input: {
  keyword: string;
  restApiKey: string;
}): Promise<{ searchedPlaces?: KakaoPlace[]; error?: string }>
```

**Business Logic:**
- Keyword validation (non-empty)
- REST API key validation
- Calls Kakao Local API

**Backend API Mapping:**
- Mock: Direct Kakao API call from edge function
- Backend: `GET /api/places/search?keyword={keyword}`
- Note: Backend removes `restApiKey` parameter (managed server-side)

**Response:**
- Mock: `{ searchedPlaces: KakaoPlace[] }` from Kakao API
- Backend: `{ searchedPlaces: Array<{ name, roadAddressName, addressName, latitude, longitude }> }`

---

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

### User Registration & Login (Token-Based Authentication)

**Current Implementation (Mock):**
1. User submits registration form
2. `registerUser` validates and creates user
3. User submits login form
4. `loginUser` validates credentials and returns `{ tokenType, accessToken }`
5. **Only token** stored in localStorage (no user object)
6. User information fetched when needed via `getProfileInfo` or `getNavigatorInfo`

**Backend Migration Notes:**
- Change `isDuplicate` to `isDuplicated` in duplicate check responses
- Login response changes from `{ user, token }` to `{ tokenType: "Bearer", accessToken }`
- Remove `verifyToken` calls (backend validates token on each request)
- User info is fetched on-demand, not stored in localStorage

### Creating a Course

1. User creates workspace via `createWorkspace`
2. User adds categories via `addCategory` (colors assigned automatically)
3. User searches places via `searchPlaces` (Kakao Local API)
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

## Backend Migration Checklist

### Authentication Changes
- [ ] Update login response handling: `{ tokenType, accessToken }` instead of `{ user, token }`
- [ ] Change duplicate check response field: `isDuplicated` instead of `isDuplicate`
- [ ] Replace `verifyToken` with on-demand user info fetching
- [ ] Update `auth-store` to only store token (no user object)
- [ ] Add `getNavigatorInfo` and `getProfileInfo` API calls

### API Endpoint Mapping
- [ ] `POST /api/auth/login` → Login
- [ ] `POST /api/members` → Register
- [ ] `GET /api/members/validations/email` → Check email
- [ ] `GET /api/members/validations/nickname` → Check nickname
- [ ] `GET /api/me/navigator` → Get user nickname
- [ ] `GET /api/me/profile` → Get user profile
- [ ] `GET /api/me/workspaces` → Get user's workspaces
- [ ] `GET /api/places/search?keyword={keyword}` → Search places

### Data Structure Changes
- [ ] Workspace ID: `id` (UUID) → `identifier` (string)
- [ ] Updated timestamp: `updatedAt` → `modifiedAt`
- [ ] Category: Add `sequence`, `representativePlaceId` fields
- [ ] Place API: Move from `/api/places` to `/api/categories/{id}/places`

### Authentication Flow
**Before (Mock):**
```
Login → { user, token } → Store both in localStorage → Use user object directly
```

**After (Backend):**
```
Login → { tokenType, accessToken } → Store token only → Fetch user info when needed
```
