type CursorPage<Item> = {
  items: Item[];
  hasNext: boolean;
  nextCursor: number | null;
};

type FetchCursorPage<Item> = (cursor: number | null) => Promise<CursorPage<Item>>;

/**
 * 커서 기반 목록을 마지막 페이지까지 안전하게 누적 조회하는 유틸
 * UserRequest: 반복되는 커서 페이지네이션 루프를 공통 유틸로 통합
 */
export const fetchAllCursorPages = async <Item>(
  fetchPage: FetchCursorPage<Item>,
): Promise<Item[]> => {
  const items: Item[] = [];
  let cursor: number | null = null;
  let hasNext = true;
  const visitedCursors = new Set<number | null>();

  while (hasNext) {
    // 잘못된 nextCursor 반복 응답으로 인한 무한 루프를 공통 레벨에서 차단
    if (visitedCursors.has(cursor)) {
      break;
    }
    visitedCursors.add(cursor);

    const page = await fetchPage(cursor);
    items.push(...page.items);

    // 빈 페이지거나 다음 커서가 없으면 즉시 종료하여 빈 목록도 정상 상태로 처리
    if (page.items.length === 0 || page.nextCursor === null) {
      break;
    }

    // 현재 커서와 동일한 nextCursor가 오면 비정상 응답으로 간주하고 종료
    if (page.nextCursor === cursor) {
      break;
    }

    hasNext = page.hasNext;
    cursor = page.nextCursor;
  }

  return items;
};
