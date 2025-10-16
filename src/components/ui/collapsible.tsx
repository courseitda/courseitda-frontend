import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

// 접기/펼치기 컴포넌트 - 콘텐츠의 표시/숨김 상태 관리
// 사용 위치: features/categories (category-card)

// 접기/펼치기 루트 컴포넌트
const Collapsible = CollapsiblePrimitive.Root;

// 접기/펼치기 트리거 요소 - 클릭 시 콘텐츠 토글
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

// 접기/펼치기 콘텐츠 영역 - 토글되는 내용을 담는 컨테이너
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
