import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MapPin, Map } from "lucide-react";

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
            {/* 클리핑 패스 - 선이 그려지는 효과 */}
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
          
          {/* 배경 경로 - 점선 (흐릿하게) - 눕힌 S자 형태 */}
          <path
            d="M 10 50 C 10 30, 30 30, 40 50 C 50 70, 60 70, 70 50 C 80 30, 90 30, 90 50"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray="3 8"
            opacity="0.2"
          />
          
          {/* 경로 선 - 점선이 그려지는 애니메이션 - 눕힌 S자 형태 */}
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
          
          {/* 첫 번째 지점 마커 (왼쪽 시작점) - 즉시 표시 */}
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
          
          {/* 두 번째 지점 마커 (첫 번째 곡선) - 25% 지점에서 나타남 */}
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
          
          {/* 세 번째 지점 마커 (두 번째 곡선) - 50% 지점에서 나타남 */}
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
          
          {/* 네 번째 지점 마커 (오른쪽 끝점) - 75% 지점에서 나타남 */}
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

  // 경로 스타일일 때 단계별 메시지
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
    }, 2000); // 2초마다 변경

    return () => clearInterval(interval);
  }, [variant, routeMessages.length]);

  const getCurrentMessage = () => {
    if (variant !== "route") return message;
    return routeMessages[currentMessageIndex];
  };

  return (
    <div className={containerClass}>
      {/* 경로 스타일일 때 배경에 지도 아이콘 패턴 */}
      {variant === "route" && fullScreen && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* 지도 그리드 라인 */}
          <div className="absolute inset-0 opacity-[0.03]">
            {/* 가로 선들 */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute w-full border-t border-primary"
                style={{ top: `${i * 10}%` }}
              />
            ))}
            {/* 세로 선들 */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute h-full border-l border-primary"
                style={{ left: `${i * 10}%` }}
              />
            ))}
          </div>
          
          {/* 흩어진 지도 핀 아이콘들 */}
          <MapPin className="absolute top-[15%] left-[20%] w-8 h-8 text-primary/10 animate-pulse" style={{ animationDelay: "0s", animationDuration: "3s" }} />
          <MapPin className="absolute top-[25%] right-[25%] w-6 h-6 text-primary/10 animate-pulse" style={{ animationDelay: "0.5s", animationDuration: "3s" }} />
          <MapPin className="absolute bottom-[20%] left-[30%] w-7 h-7 text-primary/10 animate-pulse" style={{ animationDelay: "1s", animationDuration: "3s" }} />
          <MapPin className="absolute bottom-[30%] right-[20%] w-6 h-6 text-primary/10 animate-pulse" style={{ animationDelay: "1.5s", animationDuration: "3s" }} />
          <MapPin className="absolute top-[40%] left-[15%] w-5 h-5 text-primary/10 animate-pulse" style={{ animationDelay: "2s", animationDuration: "3s" }} />
          <MapPin className="absolute top-[60%] right-[30%] w-8 h-8 text-primary/10 animate-pulse" style={{ animationDelay: "2.5s", animationDuration: "3s" }} />
          
          {/* 큰 지도 아이콘들 */}
          <Map className="absolute top-[10%] right-[15%] w-16 h-16 text-primary/5 animate-pulse" style={{ animationDuration: "4s" }} />
          <Map className="absolute bottom-[15%] left-[10%] w-20 h-20 text-primary/5 animate-pulse" style={{ animationDelay: "1s", animationDuration: "4s" }} />
          <Map className="absolute top-[50%] right-[10%] w-12 h-12 text-primary/5 animate-pulse" style={{ animationDelay: "2s", animationDuration: "4s" }} />
        </div>
      )}
      
      <div className="flex flex-col items-center gap-6 relative z-10">
        <div className="relative">
          <Spinner size={size} variant={variant} />
        </div>
        <p className="text-base font-medium text-foreground animate-pulse min-h-[1.5rem] text-center">
          {getCurrentMessage()}
        </p>
      </div>
    </div>
  );
}

