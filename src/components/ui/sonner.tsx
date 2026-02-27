import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { UI_COPY } from "@/shared/constants/ui-copy";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      // UserRequest: 모든 토스트에 사용자가 직접 닫을 수 있는 버튼을 상시 노출
      closeButton
      // UserRequest: 토스트 자동 닫힘 시간을 3초로 통일
      duration={3000}
      // UserRequest: 토스트 메시지 우측에 흰색 '닫기' 버튼을 고정 배치
      icons={{
        close: <span className="text-xs font-semibold tracking-tight">{UI_COPY.toaster.close}</span>,
      }}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast relative pr-20 group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          // UserRequest: 닫기 버튼을 토스트 본문 우측에 겹치지 않도록 배치 (검정 배경/흰 글씨 직사각형)
          closeButton:
            "!absolute !right-4 !top-1/2 !left-auto -translate-y-1/2 !flex !h-8 !items-center !justify-center !rounded-md !border !border-transparent !bg-foreground !px-4 !text-xs !font-semibold !tracking-tight !text-white !whitespace-nowrap !transition-colors hover:!bg-foreground/90 focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-ring focus-visible:!ring-offset-2 focus-visible:!ring-offset-background",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
