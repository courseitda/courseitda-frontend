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
  name: string;
  createdAt: string;
  forkCount: number;
  placeCount: number;
}> = [
  {
    id: 'my-shared-1',
    name: mySavedCategories[0]?.title ?? '내 공유 카테고리',
    createdAt: new Date().toISOString(),
    forkCount: 0,
    placeCount: mySavedCategories[0]?.placeCount ?? 0,
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

const paginate = <T>(items: T[], cursorParam: string | null, sizeParam: string | null) => {
  const size = Number(sizeParam ?? '20');
  const cursor = cursorParam ? Number(cursorParam) : null;
  const startIndex = cursor === null || Number.isNaN(cursor) ? 0 : cursor;
  const pagedItems = items.slice(startIndex, startIndex + size);
  const nextCursor = startIndex + size < items.length ? startIndex + size : null;

  return {
    items: pagedItems,
    hasNext: nextCursor !== null,
    nextCursor,
  };
};

const toApiResponse = (categories: typeof sharedSavedCategories) =>
  categories.map((category) => ({
    id: category.id,
    name: category.title,
    authorNickname: category.uploaderNickname,
    createdAt: category.uploadedAt,
    forkCount: category.forkCount,
    placeCount: category.placeCount,
    sharedCategoryPlaces: category.places.map((place) => ({
      id: place.id,
      name: place.name,
      placeUrl: place.placeUrl,
      roadAddressName: place.roadAddressName,
      addressName: place.addressName,
      latitude: place.latitude,
      longitude: place.longitude,
    })),
  }));

export const communityHandlers = [
  // UserRequest: API baseURL이 다른 origin이어도 매칭되도록 와일드카드(`*`)를 사용
  http.get('*/api/community/shared-categories/recommendations', () => {
    return HttpResponse.json(toApiResponse(recommendedSharedCategories));
  }),

  http.get('*/api/shared-categories/search', ({ request }) => {
    const url = new URL(request.url);
    const keyword = (url.searchParams.get('keyword') ?? '').trim().toLowerCase();

    const base = toApiResponse(sharedSavedCategories);
    const filtered = !keyword
      ? base
      : base.filter((category) => category.name.toLowerCase().includes(keyword));
    const paged = paginate(
      filtered,
      url.searchParams.get('cursor'),
      url.searchParams.get('size'),
    );

    return HttpResponse.json({
      sharedCategories: paged.items,
      hasNext: paged.hasNext,
      nextCursor: paged.nextCursor,
    });
  }),

  http.get('*/api/shared-categories', ({ request }) => {
    const url = new URL(request.url);
    const paged = paginate(
      toApiResponse(sharedSavedCategories),
      url.searchParams.get('cursor'),
      url.searchParams.get('size'),
    );

    return HttpResponse.json({
      sharedCategories: paged.items,
      hasNext: paged.hasNext,
      nextCursor: paged.nextCursor,
    });
  }),

  http.get('*/api/me/shared-categories', ({ request }) => {
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

    const url = new URL(request.url);
    const paged = paginate(
      mySharedCategories,
      url.searchParams.get('cursor'),
      url.searchParams.get('size'),
    );

    return HttpResponse.json({
      sharedCategories: paged.items,
      hasNext: paged.hasNext,
      nextCursor: paged.nextCursor,
    });
  }),

  http.get('*/api/shared-categories/:sharedCategoryId', ({ params }) => {
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

  http.post('*/api/shared-categories', async ({ request }) => {
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
      name: savedCategory.title,
      createdAt: new Date().toISOString(),
      forkCount: 0,
      placeCount: savedCategory.placeCount,
    };
    mySharedCategories.unshift(newShared);
    allSharedCategories.set(newShared.id, {
      id: newShared.id,
      title: newShared.name,
      uploaderNickname: 'me',
      uploadedAt: newShared.createdAt,
      isImmutableSnapshot: true,
      forkCount: 0,
      placeCount: savedCategory.placeCount,
      places: savedCategory.places.map((place) => ({ ...place })),
    });

    return HttpResponse.json(
      { id: newShared.id, name: newShared.name },
      { status: 201 },
    );
  }),

  http.delete('*/api/shared-categories/:sharedCategoryId', ({ request, params }) => {
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
