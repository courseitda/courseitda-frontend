import { http, HttpResponse } from 'msw';
import { BackendErrorCode } from '@/shared/utils/error-message';
import { createSharedSavedCategoryMocks } from '../factories/community.factory';
import { createSavedCategoryMocks } from '../factories/my-storage.factory';

const sharedSavedCategories = createSharedSavedCategoryMocks();
const mySavedCategories = createSavedCategoryMocks();

const mySharedCategories: Array<{
  id: string;
  title: string;
  uploaderNickname: string;
  uploadedAt: string;
  placeCount: number;
  savedCategoryId: string;
}> = [
  {
    id: 'my-shared-1',
    title: mySavedCategories[0]?.title ?? '내 공유 카테고리',
    uploaderNickname: 'me',
    uploadedAt: new Date().toISOString(),
    placeCount: mySavedCategories[0]?.placeCount ?? 0,
    savedCategoryId: mySavedCategories[0]?.id ?? 'cat-1',
  },
];

// 커뮤니티 찜 상태는 MSW 런타임 메모리로만 관리 (새로고침 시 초기화)
let likedSharedCategoryIds = new Set<string>(['shared-2']);

const isAuthorized = (request: Request): boolean => {
  const authorization = request.headers.get('authorization');
  return typeof authorization === 'string' && authorization.toLowerCase().startsWith('bearer ');
};

const getSavedCategoryId = (body: unknown): string => {
  if (body && typeof body === 'object' && 'savedCategoryId' in body) {
    const value = (body as { savedCategoryId?: unknown }).savedCategoryId;
    return typeof value === 'string' ? value : '';
  }
  return '';
};

const toApiResponse = (request: Request) => {
  const authorized = isAuthorized(request);
  return sharedSavedCategories.map((category) => ({
    ...category,
    isLiked: authorized ? likedSharedCategoryIds.has(category.id) : false,
  }));
};

export const communityHandlers = [
  // UserRequest: API baseURL이 다른 origin이어도 매칭되도록 와일드카드(`*`)를 사용
  http.get('*/api/community/shared-categories/recommendations', ({ request }) => {
    return HttpResponse.json(toApiResponse(request));
  }),

  http.get('*/api/community/shared-categories/search', ({ request }) => {
    const url = new URL(request.url);
    const keyword = (url.searchParams.get('keyword') ?? '').trim().toLowerCase();

    const base = toApiResponse(request);
    if (!keyword) {
      return HttpResponse.json(base);
    }

    const filtered = base.filter((category) => category.title.toLowerCase().includes(keyword));
    return HttpResponse.json(filtered);
  }),

  http.post('*/api/community/shared-categories/:sharedCategoryId/likes', ({ request, params }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Unauthorized',
          status: 401,
          detail: '인증이 필요합니다.',
          code: BackendErrorCode.MISSING_AUTH_HEADER,
        },
        { status: 401 },
      );
    }

    const sharedCategoryId = String(params.sharedCategoryId ?? '');
    const exists = sharedSavedCategories.some((category) => category.id === sharedCategoryId);
    if (!exists) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: '존재하지 않는 공유 카테고리입니다.',
          code: BackendErrorCode.SHARED_SAVED_CATEGORY_NOT_FOUND,
        },
        { status: 404 },
      );
    }

    likedSharedCategoryIds = new Set(likedSharedCategoryIds).add(sharedCategoryId);
    return HttpResponse.json({ sharedCategoryId, isLiked: true });
  }),

  http.delete('*/api/community/shared-categories/:sharedCategoryId/likes', ({ request, params }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Unauthorized',
          status: 401,
          detail: '인증이 필요합니다.',
          code: BackendErrorCode.MISSING_AUTH_HEADER,
        },
        { status: 401 },
      );
    }

    const sharedCategoryId = String(params.sharedCategoryId ?? '');
    const exists = sharedSavedCategories.some((category) => category.id === sharedCategoryId);
    if (!exists) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: '존재하지 않는 공유 카테고리입니다.',
          code: BackendErrorCode.SHARED_SAVED_CATEGORY_NOT_FOUND,
        },
        { status: 404 },
      );
    }

    const next = new Set(likedSharedCategoryIds);
    next.delete(sharedCategoryId);
    likedSharedCategoryIds = next;
    return HttpResponse.json({ sharedCategoryId, isLiked: false });
  }),

  http.get('*/api/community/shared-categories/me', ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Unauthorized',
          status: 401,
          detail: '인증이 필요합니다.',
          code: BackendErrorCode.MISSING_AUTH_HEADER,
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(mySharedCategories);
  }),

  http.post('*/api/community/shared-categories', async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Unauthorized',
          status: 401,
          detail: '인증이 필요합니다.',
          code: BackendErrorCode.MISSING_AUTH_HEADER,
        },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const savedCategoryId = getSavedCategoryId(body);
    const savedCategory = mySavedCategories.find((category) => category.id === savedCategoryId);

    if (!savedCategory) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: '보관 카테고리를 찾을 수 없습니다.',
          code: BackendErrorCode.SAVED_CATEGORY_NOT_FOUND,
        },
        { status: 404 },
      );
    }

    const exists = mySharedCategories.some((category) => category.savedCategoryId === savedCategoryId);
    if (exists) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Conflict',
          status: 409,
          detail: '이미 공유된 카테고리입니다.',
          code: BackendErrorCode.SHARED_SAVED_CATEGORY_NOT_FOUND,
        },
        { status: 409 },
      );
    }

    const newShared = {
      id: `my-shared-${Date.now()}`,
      title: savedCategory.title,
      uploaderNickname: 'me',
      uploadedAt: new Date().toISOString(),
      placeCount: savedCategory.placeCount,
      savedCategoryId: savedCategory.id,
    };
    mySharedCategories.unshift(newShared);

    return HttpResponse.json(newShared, { status: 201 });
  }),

  http.delete('*/api/community/shared-categories/:sharedCategoryId', ({ request, params }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Unauthorized',
          status: 401,
          detail: '인증이 필요합니다.',
          code: BackendErrorCode.MISSING_AUTH_HEADER,
        },
        { status: 401 },
      );
    }

    const sharedCategoryId = String(params.sharedCategoryId ?? '');
    const index = mySharedCategories.findIndex((category) => category.id === sharedCategoryId);
    if (index === -1) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: '존재하지 않는 공유 카테고리입니다.',
          code: BackendErrorCode.SHARED_SAVED_CATEGORY_NOT_FOUND,
        },
        { status: 404 },
      );
    }

    mySharedCategories.splice(index, 1);
    return HttpResponse.json(null, { status: 204 });
  }),
];
