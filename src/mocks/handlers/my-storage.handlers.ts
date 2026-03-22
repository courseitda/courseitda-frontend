import { http, HttpResponse } from 'msw';
import { BackendErrorCode } from '@/shared/utils/error-message';
import { createSavedCategoryMocks } from '../factories/my-storage.factory';

const savedCategories = createSavedCategoryMocks();

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

const isAuthorized = (request: Request): boolean => {
  const authorization = request.headers.get('authorization');
  return typeof authorization === 'string' && authorization.toLowerCase().startsWith('bearer ');
};

const mapPlaces = (places: unknown[], savedCategoryId?: string) =>
  places.map((place, index) => ({
    id:
      typeof place === 'object' && place && 'savedCategoryPlaceId' in place && typeof place.savedCategoryPlaceId === 'string'
        ? place.savedCategoryPlaceId
        : `place-${savedCategoryId ?? Date.now()}-${Date.now()}-${index}`,
    name: typeof place === 'object' && place && 'name' in place && typeof place.name === 'string' ? place.name : '알 수 없는 장소',
    placeUrl:
      typeof place === 'object' && place && 'placeUrl' in place && typeof place.placeUrl === 'string'
        ? place.placeUrl
        : '',
    roadAddressName:
      typeof place === 'object' && place && 'roadAddressName' in place && typeof place.roadAddressName === 'string'
        ? place.roadAddressName
        : '',
    addressName:
      typeof place === 'object' && place && 'addressName' in place && typeof place.addressName === 'string'
        ? place.addressName
        : '',
    latitude:
      typeof place === 'object' && place && 'latitude' in place
        ? Number(place.latitude ?? 0)
        : 0,
    longitude:
      typeof place === 'object' && place && 'longitude' in place
        ? Number(place.longitude ?? 0)
        : 0,
  }));

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

    const url = new URL(request.url);
    const paged = paginate(
      savedCategories.map((category) => ({
        id: category.id,
        name: category.title,
        placeCount: category.placeCount,
        modifiedAt: category.modifiedAt,
      })),
      url.searchParams.get('cursor'),
      url.searchParams.get('size'),
    );

    return HttpResponse.json({
      savedCategories: paged.items,
      hasNext: paged.hasNext,
      nextCursor: paged.nextCursor,
    });
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

    const newCategory = {
      id: `cat-${Date.now()}`,
      title: name,
      modifiedAt: new Date().toISOString(),
      placeCount: 0,
      places: [],
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

  // UserRequest: 보관 카테고리 최초 장소 추가는 전용 places 엔드포인트를 사용한다.
  http.post('*/api/saved-categories/:savedCategoryId/places', async ({ params, request }) => {
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
    const places = mapPlaces(getSavedCategoryPlaces(body), savedCategoryId);
    savedCategories[targetIndex] = {
      ...savedCategories[targetIndex],
      modifiedAt: new Date().toISOString(),
      placeCount: places.length,
      places,
    };

    return HttpResponse.json({ savedCategoryPlaces: places }, { status: 201 });
  }),

  // UserRequest: 내 보관 카테고리 수정 API를 MSW로 제공
  http.patch('*/api/saved-categories/:savedCategoryId', async ({ params, request }) => {
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

    savedCategories[targetIndex] = {
      ...savedCategories[targetIndex],
      title: name,
      modifiedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      id: savedCategories[targetIndex].id,
      name: savedCategories[targetIndex].title,
    });
  }),

  // UserRequest: 보관 카테고리 장소 수정은 places 동기화 엔드포인트를 사용한다.
  http.patch('*/api/saved-categories/:savedCategoryId/places', async ({ params, request }) => {
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
    const places = mapPlaces(getSavedCategoryPlaces(body), savedCategoryId);
    savedCategories[targetIndex] = {
      ...savedCategories[targetIndex],
      modifiedAt: new Date().toISOString(),
      placeCount: places.length,
      places,
    };

    return HttpResponse.json({ savedCategoryPlaces: places });
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
