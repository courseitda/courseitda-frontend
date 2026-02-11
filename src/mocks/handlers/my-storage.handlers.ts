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

  // UserRequest: 내 보관 카테고리 추가 API를 MSW로 제공
  http.post('*/api/me/saved-categories', async ({ request }) => {
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
      id: `place-${Date.now()}-${index}`,
      name: typeof place?.name === 'string' ? place.name : '알 수 없는 장소',
      placeUrl: typeof place?.placeUrl === 'string' ? place.placeUrl : '',
      roadAddressName: typeof place?.roadAddressName === 'string' ? place.roadAddressName : '',
      addressName: typeof place?.addressName === 'string' ? place.addressName : '',
      latitude: Number(place?.latitude ?? 0),
      longitude: Number(place?.longitude ?? 0),
    }));

    const newCategory = {
      id: `cat-${Date.now()}`,
      title,
      modifiedAt: new Date().toISOString(),
      placeCount: places.length,
      places,
    };

    savedCategories.unshift(newCategory);
    return HttpResponse.json(newCategory, { status: 201 });
  }),
];
