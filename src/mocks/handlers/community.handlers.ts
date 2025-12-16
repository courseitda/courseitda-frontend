import { http, HttpResponse } from 'msw';
import { BackendErrorCode } from '@/shared/utils/error-message';
import { createSharedSavedCategoryMocks } from '../factories/community.factory';

const sharedSavedCategories = createSharedSavedCategoryMocks();

// 커뮤니티 찜 상태는 MSW 런타임 메모리로만 관리 (새로고침 시 초기화)
let likedSharedCategoryIds = new Set<string>(['shared-2']);

const isAuthorized = (request: Request): boolean => {
  const authorization = request.headers.get('authorization');
  return typeof authorization === 'string' && authorization.toLowerCase().startsWith('bearer ');
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
];
