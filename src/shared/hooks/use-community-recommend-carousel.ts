import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { SharedSavedCategory } from '@/entities/types';

/**
 * 커뮤니티 추천 캐러셀의 무한 루프/드래그/중앙 정렬 상태를 관리하는 훅
 * UserRequest: Community 추천 슬라이더 로직을 페이지 본문에서 분리
 */
export const useCommunityRecommendCarousel = (categories: SharedSavedCategory[]) => {
  const [recommendIndex, setRecommendIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentTranslate = useRef(0);
  const isLoopFixingRef = useRef(false);
  const loopFallbackTimerRef = useRef<number | null>(null);
  const [sliderWidth, setSliderWidth] = useState(0);

  const hasLoop = categories.length > 1;
  const recommendCardScale = 5 / 6;
  const cardWidth = Math.round(280 * recommendCardScale);
  const cardGap = Math.round(16 * recommendCardScale);
  const cardImageHeight = Math.round(192 * recommendCardScale);
  const sliderCategories = useMemo(() => {
    if (categories.length === 0) return [];
    if (!hasLoop) return categories;
    const first = categories[0];
    const last = categories[categories.length - 1];
    return [last, ...categories, first];
  }, [categories, hasLoop]);

  const getBaseTranslate = useCallback(
    (index: number) =>
      sliderWidth ? (sliderWidth - cardWidth) / 2 - index * (cardWidth + cardGap) : 0,
    [cardGap, cardWidth, sliderWidth],
  );

  const activeIndex = categories.length
    ? hasLoop
      ? (recommendIndex - 1 + categories.length) % categories.length
      : recommendIndex
    : 0;

  useEffect(() => {
    // 자동 재생은 실제 슬라이더가 순환 가능한 경우에만 활성화
    if (categories.length === 0 || !hasLoop || sliderWidth === 0) return;

    const timer = setInterval(() => {
      setRecommendIndex((previous) => previous + 1);
    }, 4000);

    return () => clearInterval(timer);
  }, [categories.length, hasLoop, sliderWidth]);

  useEffect(() => {
    // 초기 렌더에서는 중앙 정렬이 확정된 뒤 시작 인덱스를 맞춰 깜빡임을 줄임
    if (categories.length === 0) {
      setRecommendIndex(0);
      return;
    }
    if (sliderWidth === 0) return;

    setIsAnimating(false);
    setRecommendIndex(hasLoop ? 1 : 0);
    requestAnimationFrame(() => setIsAnimating(true));
  }, [categories.length, hasLoop, sliderWidth]);

  useEffect(() => {
    // 상태 변경 시 실제 DOM transform을 즉시 동기화하여 정지 현상을 방지
    if (!trackRef.current || sliderWidth === 0 || isDragging.current) return;

    trackRef.current.style.transform = `translateX(${getBaseTranslate(recommendIndex)}px)`;
  }, [getBaseTranslate, recommendIndex, sliderWidth]);

  useEffect(() => {
    // transitionend 누락 상황에서는 지연 보정으로 무한 루프 경계를 자연스럽게 복구
    if (!hasLoop || !isAnimating) return;

    const isLoopBoundary = recommendIndex === 0 || recommendIndex === categories.length + 1;
    if (!isLoopBoundary) {
      if (loopFallbackTimerRef.current) {
        window.clearTimeout(loopFallbackTimerRef.current);
        loopFallbackTimerRef.current = null;
      }
      return;
    }

    if (loopFallbackTimerRef.current) {
      window.clearTimeout(loopFallbackTimerRef.current);
    }

    loopFallbackTimerRef.current = window.setTimeout(() => {
      if (isLoopFixingRef.current) return;
      isLoopFixingRef.current = true;
      setIsAnimating(false);
      requestAnimationFrame(() => {
        const nextIndex = recommendIndex === 0 ? categories.length : 1;
        setRecommendIndex(nextIndex);
        requestAnimationFrame(() => {
          setIsAnimating(true);
          isLoopFixingRef.current = false;
        });
      });
      loopFallbackTimerRef.current = null;
    }, 560);

    return () => {
      if (loopFallbackTimerRef.current) {
        window.clearTimeout(loopFallbackTimerRef.current);
        loopFallbackTimerRef.current = null;
      }
    };
  }, [categories.length, hasLoop, isAnimating, recommendIndex]);

  const updateSliderWidth = useCallback(() => {
    if (!sliderRef.current) return;
    setSliderWidth(sliderRef.current.getBoundingClientRect().width);
  }, []);

  useLayoutEffect(() => {
    // 리사이즈에 맞춰 가로 폭을 다시 측정하여 중앙 정렬 기준을 유지
    const slider = sliderRef.current;
    if (!slider) return;

    updateSliderWidth();
    const observer = new ResizeObserver(() => updateSliderWidth());
    observer.observe(slider);

    return () => observer.disconnect();
  }, [categories.length, updateSliderWidth]);

  useEffect(() => {
    // 탭 복귀 시 중앙 정렬과 무한 루프 경계를 즉시 복구
    const handleVisibilityChange = () => {
      if (document.hidden) return;

      updateSliderWidth();
      if (hasLoop) {
        if (recommendIndex === 0) {
          setIsAnimating(false);
          requestAnimationFrame(() => {
            setRecommendIndex(categories.length);
            requestAnimationFrame(() => setIsAnimating(true));
          });
          return;
        }
        if (recommendIndex === categories.length + 1) {
          setIsAnimating(false);
          requestAnimationFrame(() => {
            setRecommendIndex(1);
            requestAnimationFrame(() => setIsAnimating(true));
          });
          return;
        }
      }
      setIsAnimating(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [categories.length, hasLoop, recommendIndex, updateSliderWidth]);

  const handleSelectRecommend = (index: number) => {
    isDragging.current = false;
    if (trackRef.current) {
      const nextIndex = hasLoop ? index + 1 : index;
      trackRef.current.style.transform = `translateX(${getBaseTranslate(nextIndex)}px)`;
    }

    setIsAnimating(true);
    setRecommendIndex(hasLoop ? index + 1 : index);
  };

  const handlePointerDown = (clientX: number) => {
    if (categories.length === 0) return;
    isDragging.current = true;
    setIsAnimating(false);
    startX.current = clientX;
    currentTranslate.current = getBaseTranslate(recommendIndex);
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDragging.current || !trackRef.current) return;

    const delta = clientX - startX.current;
    trackRef.current.style.setProperty('transform', `translateX(${currentTranslate.current + delta}px)`);
  };

  const handlePointerUp = (clientX: number) => {
    if (!isDragging.current || !trackRef.current) return;

    isDragging.current = false;
    setIsAnimating(true);
    const delta = clientX - startX.current;
    const threshold = cardWidth / 3;
    let nextIndex = recommendIndex;

    if (delta > threshold) {
      nextIndex = hasLoop ? recommendIndex - 1 : Math.max(0, recommendIndex - 1);
    } else if (delta < -threshold) {
      nextIndex = hasLoop
        ? recommendIndex + 1
        : Math.min(categories.length - 1, recommendIndex + 1);
    }

    trackRef.current.style.transform = `translateX(${getBaseTranslate(nextIndex)}px)`;
    setRecommendIndex(nextIndex);
  };

  const handlePointerLeave = () => {
    if (!isDragging.current) return;

    isDragging.current = false;
    setIsAnimating(true);
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${getBaseTranslate(recommendIndex)}px)`;
    }
  };

  const handleTransitionEnd = () => {
    if (!hasLoop) return;

    if (recommendIndex === 0) {
      setIsAnimating(false);
      requestAnimationFrame(() => {
        setRecommendIndex(categories.length);
        requestAnimationFrame(() => setIsAnimating(true));
      });
    }

    if (recommendIndex === categories.length + 1) {
      setIsAnimating(false);
      requestAnimationFrame(() => {
        setRecommendIndex(1);
        requestAnimationFrame(() => setIsAnimating(true));
      });
    }
  };

  return {
    sliderRef,
    trackRef,
    sliderCategories,
    activeIndex,
    isAnimating,
    hasLoop,
    recommendIndex,
    sliderWidth,
    cardWidth,
    cardGap,
    cardImageHeight,
    getBaseTranslate,
    handleSelectRecommend,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleTransitionEnd,
  };
};
