import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MapPin, Map } from "lucide-react";

// UserRequest: 로딩 뷰를 만들어줄 수 있어? 빙글 빙글 돌아가게 했으면 좋을 것 같은데
// 처리: Spinner 컴포넌트와 LoadingView 컴포넌트를 생성하여 다양한 스타일의 로딩 애니메이션 제공

// UserRequest: 돌아가는 것 아주 좋아 근데 좀 더 예쁘게 만들 순 없을까?
// 처리: 다양한 스타일 옵션 추가 (dots, pulse, dual-ring, orbit, square, route)

// UserRequest: 우리가 경로를 그리는 서비스잖아 경로를 그리는 듯한 로딩 뷰를 만들어줄 수 있을까?
// 처리: route 스타일 추가 - SVG로 경로를 그리는 애니메이션 구현

// UserRequest: 저 밑 배경에 지도를 나타내는 아이콘을 깔아주면 어때?
// 처리: route 스타일 fullScreen 모드에서 지도 그리드 라인, MapPin, Map 아이콘들을 배경에 배치

// UserRequest: 저거 선 그려질때 원이 따라 흐르는 것은 없애도 될 것 같아
// 처리: route 스타일에서 움직이는 점 애니메이션 제거

// UserRequest: 우리가 서비스에서 실제 점선으로 경로를 표시해주는 것처럼 저것도 점선으로 그려주면 좋을 것 같은데
// 처리: strokeDasharray="3 8"로 점선 스타일 적용 (3px 선, 8px 간격)

// UserRequest: 점선이 간격이 더 멀었으면 좋을 것 같아
// 처리: strokeDasharray를 "3 8"로 조정하여 점선 간격을 넓힘

// UserRequest: 점 3개말고 4개로 해줄 수 있을가?
// 처리: 마커 개수를 3개에서 4개로 증가

// UserRequest: 비스듬한 N자로 표기해줘
// 처리: 경로를 N자 형태로 변경

// UserRequest: 아니 S자로 하되 눕힌 S자로 표현해줄래
// 처리: 경로를 눕힌 S자(∽) 형태로 변경

// UserRequest: 점선이 지나가는 큰 점들은 서로 좀 떨어져 있어야지 너무 붙어잇따
// 처리: 마커 위치를 더 멀리 배치하여 간격 확대

// UserRequest: 조금더 거리를 벌려봐
// 처리: 마커 간 거리를 더욱 확대

// UserRequest: 조금더 길게 늘여봐
// 처리: 전체 경로 길이를 더욱 연장

// UserRequest: 좋아 이 형태를 유지하되 지금은 약간 잘려보이니까 그대로 비율을 조금 줄이자
// 처리: 전체 경로의 비율을 축소하여 viewBox 내에 완전히 표시되도록 조정

// UserRequest: 점을 지나갈때마다 지나가는 점들안에 순서를 1,2,3,4로 희게 표시해주면 좋을 것 같은데
// 처리: 각 마커에 순서 번호(1,2,3,4)를 흰색으로 표시하는 텍스트 추가

// UserRequest: 숫자 사이즈도 좀 키우자 좀더 진하게 보이게 하고
// 처리: 숫자 폰트 크기를 증가시키고 font-bold 적용

// UserRequest: 숫자 다빼
// 처리: 모든 숫자 요소 제거

// UserRequest: 로딩 중입니다 말고 멘트가 지속적으로 바뀌는 것으로 하자. 멘트는 "지도를 불러오는 중입니다..." "마커를 찍는 중입니다..." "경로를 잇는 중입니다..." 이런 느낌으로
// 처리: route 스타일에서 4가지 단계별 메시지를 2초마다 순환하도록 구현

// UserRequest: 그라디언트, 바, 기본은 삭제해줘
// 처리: gradient, bars, default 스타일을 SpinnerProps와 LoadingViewProps에서 제거하고 해당 JSX 로직도 삭제

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dots" | "pulse" | "dual-ring" | "orbit" | "square" | "route";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const borderSizes = {
  sm: "border-2",
  md: "border-2",
  lg: "border-3",
  xl: "border-4",
};

export function Spinner({ size = "md", variant = "dots", className }: SpinnerProps) {

  if (variant === "dots") {
    const dotSize = size === "sm" ? "2" : size === "md" ? "3" : size === "lg" ? "4" : "5";
    return (
      <div className={cn("relative", sizeClasses[size])} role="status" aria-label="로딩 중">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-1">
            <div className={cn(`w-${dotSize} h-${dotSize} bg-primary rounded-full animate-bounce`)} style={{ animationDelay: "0ms" }} />
            <div className={cn(`w-${dotSize} h-${dotSize} bg-primary rounded-full animate-bounce`)} style={{ animationDelay: "150ms" }} />
            <div className={cn(`w-${dotSize} h-${dotSize} bg-primary rounded-full animate-bounce`)} style={{ animationDelay: "300ms" }} />
          </div>
        </div>
        <span className="sr-only">로딩 중...</span>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className="relative" role="status" aria-label="로딩 중">
        <div
          className={cn(
            "rounded-full bg-primary/20 animate-ping absolute",
            sizeClasses[size]
          )}
        />
        <div
          className={cn(
            "rounded-full bg-primary animate-pulse",
            sizeClasses[size],
            className
          )}
        />
        <span className="sr-only">로딩 중...</span>
      </div>
    );
  }

  if (variant === "dual-ring") {
    return (
      <div className="relative" role="status" aria-label="로딩 중">
        <div className={cn("relative", sizeClasses[size])}>
          {/* 외부 링 */}
          <div
            className={cn(
              "absolute inset-0 rounded-full border-solid border-primary border-t-transparent animate-spin",
              borderSizes[size]
            )}
          />
          {/* 내부 링 - 반대 방향 */}
          <div
            className={cn(
              "absolute inset-0 m-auto rounded-full border-solid border-primary/50 border-b-transparent",
              size === "sm" ? "h-2 w-2 border-[1px]" :
              size === "md" ? "h-4 w-4 border-[1.5px]" :
              size === "lg" ? "h-6 w-6 border-2" :
              "h-8 w-8 border-2"
            )}
            style={{ animation: "spin 1s linear infinite reverse" }}
          />
        </div>
        <span className="sr-only">로딩 중...</span>
      </div>
    );
  }

  if (variant === "orbit") {
    const orbitSize = size === "sm" ? "1.5" : size === "md" ? "2" : size === "lg" ? "3" : "4";
    return (
      <div className={cn("relative", sizeClasses[size])} role="status" aria-label="로딩 중">
        <div className="absolute inset-0 animate-spin">
          <div className={cn(`absolute top-0 left-1/2 -translate-x-1/2 w-${orbitSize} h-${orbitSize} bg-primary rounded-full`)} />
          <div className={cn(`absolute bottom-0 left-1/2 -translate-x-1/2 w-${orbitSize} h-${orbitSize} bg-primary/60 rounded-full`)} />
          <div className={cn(`absolute left-0 top-1/2 -translate-y-1/2 w-${orbitSize} h-${orbitSize} bg-primary/40 rounded-full`)} />
          <div className={cn(`absolute right-0 top-1/2 -translate-y-1/2 w-${orbitSize} h-${orbitSize} bg-primary/20 rounded-full`)} />
        </div>
        <span className="sr-only">로딩 중...</span>
      </div>
    );
  }

  if (variant === "square") {
    return (
      <div className="relative" role="status" aria-label="로딩 중">
        <div
          className={cn(
            "animate-spin rounded-lg bg-gradient-to-br from-primary to-primary/30",
            sizeClasses[size],
            className
          )}
          style={{
            animation: "spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite",
          }}
        />
        <span className="sr-only">로딩 중...</span>
      </div>
    );
  }


  if (variant === "route") {
    // UserRequest: 경로를 그리는 듯한 로딩 뷰 - 눕힌 S자 형태로 구현
    const svgSize = size === "sm" ? 32 : size === "md" ? 64 : size === "lg" ? 96 : 128;
    const strokeWidth = size === "sm" ? 2 : size === "md" ? 3 : size === "lg" ? 4 : 5;
    const dotSize = size === "sm" ? 4 : size === "md" ? 6 : size === "lg" ? 8 : 10;
    
    return (
      <div className="relative" role="status" aria-label="로딩 중">
        <svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <defs>
            {/* UserRequest: 선이 그려지는 효과 - 클리핑 패스로 점선이 순차적으로 나타나는 애니메이션 */}
            <clipPath id="revealClip">
              <rect x="0" y="0" width="0" height="100">
                <animate
                  attributeName="width"
                  values="0;100;0"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </rect>
            </clipPath>
          </defs>
          
          {/* UserRequest: 배경 경로 - 점선 (흐릿하게) - 눕힌 S자 형태 */}
          <path
            d="M 10 50 C 10 30, 30 30, 40 50 C 50 70, 60 70, 70 50 C 80 30, 90 30, 90 50"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray="3 8"
            opacity="0.2"
          />
          
          {/* UserRequest: 경로 선 - 점선이 그려지는 애니메이션 - 눕힌 S자 형태 (3px 선, 8px 간격) */}
          <path
            d="M 10 50 C 10 30, 30 30, 40 50 C 50 70, 60 70, 70 50 C 80 30, 90 30, 90 50"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray="3 8"
            opacity="0.8"
            clipPath="url(#revealClip)"
          />
          
          {/* UserRequest: 4개 마커 - 경로를 따라 배치된 원형 마커들 (펄스 애니메이션) */}
          <circle
            cx="10"
            cy="50"
            r={dotSize}
            fill="hsl(var(--primary))"
            opacity="0.8"
          >
            <animate
              attributeName="opacity"
              values="0.8;1;0.8"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
          
          <circle
            cx="30"
            cy="32"
            r={dotSize}
            fill="hsl(var(--primary))"
            opacity="0.7"
          >
            <animate
              attributeName="opacity"
              values="0.7;1;0.7"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
          
          <circle
            cx="60"
            cy="68"
            r={dotSize}
            fill="hsl(var(--primary))"
            opacity="0.7"
          >
            <animate
              attributeName="opacity"
              values="0.7;1;0.7"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
          
          <circle
            cx="90"
            cy="50"
            r={dotSize}
            fill="hsl(var(--primary))"
            opacity="0.8"
          >
            <animate
              attributeName="opacity"
              values="0.8;1;0.8"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
        <span className="sr-only">로딩 중...</span>
      </div>
    );
  }

}

interface LoadingViewProps {
  fullScreen?: boolean;
  message?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dots" | "pulse" | "dual-ring" | "orbit" | "square" | "route";
}

export function LoadingView({
  fullScreen = false,
  message = "로딩 중...",
  size = "lg",
  variant = "dots",
}: LoadingViewProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  const containerClass = fullScreen
    ? "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    : "flex items-center justify-center p-8";

  // UserRequest: 로딩 중입니다 말고 멘트가 지속적으로 바뀌는 것으로 하자. 멘트는 "지도를 불러오는 중입니다..." "마커를 찍는 중입니다..." "경로를 잇는 중입니다..." 이런 느낌으로
  // 처리: route 스타일에서 4가지 단계별 메시지를 2초마다 순환하도록 구현
  const routeMessages = [
    "지도를 불러오는 중입니다...",
    "마커를 찍는 중입니다...",
    "경로를 잇는 중입니다...",
    "최적 경로를 계산하는 중입니다..."
  ];

  useEffect(() => {
    if (variant !== "route") return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % routeMessages.length);
    }, 2000); // UserRequest: 2초마다 변경 (원래 0.5초였으나 1초로 수정 후 2초로 최종 조정)

    return () => clearInterval(interval);
  }, [variant, routeMessages.length]);

  const getCurrentMessage = () => {
    if (variant !== "route") return message;
    return routeMessages[currentMessageIndex];
  };

  return (
    <div className={containerClass}>
      {/* UserRequest: 저 밑 배경에 지도를 나타내는 아이콘을 깔아주면 어때? */}
      {/* 처리: route 스타일 fullScreen 모드에서 지도 그리드 라인, MapPin, Map 아이콘들을 배경에 배치 */}
      {variant === "route" && fullScreen && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* UserRequest: 지도 그리드 라인 - 10x10 그리드로 지도 느낌 연출 */}
          <div className="absolute inset-0 opacity-[0.03]">
            {/* 가로 선들 - 10% 간격으로 배치 */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute w-full border-t border-primary"
                style={{ top: `${i * 10}%` }}
              />
            ))}
            {/* 세로 선들 - 10% 간격으로 배치 */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute h-full border-l border-primary"
                style={{ left: `${i * 10}%` }}
              />
            ))}
          </div>
          
          {/* UserRequest: 흩어진 지도 핀 아이콘들 - 다양한 크기와 위치에 배치하여 지도 느낌 연출 */}
          <MapPin className="absolute top-[15%] left-[20%] w-8 h-8 text-primary/10 animate-pulse" style={{ animationDelay: "0s", animationDuration: "3s" }} />
          <MapPin className="absolute top-[25%] right-[25%] w-6 h-6 text-primary/10 animate-pulse" style={{ animationDelay: "0.5s", animationDuration: "3s" }} />
          <MapPin className="absolute bottom-[20%] left-[30%] w-7 h-7 text-primary/10 animate-pulse" style={{ animationDelay: "1s", animationDuration: "3s" }} />
          <MapPin className="absolute bottom-[30%] right-[20%] w-6 h-6 text-primary/10 animate-pulse" style={{ animationDelay: "1.5s", animationDuration: "3s" }} />
          <MapPin className="absolute top-[40%] left-[15%] w-5 h-5 text-primary/10 animate-pulse" style={{ animationDelay: "2s", animationDuration: "3s" }} />
          <MapPin className="absolute top-[60%] right-[30%] w-8 h-8 text-primary/10 animate-pulse" style={{ animationDelay: "2.5s", animationDuration: "3s" }} />
          
          {/* UserRequest: 큰 지도 아이콘들 - 배경에 큰 Map 아이콘들을 배치하여 지도 테마 강화 */}
          <Map className="absolute top-[10%] right-[15%] w-16 h-16 text-primary/5 animate-pulse" style={{ animationDuration: "4s" }} />
          <Map className="absolute bottom-[15%] left-[10%] w-20 h-20 text-primary/5 animate-pulse" style={{ animationDelay: "1s", animationDuration: "4s" }} />
          <Map className="absolute top-[50%] right-[10%] w-12 h-12 text-primary/5 animate-pulse" style={{ animationDelay: "2s", animationDuration: "4s" }} />
        </div>
      )}
      
      <div className="flex flex-col items-center gap-6 relative z-10">
        <div className="relative">
          <Spinner size={size} variant={variant} />
        </div>
        {/* UserRequest: 원래 진해졌다 옅어졌다 했잖아 그걸 그대로 사용을 한 상태에서 해달라고 */}
        {/* 처리: animate-pulse 효과를 유지하면서 동적 메시지 변경 기능 추가 */}
        <p className="text-base font-medium text-foreground animate-pulse min-h-[1.5rem] text-center">
          {getCurrentMessage()}
        </p>
      </div>
    </div>
  );
}

