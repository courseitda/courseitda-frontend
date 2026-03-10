import { http, HttpResponse } from 'msw';
import { BackendErrorCode } from '@/shared/utils/error-message';
import { createSharedSavedCategoryMocks } from '../factories/community.factory';
import { createRecommendedSharedCategoryMocks } from '../factories/recommended-community.factory';
import { createSavedCategoryMocks } from '../factories/my-storage.factory';

const sharedSavedCategories = createSharedSavedCategoryMocks();
const recommendedSharedCategories = createRecommendedSharedCategoryMocks();
const allSharedCategories = new Map(
  [...sharedSavedCategories, ...recommendedSharedCategories].map((category) => [category.id, category]),
);
const mySavedCategories = createSavedCategoryMocks();

const mySharedCategories: Array<{
  id: string;
  title: string;
  uploaderNickname: string;
  uploadedAt: string;
  isImmutableSnapshot: true;
  forkCount: number;
  placeCount: number;
  savedCategoryId: string;
}> = [
  {
    id: 'my-shared-1',
    title: mySavedCategories[0]?.title ?? '내 공유 카테고리',
    uploaderNickname: 'me',
    uploadedAt: new Date().toISOString(),
    isImmutableSnapshot: true,
    forkCount: 0,
    placeCount: mySavedCategories[0]?.placeCount ?? 0,
    savedCategoryId: mySavedCategories[0]?.id ?? 'cat-1',
  },
];

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

const toApiResponse = (categories: typeof sharedSavedCategories) => categories;

export const communityHandlers = [
  // UserRequest: API baseURL이 다른 origin이어도 매칭되도록 와일드카드(`*`)를 사용
  http.get('*/api/community/shared-categories/recommendations', () => {
    return HttpResponse.json(toApiResponse(recommendedSharedCategories));
  }),

  http.get('*/api/community/shared-categories/search', ({ request }) => {
    const url = new URL(request.url);
    const keyword = (url.searchParams.get('keyword') ?? '').trim().toLowerCase();

    const base = toApiResponse(sharedSavedCategories);
    if (!keyword) {
      return HttpResponse.json(base);
    }

    const filtered = base.filter((category) => category.title.toLowerCase().includes(keyword));
    return HttpResponse.json(filtered);
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

  http.get('*/api/community/shared-categories/:sharedCategoryId', ({ params }) => {
    const sharedCategoryId = String(params.sharedCategoryId ?? '');
    const category = allSharedCategories.get(sharedCategoryId);

    if (!category) {
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

    return HttpResponse.json(category);
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

    if (!savedCategory.canPublish) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          detail: savedCategory.publishBlockedReason ?? '현재 상태의 카테고리는 게시할 수 없습니다.',
          code: BackendErrorCode.ACCESS_FORBIDDEN,
        },
        { status: 403 },
      );
    }

    // UserRequest: 동일한 보관 카테고리의 중복 업로드를 허용

    const newShared = {
      id: `my-shared-${Date.now()}`,
      title: savedCategory.title,
      uploaderNickname: 'me',
      uploadedAt: new Date().toISOString(),
      isImmutableSnapshot: true,
      forkCount: 0,
      placeCount: savedCategory.placeCount,
      savedCategoryId: savedCategory.id,
    };
    mySharedCategories.unshift(newShared);
    allSharedCategories.set(newShared.id, {
      id: newShared.id,
      title: newShared.title,
      uploaderNickname: newShared.uploaderNickname,
      uploadedAt: newShared.uploadedAt,
      isImmutableSnapshot: true,
      placeCount: savedCategory.placeCount,
      places: savedCategory.places.map((place) => ({ ...place })),
    });

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
    allSharedCategories.delete(sharedCategoryId);
    return HttpResponse.json(null, { status: 204 });
  }),
];
