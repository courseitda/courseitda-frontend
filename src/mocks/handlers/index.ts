import type { RequestHandler } from 'msw';
import { communityHandlers } from './community.handlers';
import { myStorageHandlers } from './my-storage.handlers';

// MSW 핸들러 통합 - 도메인 단위로 분리된 핸들러를 한 곳에서 합쳐 관리
export const handlers: RequestHandler[] = [
  ...communityHandlers,
  ...myStorageHandlers,
];
