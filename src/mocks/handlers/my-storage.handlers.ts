import { http, HttpResponse } from 'msw';
import { BackendErrorCode } from '@/shared/utils/error-message';
import { createSavedCategoryMocks } from '../factories/my-storage.factory';

const savedCategories = createSavedCategoryMocks();

const getTitle = (body: unknown): string => {
  if (body && typeof body === 'object' && 'title' in body) {
    const value = (body as { title?: unknown }).title;
    return typeof value === 'string' ? value.trim() : '';
  }
  return '';
};

const getPlaces = (body: unknown) => {
  if (body && typeof body === 'object' && 'places' in body) {
    const value = (body as { places?: unknown }).places;
    return Array.isArray(value) ? value : [];
  }
  return [];
};

const getSourceType = (body: unknown): 'manual' | 'forked' => {
  if (body && typeof body === 'object' && 'sourceType' in body) {
    return (body as { sourceType?: 'manual' | 'forked' }).sourceType === 'forked' ? 'forked' : 'manual';
  }
  return 'manual';
};

const getForkedFromSharedCategoryId = (body: unknown): string | null => {
  if (body && typeof body === 'object' && 'forkedFromSharedCategoryId' in body) {
    const value = (body as { forkedFromSharedCategoryId?: unknown }).forkedFromSharedCategoryId;
    return typeof value === 'string' && value ? value : null;
  }
  return null;
};

const getName = (body: unknown): string => {
  if (body && typeof body === 'object' && 'name' in body) {
    const value = (body as { name?: unknown }).name;
    return typeof value === 'string' ? value.trim() : '';
  }
  return '';
};

const getSavedCategoryPlaces = (body: unknown) => {
  if (body && typeof body === 'object' && 'savedCategoryPlaces' in body) {
    const value = (body as { savedCategoryPlaces?: unknown }).savedCategoryPlaces;
    return Array.isArray(value) ? value : [];
  }
  return [];
};

const getSourceAuthorName = (body: unknown): string | null => {
  if (body && typeof body === 'object' && 'sourceAuthorName' in body) {
    const value = (body as { sourceAuthorName?: unknown }).sourceAuthorName;
    return typeof value === 'string' && value ? value : null;
  }
  return null;
};

const getSourceCategoryTitle = (body: unknown): string | null => {
  if (body && typeof body === 'object' && 'sourceCategoryTitle' in body) {
    const value = (body as { sourceCategoryTitle?: unknown }).sourceCategoryTitle;
    return typeof value === 'string' && value ? value : null;
  }
  return null;
};

const isAuthorized = (request: Request): boolean => {
  const authorization = request.headers.get('authorization');
  return typeof authorization === 'string' && authorization.toLowerCase().startsWith('bearer ');
};

export const myStorageHandlers = [
  // UserRequest: API baseURL이 다른 origin이어도 매칭되도록 와일드카드(`*`)를 사용
  http.get('*/api/me/saved-categories', ({ request }) => {
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

    return HttpResponse.json(savedCategories);
  }),

  // UserRequest: 내 카테고리 상세 페이지는 보관 카테고리 단건 조회 API를 사용한다.
  http.get('*/api/saved-categories/:savedCategoryId', ({ params, request }) => {
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

    const savedCategoryId = String(params.savedCategoryId ?? '');
    const targetCategory = savedCategories.find((category) => category.id === savedCategoryId);

    if (!targetCategory) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: '존재하지 않는 보관 카테고리입니다.',
          code: BackendErrorCode.SAVED_CATEGORY_NOT_FOUND,
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      id: targetCategory.id,
      name: targetCategory.title,
      savedCategoryPlaces: targetCategory.places.map((place) => ({
        id: place.id,
        name: place.name,
        placeUrl: place.placeUrl,
        roadAddressName: place.roadAddressName,
        addressName: place.addressName,
        latitude: place.latitude,
        longitude: place.longitude,
      })),
    });
  }),

  // UserRequest: MyCategory 생성 기능은 /api/saved-categories 계약을 사용한다.
  http.post('*/api/saved-categories', async ({ request }) => {
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
    const name = getName(body);
    if (!name) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Bad Request',
          status: 400,
          detail: '카테고리 이름이 필요합니다.',
          code: BackendErrorCode.REQUEST_VALIDATION_FAILED,
        },
        { status: 400 },
      );
    }

    const places = getSavedCategoryPlaces(body).map((place, index) => ({
      id: `place-${Date.now()}-${index}`,
      name: typeof place?.name === 'string' ? place.name : '알 수 없는 장소',
      placeUrl: typeof place?.placeUrl === 'string' ? place.placeUrl : '',
      roadAddressName: typeof place?.roadAddressName === 'string' ? place.roadAddressName : '',
      addressName: typeof place?.addressName === 'string' ? place.addressName : '',
      latitude: Number(place?.latitude ?? 0),
      longitude: Number(place?.longitude ?? 0),
    }));

    const sourceType = getSourceType(body);
    const forkedFromSharedCategoryId = getForkedFromSharedCategoryId(body);
    const sourceAuthorName = getSourceAuthorName(body);
    const sourceCategoryTitle = getSourceCategoryTitle(body);

    const newCategory = {
      id: `cat-${Date.now()}`,
      title: name,
      sourceType,
      forkedFromSharedCategoryId,
      sourceAuthorName,
      sourceCategoryTitle,
      canPublish: sourceType !== 'forked',
      publishBlockedReason:
        sourceType === 'forked' ? '공유 카테고리를 복사한 직후에는 다시 게시할 수 없습니다.' : null,
      modifiedAt: new Date().toISOString(),
      placeCount: places.length,
      places,
    };

    savedCategories.unshift(newCategory);
    return HttpResponse.json(
      {
        id: newCategory.id,
        name: newCategory.title,
      },
      { status: 201 },
    );
  }),

  // UserRequest: 내 보관 카테고리 수정 API를 MSW로 제공
  http.patch('*/api/me/saved-categories/:savedCategoryId', async ({ params, request }) => {
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

    const savedCategoryId = String(params.savedCategoryId ?? '');
    const targetIndex = savedCategories.findIndex((category) => category.id === savedCategoryId);
    if (targetIndex < 0) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: '존재하지 않는 보관 카테고리입니다.',
          code: BackendErrorCode.SAVED_CATEGORY_NOT_FOUND,
        },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const title = getTitle(body);
    if (!title) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Bad Request',
          status: 400,
          detail: '카테고리 이름이 필요합니다.',
          code: BackendErrorCode.REQUEST_VALIDATION_FAILED,
        },
        { status: 400 },
      );
    }

    const places = getPlaces(body).map((place, index) => ({
      id:
        typeof place?.id === 'string'
          ? place.id
          : `place-${savedCategoryId}-${Date.now()}-${index}`,
      name: typeof place?.name === 'string' ? place.name : '알 수 없는 장소',
      placeUrl: typeof place?.placeUrl === 'string' ? place.placeUrl : '',
      roadAddressName: typeof place?.roadAddressName === 'string' ? place.roadAddressName : '',
      addressName: typeof place?.addressName === 'string' ? place.addressName : '',
      latitude: Number(place?.latitude ?? 0),
      longitude: Number(place?.longitude ?? 0),
    }));

    savedCategories[targetIndex] = {
      ...savedCategories[targetIndex],
      title,
      canPublish: true,
      publishBlockedReason: null,
      modifiedAt: new Date().toISOString(),
      placeCount: places.length,
      places,
    };

    return HttpResponse.json(savedCategories[targetIndex]);
  }),

  // UserRequest: 내 보관 카테고리 삭제 API를 MSW로 제공
  http.delete('*/api/saved-categories/:savedCategoryId', ({ params, request }) => {
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

    const savedCategoryId = String(params.savedCategoryId ?? '');
    const targetIndex = savedCategories.findIndex((category) => category.id === savedCategoryId);
    if (targetIndex < 0) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: '존재하지 않는 보관 카테고리입니다.',
          code: BackendErrorCode.SAVED_CATEGORY_NOT_FOUND,
        },
        { status: 404 },
      );
    }

    savedCategories.splice(targetIndex, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
