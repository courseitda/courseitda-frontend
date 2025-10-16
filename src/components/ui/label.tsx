import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// 폼 레이블 컴포넌트 - 입력 필드의 설명 텍스트 표시
// 사용 위치: features/categories (add-category-dialog, edit-category-dialog), features/places (place-search-dialog), features/workspaces (create-workspace-dialog, edit-workspace-dialog), pages/Settings

// 레이블 스타일 정의
const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");

// 폼 레이블 컴포넌트 - 입력 필드의 설명 텍스트를 표시하며 접근성 향상
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
