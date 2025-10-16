import * as React from "react";

import { cn } from "@/lib/utils";

// 입력 필드 컴포넌트 - 일관된 스타일과 포커스 효과 제공
// 사용 위치: features/auth (login-form, register-form), features/categories (add-category-dialog, edit-category-dialog), features/places (place-search-dialog), features/workspaces (create-workspace-dialog, edit-workspace-dialog), pages/Settings
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
