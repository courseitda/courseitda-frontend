import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/shared/stores/auth-store';
import { Plus, Folder, Heart, Clock, Search, MapPin, User as UserIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { useCreateSavedCategory, useMySavedCategories } from '@/shared/hooks/use-my-storage';
import { COMMUNITY_QUERY_KEYS, useLikedSharedCategories } from '@/shared/hooks/use-community';
import { useSharedCategoryLike } from '@/shared/hooks/use-shared-category-like';
import type { SavedCategory, SearchedPlace, SharedSavedCategory } from '@/entities/types';
import PageHeader from '@/components/layout/page-header';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useNaverLoader } from '@/shared/hooks/use-naver-loader';
import { PlaceInfoWindow } from '@/features/map/place-info-window';
import SharedCategoryDetailDialog from '@/components/community/shared-category-detail-dialog';
import { placeApi } from '@/services/api';

type SavedCategoryMapProps = {
  open: boolean;
  places: SavedCategory['places'];
  focusedPlaceId: string | null;
};

// UserRequest: 내 보관함 카테고리 팝업 지도도 공유 카테고리 팝업과 동일한 동작/표기를 적용
const SavedCategoryMap = ({ open, places, focusedPlaceId }: SavedCategoryMapProps) => {
  const naverMapKeyId = useSettingsStore((state) => state.naverMapKeyId);
  const { ready, error } = useNaverLoader(naverMapKeyId);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const markerMapRef = useRef<
    Map<
      string,
      { marker: naver.maps.Marker; position: naver.maps.LatLng; openInfoWindow: () => void }
    >
  >(new Map());
  const currentInfoWindowRef = useRef<naver.maps.InfoWindow | null>(null);

  useEffect(() => {
    // UserRequest: 팝업이 열리고 SDK 로딩 완료 시에만 지도 초기화
    if (!open || !ready || !mapRef.current || !window.naver || !window.naver.maps || mapInstanceRef.current) {
      return;
    }

    const { naver } = window;
    const firstPlace = places[0];
    const initialCenter = firstPlace
      ? new naver.maps.LatLng(firstPlace.latitude, firstPlace.longitude)
      : new naver.maps.LatLng(37.5665, 126.9780);

    mapInstanceRef.current = new naver.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: 13,
    });

    // 지도 클릭 시 열려있는 정보창 닫기 - 사용자 경험 개선
    const handleMapClick = () => {
      if (currentInfoWindowRef.current) {
        currentInfoWindowRef.current.close();
        currentInfoWindowRef.current = null;
      }
    };

    const clickListener = naver.maps.Event.addListener(mapInstanceRef.current, 'click', handleMapClick);

    return () => {
      naver.maps.Event.removeListener(clickListener);
      if (currentInfoWindowRef.current) {
        currentInfoWindowRef.current.close();
        currentInfoWindowRef.current = null;
      }
    };
  }, [open, ready, places]);

  useEffect(() => {
    // UserRequest: 장소 좌표를 지도 마커로 반영
    if (!open || !ready || !mapInstanceRef.current || !window.naver || !window.naver.maps) return;

    const { naver } = window;
    const map = mapInstanceRef.current;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    markerMapRef.current.clear();
    if (currentInfoWindowRef.current) {
      currentInfoWindowRef.current.close();
      currentInfoWindowRef.current = null;
    }

    const validPlaces = places.filter(
      (place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude),
    );

    if (validPlaces.length === 0) {
      // UserRequest: 좌표가 없을 때 기본 중심 좌표로 이동
      map.panTo(new naver.maps.LatLng(37.5665, 126.9780));
      map.setZoom(13);
      return;
    }

    const bounds = new naver.maps.LatLngBounds();

    validPlaces.forEach((place) => {
      const position = new naver.maps.LatLng(place.latitude, place.longitude);
      const marker = new naver.maps.Marker({
        position,
        map,
        // UserRequest: 공유 카테고리 팝업과 동일한 붉은 물방울 마커 적용
        icon: {
          content: `
            <div style="
              width: 24px;
              height: 24px;
              background-color: #ef4444;
              border: 2px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            "></div>
          `,
          anchor: new naver.maps.Point(12, 24),
        },
      });
      markersRef.current.push(marker);

      // UserRequest: 워크스페이스 상세보기와 동일한 스타일의 InfoWindow 사용
      const createInfoWindowElement = () => {
        const container = document.createElement('div');
        const root = createRoot(container);
        flushSync(() => {
          root.render(
            <PlaceInfoWindow
              placeName={place.name}
              isRepresentative={false}
              onToggleRepresentative={() => undefined}
              showRepresentativeAction={false}
            />,
          );
        });
        return container;
      };

      const openInfoWindow = () => {
        if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.close();
          currentInfoWindowRef.current = null;
        }

        const infoWindow = new naver.maps.InfoWindow({
          content: createInfoWindowElement(),
          borderWidth: 0,
          backgroundColor: 'transparent',
          // UserRequest: InfoWindow와 마커 간격을 좁혀 시각적 연결감 강화
          pixelOffset: new naver.maps.Point(0, -26),
          disableAnchor: true,
        });
        infoWindow.open(map, marker);
        currentInfoWindowRef.current = infoWindow;
      };

      markerMapRef.current.set(place.id, {
        marker,
        position,
        openInfoWindow,
      });
      bounds.extend(position);
    });

    // UserRequest: 팝업 진입 시 지도 레이아웃을 먼저 갱신한 후 모든 마커가 보이도록 bounds 적용
    naver.maps.Event.trigger(map, 'resize');
    map.fitBounds(bounds);
  }, [open, ready, places]);

  useEffect(() => {
    // UserRequest: 장소 클릭 시 해당 마커를 중앙으로 이동하고 InfoWindow 표시
    if (!open || !ready || !mapInstanceRef.current || !window.naver || !window.naver.maps) return;
    if (!focusedPlaceId) return;

    const target = markerMapRef.current.get(focusedPlaceId);
    if (!target) return;

    const map = mapInstanceRef.current;

    map.panTo(target.position);
    setTimeout(() => {
      map.setZoom(14);
    }, 300);
    setTimeout(() => {
      target.openInfoWindow();
    }, 350);
  }, [open, ready, focusedPlaceId]);

  useEffect(() => {
    // 팝업 닫힘 시 지도 인스턴스와 마커 참조를 정리하여 누수 방지
    if (!open) {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      markerMapRef.current.clear();
      if (currentInfoWindowRef.current) {
        currentInfoWindowRef.current.close();
        currentInfoWindowRef.current = null;
      }
      mapInstanceRef.current = null;
    }
  }, [open]);

  if (!naverMapKeyId || error) {
    return (
      <div className="w-full h-96 rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground text-center px-6">
        네이버 지도 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="w-full h-96 rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
        지도 로딩 중...
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-96 rounded-lg border border-border overflow-hidden" />;
};

/**
 * 내 카테고리 페이지 컴포넌트
 * 카테고리/찜 탭만 제공하며 워크스페이스 탭을 노출하지 않음
 * UserRequest: 백엔드 API 연동을 위해 토큰 기반 인증으로 변경, 사용자 정보는 API 호출로 조회
 */
const MyCategory = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  // UserRequest: 내 카테고리 페이지에서는 카테고리/찜 탭만 제공하고 카테고리 탭을 기본값으로 설정
  const [activeSection, setActiveSection] = useState<'categories' | 'liked'>('categories');
  const [categoryDetailOpen, setCategoryDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SavedCategory | null>(null);
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);
  const [likePulse, setLikePulse] = useState<Record<string, boolean>>({});
  const [removingLikedIds, setRemovingLikedIds] = useState<Record<string, boolean>>({});
  const [unlikeDialogOpen, setUnlikeDialogOpen] = useState(false);
  const [pendingUnlike, setPendingUnlike] = useState<{ id: string; title: string } | null>(null);
  const [likedDetailOpen, setLikedDetailOpen] = useState(false);
  const [selectedLikedCategory, setSelectedLikedCategory] = useState<SharedSavedCategory | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<SearchedPlace[]>([]);
  const [placeSearchLoading, setPlaceSearchLoading] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState<SearchedPlace[]>([]);

  // UserRequest: 내 카테고리 목록은 service 계층 API + React Query로 로딩 (컴포넌트 내부 mock 제거)
  const {
    data: savedCategories = [],
    isLoading: savedCategoriesLoading,
    error: savedCategoriesError,
  } = useMySavedCategories(token);
  const {
    data: likedCategories = [],
    isLoading: likedCategoriesLoading,
    error: likedCategoriesError,
  } = useLikedSharedCategories(token);
  const createSavedCategoryMutation = useCreateSavedCategory(token);

  // UserRequest: 내 카테고리 찜 탭에서도 찜 해제를 지원
  const { toggleLike } = useSharedCategoryLike({
    queryKey: COMMUNITY_QUERY_KEYS.liked,
    token,
    isAuthenticated,
  });

  // 미인증 사용자 접근 차단 - 로그인 페이지로 리다이렉트하여 보안 유지
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // UserRequest: 카테고리 카드 클릭 시 상세 팝업을 표시하여 이름/지도(임시)/장소 목록을 보여줌
  const handleOpenCategory = (categoryId: string) => {
    const target = savedCategories.find((category) => category.id === categoryId);
    if (!target) return;
    setSelectedCategory(target);
    // UserRequest: 팝업 재진입 시 이전 선택 상태를 초기화
    setFocusedPlaceId(null);
    setCategoryDetailOpen(true);
  };

  useEffect(() => {
    // UserRequest: 내 카테고리 목록 조회 실패 시 사용자에게 즉시 알림
    if (savedCategoriesError) {
      toast.error(savedCategoriesError.message);
    }
  }, [savedCategoriesError]);

  useEffect(() => {
    // UserRequest: 찜 목록 조회 실패 시 사용자에게 즉시 알림
    if (likedCategoriesError) {
      toast.error(likedCategoriesError.message);
    }
  }, [likedCategoriesError]);

  const handleSearchPlaces = async () => {
    if (!placeQuery.trim()) {
      toast.error('검색어를 입력해주세요.');
      return;
    }

    setPlaceSearchLoading(true);
    const { searchedPlaces, error } = await placeApi.search({ keyword: placeQuery.trim() });
    if (error) {
      toast.error(error);
      setPlaceResults([]);
    } else {
      setPlaceResults(searchedPlaces ?? []);
      if (!searchedPlaces || searchedPlaces.length === 0) {
        toast.info('검색 결과가 없습니다.');
      }
    }
    setPlaceSearchLoading(false);
  };

  const handleAddPlace = (place: SearchedPlace) => {
    const exists = selectedPlaces.some((item) => item.id === place.id);
    if (exists) {
      toast.info('이미 추가된 장소입니다.');
      return;
    }
    setSelectedPlaces((prev) => [...prev, place]);
  };

  const handleRemovePlace = (placeId: string) => {
    setSelectedPlaces((prev) => prev.filter((place) => place.id !== placeId));
  };

  const handleOpenCreateDialog = () => {
    // UserRequest: 새 카테고리 추가 버튼 클릭 시 생성 팝업 노출
    setCreateDialogOpen(true);
  };

  const resetCreateDialog = () => {
    setNewCategoryTitle('');
    setPlaceQuery('');
    setPlaceResults([]);
    setSelectedPlaces([]);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryTitle.trim()) {
      toast.error('카테고리 이름을 입력해주세요.');
      return;
    }
    if (selectedPlaces.length === 0) {
      toast.error('장소를 1개 이상 추가해주세요.');
      return;
    }
    if (createSavedCategoryMutation.isPending) return;

    try {
      await createSavedCategoryMutation.mutateAsync({
        title: newCategoryTitle.trim(),
        places: selectedPlaces,
      });
      setCreateDialogOpen(false);
      resetCreateDialog();
    } catch {
      // UserRequest: 생성 실패 시 팝업은 유지하여 입력을 보존
    }
  };

  const triggerLikePulse = (categoryId: string) => {
    setLikePulse((prev) => ({ ...prev, [categoryId]: true }));
    setTimeout(() => {
      setLikePulse((prev) => ({ ...prev, [categoryId]: false }));
    }, 200);
  };

  const handleToggleLikedCategory = (categoryId: string, currentLiked: boolean) => {
    if (currentLiked) {
      // UserRequest: 찜 해제 시 카드가 자연스럽게 사라지는 전환 애니메이션 적용
      setRemovingLikedIds((prev) => ({ ...prev, [categoryId]: true }));
      setTimeout(() => {
        setRemovingLikedIds((prev) => {
          const next = { ...prev };
          delete next[categoryId];
          return next;
        });
      }, 220);
    }
    const didToggle = toggleLike({ sharedCategoryId: categoryId, currentLiked });
    if (!didToggle) return;
    triggerLikePulse(categoryId);
  };

  const requestUnlike = (categoryId: string, title: string) => {
    // UserRequest: 찜 해제 시 안내 팝업을 띄워 확인 후 해제 처리
    setPendingUnlike({ id: categoryId, title });
    setUnlikeDialogOpen(true);
  };

  const confirmUnlike = () => {
    if (!pendingUnlike) return;
    handleToggleLikedCategory(pendingUnlike.id, true);
    setUnlikeDialogOpen(false);
    setPendingUnlike(null);
  };

  const handleOpenLikedDetail = (category: SharedSavedCategory) => {
    // UserRequest: 찜 카드 클릭 시 카테고리 게시판과 동일한 상세 팝업을 표시
    setSelectedLikedCategory(category);
    setLikedDetailOpen(true);
  };

  if (savedCategoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (savedCategoriesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">내 카테고리를 불러오지 못했습니다.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            새로고침
          </Button>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-card">
        {/* UserRequest: 뒤로가기 버튼은 직전 페이지로 이동 */}
        {/* UserRequest: 헤더 구성 요소를 공통 컴포넌트로 교체 */}
        <PageHeader title="내 카테고리" />

        {/* 모바일 레이아웃 */}
        {/* UserRequest: 모바일 뷰 좌우 여백을 0.5배로 축소하여 다른 페이지와 통일성 유지 (px-8 → px-4) */}
        <main className="md:hidden container mx-auto px-4 py-6">
          <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as 'categories' | 'liked')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              {/* UserRequest: 워크스페이스 탭을 제거하고 카테고리/찜 탭만 노출 */}
              <TabsTrigger value="categories" className="flex items-center gap-1.5">
                <Folder className="w-4 h-4" />
                카테고리
              </TabsTrigger>
              <TabsTrigger value="liked" className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                찜
              </TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="mt-0 space-y-3">
              {/* UserRequest: 카테고리 탭에서도 생성 버튼과 목록을 워크스페이스와 동일한 형태로 표시 */}
              <Card
                  className="border-dashed hover-lift cursor-pointer"
                  onClick={handleOpenCreateDialog}
              >
                <CardHeader className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-primary">
                    <Plus className="w-5 h-5" />
                    <CardTitle className="text-base md:text-lg text-primary">새 카테고리</CardTitle>
                  </div>
                </CardHeader>
              </Card>

              {savedCategories.map((category) => (
                  <Card
                      key={category.id}
                      className="hover-lift cursor-pointer"
                      onClick={() => handleOpenCategory(category.id)}
                  >
                    <CardHeader className="flex flex-row items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                          <Folder className="w-4 h-4" />
                        </div>
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] leading-none px-1.5 py-0.5 rounded-full">
                      {category.placeCount}
                    </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-base truncate">{category.title}</CardTitle>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          수정: {new Date(category.updatedAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        </p>
                      </div>
                    </CardHeader>
                  </Card>
              ))}
            </TabsContent>

            <TabsContent value="liked" className="mt-0">
              {likedCategoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner className="w-6 h-6" />
                </div>
              ) : likedCategories.length === 0 ? (
                <div className="text-sm text-muted-foreground">찜한 카테고리가 없습니다.</div>
              ) : (
                <div className="space-y-3">
                  {/* UserRequest: 찜 탭에서도 카테고리 탭과 동일한 카드 레이아웃으로 표시 */}
                  {likedCategories.map((category) => (
                    <Card
                      key={category.id}
                      className={`hover-lift transition-all duration-200 ${removingLikedIds[category.id] ? 'opacity-0 scale-95 translate-y-1 pointer-events-none' : ''}`}
                      onClick={() => handleOpenLikedDetail(category)}
                    >
                      <CardHeader className="flex flex-row items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                            <Folder className="w-4 h-4" />
                          </div>
                          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] leading-none px-1.5 py-0.5 rounded-full">
                            {category.placeCount}
                          </span>
                        </div>
                        {/* UserRequest: 찜 카드에서 공유 시간 정보를 제거 */}
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{category.title}</CardTitle>
                          {/* UserRequest: 찜 카드에 작성자 정보를 카테고리 게시판과 동일한 형태로 표시 */}
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <UserIcon className="w-4 h-4 text-primary" />
                            {category.uploader}
                          </p>
                        </div>
                        {/* UserRequest: 찜 카드 우측에 하트 버튼을 배치해 찜 해제 가능하도록 구현 */}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            requestUnlike(category.id, category.title);
                          }}
                          aria-label={`${category.title} 찜 해제`}
                          aria-pressed={category.liked}
                          className={`relative h-11 w-11 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-90 focus:outline-none ${likePulse[category.id] ? 'scale-110' : ''}`}
                        >
                          {likePulse[category.id] && (
                            <span className="absolute inset-0 rounded-full like-heart-ping animate-ping" />
                          )}
                          <Heart
                            className={`w-7 h-7 ${isAuthenticated ? 'like-heart' : 'text-muted-foreground'} transition-transform duration-150 ${likePulse[category.id] ? 'scale-110' : ''}`}
                            fill={isAuthenticated && category.liked ? 'currentColor' : 'none'}
                            strokeWidth={isAuthenticated && category.liked ? 0 : 1.5}
                          />
                        </button>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

        {/* 데스크톱 레이아웃 - 3단 구조 */}
        {/* UserRequest: 데스크톱 화면에서도 카테고리/찜 탭만 제공하여 정보 구조를 단순화 */}
        <main className="hidden md:block min-h-[calc(100vh-80px)]">
          <div className="grid grid-cols-[1fr_2fr_1fr] min-h-[calc(100vh-80px)]">
            {/* 좌측: 배경 영역 (primary/5 색상으로 시각적 여유 제공) */}
            <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>

            {/* 중앙: 카테고리/찜 목록 콘텐츠 */}
            <div className="px-4 py-4 overflow-y-auto min-h-[calc(100vh-80px)]">
              <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as 'categories' | 'liked')}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="categories" className="flex items-center gap-1.5">
                    <Folder className="w-4 h-4" />
                    카테고리
                  </TabsTrigger>
                  <TabsTrigger value="liked" className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4" />
                    찜
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="mt-0 space-y-2">
                  {/* UserRequest: 카테고리 탭에서도 생성 버튼과 목록을 워크스페이스와 동일한 형태로 표시 */}
                  <Card
                      className="border-dashed hover-lift cursor-pointer"
                      onClick={handleOpenCreateDialog}
                  >
                    <CardHeader className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 text-primary">
                        <Plus className="w-5 h-5" />
                        <CardTitle className="text-base md:text-lg text-primary">새 카테고리</CardTitle>
                      </div>
                    </CardHeader>
                  </Card>

                  {savedCategories.map((category) => (
                      <Card
                          key={category.id}
                          className="hover-lift cursor-pointer"
                          onClick={() => handleOpenCategory(category.id)}
                      >
                        <CardHeader className="flex flex-row items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                              <Folder className="w-4 h-4" />
                            </div>
                            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] leading-none px-1.5 py-0.5 rounded-full">
                          {category.placeCount}
                        </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <CardTitle className="text-base truncate">{category.title}</CardTitle>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              수정: {new Date(category.updatedAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            </p>
                          </div>
                        </CardHeader>
                      </Card>
                  ))}
                </TabsContent>

                <TabsContent value="liked" className="mt-0">
                  {likedCategoriesLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Spinner className="w-6 h-6" />
                    </div>
                  ) : likedCategories.length === 0 ? (
                    <div className="text-sm text-muted-foreground">찜한 카테고리가 없습니다.</div>
                  ) : (
                    <div className="space-y-2">
                      {/* UserRequest: 찜 탭에서도 카테고리 탭과 동일한 카드 레이아웃으로 표시 */}
                      {likedCategories.map((category) => (
                        <Card
                          key={category.id}
                          className={`hover-lift transition-all duration-200 ${removingLikedIds[category.id] ? 'opacity-0 scale-95 translate-y-1 pointer-events-none' : ''}`}
                          onClick={() => handleOpenLikedDetail(category)}
                        >
                          <CardHeader className="flex flex-row items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                                <Folder className="w-4 h-4" />
                              </div>
                              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] leading-none px-1.5 py-0.5 rounded-full">
                                {category.placeCount}
                              </span>
                            </div>
                            {/* UserRequest: 찜 카드에서 공유 시간 정보를 제거 */}
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <CardTitle className="text-base truncate">{category.title}</CardTitle>
                              {/* UserRequest: 찜 카드에 작성자 정보를 카테고리 게시판과 동일한 형태로 표시 */}
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <UserIcon className="w-4 h-4 text-primary" />
                                {category.uploader}
                              </p>
                            </div>
                            {/* UserRequest: 찜 카드 우측에 하트 버튼을 배치해 찜 해제 가능하도록 구현 */}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                requestUnlike(category.id, category.title);
                              }}
                              aria-label={`${category.title} 찜 해제`}
                              aria-pressed={category.liked}
                              className={`relative h-11 w-11 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-90 focus:outline-none ${likePulse[category.id] ? 'scale-110' : ''}`}
                            >
                              {likePulse[category.id] && (
                                <span className="absolute inset-0 rounded-full like-heart-ping animate-ping" />
                              )}
                              <Heart
                                className={`w-7 h-7 ${isAuthenticated ? 'like-heart' : 'text-muted-foreground'} transition-transform duration-150 ${likePulse[category.id] ? 'scale-110' : ''}`}
                                fill={isAuthenticated && category.liked ? 'currentColor' : 'none'}
                                strokeWidth={isAuthenticated && category.liked ? 0 : 1.5}
                              />
                            </button>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* 우측: 배경 영역 (primary/5 색상으로 시각적 여유 제공) */}
            <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>
          </div>
        </main>

        <Dialog open={categoryDetailOpen} onOpenChange={setCategoryDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-center">{selectedCategory?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <SavedCategoryMap
                open={categoryDetailOpen}
                places={selectedCategory?.places ?? []}
                focusedPlaceId={focusedPlaceId}
              />
              <div className="space-y-2">
                <p className="text-sm font-semibold">장소 목록</p>
                {/* UserRequest: 장소 목록은 3개까지만 보이고 이후는 스크롤로 확인 */}
                <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                  {selectedCategory?.places.map((place) => (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => setFocusedPlaceId(place.id)}
                        className="w-full text-left p-3 flex flex-col gap-1 hover:bg-accent/40 transition-colors"
                      >
                        <span className="text-sm font-medium">{place.name}</span>
                        <span className="text-xs text-muted-foreground">{place.addressName}</span>
                      </button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={unlikeDialogOpen} onOpenChange={setUnlikeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>찜을 해제할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingUnlike?.title ? `"${pendingUnlike.title}"` : '선택한 카테고리'}를 찜 목록에서 제거합니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={confirmUnlike}>해제하기</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <SharedCategoryDetailDialog
          open={likedDetailOpen}
          onOpenChange={setLikedDetailOpen}
          category={selectedLikedCategory}
        />

        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              resetCreateDialog();
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 카테고리 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold">카테고리 이름</p>
                <Input
                  placeholder="예: 맛집 투어"
                  value={newCategoryTitle}
                  onChange={(event) => setNewCategoryTitle(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">추가된 장소</p>
                {/* UserRequest: 검색 결과 영역과 동일한 높이로 고정하고 스크롤로 관리 */}
                <div className="max-h-56 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                  {selectedPlaces.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">선택한 장소가 없습니다.</div>
                  ) : (
                    selectedPlaces.map((place) => (
                      <div key={place.id} className="p-3 flex items-center gap-3">
                        <div className="text-primary">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{place.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{place.addressName}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemovePlace(place.id)}
                          aria-label="장소 제거"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">장소 검색</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="장소 이름이나 주소 검색"
                    value={placeQuery}
                    onChange={(event) => setPlaceQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleSearchPlaces();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSearchPlaces}
                    disabled={placeSearchLoading}
                    className="gap-2"
                  >
                    <Search className="w-4 h-4" />
                    검색
                  </Button>
                </div>
                {placeSearchLoading && (
                  <div className="text-sm text-muted-foreground">검색 중...</div>
                )}
                {!placeSearchLoading && placeResults.length > 0 && (
                  <div className="max-h-56 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                    {placeResults.map((place) => (
                      <div key={place.id} className="p-3 flex items-start gap-3">
                        <div className="mt-1 text-primary">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{place.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{place.addressName}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleAddPlace(place)}>
                          추가
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  취소
                </Button>
                {/* UserRequest: 필수 입력값이 없으면 생성 버튼을 비활성화 */}
                <Button
                  onClick={handleCreateCategory}
                  disabled={
                    createSavedCategoryMutation.isPending ||
                    !newCategoryTitle.trim() ||
                    selectedPlaces.length === 0
                  }
                >
                  {createSavedCategoryMutation.isPending ? '생성 중...' : '생성'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default MyCategory;
